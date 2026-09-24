# Blog Post Creation Prompt

Universal prompt for generating SEO-optimized blog posts via opencode.
Fill in the 12 inputs below, then paste the entire document into opencode.

---

## USER INPUTS

Copy this section, fill in your inputs, and paste the entire document into opencode.

---

### 1. Topic / Search Term


### 2. My Experience
<!-- Your personal story — what you've tried, what happened, results -->

### 3. Opinion
<!-- Your unique take, contrarian view, or hot take on this topic -->

### 4. Story Bank File
<!-- Path to file with personal stories and product experiences -->
Example: F:\Opencode Projects\Hair Restoration\Hair Care Routine.md

### 5. Guardrails File
<!-- Path to file with YMYL rules, banned language, approved patterns -->
Example: F:\Opencode Projects\Hair Restoration\hair-restoration-guardrails.md

### 6. Internal Links File
<!-- Path to file with internal URLs to link to -->
Example: F:\Opencode Projects\Hair Restoration\Internal URLs.txt

### 7. Header Keywords
<!-- Commonly used keywords in competitor headers. Google ranks on these patterns. -->

### 8. Entities
<!-- Entities/topics that must be covered in the blog post -->

### 9. Common Keywords
<!-- Commonly used keywords in competitor content. Use where relevant. -->

### 10. Writing Style File
<!-- Path to writing style rules file -->
Example: F:\Opencode Projects\On-Page SEO (Media + Internal links - add on)\abhi-writing-style.md

### 11. Model
<!-- LLM to use for writing -->
Claude Sonnet 4.5 via OpenRouter

### 12. Media File
<!-- Path to file with image and YouTube URLs -->
Example: F:\Opencode Projects\Hair Restoration\Media URLS.md

---

## PREREQUISITES

MCP servers must be configured in opencode.json:
- Exa (exa-mcp-server) — neural semantic search
- DataForSEO (dataforseo-mcp-server) — SERP, keyword difficulty, backlinks
- Firecrawl (firecrawl-mcp) — page scraping
- OpenRouter (openrouter-mcp-server) — LLM access

---

## PHASE 1: DATA GATHERING (USE MCP TOOLS)

Before writing anything, gather the following context using your available MCP tools. Do ALL of these steps:

### 1. SEARCH INTENT + SERP DATA

Use `serp_google_organic_live` (DataForSEO) to get Google organic results for the focus keyword (depth: 20).

From the results, extract:
- Top 10 organic listings (position, title, URL, domain, description)
- SERP features: featured snippet, PAA (up to 6), related searches (up to 8), AI overview, local pack, video/image packs
- Primary intent (Informational / Commercial Investigation / Transactional / Navigational / Local)
- Secondary intent
- Funnel stage (Awareness / Interest / Consideration / Decision)
- Sub-intents with percentage weights
- Recommended content archetype (how-to, listicle, comparison, etc.)

### 2. CONTENT GAP ANALYSIS (CRITICAL)

Use `firecrawl_scrape` (Firecrawl) to read the full content of the top 5-8 ranking pages from step 1.

For each page, extract these on-page signals:
- Title, H1, meta description (and their character lengths)
- Word count
- Heading outline: all H1, H2, H3, H4 with their text
- Internal link count, external link count
- Image count, video count, table count, list count
- Whether it has an FAQ section (look for "FAQ", "frequently asked", or 3+ question-formatted headings)
- Schema types (if visible in page source)

Then compute aggregate statistics across all scraped pages:
- Median word count
- Median H2 count
- Median internal/external link count
- Median image/video count
- Percentage of pages with FAQ sections
- Percentage of pages with tables

Then identify:
- COMMON PATTERNS: Features present in 60%+ of top-ranking pages. These are table stakes — your post MUST have them.
- CONTENT GAPS: Features present in the majority of pages but that you can improve upon, OR features that are missing entirely that represent an opportunity. For each gap, note which competitor URLs have it (evidence).
- STANDOUT SIGNALS: 1-2 top rankers doing something unique or different that works. Note what it is and which URL demonstrates it.
- CONTENT DEPTH VERDICT: Based on median word count, is the top-ranking content deep or shallow? What word count range should you target?
- SERP ARCHETYPE: What content format dominates? (How-to / Listicle / Comparison / Review / Product / Service / Glossary / FAQ)

### 3. KEYWORD DIFFICULTY

Use `keywords_google_ads_search_volume` (DataForSEO) to get search volume, competition, CPC, and difficulty for the focus keyword.
Use `backlinks_summary` (DataForSEO) to get the backlink profile of the top-ranking domains.
Record: search volume, competition, CPC, difficulty band, median referring domains of top rankers.

### 4. STATS RESEARCH

Use `web_search_exa` (Exa) to search for "{topic} statistics data study research".
Use `firecrawl_scrape` (Firecrawl) to read the full content of the top 5 results.

Extract 5-10 real statistics, data points, or study findings. For each, record:
- The stat itself
- Source name and URL
- Only use verifiable stats from the search results. Do NOT fabricate.

### 5. EMPATHY RESEARCH

This step uncovers what the audience actually feels, fears, and struggles with. Run ALL of these searches:

**a) Reddit Search:**
Use `web_search_exa` (Exa) with query: "{topic OR focus_keyword} pain points frustrations problems"
Set includeDomains: ["reddit.com"], numResults: 8
Use `firecrawl_scrape` (Firecrawl) to read the top 5 threads in full.

**b) Forum Search:**
Use `web_search_exa` (Exa) with query: "{topic OR focus_keyword} complaints objections alternatives forum discussion"
Set excludeDomains: ["reddit.com", "youtube.com", "youtu.be"], numResults: 8
Use `firecrawl_scrape` (Firecrawl) to read the top 3 results in full.

**c) YouTube Search:**
Use `web_search_exa` (Exa) with query: "{topic OR focus_keyword} review experience issues"
Set includeDomains: ["youtube.com", "youtu.be"], numResults: 6
Use `firecrawl_scrape` (Firecrawl) to read the top 3 results in full.

**d) People Also Ask:**
Extract People Also Ask questions from the SERP data gathered in step 1. Record the question and answer snippet for each (up to 10).

From ALL of the above, extract and cluster into these 4 categories:
- PAIN POINTS: Emotional frustrations, annoyances, things that make the reader's life harder.
- OBJECTIONS: Reasons they hesitate, doubt, or resist (too expensive, too complicated, tried before and failed).
- PROBLEMS: Practical blockers, technical issues, workflow breakdowns.
- FEARS: What they're worried about (wasting money, looking foolish, making things worse).

For each theme, record:
- A short title (max 6 words)
- A description (1-2 sentences)
- A content angle: how the blog post should address this theme
- Representative quotes: short verbatim snippets (~30 words) from real users, with source tag [R1], [F2], [Y3], [PAA4]
- Evidence IDs: which sources support this theme

Aim for 4-8 themes total. Mix categories: aim for at least 1 pain point, 1 objection, 1 problem, 1 fear.

### 6. SALIENCE / ENTITIES

From the SERP results and scraped content gathered in steps 1, 2, and 4, identify:
- Must-cover entities (tools, brands, concepts, people) — entities that appear across 50%+ of top-ranking pages
- H2/H3 candidate topics that appear across multiple top results
- Supporting topics that add depth and authority
- FAQ candidates (from PAA questions + common user questions)

---

## PHASE 1 OUTPUT

After completing all 6 steps, output the gathered data as structured blocks. Use these exact headers:

### SEARCH INTENT ANALYSIS
[Primary intent, secondary intent, funnel stage, sub-intents with weights, recommended archetype, conflict flag if any]

### CONTENT GAP ANALYSIS
[Common patterns (table stakes), content gaps with severity P0/P1/P2, standout signals from top rankers, content depth verdict, target word count, SERP archetype]

### KEYWORD DATA
[Search volume, competition, CPC, difficulty band, median referring domains]

### STATS RESEARCH
[Each stat with source name and URL, bullet points]

### EMPATHY RESEARCH
Summary: [2-3 sentence overview of what the audience is actually struggling with]
Themes:
1. [CATEGORY] Title
   Description: ...
   Content angle: ...
   Reader voices:
   - "quote" [R3]
   - "quote" [F1]
   Evidence: [R3, F1, Y2]

### SALIENCE / ENTITIES
[Must-cover entities, H2/H3 candidates, supporting topics, FAQ candidates]

Store these blocks. Reference them when writing in Phase 3.

---

## PHASE 2: READ REFERENCE FILES

Before writing, read these files and internalize their rules:

1. Read the GUARDRAILS FILE — these are NON-NEGOTIABLE rules. Follow every rule. Banned language, approved patterns, disclaimers, identity positioning. If any guardrail conflicts with other instructions, GUARDRAILS WIN.

2. Read the WRITING STYLE FILE — this is the writing style. Follow every rule: empathy-first, personal voice, short sentences, semantic triples, no fluff, banned verbs.

3. Read the STORY BANK FILE — this contains personal stories, product experiences, and timelines. Pull relevant ones to weave into the blog post where they support the content.

4. Read the INTERNAL LINKS FILE — these are internal link URLs. Insert 3-5 of them as markdown links where contextually relevant. Anchor text must be descriptive and match the linked page topic.

5. Read the MEDIA FILE — these are image and YouTube URLs. Insert them as markdown images (![alt text](url)) or embeds wherever they add visual context to the content.

---

## PHASE 3: WRITE THE BLOG POST

Using all gathered data, all reference files, and all rules, write the complete blog post directly. Follow these rules in priority order:

### PRIORITY 1: SEARCH INTENT + SALIENCE (HIGHEST)

1. SEARCH INTENT INSIGHTS (HIGHEST PRIORITY): Treat the intent analysis as authoritative truth. Shape the entire post to address the stated primary intent. Use sub-intents to inspire section topics. Follow the recommended archetype exactly. The entire blog post must stay laser-focused on answering the searcher's question — every section, every paragraph, every takeaway must directly serve the intent behind the keyword.

2. SALIENCE INSIGHTS (HIGHEST PRIORITY): Weave must-cover entities naturally throughout using exact entity names. Use H2/H3 candidates from salience as structural anchors. Give must-cover entities their own H2/H3 if they are significant enough.

### PRIORITY 2: CONTENT GAP FILLING (SECOND HIGHEST)

3. CONTENT GAP FILLING: For every P0 gap identified in Phase 1:
   - Include that content element in your post (FAQ section, table, video embed reference, specific heading pattern, etc.)
   - For every P1 gap: include it if it serves the reader's intent.
   - For standout signals: adapt the unique approach from top rankers, but do it better.
   - Match all common patterns (table stakes) — if 60%+ of top rankers have it, your post must have it too.
   - Target the word count range identified in the content depth analysis.
   - Follow the SERP archetype identified (if top rankers are how-to posts, write a how-to; if listicles, write a listicle).

### PRIORITY 3: KEYWORDS + ENTITIES (THIRD)

4. HEADER KEYWORDS: Use the header keywords provided in the user inputs. Weave them into H2/H3 headings where they naturally fit. These are patterns Google ranks — match them where relevant, but don't force them.

5. ENTITIES: Cover every entity from the user inputs. Give significant entities their own H2/H3. Weave smaller entities into body paragraphs. Use exact entity names — don't paraphrase.

6. COMMON KEYWORDS: Use the common keywords provided in the user inputs throughout the body copy. These are patterns from competitor content — use where they fit naturally. Don't keyword-stuff.

7. FOCUS KEYWORD: Use the focus keyword in the H1 and once in the opening paragraph. Use it naturally throughout the post — don't force it.

### PRIORITY 4: WRITING STYLE + AUTHENTICITY (FOURTH)

8. WRITING STYLE: Follow every rule in the writing style file:
   - Start with empathy — acknowledge what the reader is feeling
   - Write to one person — use "you" and "your" generously
   - Keep it simple — language a 5th grader would understand
   - Get to the point — every sentence must answer "So what?"
   - Use the "So What -> Ok -> That's Interesting" formula
   - Be honest, be real — share personal stories
   - Use semantic triples (Subject -> Predicate -> Object) for entity clarity
   - Use concrete, active verbs: inspect, clear, repair, replace, review, file, negotiate, defend
   - NEVER use: boost, elevate, evolving, dominate, transform, leverage, utilize, maximize, optimize, enhance, revolutionize
   - NEVER use the word "guide" — say "this blog post" instead

9. PERSONAL STORIES + OPINIONS (AUTHENTICITY): This is what makes the blog post original and trustworthy. Do ALL of these:
   - Read the Story Bank file and pull relevant stories, product experiences, and timelines. Weave them into the blog post where they support the content.
   - Use the user's personal experience (Input 2) throughout. Lead with "I" statements. Share what worked and what didn't. Be honest about limitations.
   - Include the user's opinion (Input 3) in at least 1-2 sections. Frame it as a personal perspective, not a universal truth. Tag it as a contrarian or unique take.
   - Frame everything as personal experience, not professional advice. The reader should feel like they're learning from someone who's been through it, not being lectured by an expert.
   - Be vulnerable where appropriate. Share the failures, the doubts, the "I tried this and it didn't work" moments. That's what builds trust.

### PRIORITY 5: STRUCTURE + FORMATTING

10. DESIGN THE STRUCTURE YOURSELF: Choose the best H1 title, section headings, and flow based on the topic, context, and data gathered. Do NOT follow a fixed template — let the content dictate the structure.

11. H1: The H1 must include the Focus Keyword naturally. It should read like a compelling blog title, not a keyword-stuffed headline.

12. STAY ON TOPIC: Every section must directly address the searcher's question or a closely related sub-topic. Do NOT include filler sections, tangential stories, or generic advice. If the keyword is a question, every H2 should contribute to answering that question from a different angle.

13. TL;DR (MANDATORY): Immediately after the H1, include an H2 titled "TL;DR" (exact text). Under it, write a short descriptive paragraph (3-5 sentences) that gives the reader a direct, complete summary of the entire post. If the Focus Keyword is a question (what/how/why/when/where/who/does/can/is/are/should), the first sentence MUST answer that question directly — no hedging, no "it depends." Use concrete, active verbs. NEVER use abstract corporate buzzwords. NEVER use the word "guide" — say "this blog post" instead. The TL;DR must be factually accurate and objective — no opinions, no personal takes. Write as if this paragraph will be extracted verbatim as a featured snippet or AI search citation.

14. CONTENT: Under every heading, write engaging, authentic prose. H2s get 2-4 paragraphs. H3s get 1-2 paragraphs. The intro hook should grab attention in the first sentence — use a stat, a provocative statement, or a vivid anecdote.

15. STATS + OUTBOUND LINKS: For every statistic or data point mentioned, expand it into natural prose with a clickable markdown link. Use the source name as anchor text. Example: "According to [HealthLine](https://healthline.com/stats), 73% of men experience hair loss." Do NOT show the raw URL to the reader. Every stat MUST have a source link — this is critical for E-E-A-T. Use Exa and Firecrawl to find trustworthy sources if not already gathered.

16. PARAGRAPH LENGTH (NON-NEGOTIABLE): Every paragraph must be a MINIMUM of 3 lines and a MAXIMUM of 4 lines. If a paragraph runs longer than 4 lines, break it into two. If shorter than 3 lines, expand with supporting detail or merge with an adjacent paragraph.

17. ADDRESS AUDIENCE PAIN POINTS: Use the empathy themes gathered in Phase 1. Address the top emotional/practical concerns early, not buried deep. Use the phrasing patterns from real user questions to write relatable copy.

18. INTERNAL LINKS: Insert 3-5 internal links from the Internal Links file where contextually relevant. Use descriptive anchor text that matches the linked page topic. Never force irrelevant links.

19. MEDIA: Insert images from the Media file as markdown images (![alt text](url)) wherever they add visual context. Insert YouTube shorts/videos where relevant. Alt text must be descriptive.

20. GUARDRAILS COMPLIANCE: Every sentence must comply with the guardrails file. No banned phrases. No medical claims stated as fact (if YMYL niche). Frame everything as personal experience. Include disclaimers where required. Redirect medical/professional questions to qualified professionals.

21. KEY TAKEAWAYS: End the blog post with a "## Key Takeaways" section containing 3-5 actionable or informative takeaways based on the content you just wrote. Use parallel structure. Make each takeaway stand alone. End with a recommendation or next step when appropriate.

---

## LANGUAGE RULES (APPLY TO EVERYTHING)

- Use concrete, active verbs for actual tasks: inspect, clear, repair, replace, review, file, negotiate, defend, cover, explain, compare.
- Show how value is delivered through tangible actions, not abstract claims.
- NEVER use: boost, elevate, evolving, dominate, transform, leverage, utilize, maximize, optimize, enhance, revolutionize.
- NEVER use the word "guide" — say "this blog post" instead.
- Short sentences. No filler phrases. No fluff.
- Voice: conversational, authoritative, empathetic, personal.

---

## OUTPUT FORMAT

- Pure markdown
- Preserve H1/H2/H3 structure exactly
- No preamble, no trailing commentary, no code fences
- The output is the final blog post, ready to publish
