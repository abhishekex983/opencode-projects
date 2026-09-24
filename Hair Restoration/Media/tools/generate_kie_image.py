"""
Generate Pinterest infographic using Kie.ai GPT Image 2 API.
Outputs a 2:3 portrait health infographic.
"""

import json
import time
import urllib.request
import urllib.error
import os
import sys

API_KEY_FILE = r"F:\Opencode Projects\kie API.txt"
OUTPUT_DIR = r"F:\Opencode Projects\Hair Restoration\Media\.tmp"
OUTPUT_FILE = "nizoral-vs-nioxin-pin.png"

BASE_URL = "https://api.kie.ai"
SUBMIT_URL = f"{BASE_URL}/api/v1/jobs/createTask"
POLL_URL = f"{BASE_URL}/api/v1/jobs/recordInfo"

PROMPT = """Create a professional health infographic in portrait 2:3 Pinterest format.

STYLE: Clean, modern, medical-trust aesthetic. Minimal line icons only. NO photographs. NO clipart. Crisp vector-style illustrations. Professional typography with clear hierarchy. White card backgrounds with subtle shadows on a light gray (#faf9fc) page background.

COLOR SCHEME:
- Dark navy (#002444) for header and footer backgrounds
- Crimson red (#B91C1C) for accents, highlights, and key stat callouts
- White (#FFFFFF) for card backgrounds
- Light gray (#faf9fc) for page background
- Dark text (#1a1a2e) for body copy

LAYOUT STRUCTURE (top to bottom):

HEADER (dark navy #002444 background):
- White logo text "Hair's the Deal" in elegant script font at top
- Main title: "Nizoral vs Nioxin" in large bold white sans-serif
- Subtitle: "Which One Is Right for You?" in lighter white
- Thin crimson red (#B91C1C) accent line below

BODY (light gray #faf9fc background):

CARD 1 - White card, red (#B91C1C) pill badge "ANTI-DANDRUFF":
- Title: "Nizoral" bold dark navy
- Subtitle: "Ketoconazole Shampoo" gray
- Shield line icon in navy
- Bullets: Clears dandruff and flaking | Reduces scalp itching | Calms inflammation | Healthier scalp environment
- Warning in red: "May cause dryness"

CARD 2 - White card, navy pill badge "HAIR THICKENING":
- Title: "Nioxin" bold dark navy
- Subtitle: "3-Product System Kit" gray
- Layers line icon in navy
- Bullets: Shampoo + Conditioner + Serum | Thicker fuller hair | Noticeable volume | Supports regrowth
- Warning in red: "Requires consistent use"

CARD 3 - White card with red left border:
- Title: "Best Results: Use Both" bold dark navy
- Schedule: 1x/week Nizoral | 2x/week Nioxin | Always separate days
- Calendar line icon

STAT BOX (crimson red #B91C1C background, white text):
- Large bold: "17-50%"
- "of people deal with dandruff"
- "Men affected more than women"

TIP BOX (white card, red left border):
- Lightbulb icon
- "Start with whichever problem bothers you most. Add the other later."

FOOTER (dark navy #002444 background):
- "thinhairgrowthguide.com" white
- "Your Trusted Guide to Hair Growth" lighter white
- "Consult your doctor before combining treatments" small white
- Crimson red accent line at top of footer

TYPOGRAPHY: Bold clean sans-serif titles. Regular weight legible body. All text perfectly spelled. Clear size hierarchy.

IMPORTANT: Every word must be perfectly legible and correctly spelled. Professional health infographic. No decorative fonts for body text."""

def read_api_key():
    with open(API_KEY_FILE, "r") as f:
        return f.read().strip()

def submit_task(api_key):
    payload = json.dumps({
        "model": "gpt-image-2-text-to-image",
        "input": {
            "prompt": PROMPT,
            "aspect_ratio": "2:3",
            "resolution": "2K"
        }
    }).encode("utf-8")

    req = urllib.request.Request(SUBMIT_URL, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP Error {e.code}: {body}")
        sys.exit(1)

def poll_task(api_key, task_id, max_wait=300, interval=5):
    elapsed = 0
    while elapsed < max_wait:
        url = f"{POLL_URL}?taskId={task_id}"
        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {api_key}")

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"Poll error {e.code}: {body}")
            time.sleep(interval)
            elapsed += interval
            continue

        state = data.get("data", {}).get("state", "unknown")
        print(f"[{elapsed}s] State: {state}")

        if state == "success":
            return data
        if state == "fail":
            fail_msg = data.get("data", {}).get("failMsg", "Unknown error")
            print(f"Task failed: {fail_msg}")
            sys.exit(1)

        time.sleep(interval)
        elapsed += interval

    print(f"Timed out after {max_wait}s")
    sys.exit(1)

def extract_image_url(result):
    data = result.get("data", {})
    result_json_str = data.get("resultJson", "{}")
    
    try:
        result_json = json.loads(result_json_str) if isinstance(result_json_str, str) else result_json_str
    except json.JSONDecodeError:
        print(f"Could not parse resultJson: {result_json_str}")
        return None

    urls = result_json.get("resultUrls", [])
    if urls and isinstance(urls, list) and len(urls) > 0:
        return urls[0]

    print(f"No resultUrls found. resultJson: {json.dumps(result_json, indent=2)[:500]}")
    return None

def download_image(url, output_path, api_key=None):
    req = urllib.request.Request(url)
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        with open(output_path, "wb") as f:
            f.write(resp.read())
    size = os.path.getsize(output_path)
    print(f"Downloaded: {output_path} ({size:,} bytes)")

def main():
    print("Reading API key...")
    api_key = read_api_key()
    print(f"API key loaded ({len(api_key)} chars)")

    print("\nSubmitting task to Kie.ai GPT Image 2...")
    result = submit_task(api_key)
    print(f"Response: {json.dumps(result, indent=2)[:500]}")

    task_id = result.get("data", {}).get("taskId")
    if not task_id:
        print(f"No taskId in response: {result}")
        sys.exit(1)
    
    print(f"\nTask ID: {task_id}")
    print("Polling for completion...")

    final = poll_task(api_key, task_id)
    
    image_url = extract_image_url(final)
    if not image_url:
        print("No image URL found in final result")
        sys.exit(1)

    print(f"\nImage URL: {image_url}")
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    download_image(image_url, output_path, api_key)
    print(f"\nDone! Saved to: {output_path}")

if __name__ == "__main__":
    main()
