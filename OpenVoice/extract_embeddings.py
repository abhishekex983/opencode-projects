import os
import torch
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

ckpt_converter = 'checkpoints_v2/converter'
device = "cuda:0" if torch.cuda.is_available() else "cpu"
output_dir = 'outputs_v2'
os.makedirs(output_dir, exist_ok=True)

tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

reference_files = [
    'reference_audio/abby-voice-final.wav',
]

for ref in reference_files:
    print(f"\n--- Processing: {ref} ---")
    try:
        target_se, audio_name = se_extractor.get_se(ref, tone_color_converter, target_dir='processed', vad=True)
        save_path = f'{output_dir}/{audio_name}_se.pth'
        torch.save(target_se, save_path)
        print(f"Saved embedding to: {save_path}")
    except Exception as e:
        print(f"ERROR: {e}")
