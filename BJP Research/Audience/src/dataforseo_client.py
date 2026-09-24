import json
import time

import requests
from requests.auth import HTTPBasicAuth

from . import cache

BASE_URL = "https://api.dataforseo.com/v3"
_LAST_REQUEST_TIME = 0
MIN_INTERVAL = 0.15


class DataForSEOClient:
    def __init__(self, email, password):
        self.auth = HTTPBasicAuth(email, password)

    def _post(self, endpoint, payload):
        global _LAST_REQUEST_TIME
        elapsed = time.time() - _LAST_REQUEST_TIME
        if elapsed < MIN_INTERVAL:
            time.sleep(MIN_INTERVAL - elapsed)
        response = requests.post(
            f"{BASE_URL}/{endpoint}", auth=self.auth, json=payload, timeout=120
        )
        _LAST_REQUEST_TIME = time.time()
        return response

    def switch_to_us(self):
        self.auth = HTTPBasicAuth(
            self.auth.username, self.auth.password
        )

    def search_volume(self, keywords, location_code, language_code,
                      location_name=None, language_name=None):
        cached = cache.get(
            "search_volume", keywords, location_code, language_code
        )
        if cached:
            return cached

        task = {"keywords": keywords}
        if location_name:
            task["location_name"] = location_name
        elif location_code is not None:
            task["location_code"] = location_code
        if language_name:
            task["language_name"] = language_name
        elif language_code:
            task["language_code"] = language_code

        response = self._post(
            "keywords_data/google_ads/search_volume/live", [task]
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set(
            "search_volume", keywords, location_code, language_code, result
        )
        return result

    def keywords_for_keywords(self, keywords, location_code, language_code,
                              location_name=None, language_name=None, limit=100):
        cached = cache.get(
            "kw_for_kw", keywords, location_code, language_code
        )
        if cached:
            return cached

        task = {"keywords": keywords[:20]}
        if location_name:
            task["location_name"] = location_name
        elif location_code is not None:
            task["location_code"] = location_code
        if language_name:
            task["language_name"] = language_name
        elif language_code:
            task["language_code"] = language_code

        response = self._post(
            "keywords_data/google_ads/keywords_for_keywords/live", [task]
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set(
            "kw_for_kw", keywords, location_code, language_code, result
        )
        return result[:limit] if result else []

    def trends_demography(self, keywords, location_code=2356):
        cached = cache.get(
            "demography", keywords, location_code, None
        )
        if cached:
            return cached

        response = self._post(
            "keywords_data/dataforseo_trends/demography/live",
            [{"keywords": keywords[:5], "location_code": location_code}],
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set("demography", keywords, location_code, None, result)
        return result

    def subregion_interests(self, keywords, location_code=2356):
        cached = cache.get(
            "subregion", keywords, location_code, None
        )
        if cached:
            return cached

        response = self._post(
            "keywords_data/dataforseo_trends/subregion_interests/live",
            [{"keywords": keywords[:5], "location_code": location_code}],
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set("subregion", keywords, location_code, None, result)
        return result

    def search_intent(self, keywords, location_code, language_code):
        cached = cache.get(
            "search_intent", keywords, location_code, language_code
        )
        if cached:
            return cached

        response = self._post(
            "dataforseo_labs/google/search_intent/live",
            [
                {
                    "keywords": keywords,
                    "location_code": location_code,
                    "language_code": language_code,
                }
            ],
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set(
            "search_intent", keywords, location_code, language_code, result
        )
        return result

    def google_trends_explore(self, keywords, location_code=2356):
        cached = cache.get(
            "trends_explore", keywords, location_code, None
        )
        if cached:
            return cached

        response = self._post(
            "keywords_data/google_trends/explore/live",
            [
                {
                    "keywords": keywords[:5],
                    "location_code": location_code,
                }
            ],
        )
        data = self._parse(response)
        result = data.get("tasks", [{}])[0].get("result", [])
        cache.set(
            "trends_explore", keywords, location_code, None, result
        )
        return result

    def _parse(self, response):
        try:
            body = response.json()
        except Exception:
            return {"error": f"Invalid JSON response: {response.status_code}"}

        if response.status_code != 200:
            return {
                "error": f"API returned {response.status_code}: {body}"
            }

        if body.get("status_code") and body["status_code"] >= 40000:
            return {
                "error": body.get("status_message", "Unknown API error"),
                "code": body["status_code"],
            }

        return body
