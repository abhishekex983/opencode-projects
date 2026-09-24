"""
MiniMax TTS — Abby Voice Clone
Generates speech via MiniMax Speech 2.8 using a cloned Abby voice.

Usage:
  python minimax_tts.py --clone                    # One-time voice cloning
  python minimax_tts.py "Your text" -o output.wav   # Generate TTS
  python minimax_tts.py "Your text" -o output.wav --model speech-2.8-turbo

Prerequisites:
  - API key in F:\\Opencode Projects\\Videos\\minimax api.txt
  - Reference audio at F:\\Opencode Projects\\OpenVoice\\reference_audio\\abby-voice-final.wav
  - `requests` installed
"""

import os
import sys
import json
import argparse
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
API_KEY_FILE = r"F:\Opencode Projects\Videos\minimax api.txt"
VOICE_CONFIG_PATH = os.path.join(SCRIPT_DIR, "voices", "minimax-abby.json")
REFERENCE_AUDIO = os.path.join(SCRIPT_DIR, "reference_audio", "abby-voice-final.wav")

API_BASE = "https://api.minimax.io/v1"
UPLOAD_URL = f"{API_BASE}/files/upload"
CLONE_URL = f"{API_BASE}/voice_clone"
TTS_URL = f"{API_BASE}/t2a_v2"
VOICE_ID = "abby-voice-final"


def load_api_key():
    with open(API_KEY_FILE, "r") as f:
        return f.read().strip()


def auth_headers(api_key, json_content=False):
    h = {"Authorization": f"Bearer {api_key}"}
    if json_content:
        h["Content-Type"] = "application/json"
    return h


def upload_file(api_key, path, purpose="voice_clone"):
    with open(path, "rb") as f:
        files = {"file": (os.path.basename(path), f)}
        data = {"purpose": purpose}
        resp = requests.post(UPLOAD_URL, headers=auth_headers(api_key), data=data, files=files, timeout=120)
    resp.raise_for_status()
    body = resp.json()
    if body.get("base_resp", {}).get("status_code", 0) != 0:
        raise RuntimeError(f"Upload failed: {body}")
    return body["file"]["file_id"]


def clone_voice(api_key, file_id, voice_id, model="speech-2.8-hd"):
    payload = {
        "file_id": file_id,
        "voice_id": voice_id,
        "text": "This is a test of the cloned voice. The quick brown fox jumps over the lazy dog.",
        "model": model,
    }
    resp = requests.post(CLONE_URL, headers=auth_headers(api_key, json_content=True), json=payload, timeout=120)
    resp.raise_for_status()
    body = resp.json()
    if body.get("base_resp", {}).get("status_code", 0) != 0:
        raise RuntimeError(f"Clone failed: {body}")
    return body


def generate_tts(api_key, text, output_path, voice_id=VOICE_ID, model="speech-2.8-hd",
                 sample_rate=22050, speed=1.0, language_boost="English"):
    payload = {
        "model": model,
        "text": text,
        "stream": False,
        "language_boost": language_boost,
        "output_format": "url",
        "voice_setting": {
            "voice_id": voice_id,
            "speed": speed,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": sample_rate,
            "bitrate": 128000,
            "format": "wav",
            "channel": 1,
        },
    }
    resp = requests.post(TTS_URL, headers=auth_headers(api_key, json_content=True), json=payload, timeout=300)
    resp.raise_for_status()
    body = resp.json()
    if body.get("base_resp", {}).get("status_code", 0) != 0:
        raise RuntimeError(f"TTS failed: {body}")
    audio_url = body["data"].get("audio")
    if not audio_url or not audio_url.startswith("http"):
        raise RuntimeError(f"No audio URL in response: {body}")
    audio_resp = requests.get(audio_url, timeout=120)
    audio_resp.raise_for_status()
    with open(output_path, "wb") as f:
        f.write(audio_resp.content)
    extra = body.get("extra_info", {})
    duration_ms = extra.get("audio_length", 0)
    chars = extra.get("usage_characters", 0)
    print(f"SUCCESS: {output_path}")
    print(f"  Duration: {duration_ms/1000:.2f}s | Characters billed: {chars}")
    return output_path


def do_clone(api_key):
    print("=== MiniMax Voice Cloning ===")
    print(f"Reference audio: {REFERENCE_AUDIO}")
    print(f"Voice ID: {VOICE_ID}")
    print()
    print("Uploading reference audio...")
    file_id = upload_file(api_key, REFERENCE_AUDIO, purpose="voice_clone")
    print(f"  file_id: {file_id}")
    print("Cloning voice...")
    result = clone_voice(api_key, file_id, VOICE_ID)
    print(f"  Clone result: {json.dumps(result, indent=2)[:500]}")
    config = {
        "name": "Abby Voice (MiniMax)",
        "voice_id": VOICE_ID,
        "source_audio": "reference_audio/abby-voice-final.wav",
        "file_id": file_id,
        "model": "speech-2.8-hd",
        "sample_rate": 22050,
        "created": "2026-08-16",
        "description": "Abby voice cloned via MiniMax Speech 2.8",
    }
    os.makedirs(os.path.dirname(VOICE_CONFIG_PATH), exist_ok=True)
    with open(VOICE_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Config saved: {VOICE_CONFIG_PATH}")
    return config


def main():
    parser = argparse.ArgumentParser(description="MiniMax TTS — Abby Voice")
    parser.add_argument("text", nargs="?", help="Text to synthesize (omit with --clone)")
    parser.add_argument("--output", "-o", help="Output WAV path")
    parser.add_argument("--clone", action="store_true", help="One-time voice cloning")
    parser.add_argument("--model", "-m", default="speech-2.8-hd",
                        choices=["speech-2.8-hd", "speech-2.8-turbo"],
                        help="TTS model (default: speech-2.8-hd)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed 0.5-2.0 (default 1.0)")
    args = parser.parse_args()

    api_key = load_api_key()

    if args.clone:
        do_clone(api_key)
        return

    if not args.text:
        parser.error("text required (or use --clone)")
    if not args.output:
        parser.error("--output required")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)) or ".", exist_ok=True)
    generate_tts(api_key, args.text, args.output, model=args.model, speed=args.speed)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
