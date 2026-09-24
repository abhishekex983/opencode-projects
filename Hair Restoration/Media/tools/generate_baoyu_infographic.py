import requests
import time
import json
import os
import sys

def read_api_key():
    key_path = r"F:\Opencode Projects\Social Media Posts-Image Generator\kie API.txt"
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

    # Read prompt from file
    prompt_path = os.path.join(os.path.dirname(__file__), "..", ".tmp", "prompts", "infographic.md")
    prompt_path = os.path.normpath(prompt_path)
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        prompt = f.read()

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

                output_path = os.path.join(os.path.dirname(__file__), "..", ".tmp", "infographic-baoyu.png")
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
