import os
import sys
import torch
import torchaudio as ta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
reference_wav = os.path.join(SCRIPT_DIR, 'reference_audio', 'abby-voice-final-60s.wav')
output_path = os.path.join(SCRIPT_DIR, 'outputs_v2', 'abby_voice_chatterbox_turbo.wav')

text = 'I figure that hair thinning in men is often related to age or genetics.'

# Use cached snapshot directly to avoid snapshot_download deadlock
SNAPSHOT_PATH = r"C:\Users\Abhishek Bolar\.cache\huggingface\hub\models--ResembleAI--chatterbox-turbo\snapshots\749d1c1a46eb10492095d68fbcf55691ccf137cd"

print('Step 1: Importing...')
sys.stdout.flush()
from chatterbox.tts_turbo import ChatterboxTurboTTS

print('Step 2: Loading from local cache...')
sys.stdout.flush()
model = ChatterboxTurboTTS.from_local(SNAPSHOT_PATH, device='cuda')

print('Step 3: Model loaded! Generating...')
sys.stdout.flush()
wav = model.generate(text, audio_prompt_path=reference_wav)

print(f'Step 4: Generated! Shape: {wav.shape}')
sys.stdout.flush()
ta.save(output_path, wav, model.sr)
print(f'Step 5: Saved to {output_path}')
