# Ranking Report — Gemini Prompt Template

Purpose: given a search term + a target business, produce an evidence-backed action plan that says exactly what the business must do to rank or gain visibility. Designed to plug into an n8n workflow that has already collected KG, Places (GBP), SERP, and competitor data.

## Architecture at a glance

```
n8n workflow:
  1. Resolve entity     → KG API
  2. Pull live GBP      → Places API
  3. Pull SERP          → Serper.dev (or DataForSEO)
  4. Pull top N         → loop KG + Places for each of the top 3-5 ranking competitors
  5. Normalize          → JSON node consolidates everything into the variables below
  6. Call Gemini        → this prompt template (system + user)
  7. Render report      → Handlebars/Template node turns JSON output into markdown for client
```

Why JSON output → markdown render: the LLM is most reliable when it produces structured data. Your client-facing formatting should live in an n8n Template node, not inside the prompt. This also means the same JSON can feed dashboards later.

## The prompt (two parts)

### SYSTEM PROMPT

```
You are a senior local search analyst. Your job is to produce an actionable ranking plan — not a description, not a summary — for a specific business trying to rank for a specific search term in a specific location.

GROUNDING RULES (non-negotiable):
1. Only use facts present in the <data> blocks in the user message. If a fact is not in the data, write "not available in provided data" — do not infer, estimate, or fill in from general knowledge.
2. Every claim in your output must cite a source using one of these tags: [KG], [GBP], [SERP], [COMPETITOR:N] (where N is the competitor index from the data).
3. If data sources contradict each other (e.g., KG cache says 230 reviews, GBP says 270), treat live sources (GBP, SERP) as truth and flag the discrepancy in the data_discrepancies field.
4. Do not recommend any action that cannot be justified by a specific gap in the data. "Build more citations" is only valid if the competitor data shows competitors have more citations than the target. If you cannot justify an action, do not include it.

ANALYSIS FRAMEWORK:
For the given search term, identify:
- Search intent: informational, transactional, local, or commercial investigation — inferred from which SERP features Google shows.
- SERP features present: Local Pack, Knowledge Panel, AI Overview, People Also Ask, FAQ, Images, Videos, Reviews snippet, Sitelinks.
- The target business's current visibility state for this query.
- What the top-ranking competitors share that the target lacks. Be specific: category match, review count, review recency (last 30 days), photo count, GBP post frequency, primary category choice, attributes/services listed, website presence in SERP, schema presence implied by rich results, description length and keyword inclusion.
- Which gaps are closeable in 30 days (operational: reviews, photos, posts, attributes), 90 days (content, citations, schema), or structural (domain authority, category change with risk).

TONE: Direct, prescriptive, no hedging language. Avoid "consider", "might want to", "could be beneficial". Use "do X because Y shows Z."

OUTPUT: Valid JSON only, matching the schema in the user message. No prose outside the JSON. No markdown code fences around the JSON.
```

### USER PROMPT TEMPLATE

Variables to replace in n8n (use `{{ $json.variable_name }}` or set item syntax depending on your setup):

```
SEARCH TERM: {{search_term}}
LOCATION: {{location}}
TARGET BUSINESS: {{target_business_name}}
TARGET BUSINESS WEBSITE: {{target_website}}

<data source="KG">
{{kg_json}}
</data>

<data source="GBP">
{{gbp_json}}
</data>

<data source="SERP">
{{serp_json}}
</data>

<data source="COMPETITORS">
{{competitors_json}}
</data>

Produce a ranking plan as valid JSON matching this exact schema:

{
  "search_term": "string",
  "search_intent": "informational | transactional | local | commercial",
  "serp_features_present": ["list of feature names observed in SERP data"],
  "target_current_visibility": {
    "ranks_in_local_pack": "boolean or rank position",
    "ranks_in_organic_top_10": "boolean or rank position",
    "appears_in_knowledge_panel": "boolean",
    "appears_in_ai_overview": "boolean",
    "visibility_summary": "one sentence, with citations"
  },
  "competitive_gaps": [
    {
      "gap": "specific thing the target lacks",
      "evidence": "what competitor(s) have and the magnitude",
      "citation": "[COMPETITOR:1]"
    }
  ],
  "data_discrepancies": [
    {
      "field": "e.g., review_count, primary_category, hours",
      "kg_value": "value from KG cache",
      "live_value": "value from GBP or SERP",
      "action": "update GBP | re-claim KG | request Google re-index"
    }
  ],
  "prioritized_actions": [
    {
      "action": "verb-first specific instruction",
      "priority": "P0 | P1 | P2",
      "effort": "low | medium | high",
      "expected_impact": "what visibility gain this produces and why",
      "evidence_basis": "which competitor or SERP feature this is grounded in",
      "timeframe": "this week | 30 days | 90 days | structural"
    }
  ],
  "quick_wins": ["top 3 P0 low-effort actions, copied verbatim from prioritized_actions[].action"],
  "cannot_assess": ["list questions that would need additional data to answer, e.g., 'domain authority of target vs competitors not provided'"]
}

Return only the JSON. No commentary.
```

## Variable specification — what the n8n workflow must pass in

| Variable | Source | Shape | Notes |
|---|---|---|---|
| `search_term` | user input | string | e.g., "pediatric dentist in austin" |
| `location` | user input | string | city + state/country |
| `target_business_name` | user input | string | |
| `target_website` | user input | string | URL |
| `kg_json` | KG API response | stringified JSON | Keep: name, @type, description, url, detailedDescription, resultScore. Strip: image URLs, verbose metadata. |
| `gbp_json` | Places API response | stringified JSON | Keep: displayName, formattedAddress, rating, userRatingCount, types, primaryType, regularOpeningHours, websiteUri, reviews (top 5), photos count, editorialSummary. Strip: raw photo bytes. |
| `serp_json` | Serper.dev response | stringified JSON | Keep: organic[0-9] (title/link/snippet/position), localPack (if present), knowledgeGraph (if present), aiOverview (if present), peopleAlsoAsk, relatedSearches. |
| `competitors_json` | per-competitor fetch loop | stringified JSON array | For each top-3 SERP winner: {name, website, kg: {...}, gbp: {...}}. Use the same field-pruning rules as target. |

Rule of thumb on payload size: Gemini 2.5 Flash handles this easily up to ~50KB of input. Prune aggressively — fewer fields = less hallucination surface.

## n8n node sequence

1. **Manual Trigger / Form Trigger** — captures `search_term`, `location`, `target_business_name`.
2. **HTTP Request — KG API** — resolve target entity, get MID.
3. **HTTP Request — Places API** — GBP lookup by place ID or text search.
4. **HTTP Request — Serper.dev** — `/search` endpoint with the search term + location.
5. **Code Node (JavaScript)** — extract top 3 competitor names/websites from SERP organic + localPack.
6. **Split In Batches** — loop each competitor through KG + Places.
7. **Merge + Code Node** — consolidate all into the variable shape above. Truncate free-text fields (reviews, descriptions) to ~500 chars each.
8. **Google Gemini node** — model `gemini-2.5-flash`, temperature `0.2`, response MIME type `application/json`. System prompt + user prompt from above.
9. **JSON Parse** — parse the model output.
10. **Template node (Handlebars)** — render a markdown report for the client.
11. **Output** — email, PDF, or store in DB.

## Tuning tips

- **Temperature 0.2, not 0.** Zero can produce weirdly terse output; 0.2 keeps it grounded but readable.
- **`response_mime_type: application/json`** on the Gemini call. This is the single highest-leverage config for reliability — it forces structural validity.
- **If actions come back generic ("improve your SEO"), your input data was too thin.** The fix is always upstream — pull more competitor detail, add more SERP features to the payload — not more prompt instructions.
- **If the model invents competitors or facts,** make the grounding rules louder: add "If you cite a competitor that isn't in the <data source=\"COMPETITORS\"> block, the output is invalid. Review your citations before returning."
- **To harden further,** add an eval step: a second Gemini call that receives the first output + the original data and answers "which claims in this plan are not supported by the data?" Throw away the report and retry if the eval flags issues.

## What this prompt does NOT do (yet)

- No historical trend analysis (you'd need stored past SERP snapshots).
- No backlink or domain authority analysis (not in the API stack — would need Ahrefs/Moz if you want that).
- No multi-language or non-US SERP handling without adjusting the SERP call params.
- No sanity check on whether the target business is even eligible to rank (e.g., a consultant with no physical address can't win Local Pack).

## Example "quick wins" it should produce if wired up right

- "Add 12 photos to the GBP — top 3 competitors average 147 photos, target has 23 [COMPETITOR:1, COMPETITOR:2, COMPETITOR:3]"
- "Request 15 reviews in the next 30 days — #1 ranker has 312 reviews, target has 89, and avg review age on target is 14 months [COMPETITOR:1, GBP]"
- "Change primary category from 'Dentist' to 'Pediatric dentist' — all three Local Pack winners use the more specific category [COMPETITOR:1, COMPETITOR:2, COMPETITOR:3]"

If it's producing vague stuff like "focus on on-page SEO" — that's a signal the data feed isn't giving the model anything concrete to grip onto. Fix the pipeline, not the prompt.
