class VolumeEngine:
    def __init__(self, dfs_client):
        self.dfs = dfs_client

    def get_volumes(self, keywords, location_code, language_code,
                    location_name=None, language_name=None):
        results = []
        batch_size = 800
        for i in range(0, len(keywords), batch_size):
            batch = keywords[i : i + batch_size]
            data = self.dfs.search_volume(
                batch,
                location_code=location_code,
                language_code=language_code,
                location_name=location_name,
                language_name=language_name,
            )
            if isinstance(data, list):
                for entry in data:
                    kw = (entry.get("keyword") or "").strip().lower()
                    vol = entry.get("search_volume") or 0
                    cpc = entry.get("cpc") or 0
                    competition = entry.get("competition") or "LOW"
                    if kw:
                        results.append(
                            {
                                "keyword": kw,
                                "search_volume": vol,
                                "cpc": cpc,
                                "competition": competition,
                            }
                        )
            elif isinstance(data, dict) and data.get("error"):
                print(f"Volume error: {data['error']}")
                break
        return results

    def enrich_with_intent(self, keywords, location_code, language_code):
        intent_map = {}
        batch_size = 50
        for i in range(0, len(keywords), batch_size):
            batch = keywords[i : i + batch_size]
            data = self.dfs.search_intent(
                batch,
                location_code=location_code,
                language_code=language_code,
            )
            if isinstance(data, list):
                for entry in data:
                    for si in entry.get("items", []):
                        kw = (si.get("keyword") or "").strip().lower()
                        intent_info = si.get("keyword_intent") or {}
                        label = intent_info.get("label", "")
                        if kw:
                            intent_map[kw] = (
                                "informational"
                                if label == "informational"
                                else "commercial"
                                if label == "commercial"
                                else "transactional"
                                if label == "transactional"
                                else "navigational"
                                if label == "navigational"
                                else label or "informational"
                            )
            elif isinstance(data, dict) and data.get("error"):
                print(f"Intent error: {data['error']}")
                break
        return intent_map
