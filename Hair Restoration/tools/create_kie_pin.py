#!/usr/bin/env python3
"""Create Pinterest pins using Kie.ai API (GPT Image 2)."""

import argparse
import json
import time
import urllib.request
import urllib.error
import os


BASE_URL = "https://api.kie.ai"
CREATE_ENDPOINT = f"{BASE_URL}/api/v1/jobs/createTask"
POLL_ENDPOINT = f"{BASE_URL}/api/v1/jobs/recordInfo"


def create_pin(prompt: str, image_url: str, api_key: str, output_path: str, aspect_ratio: str = "2:3", resolution: str = "2K") -> str:
    """Create a Pinterest pin using Kie.ai image-to-image API.
    
    Args:
        prompt: Text prompt for the pin design
        image_url: URL of the input image
        api_key: Kie.ai API key
        output_path: Path to save the output image
        aspect_ratio: Image aspect ratio (default: 2:3 for Pinterest)
        resolution: Image resolution (default: 2K)
    
    Returns:
        Path to the saved image
    """
    # Prepare request payload
    payload = {
        "model": "gpt-image-2-image-to-image",
        "input": {
            "prompt": prompt,
            "input_urls": [image_url],
            "aspect_ratio": aspect_ratio,
            "resolution": resolution
        }
    }
    
    # Create task
    print(f"Creating task...")
    print(f"Prompt: {prompt[:100]}...")
    print(f"Image: {image_url}")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    req = urllib.request.Request(
        CREATE_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"API Error: {e.code} - {error_body}")
        raise
    
    task_id = result.get("data", {}).get("taskId")
    if not task_id:
        raise ValueError(f"No taskId in response: {result}")
    
    print(f"Task created: {task_id}")
    
    # Poll for result
    print("Waiting for result...")
    max_attempts = 120  # 20 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        time.sleep(10)  # Wait 10 seconds between polls
        attempt += 1
        
        poll_url = f"{POLL_ENDPOINT}?taskId={task_id}"
        req = urllib.request.Request(poll_url, headers={"Authorization": f"Bearer {api_key}"})
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"Poll error: {e.code} - {e.read().decode('utf-8')}")
            continue
        
        state = result.get("data", {}).get("state")
        print(f"Attempt {attempt}/{max_attempts} - State: {state}")
        
        if state == "success":
            result_json = result.get("data", {}).get("resultJson")
            if isinstance(result_json, str):
                result_json = json.loads(result_json)
            
            result_urls = result_json.get("resultUrls", [])
            if not result_urls:
                raise ValueError(f"No resultUrls in response: {result_json}")
            
            image_url = result_urls[0]
            print(f"Success! Downloading: {image_url}")
            
            # Download image with headers
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            dl_req = urllib.request.Request(image_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "image/png,image/*,*/*",
                "Referer": "https://api.kie.ai/"
            })
            with urllib.request.urlopen(dl_req, timeout=30) as dl_response:
                data = dl_response.read()
                with open(output_path, "wb") as f:
                    f.write(data)
            print(f"Saved to: {output_path} ({len(data)} bytes)")
            return output_path
            
        elif state == "fail":
            error_msg = result.get("data", {}).get("failMsg", "Unknown error")
            raise RuntimeError(f"Task failed: {error_msg}")
    
    raise TimeoutError(f"Task did not complete after {max_attempts * 10} seconds")


def main():
    parser = argparse.ArgumentParser(description="Create Pinterest pins using Kie.ai API")
    parser.add_argument("--prompt", required=True, help="Text prompt for pin design")
    parser.add_argument("--image", required=True, help="URL of input image")
    parser.add_argument("--api-key", required=True, help="Kie.ai API key")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--aspect-ratio", default="2:3", help="Aspect ratio (default: 2:3)")
    parser.add_argument("--resolution", default="2K", help="Resolution (default: 2K)")
    
    args = parser.parse_args()
    
    result_path = create_pin(
        prompt=args.prompt,
        image_url=args.image,
        api_key=args.api_key,
        output_path=args.output,
        aspect_ratio=args.aspect_ratio,
        resolution=args.resolution
    )
    
    print(f"\nPin created successfully: {result_path}")


if __name__ == "__main__":
    main()
