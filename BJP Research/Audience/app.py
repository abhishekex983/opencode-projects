import uuid
from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
from src.config import get_config
from src.dataforseo_client import DataForSEOClient
from src.kw_engine import KeywordEngine
from src.volume_engine import VolumeEngine
from src.demographics import DemographicsEngine
from src.trends import TrendsEngine
from src.tam_calculator import TAMCalculator
from src.reporter import Reporter
import io

app = Flask(__name__)
app.secret_key = "audience-scope-secret-key"

config = get_config()
dfs_client = DataForSEOClient(config["dfseo_email"], config["dfseo_password"])
kw_engine = KeywordEngine(dfs_client, openrouter_api_key=config.get("openrouter_api_key"))
volume_engine = VolumeEngine(dfs_client)
demographics_engine = DemographicsEngine(dfs_client)
trends_engine = TrendsEngine(dfs_client)
tam_calc = TAMCalculator()
reporter = Reporter()

LOCATIONS = [
    {"code": 2356, "name": "India", "lang": "en", "lang_name": "English"},
    {"code": 2840, "name": "United States", "lang": "en", "lang_name": "English"},
    {"code": 2826, "name": "United Kingdom", "lang": "en", "lang_name": "English"},
    {"code": 2124, "name": "Canada", "lang": "en", "lang_name": "English"},
    {"code": 2036, "name": "Australia", "lang": "en", "lang_name": "English"},
    {"code": 2276, "name": "Germany", "lang": "de", "lang_name": "German"},
    {"code": 2250, "name": "France", "lang": "fr", "lang_name": "French"},
    {"code": 2152, "name": "Japan", "lang": "ja", "lang_name": "Japanese"},
    {"code": 2156, "name": "Brazil", "lang": "pt", "lang_name": "Portuguese"},
    {"code": 2484, "name": "Singapore", "lang": "en", "lang_name": "English"},
    {"code": 2704, "name": "United Arab Emirates", "lang": "en", "lang_name": "English"},
]


@app.route("/")
def index():
    return render_template("index.html", locations=LOCATIONS)


@app.route("/analyze", methods=["POST"])
def analyze():
    description = request.form.get("description", "").strip()
    manual_keywords_raw = request.form.get("manual_keywords", "").strip()
    location_code = int(request.form.get("location", 2356))
    language_code = request.form.get("language", "en")
    depth = request.form.get("depth", "minimal")

    manual_keywords = [
        k.strip().lower()
        for k in manual_keywords_raw.split(",")
        if k.strip()
    ] if manual_keywords_raw else []

    location_name = None
    for loc in LOCATIONS:
        if loc["code"] == location_code:
            location_name = loc["name"]
            break

    gen_keywords = []
    if description:
        gen_keywords = kw_engine.generate_seed_keywords(description, count=20)

    all_seeds = gen_keywords + [k for k in manual_keywords if k not in gen_keywords]

    if not all_seeds:
        return redirect(url_for("index", error="Please provide a description or keywords."))

    seed_volumes = volume_engine.get_volumes(
        all_seeds, location_code=location_code, language_code=language_code,
        location_name=location_name
    )

    seed_keywords_only = [v.get("keyword", "") for v in seed_volumes if v.get("keyword")]

    top_for_enrich = sorted(
        seed_volumes, key=lambda x: x.get("search_volume", 0), reverse=True
    )[:5]
    top_kws = [k.get("keyword", "") for k in top_for_enrich] if top_for_enrich else seed_keywords_only[:5]

    demographics = {"age_distribution": {}, "gender_distribution": {"male": 50, "female": 50}}
    geo_data = []
    intent_map = {}
    trends_data = {}

    if depth in ("balanced", "full"):
        intent_map = volume_engine.enrich_with_intent(
            seed_keywords_only[:50], location_code=location_code, language_code=language_code
        )

    if depth in ("balanced", "full"):
        trends_data = trends_engine.get_trend_direction(
            top_kws, location_code=location_code,
        )

    if depth == "full":
        demographics = demographics_engine.get_demographics(
            top_kws, location_code=location_code,
        )
        geo_data = demographics_engine.get_geo_distribution(
            top_kws, location_code=location_code,
        )

    for entry in seed_volumes:
        entry["intent"] = intent_map.get(entry.get("keyword", ""), "informational")

    result = tam_calc.calculate(seed_volumes, demographics, geo_data, trends_data)

    report_id = uuid.uuid4().hex[:12]
    result["report_id"] = report_id
    result["description"] = description
    result["location_name"] = location_name or f"Code {location_code}"
    result["language_code"] = language_code
    result["depth"] = depth
    result["seed_keywords"] = all_seeds
    result["seed_count"] = len(seed_volumes)

    reporter.save_report(result, report_id)

    return redirect(url_for("results", report_id=report_id))


@app.route("/results/<report_id>")
def results(report_id):
    result = reporter.load_report(report_id)
    if not result:
        return "Report not found", 404
    return render_template("results.html", result=result)


@app.route("/download/<report_id>/csv")
def download_csv(report_id):
    result = reporter.load_report(report_id)
    if not result:
        return "Report not found", 404
    csv_str, _ = reporter.to_csv(result, report_id)
    return send_file(
        io.BytesIO(csv_str.encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"audience_report_{report_id}.csv",
    )


@app.route("/download/<report_id>/json")
def download_json(report_id):
    result = reporter.load_report(report_id)
    if not result:
        return "Report not found", 404
    json_str = reporter.to_json_str(result)
    return send_file(
        io.BytesIO(json_str.encode("utf-8")),
        mimetype="application/json",
        as_attachment=True,
        download_name=f"audience_report_{report_id}.json",
    )


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
