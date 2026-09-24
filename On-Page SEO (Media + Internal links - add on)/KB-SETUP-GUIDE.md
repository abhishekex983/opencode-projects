# Knowledge Base Feature — Setup Guide

## Overview

This adds a knowledge base system to your On-Page SEO tool. You can create KBs per business, upload reference documents (anecdotes, opinions, brand voice), and optionally select a KB when generating blog posts or service page content. The KB content gets injected into the AI prompt as context.

---

## Step 1: Import the KB Manager Workflow

1. In n8n, go to **Workflows** → **Import from file**
2. Select `kb-manager-workflow.json` from this project
3. Activate the workflow
4. Copy the **Production webhook URL** (it will be something like `https://n8n.srv1195841.hstgr.cloud/webhook/kb-manager`)

---

## Step 2: Configure the Frontend

1. Open the On-Page SEO app
2. Go to **Knowledge Base** in the sidebar
3. Paste the KB Manager webhook URL
4. Click **Save webhook**
5. Click **Test** to verify connectivity

---

## Step 3: Modify Blog Post Creation Workflow

You need to make **2 changes** to your existing "Blog Post Creation -- Outline + Content" workflow:

### Change 1: Modify "Normalize Outline Inputs" node

Open the **Normalize Outline Inputs** Code node and add `knowledge_base_id` to the returned object. Find the `return [{ json: { ... } }]` block and add this line:

```javascript
knowledge_base_id: parseInt(pick('knowledge_base_id', 'knowledgeBaseId', 'kb_id')) || 0,
```

### Change 2: Add "Fetch KB Content" node

Add a new **Code node** between "Normalize Outline Inputs" and "Stats Scrape". Name it **"Fetch KB Content (Outline)"**.

**Node settings:**
- Connect: "Normalize Outline Inputs" → "Fetch KB Content (Outline)" → "Stats Scrape"
- Type: Code

**Code:**

```javascript
// Fetch knowledge base content if knowledge_base_id is provided.
// Calls the KB Manager webhook's get_content action.

const KB_MANAGER_URL = 'https://n8n.srv1195841.hstgr.cloud/webhook/kb-manager';
// ↑ Replace with your actual KB Manager webhook URL

const form = $('Normalize Outline Inputs').first().json;
const kbId = form.knowledge_base_id || 0;

if (!kbId) {
  return [{ json: { ...form, kb_content: '', kb_name: '' } }];
}

try {
  const resp = await this.helpers.httpRequest({
    method: 'POST',
    url: KB_MANAGER_URL,
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'get_content', kb_id: kbId },
    json: true,
    timeout: 10000
  });

  if (resp.error) {
    return [{ json: { ...form, kb_content: '', kb_name: '', kb_error: resp.error } }];
  }

  return [{
    json: {
      ...form,
      kb_content: resp.content || '',
      kb_name: resp.kb_name || '',
      kb_doc_count: resp.doc_count || 0
    }
  }];
} catch (e) {
  return [{ json: { ...form, kb_content: '', kb_name: '', kb_error: e.message } }];
}
```

### Change 3: Modify "Build Outline Prompt" node

In the **Build Outline Prompt** Code node, find where the user prompt is built (the `parts` array or the template literal that builds the user message). Add this block **after the anecdotes/opinions sections and before the marketer_inputs section**:

```javascript
// Knowledge Base content injection
const kbContent = form.kb_content || '';
const kbName = form.kb_name || '';
if (kbContent) {
  parts.push('<knowledge_base>\n' + kbName + ':\n' + kbContent + '\n</knowledge_base>');
}
```

Or if the prompt uses template literals, add this block:

```javascript
${form.kb_content ? '<knowledge_base>\n' + (form.kb_name || 'Knowledge Base') + ':\n' + form.kb_content + '\n</knowledge_base>' : ''}
```

### Change 4: Same for Content path

Repeat the same pattern for the Content generation path:
1. Add `knowledge_base_id` to "Normalize Content Inputs"
2. Add "Fetch KB Content (Content)" node between "Normalize Content Inputs" and "Build Content Prompt"
3. Add KB content injection to "Build Content Prompt"

---

## Step 4: Modify Content Optimizer Workflow

Same pattern as Blog Post Creation:

### Change 1: Modify "Normalize Outline Inputs" node

Add `knowledge_base_id` to the returned object:

```javascript
knowledge_base_id: parseInt(pick('knowledge_base_id', 'knowledgeBaseId', 'kb_id')) || 0,
```

### Change 2: Add "Fetch KB Content" node

Add a Code node between "Normalize Outline Inputs" and the next node. Use the same code as the Blog Post Creation "Fetch KB Content" node above.

### Change 3: Modify "Build Outline Prompt" node

Add KB content injection to the user prompt:

```javascript
${form.kb_content ? '<knowledge_base>\n' + (form.kb_name || 'Knowledge Base') + ':\n' + form.kb_content + '\n</knowledge_base>' : ''}
```

### Change 4: Same for Content path

Repeat for the Content generation path.

---

## Step 5: Update the Normalize Inputs Code

Here's the exact code to add to the Normalize Outline Inputs node. Find the line that returns the json object and add the `knowledge_base_id` field:

**Before:**
```javascript
return [{
  json: {
    topic: pick('topic', 'Topic') || '',
    voice: pick('voice', 'Voice') || '',
    // ... other fields ...
  }
}];
```

**After:**
```javascript
return [{
  json: {
    topic: pick('topic', 'Topic') || '',
    voice: pick('voice', 'Voice') || '',
    // ... other fields ...
    knowledge_base_id: parseInt(pick('knowledge_base_id', 'knowledgeBaseId', 'kb_id')) || 0,
  }
}];
```

---

## How It Works

1. **Frontend**: User selects a KB from the dropdown (or leaves it as "No knowledge base")
2. **Webhook**: The `knowledge_base_id` is sent in the POST body to n8n
3. **Normalize Inputs**: Extracts `knowledge_base_id` from the request
4. **Fetch KB Content**: If KB ID is set, calls the KB Manager webhook to get the concatenated document text
5. **Build Prompt**: Injects the KB content as a `<knowledge_base>` block in the prompt
6. **LLM**: Uses the KB content as reference context for generating the outline/content

---

## Data Storage Note

The KB Manager workflow uses **n8n's workflow static data** for storage. This means:
- Data persists across executions
- Data is lost if you edit and save the workflow
- For production use, upgrade to n8n Data Tables (see below)

### Upgrading to Data Tables (Recommended)

1. In n8n, go to **Data Tables** tab
2. Create table `knowledge_bases` with columns: `id` (number), `name` (string), `description` (string), `created_at` (string)
3. Create table `kb_documents` with columns: `id` (number), `kb_id` (number), `filename` (string), `content` (string), `file_size` (number), `uploaded_at` (string)
4. In the KB Manager workflow, replace the Code node logic with Data Table nodes for each operation

---

## File Formats Supported

- **.txt** — plain text (paste directly or upload)
- **.md** — markdown (paste directly or upload)
- **.docx** — Word documents (requires additional parsing, not yet implemented)

For .docx support, you would need to add a Code node that uses the `mammoth` library to extract text from the uploaded file.

---

## Limits

- **Max file size**: 5MB per document
- **Max documents**: 20 per knowledge base
- **Max KBs**: No hard limit (practical limit depends on n8n's storage)
