import json
import time
import urllib.request
import urllib.error
import os

API_KEY_PATH = r"F:\Opencode Projects\kie API.txt"
OUTPUT_PATH = r"F:\Opencode Projects\Hair Restoration\vitamin-d-hair-thinning-infographic.png"

with open(API_KEY_PATH, "r") as f:
    API_KEY = f.read().strip()

API_BASE = "https://api.kie.ai"

PROMPT = """Create a professional health infographic in portrait 2:3 format (1080x1620 pixels). This is a clean, scannable medical infographic with a modern trust aesthetic. NO photographs. NO emojis. Use minimal line-style icons only.

COLOR SCHEME (strict):
- Header and footer background: dark navy #002444
- Accent color for highlights, badges, stat cards: crimson red #B91C1C
- Card backgrounds: pure white #FFFFFF
- Page background: light warm gray #faf9fc
- Primary text: off-charcoal #1a1a2e (NEVER use pure black #000000)
- Secondary/muted text: slate gray #64748b

TYPOGRAPHY HIERARCHY:
- Main title: bold, large, white on navy, tight letter-spacing
- Section headers: bold, dark navy, slightly smaller than title
- Body text: regular weight, dark charcoal, comfortable line-height
- Stats/numbers: extra bold, very large, crimson red on white
- Metadata/source text: small, muted gray

LAYOUT STRUCTURE (top to bottom, each section clearly separated with generous whitespace):

TOP — NAVY HEADER SECTION:
- A minimal line-style sun/vitamin D icon in golden amber at the top center
- Main title in large bold white text: "Does Low Vitamin D Cause Hair Thinning?"
- Clean, centered layout

SECTION 1 — WHITE CARD with answer:
- A crimson red badge/pill shape with "YES" in bold white
- Next to it, body text paragraph: "Low vitamin D can cause hair thinning by disrupting the hair follicle growth cycle. Vitamin D is needed to activate new growth in hair follicles, and deficiency is strongly linked to diffuse hair loss."

SECTION 2 — CRIMSON RED STAT CARD:
- Large bold white number: "Over 80%"
- Below it in white text: "of people with significant hair thinning had low vitamin D levels"
- Small muted text at bottom: "Based on clinical research findings"

SECTION 3 — WHITE CARD "How It Happens":
- Three items arranged horizontally with icons:
  1. A DNA/strand icon with label "Disrupts Follicle Cycle" and subtext "Vitamin D activates dormant hair follicles. Without it, new growth stalls."
  2. A person/scalp icon with label "Diffuse Thinning" and subtext "Hair thins all over the scalp rather than forming a distinct bald spot."
  3. A blood test tube icon with label "Blood Test Required" and subtext "A blood test is the only way to confirm a deficiency and rule out other causes."

SECTION 4 — WHITE CARD "Signs to Watch For":
- Three rows with crimson red checkbox icons:
  1. "Diffuse thinning across the entire scalp"
  2. "Slower hair regrowth than normal"
  3. "Fatigue or bone pain alongside hair loss"

SECTION 5 — WHITE CARD "Treatment Options":
- Three numbered steps with dark navy number badges:
  1. "Vitamin D Supplements" — "Doctor-recommended dosage based on your blood test levels"
  2. "Sunlight Exposure" — "15 to 20 minutes of direct sunlight several times per week"
  3. "Dietary Changes" — "Fatty fish, egg yolks, fortified dairy, and mushrooms"

SECTION 6 — LIGHT RED/PINK TIMELINE CALLOUT:
- Soft red background (#fef2f2) with red border
- Clock icon in crimson
- Bold text: "Expect several months before seeing noticeable hair regrowth"
- Subtext: "Consistency with treatment is key"

BOTTOM — NAVY FOOTER:
- White text: "Consult a health professional for proper diagnosis and treatment"
- Small muted text: "Not medical advice. Always seek guidance from a qualified healthcare provider."

DESIGN RULES:
- Every element must be perfectly legible with high contrast
- All text must be correctly spelled with no tyforms
- Clean spatial separation between sections — no overlapping elements
- Generous padding inside cards (at least 24px)
- Rounded corners on cards (12-16px radius)
- Subtle shadows on white cards for depth
- The overall feel should be clinical, trustworthy, and easy to scan
- Use SVG-style minimal line icons, not filled/solid icons
- The infographic should look like a polished Pinterest pin
- Make sure ALL text content is included and readable
"""


def create_task():
    url = f"{API_BASE}/api/v1/jobs/createTask"
    payload = json.dumps({
        "model": "gpt-image-2-text-to-image",
        "input": {
            "prompt": PROMPT,
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
            print(f"Create task response: {json.dumps(body, indent=2)}")
            if body.get("code") == 200:
                return body["data"]["taskId"]
            else:
                print(f"Error: {body.get('msg', 'Unknown error')}")
                return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "No response body"
        print(f"HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"Request error: {e}")
        return None


def poll_task(task_id, max_wait=300, interval=5):
    url = f"{API_BASE}/api/v1/jobs/recordInfo?taskId={task_id}"
    elapsed = 0

    while elapsed < max_wait:
        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {API_KEY}")

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                state = body.get("data", {}).get("state", "unknown")
                print(f"[{elapsed}s] State: {state}")

                if state == "success":
                    result_json = body["data"].get("resultJson", "{}")
                    result = json.loads(result_json)
                    urls = result.get("resultUrls", [])
                    if urls:
                        return urls[0]
                    print("No result URLs found")
                    return None
                elif state == "fail":
                    fail_msg = body["data"].get("failMsg", "Unknown failure")
                    print(f"Task failed: {fail_msg}")
                    return None

        except Exception as e:
            print(f"Poll error: {e}")

        time.sleep(interval)
        elapsed += interval

    print("Timeout waiting for task completion")
    return None


def get_download_url(temp_url):
    """Convert Kie temp URL to a downloadable URL via the download-url endpoint."""
    url = f"{API_BASE}/api/v1/common/download-url"
    payload = json.dumps({"url": temp_url}).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"Download URL response: code={body.get('code')}")
            if body.get("code") == 200:
                return body["data"]
            else:
                print(f"Error: {body.get('msg')}")
                return None
    except Exception as e:
        print(f"Download URL error: {e}")
        return None


def download_image(url, output_path):
    print(f"Downloading image to {output_path}...")
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
        with open(output_path, "wb") as f:
            f.write(data)
        print(f"Saved {len(data)} bytes to {output_path}")
        return True


def main():
    print("=== Kie API - GPT Image 2 Infographic Generator ===")
    print(f"Output: {OUTPUT_PATH}")
    print()

    print("Step 1: Creating task...")
    task_id = create_task()
    if not task_id:
        print("FAILED: Could not create task")
        return

    print(f"Task created: {task_id}")
    print()

    print("Step 2: Polling for result...")
    image_url = poll_task(task_id)
    if not image_url:
        print("FAILED: No image URL returned")
        return

    print(f"Image URL: {image_url}")
    print()

    print("Step 3: Getting download URL...")
    download_url = get_download_url(image_url)
    if not download_url:
        print("FAILED: Could not get download URL")
        return

    print(f"Download URL: {download_url}")
    print()

    print("Step 4: Downloading image...")
    if download_image(download_url, OUTPUT_PATH):
        print()
        print("=== SUCCESS ===")
        print(f"Infographic saved to: {OUTPUT_PATH}")
    else:
        print("FAILED: Could not download image")


if __name__ == "__main__":
    main()
