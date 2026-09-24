"""
Abby Voice Final - Speech Generator
Generate speech using your custom cloned voice.

Usage:
    python generate_abby_speech.py "Your text here"
    python generate_abby_speech.py "Your text here" --engine chatterbox
    python generate_abby_speech.py "Your text here" --engine xtts
    python generate_abby_speech.py "Your text here" --speaker en-br
    python generate_abby_speech.py "Your text here" --speed 0.9
"""

import os
import sys
import argparse
import json
import torch

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Load voice config
VOICE_CONFIG_PATH = os.path.join(SCRIPT_DIR, "voices", "abby-voice-final.json")
with open(VOICE_CONFIG_PATH, "r") as f:
    VOICE_CONFIG = json.load(f)

# Resolve paths
VOICE_CONFIG["embedding_path"] = os.path.join(SCRIPT_DIR, VOICE_CONFIG["embedding_path"])
VOICE_CONFIG["reference_audio"] = os.path.join(SCRIPT_DIR, VOICE_CONFIG["reference_audio"])

OUTPUT_DIR = os.path.join(SCRIPT_DIR, "outputs_v2")
CKPT_CONVERTER = os.path.join(SCRIPT_DIR, "checkpoints_v2", "converter")
CKPT_SES = os.path.join(SCRIPT_DIR, "checkpoints_v2", "base_speakers", "ses")


def generate_openvoice(text, output_path, speaker="en-newest", speed=1.0, device=None):
    """Generate speech using OpenVoice V2 with Abby voice."""
    from openvoice.api import ToneColorConverter
    from melo.api import TTS
    
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    
    print(f"Loading OpenVoice V2 on {device}...")
    
    # Load converter
    tone_color_converter = ToneColorConverter(
        os.path.join(CKPT_CONVERTER, "config.json"), device=device
    )
    tone_color_converter.load_ckpt(os.path.join(CKPT_CONVERTER, "checkpoint.pth"))
    
    # Load Abby voice embedding
    target_se = torch.load(VOICE_CONFIG["embedding_path"], map_location=device)
    print(f"Loaded Abby voice embedding: {VOICE_CONFIG['name']}")
    
    # Load base speaker embedding
    speaker_key = speaker.lower().replace("-", "_")
    source_se_path = os.path.join(CKPT_SES, f"{speaker_key}.pth")
    if not os.path.exists(source_se_path):
        source_se_path = os.path.join(CKPT_SES, f"{speaker}.pth")
    source_se = torch.load(source_se_path, map_location=device)
    print(f"Using base speaker: {speaker}")
    
    # Generate base TTS with MeloTTS
    language = "EN"
    model = TTS(language=language, device=device)
    speaker_ids = model.hps.data.spk2id
    
    # Find speaker ID
    speaker_id = None
    for k, v in speaker_ids.items():
        if speaker_key.replace("-", "_") == k.lower() or speaker == k:
            speaker_id = v
            break
    if speaker_id is None:
        speaker_id = list(speaker_ids.values())[0]
    
    print("Generating base TTS...")
    tmp_path = os.path.join(OUTPUT_DIR, "_tmp_base.wav")
    model.tts_to_file(text, speaker_id, tmp_path, speed=speed)
    
    # Apply Abby voice tone color
    print("Converting to Abby voice...")
    tone_color_converter.convert(
        audio_src_path=tmp_path,
        src_se=source_se,
        tgt_se=target_se,
        output_path=output_path,
        message="@MyShell",
    )
    
    # Cleanup
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    
    return output_path


def generate_chatterbox(text, output_path, model_type="turbo", device=None):
    """Generate speech using Chatterbox with Abby voice reference."""
    import torchaudio as ta
    
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    print(f"Loading Chatterbox ({model_type}) on {device}...")
    
    if model_type == "turbo":
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        # Use local cached snapshot to avoid snapshot_download deadlock
        snapshot_path = os.path.join(
            os.path.expanduser("~"), ".cache", "huggingface", "hub",
            "models--ResembleAI--chatterbox-turbo", "snapshots",
            "749d1c1a46eb10492095d68fbcf55691ccf137cd"
        )
        if os.path.exists(snapshot_path):
            model = ChatterboxTurboTTS.from_local(snapshot_path, device=device)
        else:
            model = ChatterboxTurboTTS.from_pretrained(device=device)
    else:
        from chatterbox.tts import ChatterboxTTS
        model = ChatterboxTTS.from_pretrained(device=device)
    
    print(f"Generating speech with Abby voice reference...")
    wav = model.generate(text, audio_prompt_path=VOICE_CONFIG["reference_audio"])
    ta.save(output_path, wav, model.sr)
    
    return output_path


def generate_xtts(text, output_path, language="en", device=None):
    """Generate speech using XTTS v2 with Abby voice reference."""
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    
    print(f"Loading XTTS v2 on {device}...")
    os.environ["COQUI_TOS_AGREED"] = "1"
    from TTS.api import TTS
    model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    
    print("Generating speech with Abby voice reference...")
    model.tts_to_file(text, file_path=output_path, speaker_wav=VOICE_CONFIG["reference_audio"], language=language)
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description=f"{VOICE_CONFIG['name']} - Speech Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_abby_speech.py "Hello YouTube!"
  python generate_abby_speech.py "Hello YouTube!" --engine chatterbox
  python generate_abby_speech.py "Hello YouTube!" --engine xtts
  python generate_abby_speech.py "Hello YouTube!" --speaker en-br
  python generate_abby_speech.py "Hello YouTube!" --speed 0.9
        """
    )
    parser.add_argument("text", help="Text to generate speech for")
    parser.add_argument("--output", "-o", help="Output WAV path")
    parser.add_argument("--engine", "-e", default="openvoice",
                        choices=["openvoice", "chatterbox", "xtts"],
                        help="TTS engine (default: openvoice)")
    parser.add_argument("--speaker", "-s", default="en-newest",
                        choices=["en-newest", "en-us", "en-br", "en-au", "en-india", "en-default"],
                        help="Base speaker accent (OpenVoice only, default: en-newest)")
    parser.add_argument("--speed", type=float, default=1.0,
                        help="Speech speed (OpenVoice only, default: 1.0)")
    parser.add_argument("--model", "-m", default="turbo",
                        choices=["turbo", "full"],
                        help="Chatterbox model type (default: turbo)")
    parser.add_argument("--language", "-l", default="en",
                        help="Language for XTTS (default: en)")
    parser.add_argument("--device", choices=["cuda:0", "cpu"],
                        help="Force device (default: auto-detect)")
    
    args = parser.parse_args()
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate output path
    if args.output:
        output_path = args.output
    else:
        engine_suffix = args.engine
        if args.engine == "chatterbox":
            engine_suffix = f"chatterbox_{args.model}"
        elif args.engine == "openvoice":
            engine_suffix = f"openvoice_{args.speaker}"
        output_path = os.path.join(OUTPUT_DIR, f"abby_voice_{engine_suffix}.wav")
    
    print(f"=" * 60)
    print(f"  {VOICE_CONFIG['name']}")
    print(f"=" * 60)
    print(f"Engine: {args.engine}")
    print(f"Text: {args.text[:100]}{'...' if len(args.text) > 100 else ''}")
    print(f"Output: {output_path}")
    print()
    
    try:
        if args.engine == "openvoice":
            result = generate_openvoice(
                args.text, output_path, args.speaker, args.speed, args.device
            )
        elif args.engine == "chatterbox":
            result = generate_chatterbox(
                args.text, output_path, args.model, args.device
            )
        elif args.engine == "xtts":
            result = generate_xtts(
                args.text, output_path, args.language, args.device
            )
        
        print()
        print(f"SUCCESS: Saved to {result}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
