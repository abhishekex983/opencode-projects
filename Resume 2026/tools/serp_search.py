#!/usr/bin/env python3
"""
Job Search SERP Tool
Searches for job listings via Exa API or DataForSEO API.

Usage:
  Single query:
    python serp_search.py "SEO specialist" "Toronto"

  Batch mode (all titles × locations):
    python serp_search.py --batch

  Use DataForSEO backend:
    python serp_search.py "SEO specialist" "Toronto" --backend dataforseo

  Output to file:
    python serp_search.py "SEO specialist" "Toronto" --output results.json

  Platform filter:
    python serp_search.py "SEO specialist" "Toronto" --platform indeed
    python serp_search.py "SEO specialist" "Toronto" --platform linkedin
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / ".env"

# API endpoints
EXA_API_URL = "https://api.exa.ai/search"
DATAFORSEO_API_URL = "https://api.dataforseo.com/v3/serp/google/organic/live/regular"
CANADA_LOCATION_CODE = 2840


def load_env(env_path: Path = ENV_FILE) -> dict:
    """Load environment variables from .env file."""
    env = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env[key.strip()] = value.strip()
    return env


def get_credentials(backend: str) -> dict:
    """Get API credentials for the specified backend.
    
    Prioritizes .env file over environment variables to avoid
    stale credentials from MCP server config.
    """
    env = load_env()

    if backend == "dataforseo":
        login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN")
        password = env.get("DATAFORSEO_PASSWORD") or os.environ.get("DATAFORSEO_PASSWORD")
        if not login or not password:
            print("ERROR: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD not found.", file=sys.stderr)
            print("Set them in tools/.env file.", file=sys.stderr)
            sys.exit(1)
        return {"login": login, "password": password}
    else:
        key = env.get("EXA_API_KEY") or os.environ.get("EXA_API_KEY")
        if not key:
            print("ERROR: EXA_API_KEY not found.", file=sys.stderr)
            sys.exit(1)
        return {"api_key": key}


def exa_search(query: str, num_results: int = 10, api_key: str = "") -> list:
    """Search using Exa API."""
    payload = json.dumps({
        "query": query,
        "numResults": num_results,
        "type": "auto",
        "contents": {"text": True}
    }).encode("utf-8")

    req = urllib.request.Request(
        EXA_API_URL,
        data=payload,
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("results", [])
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        print(f"  Exa API Error {e.code}: {body[:200]}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"  Exa request failed: {e}", file=sys.stderr)
        return []


def dataforseo_search(query: str, depth: int = 20, login: str = "", password: str = "") -> list:
    """Search using DataForSEO SERP API."""
    cred = base64.b64encode(f"{login}:{password}".encode()).decode()

    payload = json.dumps([{
        "language_code": "en",
        "location_code": CANADA_LOCATION_CODE,
        "keyword": query,
        "depth": min(depth, 200),
    }]).encode("utf-8")

    req = urllib.request.Request(
        DATAFORSEO_API_URL,
        data=payload,
        headers={
            "Authorization": f"Basic {cred}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            tasks = result.get("tasks", [])
            if tasks and tasks[0].get("status_code") == 20000:
                items = tasks[0].get("result", [{}])[0].get("items", [])
                cost = tasks[0].get("cost", 0)
                print(f"  DataForSEO cost: ${cost:.4f}", file=sys.stderr)
                return items
            else:
                status = tasks[0].get("status_code", "unknown") if tasks else "no tasks"
                msg = tasks[0].get("status_message", "") if tasks else ""
                print(f"  DataForSEO error: {status} - {msg}", file=sys.stderr)
                return []
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        print(f"  DataForSEO API Error {e.code}: {body[:200]}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"  DataForSEO request failed: {e}", file=sys.stderr)
        return []


def build_query(title: str, location: str, platform: str = "both") -> str:
    """Build search query for job listing."""
    site_filter = {
        "indeed": "site:ca.indeed.com",
        "linkedin": "site:linkedin.com/jobs",
        "both": "(site:ca.indeed.com OR site:linkedin.com/jobs)",
    }.get(platform, "(site:ca.indeed.com OR site:linkedin.com/jobs)")

    return f'"{title}" jobs in {location} Canada {site_filter}'


def parse_exa_results(results: list, title: str, location: str) -> list:
    """Parse Exa search results into job listings."""
    jobs = []
    for r in results:
        url = r.get("url", "")
        domain = r.get("author", "") or url.split("/")[2] if "/" in url else ""

        platform = "unknown"
        if "indeed" in url:
            platform = "indeed"
        elif "linkedin" in url:
            platform = "linkedin"
        elif "glassdoor" in url:
            platform = "glassdoor"
        elif "ziprecruiter" in url:
            platform = "ziprecruiter"

        if platform not in ("indeed", "linkedin", "glassdoor", "ziprecruiter"):
            continue

        result_title = r.get("title", "")
        if " hiring " in result_title and " | " in result_title:
            parts = result_title.split(" | ")[0]
            if " hiring " in parts:
                result_title = parts.split(" hiring ", 1)[1].split(" in ")[0].strip()
        if " | LinkedIn" in result_title:
            result_title = result_title.replace(" | LinkedIn", "").strip()

        snippet = r.get("text", "")
        if len(snippet) > 500:
            snippet = snippet[:500] + "..."

        jobs.append({
            "title": result_title,
            "url": url,
            "snippet": snippet,
            "domain": domain,
            "platform": platform,
            "search_title": title,
            "search_location": location,
        })

    return jobs


def parse_dataforseo_results(items: list, title: str, location: str) -> list:
    """Parse DataForSEO SERP results into job listings."""
    jobs = []
    for item in items:
        if item.get("type") != "organic":
            continue

        url = item.get("url", "")
        domain = item.get("domain", "")

        platform = "unknown"
        if "indeed" in domain:
            platform = "indeed"
        elif "linkedin" in domain:
            platform = "linkedin"
        elif "glassdoor" in domain:
            platform = "glassdoor"

        if platform not in ("indeed", "linkedin", "glassdoor"):
            continue

        result_title = item.get("title", "")
        if " hiring " in result_title and " | " in result_title:
            parts = result_title.split(" | ")[0]
            if " hiring " in parts:
                result_title = parts.split(" hiring ", 1)[1].split(" in ")[0].strip()
        if " | LinkedIn" in result_title:
            result_title = result_title.replace(" | LinkedIn", "").strip()

        snippet = item.get("description", "")
        if len(snippet) > 500:
            snippet = snippet[:500] + "..."

        jobs.append({
            "title": result_title,
            "url": url,
            "snippet": snippet,
            "domain": domain,
            "platform": platform,
            "search_title": title,
            "search_location": location,
        })

    return jobs


def search_single(title: str, location: str, num_results: int = 10,
                  platform: str = "both", backend: str = "exa",
                  credentials: dict = None) -> list:
    """Search for jobs matching a single title + location."""
    query = build_query(title, location, platform)
    print(f"  Searching: {query[:80]}...", file=sys.stderr)

    if backend == "dataforseo":
        items = dataforseo_search(query, num_results, credentials.get("login", ""), credentials.get("password", ""))
        jobs = parse_dataforseo_results(items, title, location)
    else:
        results = exa_search(query, num_results, credentials.get("api_key", ""))
        jobs = parse_exa_results(results, title, location)

    print(f"  Found {len(jobs)} job listings", file=sys.stderr)
    return jobs


def search_batch(num_results: int = 10, platform: str = "both",
                 backend: str = "exa", credentials: dict = None) -> list:
    """Search for jobs using all title × location combos."""
    titles = [
        "SEO Specialist", "SEO Strategist", "SEO Analyst", "SEO Coordinator",
        "SEO Consultant", "Technical SEO Specialist", "Digital Marketing Specialist",
        "Digital Marketing Coordinator", "Digital Marketing Analyst",
        "Digital Marketing Strategist", "Inbound Marketing Specialist",
        "Content & SEO Specialist",
    ]

    locations = ["Toronto", "Ontario", "Vancouver", "Vancouver Island", "Thunder Bay"]

    all_jobs = []
    total = len(titles) * len(locations)
    count = 0

    for title in titles:
        for location in locations:
            count += 1
            print(f"\n[{count}/{total}] {title} in {location}", file=sys.stderr)
            jobs = search_single(title, location, num_results, platform, backend, credentials)
            all_jobs.extend(jobs)
            time.sleep(0.3)

    return all_jobs


def deduplicate(jobs: list) -> list:
    """Remove duplicate jobs by URL."""
    seen = set()
    unique = []
    for job in jobs:
        url = job.get("url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(job)
    return unique


def main():
    parser = argparse.ArgumentParser(
        description="Search for job listings via Exa or DataForSEO API"
    )
    parser.add_argument("title", nargs="?", help="Job title to search for")
    parser.add_argument("location", nargs="?", help="Location to search in")
    parser.add_argument("--batch", action="store_true",
                        help="Batch mode: search all titles × locations")
    parser.add_argument("--backend", choices=["exa", "dataforseo"], default="exa",
                        help="Search backend to use (default: exa)")
    parser.add_argument("--num", type=int, default=10,
                        help="Number of results per query (default 10)")
    parser.add_argument("--platform", choices=["indeed", "linkedin", "both"],
                        default="both", help="Platform to search (default: both)")
    parser.add_argument("--output", "-o", help="Output file path (JSON)")
    parser.add_argument("--dedup", action="store_true", default=True,
                        help="Remove duplicates by URL (default: true)")

    args = parser.parse_args()

    credentials = get_credentials(args.backend)

    if args.batch:
        print(f"Running batch search ({args.backend})...", file=sys.stderr)
        jobs = search_batch(args.num, args.platform, args.backend, credentials)
    elif args.title and args.location:
        jobs = search_single(args.title, args.location, args.num, args.platform, args.backend, credentials)
    else:
        parser.error("Provide title + location, or use --batch mode")

    if args.dedup:
        before = len(jobs)
        jobs = deduplicate(jobs)
        if before != len(jobs):
            print(f"\nDeduplicated: {before} → {len(jobs)} unique jobs", file=sys.stderr)

    output = {
        "total": len(jobs),
        "search_type": "batch" if args.batch else "single",
        "backend": args.backend,
        "platform_filter": args.platform,
        "jobs": jobs,
    }

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(jobs)} jobs to {output_path}", file=sys.stderr)
    else:
        print(json.dumps(output, indent=2, ensure_ascii=False))

    print(f"\nTotal: {len(jobs)} jobs found", file=sys.stderr)


if __name__ == "__main__":
    main()
