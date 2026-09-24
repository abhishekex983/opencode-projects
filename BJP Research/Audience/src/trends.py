class TrendsEngine:
    def __init__(self, dfs_client):
        self.dfs = dfs_client

    def get_trend_direction(self, keywords, location_code=2356):
        data = self.dfs.google_trends_explore(
            keywords[:5], location_code=location_code
        )
        result = {}
        if not isinstance(data, list) or not data:
            return {k: "unknown" for k in keywords[:5]}

        for item in data:
            trend_items = item.get("items", [])
            if not trend_items:
                continue
            for ti in trend_items:
                kw_list = ti.get("keywords") or []
                graph_data = ti.get("data") or []
                if not graph_data:
                    for k in kw_list:
                        result.setdefault(k.lower().strip(), "unknown")
                    continue
                raw_vals = []
                for g in graph_data:
                    arr = g.get("values")
                    if arr and len(arr) > 0 and arr[0] is not None:
                        raw_vals.append(arr[0])
                if len(raw_vals) < 4:
                    trend_dir = "unknown"
                else:
                    recent = sum(raw_vals[-3:])
                    prior = sum(raw_vals[:-3]) / max(len(raw_vals) - 3, 1)
                    if prior == 0:
                        trend_dir = "growing"
                    else:
                        delta = (recent / 3 - prior) / prior * 100
                        if delta > 10:
                            trend_dir = "growing"
                        elif delta < -10:
                            trend_dir = "declining"
                        else:
                            trend_dir = "stable"
                for k in kw_list:
                    result[k.lower().strip()] = trend_dir
        for k in keywords[:5]:
            if k not in result:
                result[k] = "unknown"
        return result
