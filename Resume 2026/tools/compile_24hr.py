#!/usr/bin/env python3
"""Compile all 24hr jobs, score, and output Excel + CSV."""
import json
from pathlib import Path

# All jobs collected
all_jobs = [
    # Indeed 24hr
    {'title': 'Senior Digital Marketing Specialist, Growth & Digital Performance', 'company': 'Corpay', 'location': 'Toronto, ON', 'salary': '74000-112000', 'url': 'https://ca.indeed.com/viewjob?jk=28e775b5ddeee45b', 'platform': 'indeed'},
    {'title': 'Ecommerce Operations Specialist', 'company': 'Miele', 'location': '', 'salary': '70000-80000', 'url': 'https://ca.indeed.com/viewjob?jk=7fb4ab73530ece61', 'platform': 'indeed'},
    {'title': 'SFMC Specialist, Campaign Targeting and Performance', 'company': 'Sobeys', 'location': '', 'salary': '61000-84000', 'url': 'https://ca.indeed.com/viewjob?jk=0e1b9611ac1fd9a7', 'platform': 'indeed'},
    {'title': 'E-Commerce Specialist', 'company': 'Gentec International', 'location': '', 'salary': '60000-70000', 'url': 'https://ca.indeed.com/viewjob?jk=ddd097086cee8743', 'platform': 'indeed'},
    {'title': 'Meta Ad & CRM Integration Specialist', 'company': 'Toronto Academy of Education', 'location': 'Toronto, ON', 'salary': '22/hr', 'url': 'https://ca.indeed.com/viewjob?jk=572351642ffe3bb1', 'platform': 'indeed'},
    {'title': 'Content Manager', 'company': '', 'location': 'Remote', 'salary': '78000', 'url': 'https://ca.indeed.com/viewjob?jk=f7703f27c9e16ecd', 'platform': 'indeed'},
    {'title': 'Digital Content Creator', 'company': '', 'location': '', 'salary': '60000', 'url': 'https://ca.indeed.com/viewjob?jk=ba3d2affff6fb64d', 'platform': 'indeed'},
    {'title': 'Marketing Manager', 'company': 'Midnight Marketing', 'location': 'Remote', 'salary': '70000', 'url': 'https://ca.indeed.com/viewjob?jk=e40e53c95ad1a075', 'platform': 'indeed'},
    {'title': 'Growth Marketing & Systems Specialist (Canada)', 'company': 'ClinicGrower', 'location': 'Remote', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=4b8d3708fdcafc1d', 'platform': 'indeed'},
    {'title': 'Partnership & Affiliate Marketing Specialist', 'company': 'Harry Rosen Inc.', 'location': 'Toronto, ON', 'salary': '64000', 'url': 'https://ca.indeed.com/viewjob?jk=ade92aca2a2f8b22', 'platform': 'indeed'},
    {'title': 'Manager, Digital Marketing (12-month contract)', 'company': 'Mattamy Homes', 'location': 'Toronto, ON', 'salary': '85000-130000', 'url': 'https://ca.indeed.com/viewjob?jk=9655bddd09b7d539', 'platform': 'indeed'},
    {'title': 'Creative Content Specialist', 'company': 'Arctos & Bird Management Ltd.', 'location': '', 'salary': '58240-64480', 'url': 'https://ca.indeed.com/viewjob?jk=80107d370d563608', 'platform': 'indeed'},
    {'title': 'Scientific Digital Marketing Strategist - Remote', 'company': 'Supreme Optimization', 'location': 'Remote', 'salary': '69000-83000', 'url': 'https://ca.indeed.com/viewjob?jk=38fcdfd828d52ded', 'platform': 'indeed'},
    {'title': 'Scientific Digital Strategist - Remote', 'company': 'Supreme Optimization', 'location': 'Remote', 'salary': '69000-83000', 'url': 'https://ca.indeed.com/viewjob?jk=ad1cc3a50460741a', 'platform': 'indeed'},
    {'title': 'Paid Ads Specialist', 'company': 'Best Access Doors', 'location': 'Toronto, ON', 'salary': '70000-80000', 'url': 'https://ca.indeed.com/viewjob?jk=c083310fff7736b0', 'platform': 'indeed'},
    {'title': 'Senior Digital Content Designer, Digital Wealth', 'company': 'Tangerine Bank', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=1bd02884e6cc1851', 'platform': 'indeed'},
    {'title': 'Audience Engagement Manager', 'company': 'LabX Media Group', 'location': 'Toronto, ON', 'salary': '65000-85000', 'url': 'https://ca.indeed.com/viewjob?jk=6cdb85d324070aed', 'platform': 'indeed'},
    {'title': 'Industry Marketing Manager (Public Sector)', 'company': 'Softchoice', 'location': 'Toronto, ON', 'salary': '76000-102000', 'url': 'https://ca.indeed.com/viewjob?jk=5594e6b77879a7b4', 'platform': 'indeed'},
    {'title': 'Sr. Marketing Manager, Branch Experience', 'company': 'BMO Financial Group', 'location': 'Toronto, ON', 'salary': '69000-129000', 'url': 'https://ca.indeed.com/viewjob?jk=a7ab7c6e0f6b61c9', 'platform': 'indeed'},
    {'title': 'Director, Digital Marketing, Cross-Border Banking', 'company': 'Royal Bank of Canada', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=3de97ecca322140c', 'platform': 'indeed'},
    {'title': 'Senior Account Manager (DPMM)', 'company': 'VML', 'location': 'Toronto, ON', 'salary': '65000-115000', 'url': 'https://ca.indeed.com/viewjob?jk=5f7b5825bb375855', 'platform': 'indeed'},
    {'title': 'Digital Marketing (SEO/SEM/Social) Specialist', 'company': 'Websharx', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=886bd12ec5e6cad5', 'platform': 'indeed'},
    {'title': 'Technical Digital Content Writer', 'company': 'Graphite', 'location': 'Canada', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=fe9b969df73d7bd5', 'platform': 'indeed'},
    {'title': 'Marketing Specialist', 'company': 'Scispot', 'location': 'Canada', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=3ba413dc22d73679', 'platform': 'indeed'},
    {'title': 'E-Commerce Brand Copywriter', 'company': 'Flowline Merchant Funding', 'location': '', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=c42180240ce0decb', 'platform': 'indeed'},
    {'title': 'Principal Product Manager - AI Assistant', 'company': 'Constant Contact', 'location': 'Toronto, ON', 'salary': '148782-185977', 'url': 'https://ca.indeed.com/viewjob?jk=c8af0b9f99ceca65', 'platform': 'indeed'},
    # LinkedIn 24hr
    {'title': 'Web Content Manager', 'company': 'Insight Global', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4458325070/', 'platform': 'linkedin'},
    {'title': 'Paid Media Account Executive - Entry Level', 'company': 'Tug Agency', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4459346149/', 'platform': 'linkedin'},
    {'title': 'Account Strategist, SEO (Remote, Edmonton)', 'company': 'Blacksmith Agency', 'location': 'Canada (Remote)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4459336978/', 'platform': 'linkedin'},
    {'title': 'Manager, Digital Marketing (12-month contract)', 'company': 'Mattamy Homes', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4459349990/', 'platform': 'linkedin'},
    {'title': 'SEM Specialist', 'company': 'Starcom Canada', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4457943834/', 'platform': 'linkedin'},
    {'title': 'Copywriter (Team)', 'company': 'Cossette', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4459399465/', 'platform': 'linkedin'},
    {'title': 'Marketing Coordinator (Healthcare SaaS)', 'company': 'SecureRx Technologies Inc.', 'location': 'Ontario, Canada (Remote)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4458310932/', 'platform': 'linkedin'},
    {'title': 'Sr Manager, Marketing & Communications', 'company': 'Liver Canada', 'location': 'Markham, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4457951679/', 'platform': 'linkedin'},
    {'title': 'Marketing Operations Specialist', 'company': 'Skills for Change', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4459398260/', 'platform': 'linkedin'},
    {'title': 'Paid Media Specialist', 'company': 'Rockwell Automation', 'location': 'Toronto, ON (Hybrid)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4440054911/', 'platform': 'linkedin'},
    {'title': 'Marketing Growth Partner', 'company': 'Innermatch AI', 'location': 'Ontario, Canada (Remote)', 'salary': '', 'url': 'https://www.linkedin.com/jobs/view/4458335273/', 'platform': 'linkedin'},
    {'title': 'Growth Marketing Lead - Remote/Anywhere', 'company': 'Jiga', 'location': 'Canada (Remote)', 'salary': '100000-175000', 'url': 'https://www.linkedin.com/jobs/view/4459364437/', 'platform': 'linkedin'},
]

# Deduplicate
seen = set()
unique = []
for j in all_jobs:
    if j['url'] not in seen:
        seen.add(j['url'])
        unique.append(j)

# Score
industries = {
    'Health & Safety Training': ['first aid', 'cpr', 'aed', 'safety'],
    'Healthcare/Aesthetics': ['medspa', 'dental', 'clinic', 'wellness', 'medical', 'health', 'healthcare', 'saas'],
    'B2B Tech': ['saas', 'software', 'b2b', 'enterprise', 'technology', 'ai'],
    'Agency': ['agency', 'advertising'],
    'E-commerce/Retail': ['ecommerce', 'e-commerce', 'retail', 'shopify'],
    'Finance/Banking': ['bank', 'financial', 'banking'],
}

def get_score(j):
    t = j['title'].lower()
    s = 0
    if 'seo' in t and ('specialist' in t or 'strategist' in t): s += 30
    elif 'seo' in t and ('analyst' in t or 'coordinator' in t): s += 25
    elif 'seo' in t: s += 28
    elif 'digital marketing' in t and ('specialist' in t or 'strategist' in t): s += 20
    elif 'digital marketing' in t: s += 15
    elif 'search' in t and ('strategist' in t or 'specialist' in t): s += 25
    elif 'marketing' in t and ('specialist' in t or 'strategist' in t): s += 18
    elif 'marketing' in t: s += 12
    else: s += 10
    if 'seo' in t: s += 15
    elif 'digital marketing' in t: s += 10
    elif 'marketing' in t: s += 8
    for tool in ['wordpress', 'ga4', 'google analytics', 'search console', 'ahrefs', 'semrush']:
        if tool in t: s += 5
    if 'senior' in t or 'lead' in t or 'director' in t: s += 15
    elif 'specialist' in t or 'strategist' in t: s += 15
    elif 'coordinator' in t: s += 12
    elif 'analyst' in t: s += 10
    else: s += 12
    loc = j['location'].lower()
    if 'toronto' in loc or 'markham' in loc or 'vaughan' in loc or 'mississauga' in loc: s += 18
    elif 'remote' in loc: s += 16
    elif 'ontario' in loc: s += 15
    elif 'vancouver' in loc: s += 11
    elif 'canada' in loc: s += 10
    else: s += 7
    if j['platform'] == 'indeed': s += 2
    return min(s, 100)

def get_industry(j):
    text = (j['title'] + ' ' + j['company']).lower()
    for ind, kws in industries.items():
        for kw in kws:
            if kw in text: return ind
    return 'None detected'

for j in unique:
    j['score'] = get_score(j)
    j['industrial_relevance'] = get_industry(j)
    j['work_type'] = 'Remote' if 'remote' in j['location'].lower() else 'Hybrid' if 'hybrid' in j['location'].lower() else 'Unknown'
    j['reasoning'] = 'Title + Skills + Experience + Location'

unique.sort(key=lambda x: x['score'], reverse=True)

# Save scored
Path(r'F:\Opencode Projects\Resume 2026\.tmp\scored_jobs.json').write_text(
    json.dumps({'total': len(unique), 'jobs': unique}, indent=2))

print(f'Total unique jobs: {len(unique)}')
print(f'Platforms: Indeed={len([j for j in unique if j["platform"]=="indeed"])}, LinkedIn={len([j for j in unique if j["platform"]=="linkedin"])}')
print()
print('Top 10:')
for j in unique[:10]:
    print(f'  {j["score"]:3d} | {j["title"][:50]:50s} | {j["company"][:20]:20s} | {j["location"][:25]:25s} | {j["industrial_relevance"]}')
