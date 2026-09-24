import hashlib
import json
import os
import time

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)


def _cache_key(endpoint, keywords, location_code, language_code):
    raw = f"{endpoint}|{sorted(keywords) if isinstance(keywords, list) else keywords}|{location_code}|{language_code}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get(endpoint, keywords, location_code=None, language_code=None, ttl=3600):
    key = _cache_key(endpoint, keywords, location_code, language_code)
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if os.path.exists(path):
        try:
            with open(path) as f:
                entry = json.load(f)
            if time.time() - entry.get("_ts", 0) < ttl:
                return entry.get("_data")
        except (json.JSONDecodeError, KeyError):
            pass
    return None


def set(endpoint, keywords, location_code, language_code, data):
    key = _cache_key(endpoint, keywords, location_code, language_code)
    path = os.path.join(CACHE_DIR, f"{key}.json")
    entry = {"_ts": time.time(), "_data": data}
    with open(path, "w") as f:
        json.dump(entry, f)


def clear():
    for fname in os.listdir(CACHE_DIR):
        if fname.endswith(".json"):
            os.remove(os.path.join(CACHE_DIR, fname))
