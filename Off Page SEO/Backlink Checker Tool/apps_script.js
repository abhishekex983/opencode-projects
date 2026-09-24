/**
 * Backlink Checker — Google Apps Script Write Endpoint
 * =====================================================
 * This script receives results from link_checker.py and writes them
 * to the "Results" tab of your Google Sheet.
 *
 * SETUP (one-time, takes ~3 minutes):
 * ─────────────────────────────────────
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1MFawZDUoBJ0xfXwjJCehlkzuVDpKVjzpGHOq0KMEjy8/edit
 *
 * 2. Click Extensions → Apps Script
 *
 * 3. Delete any existing code in the editor and paste THIS entire file
 *
 * 4. Click Save (💾)
 *
 * 5. Click Deploy → New Deployment
 *    - Type: Web App
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone  ← important, otherwise the Python script can't POST to it
 *    - Click Deploy
 *
 * 6. Copy the Web App URL — it looks like:
 *    https://script.google.com/macros/s/AKfycby.../exec
 *
 * 7. Open link_checker.py and paste that URL into:
 *    APPS_SCRIPT_WRITE_URL = "https://script.google.com/macros/s/AKfycby.../exec"
 *
 * That's it! Every time you run the Python script it will now write
 * results directly into your "Results" tab.
 *
 * SHEET STRUCTURE EXPECTED:
 * ─────────────────────────
 * Tab "URLs"    → columns: url, our_domain, notes, date_added, outreach_contact
 * Tab "Results" → auto-created/cleared by this script on each run
 */

// ─── Main POST handler (called by link_checker.py) ──────────────────────────────

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    const sheetId   = payload.sheetId   || SpreadsheetApp.getActiveSpreadsheet().getId();
    const tabName   = payload.tabName   || "Results";
    const rows      = payload.rows      || [];
    const clearFirst = payload.clearFirst !== false;  // default true

    const ss    = SpreadsheetApp.openById(sheetId);
    let   sheet = ss.getSheetByName(tabName);

    // Create the Results tab if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    if (clearFirst) {
      sheet.clearContents();
    }

    if (rows.length === 0) {
      return jsonResponse({ status: "ok", message: "No rows to write." });
    }

    // Write all rows at once (much faster than row-by-row)
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1a1a2e");
    headerRange.setFontColor("#ffffff");

    // Colour-code Link Status column (column C = index 3)
    const statusColIndex = rows[0].indexOf("Link Status") + 1;
    if (statusColIndex > 0 && rows.length > 1) {
      for (let i = 2; i <= rows.length; i++) {
        const statusCell = sheet.getRange(i, statusColIndex);
        const status = statusCell.getValue().toString().toLowerCase();
        if (status === "live") {
          statusCell.setBackground("#d4edda");  // green
        } else if (status === "dead" || status.startsWith("error")) {
          statusCell.setBackground("#f8d7da");  // red
        } else if (status === "timeout" || status === "connection_error") {
          statusCell.setBackground("#fff3cd");  // yellow
        }
      }
    }

    // Colour-code "Our Link Found" column
    const foundColIndex = rows[0].indexOf("Our Link Found") + 1;
    if (foundColIndex > 0 && rows.length > 1) {
      for (let i = 2; i <= rows.length; i++) {
        const cell = sheet.getRange(i, foundColIndex);
        cell.setBackground(cell.getValue() === "Yes" ? "#d4edda" : "#f8d7da");
      }
    }

    // Colour-code "Link Attribute" — nofollow rows get amber
    const relColIndex = rows[0].indexOf("Link Attribute") + 1;
    if (relColIndex > 0 && rows.length > 1) {
      for (let i = 2; i <= rows.length; i++) {
        const cell = sheet.getRange(i, relColIndex);
        if (cell.getValue().toString().toLowerCase().includes("nofollow")) {
          cell.setBackground("#fff3cd");
        }
      }
    }

    // Auto-resize columns so everything is readable
    sheet.autoResizeColumns(1, rows[0].length);

    // Freeze header row
    sheet.setFrozenRows(1);

    return jsonResponse({
      status:    "ok",
      rowsWritten: rows.length - 1,
      sheetUrl:  ss.getUrl() + "#gid=" + sheet.getSheetId(),
    });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ─── Simple GET handler (health check / test) ───────────────────────────────────

function doGet(e) {
  return jsonResponse({ status: "ok", message: "Backlink Checker write endpoint is live." });
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Utility: set up the URLs tab with the right headers ────────────────────────
// Run this once manually from the Apps Script editor (Run → setupUrlsTab)
// if you want the script to create the headers for you.

function setupUrlsTab() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName("URLs");

  if (!sheet) {
    sheet = ss.insertSheet("URLs");
  }

  const headers = ["url", "our_domain", "notes", "date_added", "outreach_contact"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  SpreadsheetApp.getUi().alert("URLs tab is ready. Paste your backlink URLs in column A.");
}
