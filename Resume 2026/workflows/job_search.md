# Daily Job Search Workflow

## Purpose
Search for SEO/Digital Marketing jobs using hybrid approach (Exa API + Firecrawl + Playwright), score by relevancy, tag industrial relevance, output top 50 as Excel + CSV.

## Inputs
- **Resume**: `F:\Resume 2026\Abhishek Bolar - SEO Strategist & Marketing Specialist.pdf`
- **Exclusion List**: `F:\Resume 2026\exclusion_urls.json`
- **Date Filter**: 3 days
- **Context**: `F:\Resume 2026\context.md`
- **API Keys**: `F:\Resume 2026\tools\.env`

## Search Parameters
### Job Titles (12)
SEO Specialist, SEO Strategist, SEO Analyst, SEO Coordinator, SEO Consultant, Technical SEO Specialist, Digital Marketing Specialist, Digital Marketing Coordinator, Digital Marketing Analyst, Digital Marketing Strategist, Inbound Marketing Specialist, Content & SEO Specialist

### Locations (5)
Toronto, Ontario, Vancouver, Vancouver Island, Thunder Bay

### Location Rules
| Priority | Location | Work Type | Points |
|----------|----------|-----------|--------|
| 1 | Toronto | Remote/Hybrid/Onsite | 20/18/15 |
| 2 | Ontario (excl. Toronto) | Remote/Hybrid | 16/14 |
| 3 | Vancouver / Vancouver Island | Remote/Hybrid | 12/10 |
| 4 | Thunder Bay | Remote/Hybrid/Onsite | 10/8/5 |
| 5 | Canada-wide | Remote only | 8/6 |

## Process

### Step 1: SERP Search (Exa API)
Run: `python tools/serp_search.py --batch --output .tmp/serp_results.json`
- Searches Google for job URLs on Indeed/LinkedIn
- 12 titles × 5 locations = 60 queries
- Output: .tmp/serp_results.json
- Cost: Free tier (Exa)

### Step 2: Scrape Job Pages (Firecrawl)
For each job URL from Step 1:
- Use `firecrawl_scrape` to get full job description
- Extract: title, company, location, salary, description, requirements
- Save to: .tmp/jobs_with_descriptions.json
- Skip if URL is in exclusion_urls.json

### Step 3: LinkedIn via Playwright (Optional)
If user wants additional LinkedIn results:
- Open Playwright browser
- User manually logs into LinkedIn
- Scrape LinkedIn job search results
- Save to: .tmp/linkedin_raw.json

### Step 4: Load Exclusions
- Load exclusion_urls.json
- Filter out already-processed URLs
- Update count

### Step 5: Score Jobs (0-100)
For each job, apply scoring rubric:

| Category | Points | Criteria |
|----------|--------|----------|
| Title Match | 30 | SEO Specialist/Strategist=30, DM+SEO=25, DM general=15 |
| Skills Match | 35 | SEO in title=+15, DM=+10, tools (WordPress, GA4, Ahrefs, Schema)=+5 each |
| Experience | 15 | Specialist/Strategist=15, Coordinator=12, Analyst=10 |
| Location/Type | 20 | Combined matrix (Toronto+Remote=20, Canada+Onsite=3) |

**Description Override**: If job description has 3+ SEO signals (audits, keyword research, link building, WordPress, GA4, Ahrefs, schema), treat as SEO role regardless of title.

### Step 6: Tag Industrial Relevance
Check job description/company for industry match:

| Priority | Industry | Keywords |
|----------|----------|----------|
| 1 | Health & Safety Training | first aid, CPR, AED, safety, emergency |
| 2 | Healthcare/Aesthetics | medspa, dental, clinic, wellness |
| 3 | B2B Tech | SaaS, software, IT, B2B |
| 4 | Local Services | plumbing, HVAC, cleaning, home |
| 5+ | Other | industrial, agency, construction, education, e-commerce |

Output: Comma-separated tags, e.g. "Health & Safety Training, B2B Tech"

### Step 7: Output
Run: `python tools/process_jobs.py`
- Sort by score descending
- Take top 50
- Output: job_listings_fresh.xlsx (Excel) + job_listings_fresh.csv (CSV)
- Auto-open Excel with os.startfile()
- Update exclusion_urls.json with new URLs

## Output Files
- `F:\Resume 2026\job_listings_fresh.xlsx` — daily fresh results (Excel)
- `F:\Resume 2026\job_listings_fresh.csv` — daily fresh results (CSV)
- Updated `exclusion_urls.json` — cumulative skip list
- `.tmp/serp_results.json` — Exa search results (disposable)
- `.tmp/jobs_with_descriptions.json` — scraped job data (disposable)
- `.tmp/linkedin_raw.json` — raw LinkedIn data (disposable)

## Tools Used
| Tool | Purpose | Auth |
|------|---------|------|
| serp_search.py | Search Google for job URLs | Exa API key in .env |
| Firecrawl MCP | Scrape individual job pages | API key in opencode.json |
| Playwright MCP | LinkedIn scraping (optional) | Manual login |
| process_jobs.py | Score, tag, output Excel/CSV | None |

## Known Issues
- **localStorage domain-specific**: Dump to file before switching Indeed ↔ LinkedIn
- **Company field noise**: Clean "Often replies in X day" during scoring
- **Swapped fields**: LinkedIn sometimes swaps company↔location
- **Cloudflare**: Indeed may show challenge, wait 10s for auto-resolve
- **run_code_unsafe**: Triggers Cloudflare on Indeed. Use MCP tools instead
- **LinkedIn login wall**: Only shows limited results without login
- **DataForSEO SERP**: May return 401. Use Exa as primary.
