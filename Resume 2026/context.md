# Context

## User Profile
- **Name**: Abhishek Bolar
- **Title**: SEO Specialist & Marketing Coordinator
- **Experience**: 5+ years (mid-level)
- **Current Role**: Coast2Coast First Aid and Aquatics (Mar 2026–present)
- **Previous Role**: Digital Marketing Specialist @ InnoVyne Tech (Jun 2021–Oct 2025)
- **Portfolio**: https://shettymarketing.com/
- **Location**: Toronto, Ontario

## Core Skills
- SEO (technical, on-page, off-page, local)
- WordPress, Elementor
- Google Analytics (GA4), Search Console, Ahrefs
- Email marketing, nurture sequences
- B2B lead generation, link building
- Content strategy (TOFU/BOFU)
- AI workflows (n8n, Claude, Gemini, DataforSEO)
- Schema markup, AEO (Answer Engine Optimization)
- Canva, Adobe tools, HTML/CSS/PHP

## Search Parameters
- **Job Titles**: SEO Specialist, SEO Strategist, SEO Analyst, SEO Coordinator, SEO Consultant, Technical SEO Specialist, Digital Marketing Specialist, Digital Marketing Coordinator, Digital Marketing Analyst, Digital Marketing Strategist, Inbound Marketing Specialist, Content & SEO Specialist
- **Locations**: Toronto, Ontario, Vancouver, Vancouver Island, Thunder Bay, Canada
- **Date Range**: Last 3 days (fromage=3, f_TPR=r259200)
- **Exclude**: Coast2Coast First Aid and Aquatics, Marketing Manager titles
- **Max Results**: 50

## Priority Tiers (Location + Work Type)
| Priority | Location | Work Type | Points |
|----------|----------|-----------|--------|
| 1 | Toronto | Remote/Hybrid/Onsite | 20/18/15 |
| 2 | Ontario (excl. Toronto) | Remote/Hybrid | 16/14 |
| 3 | Vancouver / Vancouver Island | Remote/Hybrid | 12/10 |
| 4 | Thunder Bay | Remote/Hybrid/Onsite | 10/8/5 |
| 5 | Canada-wide | Remote only | 8/6 |

## Work Type Priority
1. Remote (highest)
2. Hybrid
3. Onsite (lowest)

## Platforms
1. Indeed Canada (priority) — ca.indeed.com
2. LinkedIn Jobs — linkedin.com/jobs

## Search Sources (Hybrid Approach)
| Source | Purpose | Tool |
|--------|---------|------|
| Exa API | Search Google for job URLs | serp_search.py (primary) |
| DataForSEO SERP | Search Google for job URLs | serp_search.py (fallback, needs API access) |
| Firecrawl | Scrape individual job pages for descriptions | MCP tool |
| Playwright | LinkedIn scraping (requires manual login) | MCP tool |

## Indeed URL Patterns
- Search: `https://ca.indeed.com/jobs?q={query}&l={location}&fromage={days}&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11`
- `fromage=3` = 3 days, `fromage=7` = week
- Remote filter: `remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11`
- Job detail: `https://ca.indeed.com/viewjob?jk={job_key}`

## LinkedIn URL Patterns
- Search: `https://www.linkedin.com/jobs/search/?keywords={query}&location={loc}&f_WT=2%2C3&f_TPR=r{seconds}`
- `f_WT=2,3` = Remote + Hybrid
- `f_TPR=r259200` = 3 days, `f_TPR=r604800` = week
- Job detail: `https://www.linkedin.com/jobs/view/{job_id}/`

## Relevancy Scoring Rubric (0-100)
| Category | Points | Criteria |
|----------|--------|----------|
| Title Match | 30 | SEO Specialist/Strategist=30, DM+SEO=25, DM general=15 |
| Skills Match | 35 | SEO in title=+15, DM=+10, tools (WordPress, GA4, Ahrefs, Schema)=+5 each, max 35 |
| Experience | 15 | Specialist/Strategist=15, Coordinator=12, Analyst=10 |
| Location/Type | 20 | Combined matrix (Toronto+Remote=20, Canada+Onsite=3) |

**Description Override**: If job description has 3+ SEO signals (audits, keyword research, link building, WordPress, GA4, Ahrefs, schema), treat as SEO role regardless of title.

## Industrial Relevance
Check job description/company for industry match. Priority order:

| Priority | Industry | Keywords to Match |
|----------|----------|-------------------|
| 1 | Health & Safety Training | first aid, CPR, AED, safety training, emergency, paramedic, occupational health |
| 2 | Healthcare/Aesthetics | medspa, dental, clinic, wellness, healthcare, aesthetics, medical |
| 3 | B2B Tech | SaaS, software, IT, tech startup, B2B, enterprise |
| 4 | Local Services | plumbing, HVAC, cleaning, home services, restoration, landscaping |
| 5 | Industrial/Manufacturing | CNC, machinery, air purification, fabrication, warehousing |
| 6 | Agency | digital marketing, creative, advertising, media |
| 7 | Construction/Trades | construction, electrical, plumbing, contracting |
| 8 | Education/Training | training, courses, certification, education |
| 9 | E-commerce/Retail | ecommerce, retail, Shopify, WooCommerce |
| 10 | Other | any other industry |

**Output**: Comma-separated tags, e.g. "Health & Safety Training, B2B Tech" or "None detected"

## Extraction Selectors
### Indeed
- Job cards: `a[data-jk]` links inside `.job_seen_beacon`
- Title: link text
- Job key: `data-jk` attribute
- Company/location/salary: parsed from card innerText lines

### LinkedIn
- Job cards: `a[href*="/jobs/view/"]` inside `li` elements
- Title: link text
- URL: href (strip query params)
- Company/location: parsed from card innerText

## Known Issues
- **localStorage domain-specific**: Data lost when navigating between Indeed ↔ LinkedIn. Always dump to file before switching domains.
- **Company field noise**: Indeed sometimes puts UI text ("Often replies in 1 day") or location text in company field. Clean during scoring.
- **Swapped fields**: LinkedIn sometimes swaps company↔location. Fix during scoring.
- **Cloudflare**: Indeed may show "Just a moment..." challenge. Wait 10s for auto-resolve.
- **run_code_unsafe**: Triggers Cloudflare on Indeed. Use MCP tools instead.
- **LinkedIn login wall**: Only shows limited results without login. User logs in manually.
- **DataForSEO SERP**: May return 401 if API access not enabled. Use Exa as primary.

## Output Files
- `F:\Resume 2026\job_listings_fresh.csv` — daily fresh results (CSV)
- `F:\Resume 2026\job_listings_fresh.xlsx` — daily fresh results (Excel)
- `F:\Resume 2026\exclusion_urls.json` — cumulative skip list
- `.tmp/indeed_raw.json` — raw Indeed data (disposable)
- `.tmp/linkedin_raw.json` — raw LinkedIn data (disposable)
- `.tmp/serp_results.json` — Exa/DataForSEO search results (disposable)
- `F:\Resume 2026\input.md` — reusable prompt for future runs
- `F:\Resume 2026\context.md` — this file

## Achievements
- 2024 Best Performer @ InnoVyne
- 211.57% YoY traffic growth for medspa client
- 200% traffic boost for InnoVyne over 6 months
- Built AI-powered SEO tools (on-page, off-page, keyword research, audience research)
