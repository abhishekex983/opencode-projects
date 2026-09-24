#!/usr/bin/env python3
"""Score all SERP results and output top 50."""
import json
from pathlib import Path

# Load jobs
data = json.load(open(r'F:\Opencode Projects\Resume 2026\.tmp\serp_results.json'))
jobs = data['jobs']

# SEO keywords for skills scoring
seo_keywords = ['seo', 'search engine optimization', 'keyword research', 'link building',
                'technical seo', 'on-page', 'off-page', 'backlink', 'serp', 'ranking',
                'wordpress', 'google analytics', 'ga4', 'search console', 'ahrefs',
                'semrush', 'schema markup', 'content strategy']

# Industrial relevance keywords
industries = {
    'Health & Safety Training': ['first aid', 'cpr', 'aed', 'safety training', 'emergency', 'paramedic'],
    'Healthcare/Aesthetics': ['medspa', 'dental', 'clinic', 'wellness', 'healthcare', 'aesthetics', 'medical'],
    'B2B Tech': ['saas', 'software', 'tech startup', 'b2b', 'enterprise', 'technology'],
    'Local Services': ['plumbing', 'hvac', 'cleaning', 'home services', 'restoration', 'landscaping'],
    'Industrial/Manufacturing': ['cnc', 'machinery', 'air purification', 'fabrication', 'manufacturing'],
    'Agency': ['digital marketing agency', 'creative agency', 'advertising agency'],
    'Construction/Trades': ['construction', 'electrical', 'contracting'],
    'Education/Training': ['training', 'courses', 'certification', 'education'],
    'E-commerce/Retail': ['ecommerce', 'e-commerce', 'retail', 'shopify'],
}

def get_title_score(search_title):
    title = search_title.lower()
    if 'seo' in title and ('specialist' in title or 'strategist' in title):
        return 30
    elif 'seo' in title and ('analyst' in title or 'coordinator' in title):
        return 25
    elif 'seo' in title:
        return 28
    elif 'digital marketing' in title and ('specialist' in title or 'strategist' in title):
        return 20
    elif 'digital marketing' in title:
        return 15
    elif 'content' in title and 'seo' in title:
        return 25
    elif 'inbound' in title:
        return 18
    return 15

def get_skills_score(search_title, snippet):
    score = 0
    text = (search_title + ' ' + snippet).lower()
    if 'seo' in text:
        score += 15
    elif 'digital marketing' in text:
        score += 10
    for tool in ['wordpress', 'ga4', 'google analytics', 'search console', 'ahrefs', 'semrush', 'schema']:
        if tool in text:
            score += 5
    return min(score, 35)

def get_experience_score(search_title):
    title = search_title.lower()
    if 'senior' in title or 'lead' in title or 'director' in title:
        return 15
    elif 'specialist' in title or 'strategist' in title:
        return 15
    elif 'coordinator' in title:
        return 12
    elif 'analyst' in title:
        return 10
    return 12

def get_location_score(location):
    loc = location.lower()
    if 'toronto' in loc:
        return 18
    elif 'ontario' in loc:
        return 15
    elif 'vancouver' in loc:
        return 11
    elif 'thunder bay' in loc:
        return 8
    return 7

def get_industrial_relevance(snippet):
    text = snippet.lower()
    found = []
    for industry, keywords in industries.items():
        for kw in keywords:
            if kw in text:
                found.append(industry)
                break
    return ', '.join(found) if found else 'None detected'

# Score all jobs
scored = []
for job in jobs:
    title_score = get_title_score(job['search_title'])
    skills_score = get_skills_score(job['search_title'], job['snippet'])
    experience_score = get_experience_score(job['search_title'])
    location_score = get_location_score(job['search_location'])
    total = title_score + skills_score + experience_score + location_score
    if job['platform'] == 'indeed':
        total = min(total + 2, 100)
    total = min(total, 100)

    job['score'] = total
    job['title_score'] = title_score
    job['skills_score'] = skills_score
    job['experience_score'] = experience_score
    job['location_score'] = location_score
    job['work_type'] = 'Unknown'
    job['industrial_relevance'] = get_industrial_relevance(job['snippet'])
    job['reasoning'] = f'Title:{title_score} Skills:{skills_score} Exp:{experience_score} Loc:{location_score}'
    scored.append(job)

scored.sort(key=lambda x: x['score'], reverse=True)
top50 = scored[:50]

out = {'total': len(top50), 'all_scored': len(scored), 'jobs': top50}
Path(r'F:\Opencode Projects\Resume 2026\.tmp\scored_jobs.json').write_text(
    json.dumps(out, indent=2, ensure_ascii=False))

print(f'Scored {len(scored)} jobs')
print(f'Top 50 saved')
print()
print('Top 10:')
for j in top50[:10]:
    print(f'  {j["score"]:3d} | {j["title"][:55]:55s} | {j["industrial_relevance"]}')
