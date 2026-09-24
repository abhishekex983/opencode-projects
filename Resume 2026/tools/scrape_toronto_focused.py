#!/usr/bin/env python3
"""
Toronto-Focused Job Scraper — Indeed, LinkedIn, Eluta.ca
Scrapes SEO and Marketing Specialist jobs in Toronto with descriptions.
"""
import json
import time
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

# Paths
TMP_DIR = Path(r'F:\Opencode Projects\Resume 2026\.tmp')
OUTPUT_FILE = TMP_DIR / 'all_jobs_toronto.json'

TITLES = [
    'SEO Specialist',
    'SEO Strategist',
    'SEO Analyst',
    'Digital Marketing Specialist',
    'Marketing Specialist SEO',
]

LOCATIONS = [
    {'name': 'Toronto', 'query': 'Toronto, ON', 'indeed_remote': False},
]

# JavaScript extractors
INDEED_EXTRACT = """() => {
    const r = [];
    document.querySelectorAll('[data-jk]').forEach(el => {
        const jk = el.getAttribute('data-jk');
        const card = el.closest('li') || el;
        const h = card.querySelector('h2, h3');
        const title = h ? h.textContent.trim() : '';
        const lines = card.innerText.split('\\n').map(l => l.trim()).filter(Boolean);
        let company = '', location = '', salary = '';
        for (const line of lines) {
            if (line.match(/\\$[\\d,]+.*(?:a year|an hour|per year|per hour)/i)) salary = line;
            else if (line.match(/^(Remote|Hybrid|Toronto|.*ON,|.*AB,|.*BC,|Canada)/i) && !location) location = line;
            else if (line !== title && !line.match(/Easily|Promoted|New|Full-time|Part-time|Sponsored|\\d+ days? ago|\\d+ hours? ago/i) && line.length > 2 && line.length < 80 && !company) company = line;
        }
        if (title) r.push({ title, company, location, salary, url: 'https://ca.indeed.com/viewjob?jk=' + jk, platform: 'indeed' });
    });
    return r;
}"""

LINKEDIN_EXTRACT = """() => {
    const r = [];
    document.querySelectorAll('.job-search-card, .base-card, [data-occludable-job-id]').forEach(card => {
        const titleEl = card.querySelector('.base-search-card__title, strong span, h3');
        const title = titleEl ? titleEl.textContent.trim() : '';
        const linkEl = card.querySelector('a[href*="/jobs/view/"]');
        const url = linkEl ? linkEl.href.split('?')[0] : '';
        const companyEl = card.querySelector('.base-search-card__subtitle, .hidden-nested-link');
        const company = companyEl ? companyEl.textContent.trim() : '';
        const locationEl = card.querySelector('.job-search-card__location');
        const location = locationEl ? locationEl.textContent.trim() : '';
        if (title && url) r.push({ title, company, location, salary: '', url, platform: 'linkedin' });
    });
    return r;
}"""

ELUTA_EXTRACT = """() => {
    const r = [];
    const links = document.querySelectorAll('a[href*="/job/"]');
    links.forEach(link => {
        const title = link.textContent.trim();
        const card = link.closest('li') || link.closest('div') || link.parentElement;
        const text = card ? card.innerText : '';
        const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
        let company = '', location = '', salary = '', posted = '';
        for (const line of lines) {
            if (line.match(/\\$[\\d,]+/)) salary = line;
            else if (line.match(/(Remote|Hybrid|Toronto|.*ON|.*BC|Canada)/i) && !location) location = line;
            else if (line.match(/\\d+ (days?|hours?|weeks?) ago/i)) posted = line;
            else if (line !== title && line.length > 2 && line.length < 80 && !company && !line.match(/\\d+ (days|hours|weeks) ago/i)) company = line;
        }
        if (title && title.length > 3) r.push({ title, company, location, salary, url: link.href, platform: 'eluta', posted });
    });
    return r;
}"""

INDEED_DESC = """() => {
    const el = document.querySelector('#jobDescriptionText');
    return el ? el.innerText.trim() : '';
}"""

LINKEDIN_DESC = """() => {
    const el = document.querySelector('.description__text, .show-more-less-html__markup');
    return el ? el.innerText.trim() : '';
}"""


def scrape_indeed(page, title, location, max_pages=2):
    jobs = []
    query = location['query'].replace(' ', '+')
    remote = '' if not location['indeed_remote'] else '&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11'
    base = f'https://ca.indeed.com/jobs?q={title.replace(" ", "+")}&l={query}&fromage=3{remote}'
    for pg in range(max_pages):
        url = base + (f'&start={pg * 10}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)
            jobs.extend(page.evaluate(INDEED_EXTRACT))
            time.sleep(1)
        except Exception as e:
            print(f'    Indeed error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def scrape_linkedin(page, title, location, max_pages=2):
    jobs = []
    loc = location['query'].replace(' ', '%20')
    base = f'https://www.linkedin.com/jobs/search/?keywords={title.replace(" ", "%20")}&location={loc}&f_WT=2%2C3&f_TPR=r259200'
    for pg in range(max_pages):
        url = base + (f'&start={pg * 25}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(4)
            jobs.extend(page.evaluate(LINKEDIN_EXTRACT))
            time.sleep(1)
        except Exception as e:
            print(f'    LinkedIn error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def scrape_eluta(page, title, location, max_pages=2):
    jobs = []
    loc = location['query'].replace(' ', '+')
    base = f'https://www.eluta.ca/search?q={title.replace(" ", "+")}&l={loc}'
    for pg in range(max_pages):
        url = base + (f'&pg={pg + 1}' if pg > 0 else '')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(2)
            jobs.extend(page.evaluate(ELUTA_EXTRACT))
            time.sleep(1)
        except Exception as e:
            print(f'    Eluta error pg{pg+1}: {str(e)[:60]}')
            break
    return jobs


def scrape_description(page, url, platform):
    try:
        page.goto(url, wait_until='domcontentloaded', timeout=15000)
        time.sleep(2)
        if platform == 'indeed':
            return page.evaluate(INDEED_DESC)
        elif platform == 'linkedin':
            return page.evaluate(LINKEDIN_DESC)
        else:
            return page.evaluate("() => document.body.innerText.substring(0, 5000)")
    except:
        return ''


def deduplicate(jobs):
    seen = set()
    unique = []
    for j in jobs:
        if j['url'] and j['url'] not in seen:
            seen.add(j['url'])
            unique.append(j)
    return unique


def main():
    all_jobs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        # Phase 1: Collect job cards
        print('=== Phase 1: Collecting Toronto job cards ===')

        print('\n--- Indeed ---')
        for title in TITLES:
            for loc in LOCATIONS:
                jobs = scrape_indeed(page, title, loc, max_pages=2)
                all_jobs.extend(jobs)
                print(f'  {title}: {len(jobs)}')
                time.sleep(0.5)

        print(f'\nIndeed total: {len([j for j in all_jobs if j["platform"] == "indeed"])}')

        print('\n--- LinkedIn ---')
        for title in TITLES:
            for loc in LOCATIONS:
                jobs = scrape_linkedin(page, title, loc, max_pages=2)
                all_jobs.extend(jobs)
                print(f'  {title}: {len(jobs)}')
                time.sleep(0.5)

        print(f'\nLinkedIn total: {len([j for j in all_jobs if j["platform"] == "linkedin"])}')

        print('\n--- Eluta.ca ---')
        for title in TITLES:
            for loc in LOCATIONS:
                jobs = scrape_eluta(page, title, loc, max_pages=1)
                all_jobs.extend(jobs)
                print(f'  {title}: {len(jobs)}')
                time.sleep(0.5)

        print(f'\nEluta total: {len([j for j in all_jobs if j["platform"] == "eluta"])}')

        # Deduplicate
        before_dedup = len(all_jobs)
        all_jobs = deduplicate(all_jobs)
        print(f'\nDeduplicated: {before_dedup} -> {len(all_jobs)} unique jobs')

        # Phase 2: Scrape individual descriptions
        print('\n=== Phase 2: Scraping job descriptions ===')
        for i, job in enumerate(all_jobs):
            print(f'  [{i+1}/{len(all_jobs)}] {job["title"][:50]}...', end=' ', flush=True)
            desc = scrape_description(page, job['url'], job['platform'])
            job['description'] = desc
            print(f'({len(desc)} chars)')
            time.sleep(1)

        page.close()
        browser.close()

    # Save
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'total': len(all_jobs), 'jobs': all_jobs}, f, indent=2, ensure_ascii=False)
    print(f'\nSaved {len(all_jobs)} jobs with descriptions to {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
