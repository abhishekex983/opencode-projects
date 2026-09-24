# Drive RAG Setup — Marketing Insights Chat

What you're setting up: the chat at `marketing-insights.html` will answer questions using semantic search over your Google Drive docs + sheets in the folder `1iiu1PXh1LilB7B9mmJ2ZBLZIuMMGJ8Kd`.

Two workflows live in this folder:
- **`marketing-insights-index-workflow.json`** — daily job that walks the Drive folder and writes embeddings to Supabase.
- **`marketing-insights-chat-workflow.json`** — the existing chat webhook, now backed by Supabase vector search instead of Drive keyword search.

There are four one-time setup steps.

---

## 1. Supabase — run this SQL once

Supabase → SQL Editor → New Query → paste → **Run**.

```sql
-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Table for indexed chunks
create table if not exists marketing_doc_chunks (
  id            bigserial primary key,
  drive_file_id text   not null,
  file_name     text   not null,
  file_url      text   not null,
  mime_type     text   not null,
  modified_time timestamptz,
  chunk_index   int    not null,
  content       text   not null,
  embedding     vector(1536) not null,
  indexed_at    timestamptz default now(),
  unique (drive_file_id, chunk_index)
);

-- 3. Index for fast similarity search (cosine)
create index if not exists marketing_doc_chunks_embedding_idx
  on marketing_doc_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. View: latest modified_time per file (used by the indexer to skip unchanged files)
create or replace view marketing_doc_files as
select
  drive_file_id,
  max(modified_time) as modified_time,
  max(indexed_at)    as indexed_at
from marketing_doc_chunks
group by drive_file_id;

-- 5. Similarity search RPC (the chat workflow calls this)
create or replace function match_marketing_doc_chunks (
  query_embedding vector(1536),
  match_count     int default 8,
  similarity_threshold float default 0.3
)
returns table (
  drive_file_id text,
  file_name     text,
  file_url      text,
  mime_type     text,
  modified_time timestamptz,
  chunk_index   int,
  content       text,
  similarity    float
)
language sql stable
as $$
  select
    drive_file_id, file_name, file_url, mime_type,
    modified_time, chunk_index, content,
    1 - (embedding <=> query_embedding) as similarity
  from marketing_doc_chunks
  where 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## 2. Collect your 3 secrets

From OpenAI (https://platform.openai.com/api-keys):
- `OPENAI_API_KEY` — starts with `sk-...`

From Supabase → Project Settings → API:
- `SUPABASE_URL` — looks like `https://xxxxxxxxxxxxx.supabase.co`
- `SUPABASE_KEY` — the `service_role` value (long JWT, marked "secret"). **Do not commit this anywhere public.**

---

## 3. Import the workflows into n8n

### a. Indexing workflow

1. n8n → Workflows → **Import from File** → pick `marketing-insights-index-workflow.json`.
2. Open the **Index Drive Folder** Code node.
3. At the top of the script, replace the three `REPLACE_ME_...` constants with the values from step 2.
4. **Save** the node, then **Save** the workflow.
5. Hit **Execute Workflow** once manually to do the first full index. Initial run on N files takes roughly `N × 1-3 seconds`. Watch the output node for the summary `{ total_in_folder, changed, indexed, failed, errors }`.
6. Once it completes successfully, flip the workflow **Active** toggle on (top-right). It now runs daily at 03:00 server time.

### b. Chat workflow

1. n8n → Workflows → the existing **Marketing Insights -- Chat** workflow. (Or re-import `marketing-insights-chat-workflow.json` if you want a clean copy.)
2. Open the **Drive Vector Search** Code node.
3. Replace the same three `REPLACE_ME_...` constants with the same values.
4. **Save** the node, then **Save** + **Activate** the workflow.

The webhook URL and frontend stay exactly the same — no changes to `marketing-insights.html`.

---

## 4. Smoke test

After the indexer's first manual run finishes:

1. In `marketing-insights.html`, open the chat and ask something whose answer you know lives in one of your Drive docs (e.g. *"what's our pricing approach for SEO retainers?"*).
2. Expected: Claude answers using content from your doc, with `[N]` citations linking back to the Drive file URLs. The `My Google Drive` source group at the bottom should list those files.
3. If the answer says "no sources matched" but you know it should have:
   - Confirm the indexer ran successfully (check the workflow's last execution).
   - Lower `SIMILARITY_THRESHOLD` in the **Drive Vector Search** node from `0.3` to `0.2` — your query may be only loosely related to the chunk wording.
   - In Supabase SQL editor, run `select count(*), max(indexed_at) from marketing_doc_chunks;` to confirm chunks exist.

---

## Notes & limits

- **Cost:** OpenAI `text-embedding-3-small` is $0.02 per 1M tokens. A folder with ~500 typical docs (~2k tokens each) costs about $0.02 to fully index. Incremental daily re-indexing is effectively free.
- **What gets indexed:** Google Docs (exported as plain text) + Google Sheets (exported as CSV, one chunk = a block of rows). Subfolders ARE walked recursively. PDFs, Slides, images, and non-Google files are skipped — tell me if you want any of those added.
- **Latency:** chat adds ~1 second for query embedding + Supabase lookup. Drive re-indexing is incremental — daily runs typically only touch a handful of changed files.
- **Re-indexing on demand:** just hit `Execute Workflow` on the indexer. It only re-embeds files whose `modifiedTime` advanced.
- **Deleting a file from Drive:** orphaned chunks stay in Supabase. To purge: `delete from marketing_doc_chunks where drive_file_id not in ('id1','id2',...)` — or I can add a cleanup pass to the indexer if it becomes a problem.
- **The old `drive_query` field** in the Multi-Source Search node is unused now (vector search replaced keyword search) but kept for backward compatibility — harmless dead code.
