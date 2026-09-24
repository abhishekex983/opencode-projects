"""
Backlink Live Checker
=====================
Reads URLs from a Google Sheet (or local CSV), crawls each one, and reports:
  - Live / dead status
  - Whether your backlink is still on the page
  - Anchor text + follow/nofollow attribute

Results are written back to your Google Sheet AND saved to a local CSV.

Usage
-----
  Edit config.json with your settings, then double-click "Run Check.bat".
  (Or from a terminal: python link_checker.py)

Requirements
------------
  pip install -r requirements.txt
  (Setup.bat does this for you the first time.)
"""

import asyncio
import aiohttp
import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse, urljoin, quote

import pandas as pd
import requests
from bs4 import BeautifulSoup
from tqdm.asyncio import tqdm_asyncio

# Force UTF-8 output on Windows terminals (default cp1252 chokes on emoji/foreign chars)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ─── Config loading ────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")


def load_config() -> dict:
    """Load config.json from the same folder as this script. Exit with a
    friendly message if it's missing or has placeholder values."""
    if not os.path.isfile(CONFIG_PATH):
        sys.exit(
            "\nERROR: config.json was not found.\n"
            f"Expected it at: {CONFIG_PATH}\n"
            "Open README.txt for setup steps.\n"
        )
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        sys.exit(f"\nERROR: config.json is not valid JSON: {e}\n")

    required = ("sheets_api_key", "sheet_id", "target_domain", "apps_script_url")
    missing = [k for k in required if not cfg.get(k) or "PASTE_" in str(cfg.get(k, ""))]
    if missing:
        sys.exit(
            "\nERROR: config.json is missing required values: "
            + ", ".join(missing)
            + "\nOpen config.json and replace the PASTE_... placeholders.\n"
            "See README.txt for where to get each value.\n"
        )
    return cfg


CFG = load_config()
GOOGLE_SHEETS_API_KEY = CFG["sheets_api_key"]
SHEET_ID              = CFG["sheet_id"]
TARGET_DOMAIN         = CFG["target_domain"]
APPS_SCRIPT_WRITE_URL = CFG["apps_script_url"]
INPUT_TAB_NAME        = CFG.get("input_tab",  "URLs")
RESULTS_TAB_NAME      = CFG.get("results_tab", "Results")

# ─── Crawl tuning ──────────────────────────────────────────────────────────────

DEFAULT_CONCURRENCY = int(CFG.get("concurrency", 20))
DEFAULT_TIMEOUT     = int(CFG.get("timeout_seconds", 15))
DEFAULT_RETRIES     = 2
POLITE_DELAY        = 0.3   # seconds between hits to the same domain

USER_AGENT = (
    "Mozilla/5.0 (compatible; BacklinkChecker/1.0; "
    "https://github.com/your-org/link-checker)"
)

# ─── Data model ────────────────────────────────────────────────────────────────

@dataclass
class LinkResult:
    url: str
    http_status: Optional[int] = None
    link_status: str           = "unknown"   # live | dead | timeout | redirect | error_XXX
    final_url: str             = ""
    our_link_found: str        = "No"        # Yes | No
    anchor_text: str           = ""
    link_href: str             = ""
    link_attribute: str        = "follow"    # follow | nofollow | sponsored | ugc
    indexed_by_google: str     = "not_checked"
    error_message: str         = ""

    def to_dict(self) -> dict:
        return {
            "URL":                         self.url,
            "HTTP Status":                 self.http_status,
            "Link Status":                 self.link_status,
            "Final URL (after redirects)": self.final_url,
            "Our Link Found":              self.our_link_found,
            "Anchor Text":                 self.anchor_text,
            "Link Href":                   self.link_href,
            "Link Attribute":              self.link_attribute,
            "Indexed by Google":           self.indexed_by_google,
            "Error":                       self.error_message,
        }

    def to_sheets_row(self) -> list:
        return [
            self.url,
            str(self.http_status) if self.http_status else "",
            self.link_status,
            self.final_url,
            self.our_link_found,
            self.anchor_text,
            self.link_href,
            self.link_attribute,
            self.indexed_by_google,
            self.error_message,
        ]


RESULTS_HEADERS = [
    "URL", "HTTP Status", "Link Status", "Final URL (after redirects)",
    "Our Link Found", "Anchor Text", "Link Href", "Link Attribute",
    "Indexed by Google", "Error",
]

# ─── Google Sheets — Read ──────────────────────────────────────────────────────

def fetch_urls_from_sheet(sheet_id: str, tab: str) -> list[dict]:
    """Read URLs from your Google Sheet (must be shared as 'Anyone with the link can view')."""
    range_name = f"{tab}!A:F"
    endpoint = (
        f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}"
        f"/values/{quote(range_name)}?key={GOOGLE_SHEETS_API_KEY}"
    )
    resp = requests.get(endpoint, timeout=15)
    if resp.status_code == 403:
        raise PermissionError(
            "Google Sheets returned 403 Forbidden.\n"
            "Make sure your sheet is shared as 'Anyone with the link can view'.\n"
            "In Google Sheets: Share -> Change -> Anyone with the link -> Viewer."
        )
    if resp.status_code == 400:
        raise ValueError(
            f"Tab '{tab}' may not exist in your sheet. "
            f"Open the sheet and check the tab name matches exactly.\n"
            f"API response: {resp.text[:300]}"
        )
    resp.raise_for_status()
    data = resp.json()
    rows = data.get("values", [])
    if not rows:
        raise ValueError(f"Tab '{tab}' is empty or does not exist.")

    headers = [h.lower().strip() for h in rows[0]]
    records = []
    for row in rows[1:]:
        padded = row + [""] * (len(headers) - len(row))
        rec = dict(zip(headers, padded))
        if rec.get("url", "").strip():
            records.append(rec)
    print(f"[loaded] {len(records):,} URLs from tab '{tab}'")
    return records

# ─── Google Sheets — Write (via Apps Script) ───────────────────────────────────

def write_results_to_sheet(results: list[LinkResult], sheet_id: str):
    if not APPS_SCRIPT_WRITE_URL:
        print("\n[WARNING] apps_script_url is empty in config.json — skipping sheet write-back.")
        print("          Results are still saved to results.csv locally.")
        return

    rows = [RESULTS_HEADERS] + [r.to_sheets_row() for r in results]
    payload = {
        "sheetId":    sheet_id,
        "tabName":    RESULTS_TAB_NAME,
        "rows":       rows,
        "clearFirst": True,
    }
    try:
        resp = requests.post(APPS_SCRIPT_WRITE_URL, json=payload, timeout=120)
        if resp.status_code == 200 and resp.json().get("status") == "ok":
            print(f"[OK] Results written to Google Sheet tab '{RESULTS_TAB_NAME}'")
        else:
            print(f"[WARNING] Sheet write returned unexpected response: {resp.text[:200]}")
    except Exception as e:
        print(f"[WARNING] Could not write to sheet: {e}")

# ─── Crawler ───────────────────────────────────────────────────────────────────

class LinkChecker:
    def __init__(self, our_domain: str, concurrency: int):
        self.our_domain = self._normalise_domain(our_domain)
        self.concurrency = concurrency
        self.semaphore = asyncio.Semaphore(concurrency)
        self._domain_last_hit: dict[str, float] = {}

    @staticmethod
    def _normalise_domain(domain: str) -> str:
        domain = domain.lower().strip().rstrip("/")
        if "://" in domain:
            domain = urlparse(domain).netloc
        return domain.lstrip("www.") if domain.startswith("www.") else domain

    def _link_points_to_us(self, href: str) -> bool:
        try:
            parsed = urlparse(href)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc == self.our_domain or netloc.endswith("." + self.our_domain)
        except Exception:
            return False

    @staticmethod
    def _parse_rel(tag) -> str:
        rel = tag.get("rel", [])
        rel_str = (" ".join(rel) if isinstance(rel, list) else str(rel)).lower()
        if "nofollow" in rel_str:
            if "sponsored" in rel_str: return "nofollow sponsored"
            if "ugc" in rel_str:       return "nofollow ugc"
            return "nofollow"
        if "sponsored" in rel_str: return "sponsored"
        if "ugc" in rel_str:       return "ugc"
        return "follow"

    async def _polite_delay(self, netloc: str):
        import time
        now = time.monotonic()
        wait = POLITE_DELAY - (now - self._domain_last_hit.get(netloc, 0))
        if wait > 0:
            await asyncio.sleep(wait)
        self._domain_last_hit[netloc] = time.monotonic()

    async def check_url(self, session: aiohttp.ClientSession, url: str) -> LinkResult:
        result = LinkResult(url=url)
        netloc = urlparse(url).netloc

        async with self.semaphore:
            await self._polite_delay(netloc)

            for attempt in range(DEFAULT_RETRIES + 1):
                try:
                    async with session.get(
                        url,
                        timeout=aiohttp.ClientTimeout(total=DEFAULT_TIMEOUT),
                        allow_redirects=True,
                        ssl=False,
                    ) as resp:
                        result.http_status = resp.status
                        result.final_url   = str(resp.url)

                        if resp.status == 200:
                            result.link_status = "live"
                            html = await resp.text(errors="replace")
                            soup = BeautifulSoup(html, "lxml")
                            for tag in soup.find_all("a", href=True):
                                href = tag["href"].strip()
                                absolute = urljoin(result.final_url, href)
                                if self._link_points_to_us(absolute):
                                    result.our_link_found = "Yes"
                                    result.anchor_text    = tag.get_text(strip=True)
                                    result.link_href      = absolute
                                    result.link_attribute = self._parse_rel(tag)
                                    break
                        elif resp.status == 404:
                            result.link_status = "dead"
                        elif resp.status in (301, 302, 303, 307, 308):
                            result.link_status = "redirect"
                        elif resp.status >= 400:
                            result.link_status = f"error_{resp.status}"
                        else:
                            result.link_status = str(resp.status)
                        break

                except asyncio.TimeoutError:
                    result.link_status   = "timeout"
                    result.error_message = "Request timed out"
                except aiohttp.ClientSSLError as e:
                    result.link_status   = "ssl_error"
                    result.error_message = str(e)[:120]
                except aiohttp.ClientConnectorError as e:
                    result.link_status   = "connection_error"
                    result.error_message = str(e)[:120]
                except Exception as e:
                    result.link_status   = "error"
                    result.error_message = str(e)[:120]
                    if attempt < DEFAULT_RETRIES:
                        await asyncio.sleep(1)
        return result

# ─── I/O ───────────────────────────────────────────────────────────────────────

def load_urls_from_csv(path: str) -> list[dict]:
    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]
    url_col = next((c for c in df.columns if "url" in c or "link" in c), df.columns[0])
    rows = df.fillna("").to_dict(orient="records")
    for r in rows:
        r["url"] = r.get(url_col, "").strip()
        if r["url"] and not r["url"].startswith("http"):
            r["url"] = "https://" + r["url"]
    return [r for r in rows if r.get("url")]


def save_results_to_csv(results: list[LinkResult], path: str):
    pd.DataFrame([r.to_dict() for r in results]).to_csv(path, index=False)
    print(f"[OK] Results CSV saved to: {path}")

# ─── Main ──────────────────────────────────────────────────────────────────────

async def main(domain: str, sheet_id: str, input_csv: str, output_csv: str, concurrency: int):
    print("\n[*] Backlink Live Checker")
    print(f"    Target domain : {domain}")

    if input_csv:
        records = load_urls_from_csv(input_csv)
        print(f"    Source        : {input_csv} ({len(records):,} URLs)")
    elif sheet_id:
        records = fetch_urls_from_sheet(sheet_id, INPUT_TAB_NAME)
        print(f"    Source        : Google Sheet tab '{INPUT_TAB_NAME}' ({len(records):,} URLs)")
    else:
        sys.exit("Error: provide either --sheet-id or --input.")

    urls = []
    for r in records:
        u = r.get("url", "").strip()
        if u and not u.startswith("http"):
            u = "https://" + u
        if u:
            urls.append(u)

    if not domain:
        sys.exit("Error: 'target_domain' is empty in config.json.")

    print(f"    Concurrency   : {concurrency} simultaneous requests\n")

    checker = LinkChecker(our_domain=domain, concurrency=concurrency)
    headers = {
        "User-Agent":      USER_AGENT,
        "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection":      "keep-alive",
    }
    connector = aiohttp.TCPConnector(limit=concurrency, ssl=False)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        tasks = [checker.check_url(session, url) for url in urls]
        results: list[LinkResult] = await tqdm_asyncio.gather(*tasks, desc="Checking URLs")

    # ── Summary ──
    live  = sum(1 for r in results if r.link_status == "live")
    dead  = sum(1 for r in results if r.link_status in ("dead", "timeout", "connection_error", "ssl_error"))
    found = sum(1 for r in results if r.our_link_found == "Yes")
    nofol = sum(1 for r in results if "nofollow" in r.link_attribute)

    print("\n[summary]")
    print(f"    Total checked   : {len(results):,}")
    print(f"    Live            : {live:,}")
    print(f"    Dead/Error      : {dead:,}")
    print(f"    Our link found  : {found:,}  ({100*found//max(live,1)}% of live pages)")
    print(f"    Nofollow        : {nofol:,}")

    save_results_to_csv(results, output_csv)
    if sheet_id:
        write_results_to_sheet(results, sheet_id)

    print("\nDone. Open your dashboard and click Refresh to see the updated results.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backlink Live Checker")
    parser.add_argument("--domain",      default=TARGET_DOMAIN, help="Override target domain from config.json")
    parser.add_argument("--sheet-id",    default=SHEET_ID,      help="Override Google Sheet ID from config.json")
    parser.add_argument("--input",       default="",            help="Local CSV file to use instead of Google Sheets")
    parser.add_argument("--output",      default="results.csv", help="Output CSV filename")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY,
                        help=f"Concurrent requests (default: {DEFAULT_CONCURRENCY})")
    args = parser.parse_args()

    asyncio.run(main(
        domain      = args.domain,
        sheet_id    = args.sheet_id,
        input_csv   = args.input,
        output_csv  = args.output,
        concurrency = args.concurrency,
    ))
