import base64

with open(r"F:\Opencode Projects\Hair Restoration\vitamin-d-hair-thinning-infographic.png", "rb") as f:
    data = base64.b64encode(f.read()).decode()

html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;background:#eee;display:grid;place-items:center;min-height:100vh">
<img src="data:image/png;base64,{data}" style="max-width:100%;max-height:100vh;object-fit:contain"/>
</body>
</html>"""

with open(r"F:\Opencode Projects\Hair Restoration\preview.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Preview HTML created")
