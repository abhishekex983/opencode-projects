# Job Search Automation

## My Profile
- **Resume**: F:\Resume 2026\Abhishek Bolar - SEO Strategist & Marketing Specialist.pdf
- **Portfolio**: https://shettymarketing.com/
- **Current Title**: SEO Specialist & Marketing Coordinator
- **Experience**: 5+ years (mid-level)
- **Location**: Toronto, Ontario
- **Core Skills**: SEO (technical/on-page/off-page/local), WordPress, GA4, Search Console, Ahrefs, Email Marketing, B2B Lead Gen, Link Building, Content Strategy, AI Workflows (n8n, Claude), Schema Markup, Canva, HTML/CSS/PHP

## Search Parameters
- **Job Titles**: SEO Specialist, SEO Strategist, SEO Analyst, SEO Coordinator, SEO Consultant, Technical SEO Specialist, Digital Marketing Specialist, Digital Marketing Coordinator, Digital Marketing Analyst, Digital Marketing Strategist, Inbound Marketing Specialist, Content & SEO Specialist
- **Locations**: Toronto, Ontario, Vancouver, Vancouver Island, Thunder Bay, Canada
- **Work Type**: Remote (priority) > Hybrid > Onsite
- **Date Range**: Last 3 days
- **Exclude**: Coast2Coast First Aid and Aquatics, Marketing Manager titles
- **Max Results**: 50

## Priority Tiers
| Priority | Location | Work Type | Points |
|----------|----------|-----------|--------|
| 1 | Toronto | Remote/Hybrid/Onsite | 20/18/15 |
| 2 | Ontario (excl. Toronto) | Remote/Hybrid | 16/14 |
| 3 | Vancouver / Vancouver Island | Remote/Hybrid | 12/10 |
| 4 | Thunder Bay | Remote/Hybrid/Onsite | 10/8/5 |
| 5 | Canada-wide | Remote only | 8/6 |

## Platforms
1. Indeed Canada (priority) — ca.indeed.com
2. LinkedIn Jobs — linkedin.com/jobs

## Search Sources
1. **Exa API** (primary) — searches Google for job URLs via serp_search.py
2. **Firecrawl** — scrapes individual job pages for full descriptions
3. **Playwright** — LinkedIn scraping (requires manual login)

## Process
1. Run serp_search.py to search Google for jobs (Exa API)
   - 12 titles × 5 locations = 60 queries
   - Output: .tmp/serp_results.json
2. Scrape job pages with Firecrawl for full descriptions
3. LinkedIn via Playwright (if needed, user logs in manually)
4. Deduplicate across platforms (by URL)
5. Score each job (0-100) using rubric:
   - Title match (30pts): exact SEO title=30, DM+SEO=25, DM general=15
   - Skills match (35pts): SEO in title=+15, DM=+10, tools mentioned
   - Experience (15pts): Specialist/Strategist=15, Coordinator=12, Analyst=10
   - Location/type (20pts): combined matrix (Toronto+Remote=20, Canada+Onsite=3)
6. Tag industrial relevance (10 categories, priority order)
7. Sort by score descending, output top 50

## Scoring Rubric (0-100)
| Category | Points | Criteria |
|----------|--------|----------|
| Title Match | 30 | SEO Specialist/Strategist=30, DM+SEO=25, DM general=15 |
| Skills Match | 35 | SEO in title=+15, DM=+10, tools (WordPress, GA4, Ahrefs, Schema)=+5 each |
| Experience | 15 | Specialist/Strategist=15, Coordinator=12, Analyst=10 |
| Location/Type | 20 | Combined matrix (Toronto+Remote=20, Canada+Onsite=3) |

**Description Override**: 3+ SEO signals in description → treat as SEO role regardless of title.

## Industrial Relevance
| Priority | Industry | Keywords |
|----------|----------|----------|
| 1 | Health & Safety Training | first aid, CPR, AED, safety, emergency |
| 2 | Healthcare/Aesthetics | medspa, dental, clinic, wellness |
| 3 | B2B Tech | SaaS, software, IT, B2B |
| 4 | Local Services | plumbing, HVAC, cleaning, home |
| 5 | Industrial/Manufacturing | CNC, machinery, air purification |
| 6 | Agency | digital marketing, creative, advertising |
| 7 | Construction/Trades | construction, electrical, contracting |
| 8 | Education/Training | training, courses, certification |
| 9 | E-commerce/Retail | ecommerce, retail, Shopify |
| 10 | Other | any other industry |

**Output**: Comma-separated tags, e.g. "Health & Safety Training, B2B Tech" or "None detected"

## Output
- **Format**: Single-sheet Excel (.xlsx) + CSV backup
- **File**: F:\Resume 2026\job_listings_fresh.xlsx + .csv
- **Auto-open**: Excel opens automatically after generation
- **Columns**: Rank, Title, Company, Location, Work_Type, Relevancy_Score, Industrial_Relevance, Salary, URL, Platform, Reasoning

## Cost Per Run
- Exa API: Free tier (60 queries)
- Firecrawl: Free tier (50-100 pages)
- Playwright: Free (LinkedIn only)
- **Total**: ~$0.00-0.06 per run
