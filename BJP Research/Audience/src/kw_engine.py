import json
import requests

SEED_PROMPT = """You are an expert SEO and audience research analyst.
Given a description of a target audience, generate {count} specific,
actionable Google search keywords that members of this audience would
actually type into Google.

Rules:
- Return ONLY a JSON array of strings. No explanation, no markdown.
- Each keyword should be 1-5 words, realistic, and searchable.
- Cover different angles: informational, commercial, navigational, and
  transactional intent.
- Include some long-tail keywords (3-5 words).
- Include regional qualifiers if geography is mentioned.
- Weight heavily toward what people actually search, not filler terms.

Audience description: {description}

Return format: ["keyword1", "keyword2", ...]"""


class KeywordEngine:
    def __init__(self, dfs_client, openrouter_api_key=None):
        self.dfs = dfs_client
        self.api_key = openrouter_api_key
        self.model = "google/gemini-2.0-flash-001"

    def generate_seed_keywords(self, topic_description, count=20):
        if not self.api_key:
            return []
        prompt = SEED_PROMPT.format(
            count=count, description=topic_description
        )
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=30,
            )
            if response.status_code != 200:
                print(f"OpenRouter error: {response.status_code} {response.text[:200]}")
                return []
            body = response.json()
            text = (
                body.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0]
            keywords = json.loads(text)
            if isinstance(keywords, list):
                return [str(k).strip().lower() for k in keywords if k]
        except Exception as e:
            print(f"AI keyword generation failed: {e}")
        return []

    def expand_keywords(self, seed_keywords, location_code=2356,
                        language_code="en"):
        all_expanded = []
        batches = [
            seed_keywords[i : i + 20]
            for i in range(0, len(seed_keywords), 20)
        ]

        for batch in batches:
            result = self.dfs.keywords_for_keywords(
                batch,
                location_code=location_code,
                language_code=language_code,
                limit=200,
            )
            if isinstance(result, list):
                for entry in result:
                    kw = (entry.get("keyword") or "").strip().lower()
                    vol = entry.get("search_volume") or 0
                    cpc = entry.get("cpc") or 0
                    competition = entry.get("competition") or "LOW"
                    if kw:
                        all_expanded.append(
                            {
                                "keyword": kw,
                                "search_volume": vol,
                                "cpc": cpc,
                                "competition": competition,
                            }
                        )
        return all_expanded

    def merge_keywords(self, seeds, expanded):
        seen = set()
        merged = []
        for kw in seeds:
            k = kw.lower().strip()
            if k and k not in seen:
                seen.add(k)
                merged.append(k)
        for entry in expanded:
            k = (entry.get("keyword") or "").lower().strip()
            if k and k not in seen:
                seen.add(k)
                merged.append(k)
        return merged
