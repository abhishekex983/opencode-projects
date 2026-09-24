class DemographicsEngine:
    def __init__(self, dfs_client):
        self.dfs = dfs_client

    def get_demographics(self, keywords, location_code=2356):
        data = self.dfs.trends_demography(
            keywords[:5], location_code=location_code
        )
        if not isinstance(data, list) or not data:
            return {
                "age_distribution": {},
                "gender_distribution": {"male": 50, "female": 50},
            }
        age_agg = {}
        gender_agg = {"male": 0, "female": 0}
        count = 0
        for item in data:
            for sub_item in (item.get("items") or []):
                demo = sub_item.get("demography") or {}
                age_list = demo.get("age") or []
                gender_list = demo.get("gender") or []
                for age_entry in age_list:
                    for val in (age_entry.get("values") or []):
                        bracket = val.get("type") or ""
                        v = val.get("value") or 0
                        if bracket:
                            age_agg[bracket] = age_agg.get(bracket, 0) + v
                for gen_entry in gender_list:
                    for val in (gen_entry.get("values") or []):
                        gtype = (val.get("type") or "").lower()
                        v = val.get("value") or 0
                        if gtype in gender_agg:
                            gender_agg[gtype] += v
                count += 1
        if count > 0 and age_agg:
            total_age = sum(age_agg.values()) or 1
            age_dist = {
                k: round(v / total_age * 100, 1) for k, v in age_agg.items()
            }
        else:
            age_dist = {}
        if count > 0 and sum(gender_agg.values()) > 0:
            total_gen = sum(gender_agg.values())
            gen_dist = {
                k: round(v / total_gen * 100, 1)
                for k, v in gender_agg.items()
            }
        else:
            gen_dist = {"male": 50, "female": 50}
        return {
            "age_distribution": age_dist,
            "gender_distribution": gen_dist,
        }

    def get_geo_distribution(self, keywords, location_code=2356):
        data = self.dfs.subregion_interests(
            keywords[:5], location_code=location_code
        )
        if not isinstance(data, list) or not data:
            return []
        geo_map = {}
        for item in data:
            for sub_item in (item.get("items") or []):
                interests = sub_item.get("interests") or []
                for interest_entry in interests:
                    for val in (interest_entry.get("values") or []):
                        name = (val.get("geo_name") or "").strip()
                        v = val.get("value") or 0
                        if name:
                            geo_map[name] = geo_map.get(name, 0) + v
        sorted_geo = sorted(
            geo_map.items(), key=lambda x: x[1], reverse=True
        )
        return [{"region": k, "value": v} for k, v in sorted_geo[:20]]
