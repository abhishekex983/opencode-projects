"""
Screenshot the infographic HTML to PNG using Python Playwright.
Output: 1000x1500px Pinterest pin.
"""

import os
import sys
from playwright.sync_api import sync_playwright

HTML_PATH = r"F:\Opencode Projects\Hair Restoration\Media\tools\infographic.html"
OUTPUT_PATH = r"F:\Opencode Projects\Hair Restoration\Media\.tmp\nizoral-vs-nioxin-pin-v2.png"

def main():
    html_url = "file:///" + HTML_PATH.replace("\\", "/")
    print(f"Loading: {html_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1000, "height": 1500})
        page.goto(html_url, wait_until="networkidle")
        page.wait_for_timeout(2000)  # Wait for fonts

        page.screenshot(
            path=OUTPUT_PATH,
            clip={"x": 0, "y": 0, "width": 1000, "height": 1500},
            type="png"
        )
        browser.close()

    if os.path.exists(OUTPUT_PATH):
        size = os.path.getsize(OUTPUT_PATH)
        print(f"Saved: {OUTPUT_PATH} ({size:,} bytes)")
    else:
        print("ERROR: Output not created")
        sys.exit(1)

if __name__ == "__main__":
    main()
