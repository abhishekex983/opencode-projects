import os
import sys
import argparse
import torch
import torchaudio as ta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'outputs_v2')
REFERENCE_WAV = os.path.join(SCRIPT_DIR, 'reference_audio', 'voice-recording.wav')


def generate_speech(text, output_path=None, reference_wav=None, model_type="turbo", device=None):
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    if reference_wav is None:
        reference_wav = REFERENCE_WAV

    if output_path is None:
        output_path = os.path.join(OUTPUT_DIR, 'chatterbox_generated.wav')

    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    if model_type == "turbo":
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        print(f"Loading Chatterbox-Turbo on {device}...")
        model = ChatterboxTurboTTS.from_pretrained(device=device)
    else:
        from chatterbox.tts import ChatterboxTTS
        print(f"Loading Chatterbox on {device}...")
        model = ChatterboxTTS.from_pretrained(device=device)

    print(f"Generating speech...")
    print(f"  Reference: {reference_wav}")
    wav = model.generate(text, audio_prompt_path=reference_wav)

    ta.save(output_path, wav, model.sr)
    print(f"Saved: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Generate speech with Chatterbox voice cloning')
    parser.add_argument('text', help='Text to generate')
    parser.add_argument('--output', '-o', help='Output WAV path')
    parser.add_argument('--reference', '-r', help='Reference speaker WAV')
    parser.add_argument('--model', '-m', default='turbo', choices=['turbo', 'full'],
                        help='Model type (turbo=faster, full=more quality)')
    parser.add_argument('--device', choices=['cuda', 'cpu'], help='Force device')

    args = parser.parse_args()

    print(f"Text: {args.text[:80]}{'...' if len(args.text) > 80 else ''}")

    generate_speech(
        text=args.text,
        output_path=args.output,
        reference_wav=args.reference,
        model_type=args.model,
        device=args.device,
    )


if __name__ == '__main__':
    main()
