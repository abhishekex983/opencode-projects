#!/usr/bin/env python3
"""
Low Fruits Keyword Research Script
Finds easy-to-rank keywords using KGR (Keyword Golden Ratio) method via DataForSEO APIs.
"""

import argparse
import base64
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# --- Constants ---
API_BASE = "https://api.dataforseo.com/v3"
CRED_FILE = r"F:\Opencode Projects\Keyword Research\api-keys.txt"

UGC_PATTERNS = re.compile(
    r"reddit\.com|quora\.com|stackoverflow\.com|stackexchange\.com|"
    r"medium\.com|substack\.com|blogspot\.com|wordpress\.com|"
    r"discord\.com|github\.com|facebook\.com/groups|youtube\.com/channel",
    re.IGNORECASE,
)

HIGH_AUTHORITY = {
    "youtube.com", "wikipedia.org", "amazon.com", "facebook.com",
    "twitter.com", "instagram.com", "linkedin.com", "forbes.com",
    "nytimes.com", "bbc.com", "cnn.com", "healthline.com",
    "webmd.com", "mayoclinic.org", "nih.gov", "cdc.gov",
}


def load_credentials(cred_file: str) -> tuple[str, str]:
    """Load DataForSEO login/password from credentials file."""
    login = password = None
    with open(cred_file, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATAFORSEO_LOGIN="):
                login = line.split("=", 1)[1].strip()
            elif line.startswith("DATAFORSEO_PASSWORD="):
                password = line.split("=", 1)[1].strip()
    if not login or not password:
        raise ValueError(f"Could not find DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in {cred_file}")
    return login, password


def api_request(endpoint: str, body: list, login: str, password: str) -> dict:
    """Make authenticated request to DataForSEO API."""
    url = f"{API_BASE}/{endpoint}"
    cred = base64.b64encode(f"{login}:{password}".encode()).decode()
    data = json.dumps(body).encode("utf-8")

    req = Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Basic {cred}")
    req.add_header("Content-Type", "application/json")

    try:
        with urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"  API Error {e.code}: {error_body[:300]}", file=sys.stderr)
        raise
    except URLError as e:
        print(f"  Network Error: {e.reason}", file=sys.stderr)
        raise


def expand_keywords(seeds: list[str], location: str, language: str, login: str, password: str) -> list[dict]:
    """Expand seed keywords via 3 DataForSEO endpoints."""
    all_keywords = {}

    endpoints = [
        ("dataforseo_labs/google/keyword_suggestions/live", "keyword_suggestions"),
        ("dataforseo_labs/google/keyword_ideas/live", "keyword_ideas"),
        ("dataforseo_labs/google/related_keywords/live", "related_keywords"),
    ]

    for seed in seeds:
        for endpoint, name in endpoints:
            print(f"  [{name}] Expanding '{seed}'...")
            body = [{
                "keyword": seed,
                "location_name": location,
                "language_code": language,
                "include_seed_keyword": True,
                "limit": 500,
            }]

            try:
                resp = api_request(endpoint, body, login, password)
                tasks = resp.get("tasks", [])
                if not tasks:
                    continue
                result = tasks[0].get("result", [])
                if not result:
                    continue
                items = result[0].get("items", []) if result else []

                for item in items:
                    kw = item.get("keyword", "").strip().lower()
                    if not kw or len(kw) < 3 or len(kw) > 100:
                        continue

                    vi = item.get("keyword_info") or {}
                    vp = item.get("keyword_properties") or {}

                    if kw not in all_keywords:
                        all_keywords[kw] = {
                            "keyword": kw,
                            "search_volume": vi.get("search_volume"),
                            "cpc": vi.get("cpc"),
                            "kd": vp.get("keyword_difficulty"),
                            "competition_level": vi.get("competition_level"),
                        }
                    else:
                        existing = all_keywords[kw]
                        if existing["search_volume"] is None and vi.get("search_volume"):
                            existing["search_volume"] = vi["search_volume"]
                        if existing["kd"] is None and vp.get("keyword_difficulty"):
                            existing["kd"] = vp["keyword_difficulty"]
                        if existing["cpc"] is None and vi.get("cpc"):
                            existing["cpc"] = vi["cpc"]

                count = len(items)
                print(f"    Found {count} keywords")
                time.sleep(0.5)

            except Exception as e:
                print(f"    Error: {e}", file=sys.stderr)
                time.sleep(1)

    return list(all_keywords.values())


def filter_keywords(keywords: list[dict], min_vol: int, max_vol: int, max_kd: int) -> list[dict]:
    """Filter keywords by volume and KD."""
    filtered = []
    for kw in keywords:
        vol = kw.get("search_volume")
        kd = kw.get("kd")

        if vol is None or vol < min_vol or vol > max_vol:
            continue
        if kd is not None and kd > max_kd:
            continue

        filtered.append(kw)

    filtered.sort(key=lambda x: x.get("search_volume") or 0, reverse=True)
    return filtered


def get_serp_data(keyword: str, location: str, language: str, login: str, password: str) -> dict | None:
    """Fetch SERP data for a keyword."""
    body = [{
        "keyword": keyword,
        "location_name": location,
        "language_code": language,
        "device": "desktop",
        "depth": 10,
    }]

    try:
        resp = api_request("serp/google/organic/live/advanced", body, login, password)
        tasks = resp.get("tasks", [])
        if not tasks:
            return None
        result = tasks[0].get("result", [])
        if not result:
            return None
        return result[0]
    except Exception as e:
        print(f"    SERP error for '{keyword}': {e}", file=sys.stderr)
        return None


def analyze_serp(serp_result: dict, keyword: str) -> dict:
    """Analyze SERP for allintitle proxy and weak spots."""
    items = serp_result.get("items", [])

    allintitle_count = 0
    weak_spots = 0
    weak_domains = []

    keyword_lower = keyword.lower()

    for item in items:
        if item.get("type") != "organic":
            continue

        title = (item.get("title") or "").lower()
        domain = (item.get("domain") or "").replace("www.", "").lower()

        if keyword_lower in title:
            allintitle_count += 1

        is_high_auth = domain in HIGH_AUTHORITY
        is_ugc = bool(UGC_PATTERNS.search(domain))

        if not is_high_auth:
            if is_ugc:
                weak_spots += 1
                weak_domains.append(f"{domain} (UGC)")
            elif serp_result.get("domain_ranks"):
                for dr_info in serp_result["domain_ranks"]:
                    dr_domain = (dr_info.get("target") or "").replace("www.", "").lower()
                    dr_rank = dr_info.get("rank", 0)
                    if dr_domain == domain and dr_rank < 20:
                        weak_spots += 1
                        weak_domains.append(f"{domain} (DR {dr_rank})")
                        break

    check_url = serp_result.get("check_url", "")

    return {
        "allintitle_count": allintitle_count,
        "weak_spots": weak_spots,
        "weak_domains": "; ".join(weak_domains[:5]) if weak_domains else "",
        "serp_url": check_url,
    }


def calculate_kgr(allintitle: int, volume: int) -> float | None:
    """Calculate Keyword Golden Ratio."""
    if volume is None or volume == 0:
        return None
    return round(allintitle / volume, 4)


def classify_verdict(kgr: float | None, weak_spots: int) -> str:
    """Classify keyword verdict based on KGR and weak spots."""
    if kgr is None:
        return "SKIP"
    if kgr == 0:
        return "GO"
    if kgr < 0.25 and weak_spots >= 1:
        return "GO"
    if kgr < 0.25:
        return "GOOD"
    if kgr <= 1.0:
        return "MODERATE"
    return "SKIP"


def enrich_with_domain_ranks(keywords: list[dict], serp_results: dict, login: str, password: str) -> None:
    """Fetch domain ranks for weak spot detection."""
    domains_to_check = set()
    for kw_data in keywords:
        kw = kw_data["keyword"]
        if kw in serp_results and serp_results[kw]:
            items = serp_results[kw].get("items", [])
            for item in items:
                if item.get("type") == "organic":
                    domain = (item.get("domain") or "").replace("www.", "").lower()
                    if domain and domain not in HIGH_AUTHORITY:
                        domains_to_check.add(domain)

    if not domains_to_check:
        return

    domain_list = list(domains_to_check)[:100]
    print(f"\n  Fetching domain ranks for {len(domain_list)} domains...")

    batch_size = 50
    rank_map = {}

    for i in range(0, len(domain_list), batch_size):
        batch = domain_list[i:i + batch_size]
        body = [{"targets": batch}]

        try:
            resp = api_request("backlinks/bulk_ranks/live", body, login, password)
            tasks = resp.get("tasks", [])
            if tasks and tasks[0].get("result"):
                items = tasks[0]["result"][0].get("items", [])
                for item in items:
                    target = (item.get("target") or "").replace("www.", "").lower()
                    rank = item.get("rank", 0)
                    dr = round(rank / 10) if rank else 0
                    rank_map[target] = dr
            time.sleep(0.5)
        except Exception as e:
            print(f"    Bulk ranks error: {e}", file=sys.stderr)
            time.sleep(1)

    for kw_data in keywords:
        kw = kw_data["keyword"]
        if kw in serp_results and serp_results[kw]:
            items = serp_results[kw].get("items", [])
            weak_count = 0
            weak_list = []

            for item in items:
                if item.get("type") != "organic":
                    continue
                domain = (item.get("domain") or "").replace("www.", "").lower()
                if domain in HIGH_AUTHORITY:
                    continue

                is_ugc = bool(UGC_PATTERNS.search(domain))
                dr = rank_map.get(domain)

                if is_ugc:
                    weak_count += 1
                    weak_list.append(f"{domain} (UGC)")
                elif dr is not None and dr < 20:
                    weak_count += 1
                    weak_list.append(f"{domain} (DR {dr})")

            kw_data["weak_spots"] = weak_count
            kw_data["weak_domains"] = "; ".join(weak_list[:5]) if weak_list else ""


def export_csv(keywords: list[dict], output_path: str) -> None:
    """Export keywords to CSV."""
    headers = [
        "keyword", "search_volume", "kd", "cpc", "competition_level",
        "allintitle_count", "kgr", "weak_spots", "weak_domains",
        "verdict", "serp_url",
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for kw in keywords:
            row = {h: kw.get(h, "") for h in headers}
            writer.writerow(row)

    print(f"\n  CSV saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Low Fruits Keyword Research")
    parser.add_argument("--seeds", nargs="+", required=True, help="Seed keywords")
    parser.add_argument("--location", default="United States", help="Target location")
    parser.add_argument("--language", default="en", help="Language code")
    parser.add_argument("--min-volume", type=int, default=50, help="Min search volume")
    parser.add_argument("--max-volume", type=int, default=5000, help="Max search volume")
    parser.add_argument("--max-kd", type=int, default=30, help="Max keyword difficulty")
    parser.add_argument("--kgr-limit", type=int, default=40, help="Keywords to check KGR for")
    parser.add_argument("--output", default=None, help="Output CSV path")
    args = parser.parse_args()

    if not args.output:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        args.output = f"low-fruits-{timestamp}.csv"

    print("=" * 60)
    print("LOW FRUITS KEYWORD RESEARCH")
    print("=" * 60)
    print(f"  Seeds: {', '.join(args.seeds)}")
    print(f"  Location: {args.location}")
    print(f"  Language: {args.language}")
    print(f"  Volume range: {args.min_volume}-{args.max_volume}")
    print(f"  Max KD: {args.max_kd}")
    print(f"  KGR check limit: {args.kgr_limit}")
    print()

    # Load credentials
    print("[1/5] Loading credentials...")
    login, password = load_credentials(CRED_FILE)
    print("  Credentials loaded.")

    # Expand keywords
    print("\n[2/5] Expanding seed keywords...")
    all_keywords = expand_keywords(args.seeds, args.location, args.language, login, password)
    print(f"\n  Total unique keywords: {len(all_keywords)}")

    # Filter
    print("\n[3/5] Filtering keywords...")
    filtered = filter_keywords(all_keywords, args.min_volume, args.max_volume, args.max_kd)
    print(f"  Keywords after filter: {len(filtered)}")

    if not filtered:
        print("\n  No keywords match your filters. Try adjusting --min-volume, --max-volume, or --max-kd.")
        sys.exit(0)

    # SERP analysis for top keywords
    kgr_candidates = filtered[: args.kgr_limit]
    print(f"\n[4/5] SERP analysis for top {len(kgr_candidates)} keywords...")

    serp_results = {}
    for i, kw_data in enumerate(kgr_candidates):
        kw = kw_data["keyword"]
        print(f"  [{i + 1}/{len(kgr_candidates)}] {kw}...")

        serp = get_serp_data(kw, args.location, args.language, login, password)
        if serp:
            serp_results[kw] = serp
            analysis = analyze_serp(serp, kw)
            kw_data["allintitle_count"] = analysis["allintitle_count"]
            kw_data["weak_spots"] = analysis.get("weak_spots", 0)
            kw_data["weak_domains"] = analysis.get("weak_domains", "")
            kw_data["serp_url"] = analysis["serp_url"]
            kw_data["kgr"] = calculate_kgr(analysis["allintitle_count"], kw_data.get("search_volume"))
            kw_data["verdict"] = classify_verdict(kw_data["kgr"], kw_data.get("weak_spots", 0))
        else:
            kw_data["allintitle_count"] = None
            kw_data["kgr"] = None
            kw_data["verdict"] = "SKIP"
            kw_data["weak_spots"] = 0
            kw_data["weak_domains"] = ""
            kw_data["serp_url"] = ""

        time.sleep(0.5)

    # Enrich with domain ranks
    print("\n  Fetching domain authority data...")
    enrich_with_domain_ranks(kgr_candidates, serp_results, login, password)

    # Recalculate verdicts after domain rank enrichment
    for kw_data in kgr_candidates:
        kw_data["verdict"] = classify_verdict(kw_data.get("kgr"), kw_data.get("weak_spots", 0))

    # Sort by KGR (best first)
    kgr_candidates.sort(key=lambda x: x.get("kgr") if x.get("kgr") is not None else 999)

    # Export
    print(f"\n[5/5] Exporting CSV...")
    output_path = os.path.join(os.path.dirname(CRED_FILE) or ".", args.output)
    export_csv(kgr_candidates, output_path)

    # Summary
    go_count = sum(1 for k in kgr_candidates if k.get("verdict") == "GO")
    good_count = sum(1 for k in kgr_candidates if k.get("verdict") == "GOOD")
    mod_count = sum(1 for k in kgr_candidates if k.get("verdict") == "MODERATE")
    skip_count = sum(1 for k in kgr_candidates if k.get("verdict") == "SKIP")

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    print(f"  GO (KGR < 0.25 + weak spots): {go_count}")
    print(f"  GOOD (KGR < 0.25, no weak):   {good_count}")
    print(f"  MODERATE (KGR 0.25-1.0):       {mod_count}")
    print(f"  SKIP (KGR > 1.0):              {skip_count}")
    print(f"\n  Total analyzed: {len(kgr_candidates)}")
    print(f"  CSV: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
