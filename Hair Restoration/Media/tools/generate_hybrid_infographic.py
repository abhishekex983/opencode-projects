import requests
import time
import json
import os
import sys

def read_api_key():
    key_path = r"F:\Opencode Projects\Social Media Posts-Image Generator\kie API.txt"
    with open(key_path, 'r') as f:
        return f.read().strip()

def generate_hybrid():
    API_KEY = read_api_key()
    CREATE_URL = "https://api.kie.ai/api/v1/jobs/createTask"
    QUERY_URL = "https://api.kie.ai/api/v1/jobs/recordInfo"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # Use the baoyu-generated image as input
    input_url = "https://tempfile.aiquickdraw.com/a2/572e6fb32705d29bacf12d0c78765b46_1785984980753.png"

    prompt = """Enhance this infographic's visual polish and professional quality.

INSTRUCTIONS:
- Keep ALL text exactly as shown — do not alter any words, numbers, or URLs
- Add subtle depth and shadows to the card elements
- Refine icons to clean minimal line art style
- Improve color richness while maintaining the navy (#002444), crimson (#B91C1C), white, and gray (#faf9fc) palette
- Add professional medical publication aesthetic
- Ensure the "Hair's the Deal" logo and thinhairgrowthguide.com URL remain clearly visible
- Maintain the 2:3 portrait aspect ratio
- Keep the bento-grid modular layout structure
- Enhance the hand-drawn craft style with cleaner lines

DO NOT:
- Change any text content
- Add new text that wasn't in the original
- Alter the layout structure
- Remove any existing elements"""

    payload = {
        "model": "gpt-image-2-image-to-image",
        "input": {
            "prompt": prompt,
            "input_urls": [input_url],
            "aspect_ratio": "2:3",
            "resolution": "2K"
        }
    }

    print("[1/3] Creating hybrid generation task...")

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

                output_path = os.path.join(os.path.dirname(__file__), "..", ".tmp", "infographic-hybrid.png")
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
    success = generate_hybrid()
    sys.exit(0 if success else 1)
