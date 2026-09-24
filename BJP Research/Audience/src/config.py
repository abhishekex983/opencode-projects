import os
import base64
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


def _read_credential_file(filename):
    path = os.path.join(os.path.dirname(__file__), "..", filename)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return f.read().strip()


def _parse_dfseo_credentials(content):
    email = password = None
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if "api login" in lower or "login" in lower:
            email = line.split(":", 1)[-1].strip()
        elif "api password" in lower or "password" in lower:
            password = line.split(":", 1)[-1].strip()
    return email, password


def get_config():
    dfseo_file = _read_credential_file("DataforSEO credentials.txt")
    dfseo_email, dfseo_password = _parse_dfseo_credentials(dfseo_file or "")

    config = {
        "dfseo_email": os.getenv("DFSEO_EMAIL") or dfseo_email,
        "dfseo_password": os.getenv("DFSEO_PASSWORD") or dfseo_password,
        "gemini_api_key": os.getenv("GEMINI_API_KEY")
        or _read_credential_file("Gemini API (Generative API).txt"),
        "openrouter_api_key": os.getenv("OPENROUTER_API_KEY")
        or _read_credential_file("Openrouter API.txt"),
    }

    config["dfseo_auth"] = base64.b64encode(
        f"{config['dfseo_email']}:{config['dfseo_password']}".encode()
    ).decode()

    if not config["dfseo_email"] or not config["dfseo_password"]:
        raise RuntimeError(
            "DataForSEO credentials not found. Set DFSEO_EMAIL and "
            "DFSEO_PASSWORD in .env or ensure DataforSEO credentials.txt exists."
        )

    return config
