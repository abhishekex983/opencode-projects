==============================================================
  BACKLINK LIVE CHECKER - Setup Guide
==============================================================

This tool crawls every URL where your site has been linked and
reports whether each link is still live, whether your backlink is
still present on the page, what the anchor text is, and whether
it's follow or nofollow.

You'll see the results in three places:
  - Your Google Sheet (the "Results" tab)
  - A local results.csv file (for Excel/spreadsheet analysis)
  - The Links Tracker dashboard at:
    https://shettymarketing.com/off-page-seo/


--------------------------------------------------------------
  PREREQUISITES
--------------------------------------------------------------

  - Windows, Mac, or Linux computer
  - Python 3.10 or newer - download from:
    https://www.python.org/downloads/
    (On install, check "Add Python to PATH")


--------------------------------------------------------------
  SETUP (ONE-TIME, ABOUT 10 MINUTES)
--------------------------------------------------------------

STEP 1  -  Create a Google Sheet
  a. Go to https://sheets.google.com and create a new sheet
  b. Rename the first tab to exactly:  URLs
  c. In row 1 of the URLs tab, put headers:
        url          our_domain          notes
  d. Paste your backlink URLs under the "url" column, one per row
  e. Create a second tab called exactly:  Results
     (leave it blank - the tool will populate it)
  f. Click Share (top right) -> Change "Restricted" to
     "Anyone with the link" -> "Viewer" -> Done

STEP 2  -  Get the Sheet ID
  Look at your sheet's URL. It looks like:
    https://docs.google.com/spreadsheets/d/ABCDEFG12345XYZ/edit
                                              ^^^^^^^^^^^^^^^
                                              THIS is your Sheet ID
  Copy it.

STEP 3  -  Get a Google Sheets API Key
  a. Go to https://console.cloud.google.com/apis/credentials
  b. Create a new project if you don't have one
  c. Click "+ Create Credentials" -> "API key"
  d. Copy the key (looks like: AIzaSyB...)
  e. (Recommended) Click Edit -> API restrictions ->
     Restrict to "Google Sheets API" only

STEP 4  -  Deploy the write-back Apps Script
  (This lets the tool write results back to your sheet.)

  a. Open your Google Sheet
  b. Click Extensions -> Apps Script
  c. Delete any existing code, then paste the ENTIRE contents of
     apps_script.js (in this folder) into the editor
  d. Click Save (floppy disk icon)
  e. Click Deploy -> New deployment
       - Click the gear icon -> Type: Web app
       - Execute as: Me
       - Who has access: Anyone   (IMPORTANT)
       - Click Deploy
  f. If prompted, click Authorize Access, choose your Google
     account, click Advanced -> "Go to (project name) (unsafe)"
     -> Allow.  (It's your own script, so this is safe.)
  g. Copy the Web App URL - looks like:
        https://script.google.com/macros/s/AKfycby.../exec

STEP 5  -  Fill in config.json
  Open config.json in this folder with any text editor (Notepad
  works fine). Replace the PASTE_... placeholders with your
  actual values:

    "target_domain":   "c2cfirstaidaquatics.com",
    "sheet_id":        "ABCDEFG12345XYZ",
    "sheets_api_key":  "AIzaSyB...",
    "apps_script_url": "https://script.google.com/macros/s/AKfy.../exec"

  Save the file.

STEP 6  -  Install Python dependencies
  Double-click Setup.bat
  Wait for it to finish (about 30-60 seconds). This installs
  aiohttp, beautifulsoup4, pandas, and a few other libraries.


--------------------------------------------------------------
  DAILY USE
--------------------------------------------------------------

Every time you add or update URLs in your sheet:

  1. Paste the new URLs into the "URLs" tab
  2. Double-click  Run Check.bat
  3. Wait for it to finish (about 2-3 seconds per URL,
     so 500 URLs = ~40 seconds, 4000 URLs = ~5-8 minutes)
  4. Open your dashboard and click Refresh:
       https://shettymarketing.com/off-page-seo/
     (or just look at the "Results" tab of your sheet)


--------------------------------------------------------------
  COMMON PROBLEMS
--------------------------------------------------------------

Q:  Setup.bat says "Python is not installed"
A:  Install Python from https://www.python.org/downloads/ and
    MAKE SURE to check "Add Python to PATH" during install.

Q:  Run Check.bat says "403 Forbidden" when reading the sheet
A:  The sheet isn't shared publicly. In Google Sheets:
    Share -> Change -> Anyone with the link -> Viewer.

Q:  The crawler runs but results don't appear in the sheet
A:  The Apps Script URL is wrong or the deployment is old.
    Re-deploy (Deploy -> Manage deployments -> pencil ->
    New version -> Deploy) and paste the NEW URL into config.json.

Q:  Every row says "Our Link Found: No" but I know the link is there
A:  The target_domain in config.json is wrong, OR the site
    renders links via JavaScript (React/Vue SPAs). Check the
    first one first.

Q:  I want to track backlinks for a different client's site
A:  Either change "target_domain" in config.json and re-run,
    or make a copy of this whole folder for each client with
    its own config.json.


--------------------------------------------------------------
  FILES IN THIS FOLDER
--------------------------------------------------------------

  link_checker.py    Main crawler (don't edit)
  config.json        Your settings - EDIT THIS
  apps_script.js     Paste into Google Apps Script (step 4)
  requirements.txt   Python package list (don't edit)
  Setup.bat          Run once, first time
  Run Check.bat      Run every time you want to crawl
  README.txt         This file
