#!/usr/bin/env python3
# Assembles an Activepieces-importable flow template from the ported Code-step JS.
import base64, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
JS_PATH = os.path.join(HERE, "analyse-domains.ap.js")
OUT_NAME = "Domain Analysis Tool (Activepieces).json"
DOWNLOADS = r"C:\Users\Abhishek Bolar\Downloads"

# DataforSEO Basic auth (login:password) -> base64, matching the n8n original.
DFS_CREDS = "abhishekbolarshetty@gmail.com:6aa69ca0a4bf8188"
APIKEY_B64 = base64.b64encode(DFS_CREDS.encode("utf-8")).decode("ascii")

with open(JS_PATH, "r", encoding="utf-8") as f:
    code = f.read().replace("__APIKEY_B64__", APIKEY_B64)

NAME = "Domain Analysis Tool (with Traffic History)"
WEBHOOK_PIECE = "@activepieces/piece-webhook"
WEBHOOK_VERSION = "~0.1.34"
LAST_DATE = "2026-05-29T00:00:00.000Z"
SCHEMA_VERSION = "20"

err_opts = {
    "continueOnFailure": {"value": False},
    "retryOnFailure": {"value": False},
}

respond_action = {
    "name": "step_2",
    "valid": True,
    "displayName": "Return Response",
    "type": "PIECE",
    "settings": {
        "pieceName": WEBHOOK_PIECE,
        "pieceVersion": WEBHOOK_VERSION,
        "actionName": "return_response",
        "input": {
            "responseType": "json",
            "fields": {
                "status": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                "body": "{{step_1}}",
            },
            "respond": "stop",
        },
        "propertySettings": {},
        "inputUiInfo": {},
        "errorHandlingOptions": err_opts,
    },
    "lastUpdatedDate": LAST_DATE,
}

code_action = {
    "name": "step_1",
    "valid": True,
    "displayName": "Analyse Domains",
    "type": "CODE",
    "settings": {
        "sourceCode": {
            "code": code,
            "packageJson": "{\n  \"dependencies\": {}\n}",
        },
        "input": {
            "body": "{{trigger.body}}",
        },
        "propertySettings": {},
        "inputUiInfo": {},
        "errorHandlingOptions": err_opts,
    },
    "lastUpdatedDate": LAST_DATE,
    "nextAction": respond_action,
}

trigger = {
    "name": "trigger",
    "valid": True,
    "displayName": "Catch Webhook",
    "type": "PIECE_TRIGGER",
    "settings": {
        "pieceName": WEBHOOK_PIECE,
        "pieceVersion": WEBHOOK_VERSION,
        "triggerName": "catch_webhook",
        "input": {
            "authType": "none",
            "authFields": {},
        },
        "propertySettings": {},
        "inputUiInfo": {},
    },
    "lastUpdatedDate": LAST_DATE,
    "nextAction": code_action,
}

flow = {
    "displayName": NAME,
    "valid": True,
    "schemaVersion": SCHEMA_VERSION,
    "trigger": trigger,
}

template = {
    "name": NAME,
    "type": "CUSTOM",
    "summary": "",
    "description": (
        "Off-page SEO domain analysis: per-domain backlinks, organic traffic, "
        "12-month traffic history, and an AI backlink-opportunity verdict. "
        "Ported from the n8n 'Domain Analysis Tool (with Traffic History)' workflow."
    ),
    "tags": [],
    "blogUrl": None,
    "metadata": None,
    "author": "Shetty Marketing",
    "categories": ["MARKETING"],
    "pieces": [WEBHOOK_PIECE],
    "flows": [flow],
    "status": "PUBLISHED",
}

out_local = os.path.join(HERE, OUT_NAME)
with open(out_local, "w", encoding="utf-8") as f:
    json.dump(template, f, ensure_ascii=False, indent=2)

# Also drop a copy next to the original n8n file in Downloads, if reachable.
out_dl = None
if os.path.isdir(DOWNLOADS):
    out_dl = os.path.join(DOWNLOADS, OUT_NAME)
    with open(out_dl, "w", encoding="utf-8") as f:
        json.dump(template, f, ensure_ascii=False, indent=2)

# Round-trip validation.
with open(out_local, "r", encoding="utf-8") as f:
    reparsed = json.load(f)
assert reparsed["flows"][0]["trigger"]["nextAction"]["nextAction"]["settings"]["actionName"] == "return_response"

print("APIKEY_B64        :", APIKEY_B64)
print("code length       :", len(code), "chars")
print("output (project)  :", out_local)
print("output (downloads):", out_dl)
print("top-level keys    :", list(reparsed.keys()))
print("step chain        : trigger ->",
      reparsed["flows"][0]["trigger"]["nextAction"]["name"], "->",
      reparsed["flows"][0]["trigger"]["nextAction"]["nextAction"]["name"])
print("VALID JSON, round-trip OK")
