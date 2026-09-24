#!/usr/bin/env python3
"""
Hair Thinning Infographic Generator — 2 Pinterest Variants
Uses Kie.ai GPT Image 2 API (text-to-image)
"""

import json
import time
import urllib.request
import urllib.error
import os

API_KEY_PATH = r"F:\Opencode Projects\kie API.txt"
OUTPUT_DIR = r"F:\Opencode Projects\Hair Restoration\.tmp"

with open(API_KEY_PATH, "r") as f:
    API_KEY = f.read().strip()

API_BASE = "https://api.kie.ai"

# ─── VARIANT 1: CAUSES GRID ────────────────────────────────────────────────────

PROMPT_V1 = """Create a professional health infographic in portrait 2:3 format (1080x1620 pixels). Clean, scannable medical infographic with modern trust aesthetic. NO photographs. NO emojis. Minimal line-style icons only.

COLOR SCHEME (strict):
- Header and footer background: dark navy #002444
- Accent color for highlights, badges, stat cards: crimson red #B91C1C
- Card backgrounds: pure white #FFFFFF
- Page background: light warm gray #faf9fc
- Primary text: off-charcoal #1a1a2e
- Secondary/muted text: slate gray #64748b

TYPOGRAPHY HIERARCHY:
- Main title: bold, large, white on navy, tight letter-spacing
- Section headers: bold, dark navy, slightly smaller than title
- Body text: regular weight, dark charcoal, comfortable line-height
- Stats/numbers: extra bold, very large, crimson red on white
- Metadata/source text: small, muted gray

LAYOUT STRUCTURE (top to bottom, generous whitespace between sections):

TOP — NAVY HEADER SECTION:
- Minimal line-style hair strand icon at top center in white
- Main title in large bold white text: "What Does It Mean When Your Hair Is Thinning?"
- Subtitle in lighter weight: "Understanding the causes, signs, and solutions"

SECTION 1 — WHITE CARD:
- Section header: "Thinning Hair vs. Hair Loss"
- Body text: "Hair thinning means strands become finer or density decreases. Unlike hair loss where strands fall out at the root, thinning is about volume and density. About 50-100 hairs shed daily is normal."

SECTION 2 — CRIMSON RED STAT CARD:
- Large bold white number: "80% of Men"
- Below: "50% of Women"
- White text: "experience pattern hair loss by age 70"
- Small muted text at bottom: "Source: Clinical research data"

SECTION 3 — WHITE CARD "6 Common Causes" (LARGE, EMPHASIZED):
- Section header with crimson underline accent
- 6-item grid (2 columns x 3 rows), each with:
  - Minimal line icon
  - Bold label
  - 1-line explanation
- Items:
  1. Genetics — "Androgenetic alopecia runs in families"
  2. Hormones — "Pregnancy, menopause, PCOS, thyroid issues"
  3. Stress — "Telogen effluvium pushes hair into shedding phase"
  4. Nutrition — "Low iron, zinc, or biotin deficiency"
  5. Medical — "Autoimmune diseases, certain medications"
  6. Styling — "Tight ponytails cause traction alopecia"

SECTION 4 — WHITE CARD "Early Warning Signs":
- 4 items with crimson red checkmark icons:
  1. "Wider hair part than before"
  2. "More scalp visible through hair"
  3. "Ponytail feels thinner"
  4. "Increased hair on pillow or in brush"

SECTION 5 — NAVY CALLOUT:
- Bold white text: "Early detection leads to better outcomes"
- Subtitle: "Act at the first signs for best results"

SECTION 6 — WHITE CARD "Treatment Options":
- 4 numbered steps with dark navy number badges:
  1. "Minoxidil" — "Topical treatment to stimulate growth"
  2. "Scalp Care" — "Use targeted shampoos, keep scalp healthy"
  3. "DHT Blockers" — "Prescription options like finasteride"
  4. "Dermarolling" — "Microneedling to boost circulation"

BOTTOM — NAVY FOOTER:
- White text: "Consult a health professional for proper diagnosis"
- Small muted text: "Not medical advice. Always seek guidance from a qualified healthcare provider."

DESIGN RULES:
- Every element perfectly legible with high contrast
- All text correctly spelled, no typos
- Clean spatial separation between sections
- Generous padding inside cards (at least 24px)
- Rounded corners on cards (12-16px radius)
- Subtle shadows on white cards
- Clinical, trustworthy, easy to scan
- SVG-style minimal line icons, not filled
- Polished Pinterest pin appearance
- ALL text content included and readable
"""

# ─── VARIANT 2: CAUSE SPOTLIGHT ────────────────────────────────────────────────

PROMPT_V2 = """Create a professional health infographic in portrait 2:3 format (1080x1620 pixels). Clean, scannable medical infographic with modern trust aesthetic. NO photographs. NO emojis. Minimal line-style icons only.

COLOR SCHEME (strict):
- Header and footer background: dark navy #002444
- Accent color for highlights, badges, stat cards: crimson red #B91C1C
- Card backgrounds: pure white #FFFFFF
- Page background: light warm gray #faf9fc
- Primary text: off-charcoal #1a1a2e
- Secondary/muted text: slate gray #64748b

TYPOGRAPHY HIERARCHY:
- Main title: bold, large, white on navy, tight letter-spacing
- Section headers: bold, dark navy, slightly smaller than title
- Body text: regular weight, dark charcoal, comfortable line-height
- Stats/numbers: extra bold, very large, crimson red on white
- Metadata/source text: small, muted gray

LAYOUT STRUCTURE (top to bottom, generous whitespace between sections):

TOP — NAVY HEADER SECTION:
- Minimal line-style magnifying glass + hair icon at top center in white
- Main title in large bold white text: "Why Is Your Hair Thinning?"
- Subtitle: "The 5 main causes you need to know"

SECTION 1 — WHITE STAT CARD:
- Two large crimson red numbers side by side: "24%" and "29%"
- Below in dark text: "of men and women report having thin hair"
- Muted subtext: "Based on a study across 9 countries"

SECTION 2 — LARGE CRIMSON RED CARD "The 5 Main Causes" (MOST PROMINENT):
- White text header on crimson background: "The 5 Main Causes"
- 5 stacked rows, each with:
  - White circular icon background with minimal line icon
  - Bold white label
  - 2-line white description below
- Items:
  1. "Genetics" — "Androgenetic alopecia is the most common cause. Up to 80% of men and 50% of women experience it by age 70."
  2. "Hormonal Changes" — "Pregnancy, menopause, PCOS, and thyroid disorders can all disrupt the hair growth cycle."
  3. "Chronic Stress" — "High stress pushes hair into telogen effluvium — a shedding phase that causes noticeable thinning."
  4. "Nutritional Deficiency" — "Low iron, zinc, biotin, or vitamin D deprives follicles of nutrients needed for growth."
  5. "Medical Conditions" — "Autoimmune diseases like alopecia areata and certain medications can trigger hair loss."

SECTION 3 — WHITE CARD "How to Spot Thinning Hair":
- Section header with crimson accent line
- 4 checklist items with crimson checkmark icons:
  1. "Part looks wider than it used to"
  2. "Scalp is more visible, especially at the crown"
  3. "Ponytail feels noticeably thinner"
  4. "More hair shedding in shower or on pillow"

SECTION 4 — LIGHT RED CALLOUT (#fef2f2 background):
- Clock icon in crimson
- Bold text: "See a doctor if hair loss is sudden"
- Subtext: "Or if at-home treatments fail after several months"

BOTTOM — NAVY FOOTER:
- White text: "Consult a health professional for proper diagnosis"
- Small muted text: "Not medical advice. Always seek guidance from a qualified healthcare provider."

DESIGN RULES:
- Every element perfectly legible with high contrast
- All text correctly spelled, no typos
- Clean spatial separation between sections
- Generous padding inside cards (at least 24px)
- Rounded corners on cards (12-16px radius)
- Subtle shadows on white cards
- Clinical, trustworthy, easy to scan
- SVG-style minimal line icons, not filled
- Polished Pinterest pin appearance
- The 5 causes section must be the visual focal point — largest card, bold colors
- ALL text content included and readable
"""


def create_task(prompt: str, variant_name: str):
    """Submit text-to-image task to Kie.ai API."""
    print(f"[{variant_name}] Creating task...")
    
    url = f"{API_BASE}/api/v1/jobs/createTask"
    payload = json.dumps({
        "model": "gpt-image-2-text-to-image",
        "input": {
            "prompt": prompt,
            "aspect_ratio": "2:3",
            "resolution": "2K"
        }
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[{variant_name}] Response: code={body.get('code')}")
            if body.get("code") == 200:
                task_id = body["data"]["taskId"]
                print(f"[{variant_name}] Task ID: {task_id}")
                return task_id
            else:
                print(f"[{variant_name}] Error: {body.get('msg', 'Unknown error')}")
                return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "No response body"
        print(f"[{variant_name}] HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"[{variant_name}] Request error: {e}")
        return None


def poll_task(task_id: str, variant_name: str, max_wait=300, interval=5):
    """Poll task status until completion."""
    print(f"[{variant_name}] Polling for result (max {max_wait}s)...")
    
    url = f"{API_BASE}/api/v1/jobs/recordInfo?taskId={task_id}"
    elapsed = 0

    while elapsed < max_wait:
        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {API_KEY}")

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                state = body.get("data", {}).get("state", "unknown")
                print(f"[{variant_name}] [{elapsed}s] State: {state}")

                if state == "success":
                    result_json = body["data"].get("resultJson", "{}")
                    result = json.loads(result_json)
                    urls = result.get("resultUrls", [])
                    if urls:
                        return urls[0]
                    print(f"[{variant_name}] No result URLs found")
                    return None
                elif state == "fail":
                    fail_msg = body["data"].get("failMsg", "Unknown failure")
                    print(f"[{variant_name}] Task failed: {fail_msg}")
                    return None

        except Exception as e:
            print(f"[{variant_name}] Poll error: {e}")

        time.sleep(interval)
        elapsed += interval

    print(f"[{variant_name}] Timeout after {max_wait}s")
    return None


def get_download_url(temp_url: str, variant_name: str):
    """Convert Kie temp URL to downloadable URL."""
    print(f"[{variant_name}] Getting download URL...")
    
    url = f"{API_BASE}/api/v1/common/download-url"
    payload = json.dumps({"url": temp_url}).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("code") == 200:
                return body["data"]
            else:
                print(f"[{variant_name}] Download URL error: {body.get('msg')}")
                return None
    except Exception as e:
        print(f"[{variant_name}] Download URL error: {e}")
        return None


def download_image(url: str, output_path: str, variant_name: str):
    """Download image to local file."""
    print(f"[{variant_name}] Downloading to {output_path}...")
    
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(data)
            print(f"[{variant_name}] Saved {len(data)} bytes")
            return True
    except Exception as e:
        print(f"[{variant_name}] Download error: {e}")
        return False


def generate_variant(prompt: str, output_filename: str, variant_name: str):
    """Full pipeline: create task → poll → download."""
    print(f"\n{'='*60}")
    print(f"GENERATING: {variant_name}")
    print(f"Output: {output_filename}")
    print(f"{'='*60}\n")
    
    # Step 1: Create task
    task_id = create_task(prompt, variant_name)
    if not task_id:
        print(f"[{variant_name}] FAILED: Could not create task")
        return None
    
    # Step 2: Poll for result
    image_url = poll_task(task_id, variant_name)
    if not image_url:
        print(f"[{variant_name}] FAILED: No image URL returned")
        return None
    
    print(f"[{variant_name}] Image URL: {image_url}")
    
    # Step 3: Get download URL
    download_url = get_download_url(image_url, variant_name)
    if not download_url:
        print(f"[{variant_name}] FAILED: Could not get download URL")
        return None
    
    # Step 4: Download
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    if download_image(download_url, output_path, variant_name):
        print(f"[{variant_name}] SUCCESS: {output_path}")
        return output_path
    
    print(f"[{variant_name}] FAILED: Download error")
    return None


def main():
    print("=" * 60)
    print("Hair Thinning Infographic Generator")
    print("2 Pinterest Variants via Kie.ai GPT Image 2")
    print("=" * 60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    results = {}
    
    # Variant 1: Causes Grid
    results["v1"] = generate_variant(
        prompt=PROMPT_V1,
        output_filename="hair-thinning-causes-grid.png",
        variant_name="Variant 1 (Causes Grid)"
    )
    
    # Variant 2: Cause Spotlight
    results["v2"] = generate_variant(
        prompt=PROMPT_V2,
        output_filename="hair-thinning-cause-spotlight.png",
        variant_name="Variant 2 (Cause Spotlight)"
    )
    
    # Summary
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    
    for key, path in results.items():
        status = "SUCCESS" if path else "FAILED"
        print(f"  {key}: {status} — {path or 'N/A'}")
    
    success_count = sum(1 for p in results.values() if p)
    print(f"\n{success_count}/2 variants generated successfully.")
    
    return 0 if success_count > 0 else 1


if __name__ == "__main__":
    exit(main())
