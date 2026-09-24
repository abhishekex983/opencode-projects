#!/usr/bin/env python3
"""Compile and score all found jobs."""
import json

all_jobs = [
    {'title': 'Global Communications & Content Specialist', 'company': 'Corpay', 'location': 'Toronto, ON', 'salary': '65000-75000', 'url': 'https://ca.indeed.com/viewjob?jk=bc123cb8faf81e09', 'platform': 'indeed'},
    {'title': 'AEM Integration Specialist', 'company': 'BIMM', 'location': 'Toronto, ON', 'salary': '50000-60000', 'url': 'https://ca.indeed.com/viewjob?jk=beec5d34783096a2', 'platform': 'indeed'},
    {'title': 'Specialiste, Automatisation du marketing', 'company': 'CIHI', 'location': 'Toronto, ON', 'salary': '79277-93267', 'url': 'https://ca.indeed.com/viewjob?jk=c04b5d265ecbce19', 'platform': 'indeed'},
    {'title': 'Associate TikTok Strategist', 'company': 'Podean', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=72b20b3918ba901e', 'platform': 'indeed'},
    {'title': 'Growth Marketing & Systems Specialist (Canada)', 'company': 'ClinicGrower', 'location': 'Remote', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=4b8d3708fdcafc1d', 'platform': 'indeed'},
    {'title': 'Media Buyer - Meta & Google Ads', 'company': 'Les Plans Changent', 'location': 'Remote', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=8793dedf6fcd6078', 'platform': 'indeed'},
    {'title': 'Paid Ads Specialist', 'company': 'Best Access Doors', 'location': 'Toronto, ON', 'salary': '70000-80000', 'url': 'https://ca.indeed.com/viewjob?jk=c083310fff7736b0', 'platform': 'indeed'},
    {'title': 'Scientific Digital Strategist - Remote', 'company': 'Multiple openings', 'location': 'Remote', 'salary': '69000-83000', 'url': 'https://ca.indeed.com/viewjob?jk=ad1cc3a50460741a', 'platform': 'indeed'},
    {'title': 'Scientific Digital Marketing Strategist - Remote', 'company': 'Supreme Optimization', 'location': 'Remote', 'salary': '69000-83000', 'url': 'https://ca.indeed.com/viewjob?jk=38fcdfd828d52ded', 'platform': 'indeed'},
    {'title': 'TikTok Shop Strategist', 'company': 'Podean', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://ca.indeed.com/viewjob?jk=c25a647242c230f1', 'platform': 'indeed'},
    {'title': 'Partnership & Affiliate Marketing Specialist', 'company': 'Harry Rosen Inc.', 'location': 'Toronto, ON', 'salary': '64000', 'url': 'https://ca.indeed.com/viewjob?jk=ade92aca2a2f8b22', 'platform': 'indeed'},
    {'title': 'Digital Marketing (SEO/SEM/Social) Specialist', 'company': 'Web Sharx', 'location': 'Toronto, ON', 'salary': '', 'url': 'https://www.eluta.ca/job/web-sharx', 'platform': 'eluta'},
    {'title': 'Search Discoverability Specialist (SEO/AEO)', 'company': 'nvision Solutions Inc.', 'location': 'Markham, ON', 'salary': '75000-85000', 'url': 'https://www.eluta.ca/job/nvision', 'platform': 'eluta'},
    {'title': 'Digital Marketing SEO Specialist', 'company': 'Leadbright Inc.', 'location': 'Toronto, ON (Remote)', 'salary': '', 'url': 'https://www.eluta.ca/job/leadbright', 'platform': 'eluta'},
    {'title': 'SEO Specialist', 'company': 'Pleasant Solutions Inc.', 'location': 'Mississauga, ON', 'salary': '', 'url': 'https://www.eluta.ca/job/pleasant', 'platform': 'eluta'},
    {'title': 'Senior Search Strategist', 'company': 'Critical Mass Inc.', 'location': 'Toronto, ON', 'salary': '85000-100000', 'url': 'https://www.eluta.ca/job/critical-mass', 'platform': 'eluta'},
    {'title': 'Digital Marketing Coordinator', 'company': 'Team Town Sports', 'location': 'Vaughan, ON', 'salary': '60000-70000', 'url': 'https://www.eluta.ca/job/team-town', 'platform': 'eluta'},
]

# Deduplicate
seen = set()
unique = []
for j in all_jobs:
    if j['url'] not in seen:
        seen.add(j['url'])
        unique.append(j)

def get_score(j):
    t = j['title'].lower()
    s = 0
    if 'seo' in t and ('specialist' in t or 'strategist' in t): s += 30
    elif 'seo' in t and ('analyst' in t or 'coordinator' in t): s += 25
    elif 'seo' in t: s += 28
    elif 'digital marketing' in t and ('specialist' in t or 'strategist' in t): s += 20
    elif 'digital marketing' in t: s += 15
    elif 'search' in t and ('strategist' in t or 'specialist' in t): s += 25
    else: s += 10
    if 'seo' in t: s += 15
    elif 'digital marketing' in t: s += 10
    for tool in ['wordpress', 'ga4', 'google analytics', 'search console', 'ahrefs', 'semrush']:
        if tool in t: s += 5
    if 'senior' in t or 'lead' in t: s += 15
    elif 'specialist' in t or 'strategist' in t: s += 15
    elif 'coordinator' in t: s += 12
    elif 'analyst' in t: s += 10
    else: s += 12
    loc = j['location'].lower()
    if 'toronto' in loc or 'markham' in loc or 'vaughan' in loc or 'mississauga' in loc: s += 18
    elif 'remote' in loc: s += 16
    elif 'ontario' in loc: s += 15
    elif 'vancouver' in loc: s += 11
    else: s += 7
    if j['platform'] == 'indeed': s += 2
    return min(s, 100)

industries = {
    'Health & Safety Training': ['first aid', 'cpr', 'aed', 'safety'],
    'Healthcare/Aesthetics': ['medspa', 'dental', 'clinic', 'wellness', 'medical', 'health'],
    'B2B Tech': ['saas', 'software', 'b2b', 'enterprise', 'technology'],
    'Agency': ['digital marketing agency', 'advertising', 'agency'],
    'E-commerce/Retail': ['ecommerce', 'retail', 'shopify'],
}

def get_industry(j):
    text = (j['title'] + ' ' + j['company']).lower()
    for ind, kws in industries.items():
        for kw in kws:
            if kw in text: return ind
    return 'None detected'

for j in unique:
    j['score'] = get_score(j)
    j['industrial_relevance'] = get_industry(j)
    j['work_type'] = 'Remote' if 'remote' in j['location'].lower() else 'Unknown'
    j['reasoning'] = 'Title + Skills + Experience + Location'

unique.sort(key=lambda x: x['score'], reverse=True)

from pathlib import Path
Path(r'F:\Opencode Projects\Resume 2026\.tmp\scored_jobs.json').write_text(
    json.dumps({'total': len(unique), 'jobs': unique}, indent=2))

print(f'Saved {len(unique)} scored jobs')
for j in unique[:10]:
    print(f'  {j["score"]:3d} | {j["title"][:50]:50s} | {j["company"][:20]:20s} | {j["industrial_relevance"]}')
