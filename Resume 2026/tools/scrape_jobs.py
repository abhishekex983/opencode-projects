#!/usr/bin/env python3
"""
Job Scraper — Indeed, LinkedIn, Eluta.ca
Connects to running Chrome via CDP (port 9222).
Scrapes job listings from search results pages.
"""
import json
import time
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

# Paths
TMP_DIR = Path(r'F:\Opencode Projects\Resume 2026\.tmp')
OUTPUT_FILE = TMP_DIR / 'all_jobs_raw.json'

TITLES = [
    'SEO Specialist', 'SEO Strategist', 'SEO Analyst', 'SEO Coordinator',
    'SEO Consultant', 'Technical SEO Specialist', 'Digital Marketing Specialist',
    'Digital Marketing Coordinator', 'Digital Marketing Analyst',
    'Digital Marketing Strategist', 'Inbound Marketing Specialist',
    'Content SEO Specialist'
]

LOCATIONS = [
    {'name': 'Toronto', 'query': 'Toronto, ON', 'indeed_remote': False},
    {'name': 'Ontario', 'query': 'Ontario', 'indeed_remote': True},
    {'name': 'Vancouver', 'query': 'Vancouver, BC', 'indeed_remote': True},
    {'name': 'Vancouver Island', 'query': 'Vancouver Island, BC', 'indeed_remote': True},
    {'name': 'Thunder Bay', 'query': 'Thunder Bay, ON', 'indeed_remote': False},
]

INDEED_EXTRACT_JS = """() => {
    const results = [];
    const jkElements = document.querySelectorAll('[data-jk]');
    jkElements.forEach(el => {
        const jk = el.getAttribute('data-jk');
        const card = el.closest('li') || el;
        const text = card.innerText;
        const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
        let title = '', company = '', location = '', salary = '';
        const h = card.querySelector('h2, h3');
        if (h) title = h.textContent.trim();
        for (const line of lines) {
            if (line.match(/\\$[\\d,]+.*(?:a year|an hour|per year)/i)) salary = line;
            else if (line.match(/^(Remote|Hybrid|Toronto|.*ON,|.*AB,|.*BC,|Canada)/i) && !location) location = line;
            else if (line !== title && !line.match(/Easily|Promoted|New|Full-time|Part-time|Simply|Quick|days ago|hours ago|Sponsored/i) && line.length > 2 && line.length < 80 && !company) company = line;
        }
        if (title) results.push({ title, company, location, salary, url: 'https://ca.indeed.com/viewjob?jk=' + jk, platform: 'indeed' });
    });
    return results;
}"""

LINKEDIN_EXTRACT_JS = """() => {
    const results = [];
    const cards = document.querySelectorAll('[data-occludable-job-id]');
    cards.forEach(card => {
        const titleEl = card.querySelector('strong span, h3 a span');
        const title = titleEl ? titleEl.textContent.trim() : '';
        const linkEl = card.querySelector('a[href*="/jobs/view/"]');
        const url = linkEl ? linkEl.href.split('?')[0] : '';
        const allText = card.innerText;
        const lines = allText.split('\\n').map(l => l.trim()).filter(Boolean);
        let company = '', location = '', salary = '';
        for (const line of lines) {
            if (line.match(/\\$[\\d,]+/)) salary = line;
            else if (line.match(/(Remote|Hybrid|Toronto|.*ON|.*BC|.*AB|Canada|NAMER)/i) && !location) location = line;
            else if (line !== title && !line.match(/Promoted|Easy Apply|Viewed|\\d+ applicants|Actively/i) && line.length > 1 && line.length < 60 && !company) company = line;
        }
        if (title) results.push({ title, company, location, salary, url, platform: 'linkedin' });
    });
    return results;
}"""

ELUTA_EXTRACT_JS = """() => {
    const results = [];
    const cards = document.querySelectorAll('.result-content, [class*="job-card"], li[id*="job"]');
    if (cards.length === 0) {
        // Fallback: look for job title links
        const links = document.querySelectorAll('a[href*="/job/"]');
        links.forEach(link => {
            const title = link.textContent.trim();
            const card = link.closest('li') || link.closest('div') || link.parentElement;
            const text = card ? card.innerText : '';
            const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
            let company = '', location = '', salary = '';
            for (const line of lines) {
                if (line.match(/\\$[\\d,]+/)) salary = line;
                else if (line.match(/(Remote|Hybrid|Toronto|.*ON|.*BC|Canada)/i) && !location) location = line;
                else if (line !== title && line.length > 2 && line.length < 80 && !company && !line.match(/\\d+ (days|hours|weeks) ago/i)) company = line;
            }
            if (title && title.length > 3) results.push({ title, company, location, salary, url: link.href, platform: 'eluta' });
        });
    }
    return results;
}"""


def scrape_indeed(page, title, location, max_pages=2):
    """Scrape Indeed search results for a given title and location."""
    jobs = []
    query = location['query'].replace(' ', '+')
    remote_param = '' if not location['indeed_remote'] else '&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11'
    base_url = f'https://ca.indeed.com/jobs?q={title.replace(" ", "+")}&l={query}&fromage=3{remote_param}'

    for pg in range(max_pages):
        url = base_url + (f'&start={pg * 10}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(2)
            page_jobs = page.evaluate(INDEED_EXTRACT_JS)
            if not page_jobs:
                break
            jobs.extend(page_jobs)
            time.sleep(1)
        except Exception as e:
            print(f'    Indeed error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def scrape_linkedin(page, title, location, max_pages=2):
    """Scrape LinkedIn search results for a given title and location."""
    jobs = []
    loc_query = location['query']
    base_url = f'https://www.linkedin.com/jobs/search/?keywords={title.replace(" ", "%20")}&location={loc_query.replace(" ", "%20")}&f_WT=2%2C3&f_TPR=r259200'

    for pg in range(max_pages):
        url = base_url + (f'&start={pg * 25}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)
            page_jobs = page.evaluate(LINKEDIN_EXTRACT_JS)
            if not page_jobs:
                break
            jobs.extend(page_jobs)
            time.sleep(1)
        except Exception as e:
            print(f'    LinkedIn error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def scrape_eluta(page, title, location, max_pages=2):
    """Scrape Eluta.ca search results for a given title and location."""
    jobs = []
    loc_query = location['query'].replace(' ', '+')
    base_url = f'https://www.eluta.ca/search?q={title.replace(" ", "+")}&l={loc_query}'

    for pg in range(max_pages):
        url = base_url + (f'&pg={pg + 1}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(2)
            page_jobs = page.evaluate(ELUTA_EXTRACT_JS)
            if not page_jobs:
                break
            jobs.extend(page_jobs)
            time.sleep(1)
        except Exception as e:
            print(f'    Eluta error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def deduplicate(jobs):
    """Remove duplicates by URL."""
    seen = set()
    unique = []
    for job in jobs:
        url = job.get('url', '')
        if url and url not in seen:
            seen.add(url)
            unique.append(job)
    return unique


def main():
    all_jobs = []

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp('http://localhost:9222')
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        page = context.new_page()

        # Scrape Indeed
        print('=== Indeed ===')
        for title in TITLES:
            for loc in LOCATIONS:
                print(f'  {title} in {loc["name"]}...', end=' ', flush=True)
                jobs = scrape_indeed(page, title, loc, max_pages=2)
                all_jobs.extend(jobs)
                print(f'{len(jobs)} jobs')
                time.sleep(0.5)

        # Scrape LinkedIn (user should be logged in)
        print('\n=== LinkedIn ===')
        for title in TITLES:
            for loc in LOCATIONS:
                print(f'  {title} in {loc["name"]}...', end=' ', flush=True)
                jobs = scrape_linkedin(page, title, loc, max_pages=2)
                all_jobs.extend(jobs)
                print(f'{len(jobs)} jobs')
                time.sleep(0.5)

        # Scrape Eluta.ca
        print('\n=== Eluta.ca ===')
        for title in TITLES:
            for loc in LOCATIONS:
                print(f'  {title} in {loc["name"]}...', end=' ', flush=True)
                jobs = scrape_eluta(page, title, loc, max_pages=1)
                all_jobs.extend(jobs)
                print(f'{len(jobs)} jobs')
                time.sleep(0.5)

        page.close()

    # Deduplicate
    before = len(all_jobs)
    all_jobs = deduplicate(all_jobs)
    print(f'\nTotal: {before} → {len(all_jobs)} unique jobs')

    # Save
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'total': len(all_jobs), 'jobs': all_jobs}, f, indent=2, ensure_ascii=False)
    print(f'Saved to {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
