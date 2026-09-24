# Guardrails Feature — Setup Guide

## Overview

Guardrails are compliance rules that content MUST follow. They are injected as the **highest-priority** system instructions during content generation and enforced with a post-generation compliance check. Use guardrails to avoid legal issues, Google penalties, or brand-damaging claims.

Guardrails are **per-business** — you create separate guardrail sets for each client and select them via dropdown when generating blog posts or service pages.

---

## Step 1: Import the Guardrails Manager Workflow

1. In n8n, go to **Workflows** → **Import from file**
2. Select `guardrails-manager-workflow.json` from this project
3. Activate the workflow
4. Copy the **Production webhook URL** (it will be something like `https://n8n.srv1195841.hstgr.cloud/webhook/guardrails-manager`)

---

## Step 2: Configure the Frontend

1. Open the On-Page SEO app
2. Go to **Guardrails** in the sidebar
3. Paste the Guardrails Manager webhook URL
4. Click **Save webhook**
5. Click **Test** to verify connectivity

---

## Step 3: Import Updated Workflows (if not already done)

The guardrails integration is **already built into** the workflow JSON files. If you're setting up fresh:

1. Import `blog-post-creation-workflow.json` — guardrails nodes are pre-wired
2. Import `content-optimizer-workflow.json` — guardrails nodes are pre-wired

If you're using existing workflow versions, you need to update them. See **Appendix** below.

---

## Step 4: Create Your First Guardrail

1. Go to the **Guardrails** tab in the frontend
2. Enter a name (e.g., "Healthcare Compliance", "Brand ABC Rules")
3. Optional: add a description
4. Click **Create Guardrail**
5. In the **Upload Rule Documents** section, select your new guardrail
6. Enter a document name (e.g., "Banned Phrases", "FTC Rules")
7. Paste your rules content or upload a .txt / .md file
8. Click **Add Rule Document**
9. Repeat for additional rule documents

---

## Step 5: Use Guardrails in Content Creation

### Blog Post Creation
1. Go to **Blog Post Creation**
2. Fill in your inputs as usual
3. In the **Guardrails** dropdown, select the guardrail set to apply
4. Generate the outline and content as normal

### Service Page Creation
1. Go to **Service Page Creation**
2. Fill in your inputs as usual
3. In the **Guardrails** dropdown, select the guardrail set to apply
4. Generate the outline and content as normal

---

## How Enforcement Works

When a guardrail is selected, two enforcement layers activate:

### Layer 1: Prompt Injection (Prevention)
The guardrail rules are injected as the **absolute highest-priority** system instruction in the generation prompt, before all other rules (including search intent, SERP analysis, and salience). The LLM is told:

> "CRITICAL COMPLIANCE GUARDRAILS (ABSOLUTE HIGHEST PRIORITY — OVERRIDE ALL OTHER INSTRUCTIONS): The following rules are NON-NEGOTIABLE..."

This prevents most violations before they happen.

### Layer 2: Compliance Check (Safety Net)
After the outline or content is generated, a separate LLM call reviews the output against the guardrails. If violations are found, the violating sections are rewritten to be compliant. This catches edge cases the first layer missed.

### What Gets Checked
- **Outline**: Every heading and section description
- **Content**: Every sentence, claim, and section

### If No Guardrail Selected
If the guardrail dropdown is set to "No guardrails", both enforcement layers are skipped — content generates as before with no compliance overhead.

---

## Example Guardrail Documents

### Banned Phrases
```
NEVER use these phrases:
- "guaranteed results"
- "100% effective"
- "miracle cure"
- "get rich quick"
- "no risk"
- "FDA approved" (unless verified with documentation)
```

### Required Disclaimers
```
ALWAYS include:
- "Results may vary" when discussing outcomes
- "Consult your doctor before starting any treatment" for health content
- "Past performance does not guarantee future results" for financial content
- "This is not legal advice" for legal-adjacent content
```

### Google YMYL Compliance
```
For health/finance/legal content:
- Cite authoritative sources (studies, government sites, recognized institutions)
- Include author credentials or expertise signals
- Avoid absolute claims without evidence
- Use hedging language for unproven treatments
- Include "according to [source]" for any statistics
```

---

## Data Storage

The Guardrails Manager uses **n8n's workflow static data** for storage:
- Data persists across executions
- Data is lost if you edit and save the workflow
- For production use, upgrade to n8n Data Tables (same pattern as KB Manager)

---

## Limits

- **Max file size**: 5MB per document
- **Max documents**: 20 per guardrail set
- **Max guardrail sets**: No hard limit (practical limit depends on n8n's storage)

---

## Appendix: Updating Existing Workflows

If you already have working blog-post-creation or content-optimizer workflows and don't want to re-import, add these changes manually:

### Blog Post Creation Workflow

1. **Normalize Outline Inputs**: Add `guardrail_id: parseInt(pick('guardrail_id', 'guardrailId')) || 0` to the returned JSON object

2. **Normalize Content Inputs**: Same addition

3. **Add "Fetch Guardrail Content (Outline)"** Code node between "Fetch Writing Style (Outline)" and "Stats Scrape":
```javascript
const GR_MANAGER_URL = 'https://n8n.srv1195841.hstgr.cloud/webhook/guardrails-manager';
const form = $('Fetch Writing Style (Outline)').first().json;
const grId = form.guardrail_id || 0;

if (!grId) {
  return [{ json: { ...form, guardrail_content: '', guardrail_name: '' } }];
}

try {
  const resp = await this.helpers.httpRequest({
    method: 'POST',
    url: GR_MANAGER_URL,
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'get_content', guardrail_id: grId },
    json: true,
    timeout: 10000
  });

  if (resp.error) {
    return [{ json: { ...form, guardrail_content: '', guardrail_name: '', guardrail_error: resp.error } }];
  }

  return [{
    json: {
      ...form,
      guardrail_content: resp.content || '',
      guardrail_name: resp.guardrail_name || '',
      guardrail_doc_count: resp.doc_count || 0
    }
  }];
} catch (e) {
  return [{ json: { ...form, guardrail_content: '', guardrail_name: '', guardrail_error: e.message } }];
}
```

4. **Add "Fetch Guardrail Content (Content)"** between "Fetch Writing Style (Content)" and "Fetch Media Library" — same code, reference `$('Fetch Writing Style (Content)')` instead

5. **Build Outline Prompt**: Add guardrails injection before the system prompt:
```javascript
const guardrailContent = (form.guardrail_content || '').trim();
let guardrailsPrefix = '';
if (guardrailContent) {
  guardrailsPrefix = 'CRITICAL COMPLIANCE GUARDRAILS (ABSOLUTE HIGHEST PRIORITY — OVERRIDE ALL OTHER INSTRUCTIONS):\n' +
    'The following rules are NON-NEGOTIABLE. If any rule conflicts with other instructions, GUARDRAILS TAKE PRECEDENCE.\n' +
    'Violations may result in legal liability, Google penalties, or brand damage.\n\n' +
    '<guardrails>\n' + guardrailContent + '\n</guardrails>\n\n' +
    'EVERY section, heading, and description in your output MUST comply with these guardrails.\n\n';
}
```
Then prepend `guardrailsPrefix` to the system prompt and add `<guardrails>` block to the user prompt.

6. **Build Content Prompt**: Same pattern

7. **Add "Compliance Check (Outline)"** after "OpenRouter (Outline)" and before "Parse Outline" — a Code node that calls OpenRouter to verify the outline against guardrails

8. **Add "Compliance Check (Content)"** after "OpenRouter (Content)" and before "Parse Content"

9. Update connections accordingly

### Content Optimizer Workflow

Same pattern as blog post creation, adapted for the content optimizer's node structure.
