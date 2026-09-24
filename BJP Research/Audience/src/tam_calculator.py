class TAMCalculator:
    DEDUP_FACTOR = 0.65
    COVERAGE_FACTOR = 1.4

    def calculate(self, keywords_data, demographics, geo_data, trends):
        total_volume = sum(kw.get("search_volume") or 0 for kw in keywords_data)
        unique_audience = int(total_volume * self.DEDUP_FACTOR)
        tam = int(unique_audience * self.COVERAGE_FACTOR)

        intent_segments = self._calc_intents(keywords_data)
        commercial_audience = int(
            unique_audience * intent_segments.get("commercial", {}).get("pct", 0) / 100
        )
        avg_cpc = self._calc_avg_cpc(keywords_data)

        demographic_segments = self._calc_demographics(
            unique_audience, demographics
        )
        geo_segments = self._calc_geo(unique_audience, geo_data)

        trend_counts = {"growing": 0, "stable": 0, "declining": 0}
        for kw, direction in trends.items():
            if direction in trend_counts:
                trend_counts[direction] += 1

        competition_level = self._calc_competition(keywords_data)

        return {
            "total_monthly_volume": total_volume,
            "unique_audience": unique_audience,
            "tam": tam,
            "demographic_segments": demographic_segments,
            "geo_segments": geo_segments,
            "intent_segments": intent_segments,
            "commercial_market": {
                "audience_size": commercial_audience,
                "avg_cpc": avg_cpc,
            },
            "trend_summary": trend_counts,
            "competition_level": competition_level,
            "avg_cpc": avg_cpc,
        }

    def _calc_intents(self, keywords_data):
        intent_vol = {}
        for kw in keywords_data:
            intent = kw.get("intent") or "informational"
            vol = kw.get("search_volume") or 0
            intent_vol[intent] = intent_vol.get(intent, 0) + vol
        total = sum(intent_vol.values()) or 1
        return {
            k: {"volume": v, "pct": round(v / total * 100, 1)}
            for k, v in sorted(intent_vol.items(), key=lambda x: x[1], reverse=True)
        }

    def _calc_avg_cpc(self, keywords_data):
        cpcs = [k.get("cpc") or 0 for k in keywords_data if (k.get("cpc") or 0) > 0]
        return round(sum(cpcs) / len(cpcs), 2) if cpcs else 0

    def _calc_demographics(self, unique_audience, demographics):
        segments = []
        age_dist = demographics.get("age_distribution", {})
        gender_dist = demographics.get("gender_distribution", {})
        for age_bracket, age_pct in age_dist.items():
            for gender, gen_pct in gender_dist.items():
                size = int(unique_audience * (age_pct / 100) * (gen_pct / 100))
                segments.append(
                    {
                        "age_group": age_bracket,
                        "gender": gender,
                        "audience_size": size,
                    }
                )
        return segments

    def _calc_geo(self, unique_audience, geo_data):
        total_geo_val = sum(g.get("value") or 0 for g in geo_data) or 1
        return [
            {
                "region": g["region"],
                "audience_size": int(
                    unique_audience * ((g.get("value") or 0) / total_geo_val)
                ),
                "interest": g.get("value") or 0,
            }
            for g in geo_data[:10]
        ]

    def _calc_competition(self, keywords_data):
        levels = [(k.get("competition") or "LOW").upper() for k in keywords_data]
        high = levels.count("HIGH")
        medium = levels.count("MEDIUM")
        low = levels.count("LOW")
        if high > len(levels) * 0.4:
            return "HIGH"
        if medium > len(levels) * 0.5:
            return "MEDIUM"
        return "LOW"
