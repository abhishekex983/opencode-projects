import csv
import io
import json
import os
import uuid

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


class Reporter:
    def __init__(self):
        pass

    def save_report(self, result, report_id=None):
        if not report_id:
            report_id = uuid.uuid4().hex[:12]
        path = os.path.join(REPORTS_DIR, f"{report_id}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        return report_id

    def load_report(self, report_id):
        path = os.path.join(REPORTS_DIR, f"{report_id}.json")
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def to_display(self, result):
        return result

    def to_json_str(self, result):
        return json.dumps(result, indent=2, ensure_ascii=False)

    def to_csv(self, result, report_id):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["=== AUDIENCE RESEARCH REPORT ==="])
        writer.writerow([])
        writer.writerow(["SUMMARY"])
        writer.writerow(["Total Monthly Search Volume", result.get("total_monthly_volume", 0)])
        writer.writerow(["Estimated Unique Audience", result.get("unique_audience", 0)])
        writer.writerow(["Total Addressable Market (TAM)", result.get("tam", 0)])
        writer.writerow(["Average CPC ($)", result.get("avg_cpc", 0)])
        writer.writerow(["Competition Level", result.get("competition_level", "")])
        writer.writerow(["Commercial Audience Size", result.get("commercial_market", {}).get("audience_size", 0)])
        writer.writerow([])

        writer.writerow(["SEARCH INTENT BREAKDOWN"])
        writer.writerow(["Intent", "Volume", "%"])
        for intent, data in result.get("intent_segments", {}).items():
            writer.writerow([intent, data.get("volume", 0), f"{data.get('pct', 0)}%"])
        writer.writerow([])

        writer.writerow(["DEMOGRAPHICS"])
        writer.writerow(["Age Group", "Gender", "Audience Size"])
        for seg in result.get("demographic_segments", []):
            writer.writerow([seg.get("age_group", ""), seg.get("gender", ""), seg.get("audience_size", 0)])
        writer.writerow([])

        writer.writerow(["GEOGRAPHIC DISTRIBUTION"])
        writer.writerow(["Region", "Audience Size", "Interest Value"])
        for geo in result.get("geo_segments", []):
            writer.writerow([geo.get("region", ""), geo.get("audience_size", 0), geo.get("interest", 0)])
        writer.writerow([])

        writer.writerow(["TREND SUMMARY"])
        ts = result.get("trend_summary", {})
        writer.writerow(["Growing Keywords", ts.get("growing", 0)])
        writer.writerow(["Stable Keywords", ts.get("stable", 0)])
        writer.writerow(["Declining Keywords", ts.get("declining", 0)])
        writer.writerow([])

        return output.getvalue(), report_id
