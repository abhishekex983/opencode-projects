# Content Creation Setup

Universal blog post creation system powered by opencode + MCP servers.

---

## Folder Structure

```
Content Creation/
  blog-post-prompt.md    ← Universal prompt (paste into opencode)
  abhi-writing-style.md  ← Writing style rules
  api-keys.txt           ← All API keys (DO NOT share)
  README.md              ← This file
```

---

## Prerequisites

### 1. MCP Servers

Four MCP servers must be configured in opencode.json. These are already set up at:

```
C:\Users\Abhishek Bolar\.config\opencode\opencode.json
```

The config includes:

| MCP Server | Package | Purpose |
|---|---|---|
| Exa | `exa-mcp-server` | Neural semantic search (Reddit, forums, articles) |
| DataForSEO | `dataforseo-mcp-server` | Google SERP, keyword difficulty, backlinks |
| Firecrawl | `firecrawl-mcp` | Page scraping, content extraction |
| OpenRouter | `openrouter-mcp-server` | LLM access (Claude, Gemini, etc.) |

### 2. Node.js

MCP servers run via `npx`. Node.js must be installed.

---

## How to Use

### Step 1: Open the prompt

Open `blog-post-prompt.md` in any text editor.

### Step 2: Fill in the 12 inputs

At the top of the prompt, fill in:

1. Topic / Search Term
2. My Experience
3. Opinion
4. Story Bank File (path to your stories file)
5. Guardrails File (path to your rules file)
6. Internal Links File (path to your URLs file)
7. Header Keywords
8. Entities
9. Common Keywords
10. Writing Style File (default: abhi-writing-style.md in this folder)
11. Model (default: Claude Sonnet 4.5 via OpenRouter)
12. Media File (path to your media URLs file)

### Step 3: Paste into opencode

Copy the entire document (inputs + prompt) and paste it into opencode.

### Step 4: opencode executes

opencode will:
1. Gather data using MCP tools (SERP, Exa, Firecrawl)
2. Read your reference files (guardrails, stories, links, media)
3. Write the complete blog post
4. Output: ready-to-publish markdown

---

## What's Automated (No Input Needed)

| Feature | How |
|---|---|
| Search Intent | DataForSEO SERP analysis |
| Content Gap Analysis | Firecrawl scrapes top 5-8 competitors |
| Keyword Difficulty | DataForSEO keyword data |
| Stats + Outbound Links | Exa + Firecrawl finds real stats with source URLs |
| Empathy Research | Exa searches Reddit, forums, YouTube + DataForSEO PAA |
| Salience / Entities | Extracted from SERP + competitor content |
| TL;DR | Generated automatically after H1 |
| Key Takeaways | Generated at end of blog post |

---

## Project-Specific Files

These files are different for each project/niche. Store them in your project folders and reference by path in the inputs:

| File | Purpose | Example |
|---|---|---|
| Guardrails | YMYL rules, banned language, disclaimers | `F:\Opencode Projects\Hair Restoration\hair-restoration-guardrails.md` |
| Story Bank | Personal stories, product experiences | `F:\Opencode Projects\Hair Restoration\Hair Care Routine.md` |
| Internal Links | URLs to link to within your site | `F:\Opencode Projects\Hair Restoration\Internal URLs.txt` |
| Media | Image and YouTube URLs | `F:\Opencode Projects\Hair Restoration\Media URLS.md` |

---

## Security

- `api-keys.txt` contains sensitive API keys
- Do NOT commit to public repositories
- Do NOT share with anyone
- The MCP config in opencode.json also contains these keys (stored locally only)

---

## Troubleshooting

**MCP server not connecting:**
- Check that Node.js is installed: `node --version`
- Check that npx works: `npx --version`
- Restart opencode after changing opencode.json

**DataForSEO returning 404:**
- Your DataForSEO account may not have access to all modules
- The config limits to: SERP, KEYWORDS_DATA, LABS, BACKLINKS
- Enable additional modules in the DataForSEO dashboard if needed

**Exa rate limits:**
- Free tier has rate limits
- Get a paid API key at https://dashboard.exa.ai/api-keys

**Firecrawl rate limits:**
- Free tier works without API key (rate-limited)
- Get a paid key at https://www.firecrawl.dev/app/api-keys
