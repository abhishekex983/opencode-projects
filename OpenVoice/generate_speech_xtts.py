"""
XTTS v2 Voice Cloning Speech Generator
Uses Coqui XTTS v2 via transformers for high-quality voice cloning.

Usage:
    python generate_speech_xtts.py "Your text here"
    python generate_speech_xtts.py "Your text here" --speed 0.9
"""

import os
import sys
import argparse
import torch
import torchaudio

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'outputs_v2')
REFERENCE_WAV = os.path.join(SCRIPT_DIR, 'reference_audio', 'voice-recording.wav')
MODEL_NAME = "coqui/XTTS-v2"


def generate_speech(text, output_path=None, reference_wav=None, language="en", device=None):
    """Generate speech using XTTS v2 with voice cloning."""
    from transformers import AutoModel, AutoTokenizer
    
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    
    if reference_wav is None:
        reference_wav = REFERENCE_WAV
    
    if output_path is None:
        output_path = os.path.join(OUTPUT_DIR, 'xtts_generated.wav')
    
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    print(f"Loading XTTS v2 model...")
    model = AutoModel.from_pretrained(MODEL_NAME, trust_remote_code=True).to(device)
    
    print(f"Generating speech...")
    output = model.generate(
        text=text,
        language=language,
        gpt_cond_latent=None,
        speaker_embedding=None,
        speaker_wav=reference_wav,
    )
    
    # Save audio
    if isinstance(output, dict):
        audio = output["wav"]
    else:
        audio = output
    
    if isinstance(audio, torch.Tensor):
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        torchaudio.save(output_path, audio.cpu(), 24000)
    else:
        import numpy as np
        import soundfile as sf
        sf.write(output_path, audio, 24000)
    
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Generate speech with XTTS v2 voice cloning')
    parser.add_argument('text', help='Text to generate speech for')
    parser.add_argument('--output', '-o', help='Output WAV path')
    parser.add_argument('--reference', '-r', help='Reference speaker WAV')
    parser.add_argument('--language', '-l', default='en', help='Language (default: en)')
    parser.add_argument('--device', choices=['cuda:0', 'cpu'], help='Force device')

    args = parser.parse_args()

    output = args.output or os.path.join(OUTPUT_DIR, 'xtts_generated.wav')

    print(f"Text: {args.text[:80]}{'...' if len(args.text) > 80 else ''}")
    print(f"Reference: {args.reference or REFERENCE_WAV}")
    
    result = generate_speech(
        text=args.text,
        output_path=output,
        reference_wav=args.reference,
        language=args.language,
        device=args.device,
    )
    print(f"\nSaved: {result}")


if __name__ == '__main__':
    main()
