import requests
import time
import json
import os
import sys

def read_api_key():
    key_path = r"F:\Opencode Projects\kie API.txt"
    with open(key_path, 'r') as f:
        return f.read().strip()

def generate_infographic():
    API_KEY = read_api_key()
    CREATE_URL = "https://api.kie.ai/api/v1/jobs/createTask"
    QUERY_URL = "https://api.kie.ai/api/v1/jobs/recordInfo"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = """Create a professional health infographic in portrait format (2:3 ratio).

DESIGN SPECIFICATIONS:
- Header and footer: Dark navy blue (#002444)
- Accent colors and highlights: Crimson red (#B91C1C)
- Card backgrounds: White
- Page background: Light gray (#faf9fc)
- Clean, modern, medical-trust aesthetic
- Clear typography hierarchy for easy scanning
- Minimal line icons (no photos)
- All text must be highly legible and error-free

CONTENT LAYOUT:

HEADER SECTION:
- Large title: "Does Dandruff Cause Thinning Hair?"
- Subtitle: "The Real Link Between Your Scalp and Hair Health"

BODY (in white cards with subtle shadows):

1. Section: "MYTH BUSTED"
   - Main point: "Dandruff does NOT directly cause permanent hair loss"
   - Small text: "But it contributes to temporary thinning"
   - Simple checkmark or shield icon

2. Section: "THE REAL PROBLEM"
   - "Chronic scalp inflammation weakens hair follicles"
   - "Pushes hairs from growing phase to shedding phase"
   - Warning or inflammation icon

3. Section: "THE SCRATCHING CYCLE"
   - Circular diagram showing: Itch > Scratch > Inflammation > More Itching
   - "Physical damage causes breakage and hair fall"
   - Cycle/refresh icon

4. Section: "BY THE NUMBERS"
   - Large number: "50%"
   - Text: "of adults worldwide affected by dandruff"
   - Globe or statistics icon

5. Section: "SOLUTIONS"
   - "Use medicated shampoos with ketoconazole"
   - "Controls Malassezia fungus and reduces inflammation"
   - Medicine bottle or shampoo icon

6. Section: "WHEN TO SEE A DOCTOR"
   - "If OTC treatments fail after 2-3 weeks"
   - "If hair loss is severe or worsening"
   - Doctor or medical professional icon

FOOTER:
- Logo text: "Hair's the Deal" (white on navy)
- Website: thinhairgrowthguide.com
- Call to action: "Read the full guide"

STYLE NOTES:
- Subtle drop shadows on white cards
- Red accent lines or borders for emphasis
- Clean sans-serif fonts
- Adequate white space between sections
- Professional medical publication feel
- No photographs or realistic images
- Icons should be minimal line art style"""

    payload = {
        "model": "gpt-image-2-text-to-image",
        "input": {
            "prompt": prompt,
            "aspect_ratio": "2:3",
            "resolution": "2K"
        }
    }

    print("[1/3] Creating generation task...")

    try:
        response = requests.post(CREATE_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print(f"Response: {json.dumps(result, indent=2)}")

        if result.get("code") != 200:
            print(f"Error: {result.get('msg', 'Unknown error')}")
            return False

        task_id = result["data"]["taskId"]
        print(f"[2/3] Task created: {task_id}")
        print("Polling for completion...")

        max_attempts = 60
        attempt = 0

        while attempt < max_attempts:
            time.sleep(5)
            attempt += 1

            query_response = requests.get(
                QUERY_URL,
                headers=headers,
                params={"taskId": task_id},
                timeout=30
            )
            query_result = query_response.json()

            if query_result.get("code") != 200:
                print(f"  Query error: {query_result.get('msg')}")
                continue

            state = query_result["data"]["state"]
            print(f"  Attempt {attempt}: state = {state}")

            if state == "success":
                result_json = json.loads(query_result["data"]["resultJson"])
                image_url = result_json["resultUrls"][0]

                print(f"[3/3] Downloading: {image_url}")

                img_response = requests.get(image_url, timeout=60)
                img_response.raise_for_status()

                output_path = os.path.join(os.path.dirname(__file__), "..", ".tmp", "infographic.png")
                output_path = os.path.normpath(output_path)

                with open(output_path, 'wb') as f:
                    f.write(img_response.content)

                print(f"SUCCESS! Saved to: {output_path}")
                return True

            elif state == "fail":
                fail_msg = query_result["data"].get("failMsg", "Unknown error")
                print(f"Error: Task failed - {fail_msg}")
                return False

        print("Error: Timed out after 5 minutes")
        return False

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False

if __name__ == "__main__":
    success = generate_infographic()
    sys.exit(0 if success else 1)
