#!/usr/bin/env python3
"""
Score Toronto jobs based on title, skills, experience, and distance.
"""
import json
from pathlib import Path

INPUT_FILE = Path(r'F:\Opencode Projects\Resume 2026\.tmp\jobs_with_distance.json')
OUTPUT_FILE = Path(r'F:\Opencode Projects\Resume 2026\.tmp\scored_jobs.json')

# SEO keywords for skills scoring
SEO_KEYWORDS = ['seo', 'search engine optimization', 'keyword research', 'link building',
                'technical seo', 'on-page', 'off-page', 'backlink', 'serp', 'ranking',
                'wordpress', 'google analytics', 'ga4', 'search console', 'ahrefs',
                'semrush', 'schema markup', 'content strategy', 'geographic', 'aeo',
                'generative engine optimization', 'ai search', 'local seo']

# Industrial relevance keywords
INDUSTRIES = {
    'Health & Safety Training': ['first aid', 'cpr', 'aed', 'safety training', 'emergency', 'paramedic'],
    'Healthcare/Aesthetics': ['medspa', 'dental', 'clinic', 'wellness', 'healthcare', 'aesthetics', 'medical'],
    'B2B Tech': ['saas', 'software', 'tech startup', 'b2b', 'enterprise', 'technology'],
    'Local Services': ['plumbing', 'hvac', 'cleaning', 'home services', 'restoration', 'landscaping'],
    'Agency': ['digital marketing agency', 'creative agency', 'advertising agency', 'marketing agency'],
    'E-commerce/Retail': ['ecommerce', 'e-commerce', 'retail', 'shopify', 'dtc'],
    'Finance': ['banking', 'insurance', 'financial', 'investment', 'capital'],
    'Real Estate': ['real estate', 'property', 'realtor'],
}


def get_title_score(title):
    """Score based on job title matching SEO."""
    t = title.lower()
    if 'seo' in t and ('specialist' in t or 'strategist' in t):
        return 30
    elif 'seo' in t and ('analyst' in t or 'coordinator' in t):
        return 25
    elif 'seo' in t:
        return 28
    elif 'geographic' in t or 'geo' in t:
        return 27
    elif 'digital marketing' in t and ('specialist' in t or 'strategist' in t):
        return 20
    elif 'digital marketing' in t:
        return 15
    elif 'content' in t and 'seo' in t:
        return 25
    elif 'inbound' in t:
        return 18
    elif 'marketing specialist' in t:
        return 18
    elif 'marketing coordinator' in t:
        return 15
    elif 'marketing manager' in t:
        return 15
    elif 'content' in t:
        return 14
    elif 'social media' in t:
        return 12
    elif 'email' in t and 'marketing' in t:
        return 13
    elif 'paid' in t or 'ppc' in t or 'ads' in t:
        return 14
    return 12


def get_skills_score(title, description):
    """Score based on SEO skills in description."""
    text = (title + ' ' + description).lower()
    score = 0
    
    # Core SEO mentions
    if 'seo' in text:
        score += 15
    elif 'search engine' in text:
        score += 10
    
    # AEO/GEO (emerging)
    if 'aeo' in text or 'generative engine' in text or 'ai search' in text:
        score += 8
    
    # Tools
    for tool in ['wordpress', 'ga4', 'google analytics', 'search console', 'ahrefs', 'semrush', 'schema', 'moz']:
        if tool in text:
            score += 5
    
    return min(score, 35)


def get_experience_score(title):
    """Score based on experience level."""
    t = title.lower()
    if 'senior' in t or 'lead' in t or 'director' in t or 'vp' in t:
        return 15
    elif 'specialist' in t or 'strategist' in t:
        return 15
    elif 'coordinator' in t:
        return 12
    elif 'analyst' in t:
        return 12
    elif 'manager' in t:
        return 14
    elif 'intern' in t:
        return 8
    return 12


def get_distance_score(distance_km, work_type):
    """Score based on distance from 137 Eglinton Ave West."""
    if work_type == 'Remote':
        return 20
    if distance_km is None:
        return 10
    if distance_km <= 5:
        return 20
    elif distance_km <= 10:
        return 18
    elif distance_km <= 15:
        return 15
    elif distance_km <= 20:
        return 12
    elif distance_km <= 25:
        return 10
    elif distance_km <= 35:
        return 7
    elif distance_km <= 50:
        return 5
    else:
        return 3


def get_industrial_relevance(title, company, description):
    """Tag industrial relevance."""
    text = (title + ' ' + company + ' ' + description).lower()
    found = []
    for industry, keywords in INDUSTRIES.items():
        for kw in keywords:
            if kw in text:
                found.append(industry)
                break
    return ', '.join(found) if found else 'None detected'


def main():
    if not INPUT_FILE.exists():
        print(f'ERROR: {INPUT_FILE} not found')
        return
    
    data = json.loads(INPUT_FILE.read_text(encoding='utf-8'))
    jobs = data.get('jobs', [])
    print(f'Loaded {len(jobs)} jobs')
    
    # Score all jobs
    scored = []
    for job in jobs:
        title = job.get('title', '')
        desc = job.get('description', '')
        company = job.get('company', '')
        distance = job.get('distance_km')
        work_type = job.get('work_type', 'Unknown')
        
        title_score = get_title_score(title)
        skills_score = get_skills_score(title, desc)
        experience_score = get_experience_score(title)
        distance_score = get_distance_score(distance, work_type)
        
        total = title_score + skills_score + experience_score + distance_score
        total = min(total, 100)
        
        job['score'] = total
        job['title_score'] = title_score
        job['skills_score'] = skills_score
        job['experience_score'] = experience_score
        job['distance_score'] = distance_score
        job['industrial_relevance'] = get_industrial_relevance(title, company, desc)
        job['reasoning'] = f'Title:{title_score} Skills:{skills_score} Exp:{experience_score} Dist:{distance_score}'
        
        scored.append(job)
    
    # Sort by score
    scored.sort(key=lambda x: x['score'], reverse=True)
    
    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'total': len(scored), 'jobs': scored}, f, indent=2, ensure_ascii=False)
    
    print(f'Scored {len(scored)} jobs')
    print(f'\nTop 15:')
    for j in scored[:15]:
        dist = j.get('distance_km', '?')
        print(f'  {j["score"]:3d} | {j["title"][:45]:45s} | {dist} km | {j["work_type"]}')


if __name__ == '__main__':
    main()
