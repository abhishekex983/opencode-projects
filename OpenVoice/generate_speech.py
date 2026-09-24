"""
Voice Cloning Speech Generator using OpenVoice V2
Uses your cloned voice embedding to generate new speech from text.

Usage:
    python generate_speech.py "Your text here"
    python generate_speech.py "Your text here" --speed 0.9
    python generate_speech.py "Your text here" --embedding outputs_v2/xyon-review_v2_b_^wOXF4zoO4r+fY1_se.pth
    python generate_speech.py "Your text here" --speaker en-newest
"""

import os
import sys
import argparse
import torch
from openvoice.api import ToneColorConverter
from melo.api import TTS

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Default paths
CKPT_CONVERTER = os.path.join(SCRIPT_DIR, 'checkpoints_v2', 'converter')
CKPT_SES = os.path.join(SCRIPT_DIR, 'checkpoints_v2', 'base_speakers', 'ses')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'outputs_v2')

# Default embedding - clean voice recording (3+ min, high quality)
DEFAULT_EMBEDDING = os.path.join(OUTPUT_DIR, 'voice-recording_v2_rvmlGeu5YtjBs9ho_se.pth')


def find_embedding(name_fragment):
    """Find an embedding file by partial name match."""
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith('_se.pth') and name_fragment.lower() in f.lower():
            return os.path.join(OUTPUT_DIR, f)
    return None


def generate_speech(text, output_path=None, embedding_path=None, speaker='en-newest',
                    speed=1.0, device=None):
    """
    Generate speech with your cloned voice.
    
    Args:
        text: Text to speak
        output_path: Where to save the WAV file
        embedding_path: Path to your voice embedding .pth file
        speaker: Base speaker model (en-newest, en-us, en-br, en-au, en-india, en-default)
        speed: Speech speed (0.8-1.2)
        device: 'cuda:0' or 'cpu'
    
    Returns:
        Path to the generated WAV file
    """
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    
    if embedding_path is None:
        embedding_path = DEFAULT_EMBEDDING
    
    if not os.path.exists(embedding_path):
        raise FileNotFoundError(f"Embedding not found: {embedding_path}")
    
    if output_path is None:
        output_path = os.path.join(OUTPUT_DIR, 'generated_speech.wav')
    
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    # Load tone color converter
    tone_color_converter = ToneColorConverter(
        os.path.join(CKPT_CONVERTER, 'config.json'), device=device
    )
    tone_color_converter.load_ckpt(os.path.join(CKPT_CONVERTER, 'checkpoint.pth'))

    # Load your voice embedding
    target_se = torch.load(embedding_path, map_location=device)

    # Load base speaker embedding
    speaker_key = speaker.lower().replace('-', '_')
    source_se_path = os.path.join(CKPT_SES, f'{speaker_key}.pth')
    if not os.path.exists(source_se_path):
        # Try alternative naming
        source_se_path = os.path.join(CKPT_SES, f'{speaker}.pth')
    source_se = torch.load(source_se_path, map_location=device)

    # Generate base TTS with MeloTTS
    language = 'EN'  # Default to English
    model = TTS(language=language, device=device)
    speaker_ids = model.hps.data.spk2id
    
    # Find the right speaker ID
    speaker_id = None
    for k, v in speaker_ids.items():
        if speaker_key.replace('-', '_') == k.lower() or speaker == k:
            speaker_id = v
            break
    if speaker_id is None:
        # Use first available
        speaker_id = list(speaker_ids.values())[0]
    
    tmp_path = os.path.join(OUTPUT_DIR, '_tmp_base.wav')
    model.tts_to_file(text, speaker_id, tmp_path, speed=speed)

    # Apply your voice tone color
    encode_message = "@MyShell"
    tone_color_converter.convert(
        audio_src_path=tmp_path,
        src_se=source_se,
        tgt_se=target_se,
        output_path=output_path,
        message=encode_message,
    )

    # Cleanup temp
    if os.path.exists(tmp_path):
        os.remove(tmp_path)

    return output_path


def main():
    parser = argparse.ArgumentParser(description='Generate speech with your cloned voice')
    parser.add_argument('text', help='Text to generate speech for')
    parser.add_argument('--output', '-o', help='Output WAV path')
    parser.add_argument('--embedding', '-e', help='Voice embedding .pth file')
    parser.add_argument('--speaker', '-s', default='en-newest',
                        choices=['en-newest', 'en-us', 'en-br', 'en-au', 'en-india', 'en-default'],
                        help='Base speaker (default: en-newest)')
    parser.add_argument('--speed', type=float, default=1.0, help='Speech speed (default: 1.0)')
    parser.add_argument('--device', choices=['cuda:0', 'cpu'], help='Force device')
    parser.add_argument('--list-embeddings', action='store_true', help='List available voice embeddings')

    args = parser.parse_args()

    if args.list_embeddings:
        print("Available voice embeddings:")
        for f in sorted(os.listdir(OUTPUT_DIR)):
            if f.endswith('_se.pth'):
                print(f"  {f}")
        return

    # Resolve embedding
    embedding = args.embedding
    if embedding and not os.path.exists(embedding):
        # Try as fragment
        found = find_embedding(embedding)
        if found:
            embedding = found
        else:
            print(f"Embedding not found: {embedding}")
            sys.exit(1)

    output = args.output or os.path.join(OUTPUT_DIR, 'generated_speech.wav')

    print(f"Generating speech...")
    print(f"  Text: {args.text[:80]}{'...' if len(args.text) > 80 else ''}")
    print(f"  Speaker: {args.speaker}")
    print(f"  Speed: {args.speed}")
    print(f"  Embedding: {embedding or 'default (xyon-review)'}")
    
    result = generate_speech(
        text=args.text,
        output_path=output,
        embedding_path=embedding,
        speaker=args.speaker,
        speed=args.speed,
        device=args.device,
    )
    print(f"\nSaved: {result}")


if __name__ == '__main__':
    main()
