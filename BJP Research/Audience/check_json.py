import json, re

with open('audience-research-n8n.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

node = [n for n in d['nodes'] if 'ALL DataForSEO' in n['name']][0]
code = node['parameters']['jsCode']

print("=== Catch blocks ===")
for l in code.split('\n'):
    if 'catch' in l.strip():
        print(l.strip()[:120])

print()
print("returnFullResponse:", "returnFullResponse" in code)
print("JSON.parse:", "JSON.parse" in code)
print("valid:", True)
