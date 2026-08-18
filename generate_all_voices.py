import os
import json
import time

try:
    from gtts import gTTS
except ImportError:
    os.system('pip3 install gTTS')
    from gTTS import gTTS

def generate_all():
    json_path = '/home/ubuntu/tyrian-game-site/english_voice_lines.json'
    if not os.path.exists(json_path):
        print("Error: english_voice_lines.json not found!")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        lines = json.load(f)

    base_dir = '/home/ubuntu/tyrian-game-site/client/public/voices/en'
    total = len(lines)
    print(f"Starting generation of {total} voice lines...")

    success_count = 0
    fail_count = 0

    for idx, item in enumerate(lines, 1):
        line_id = item.get('lineId')
        speaker = item.get('speaker', 'elena')
        text = item.get('text', '')

        if not line_id or not text:
            continue

        speaker_dir = os.path.join(base_dir, speaker)
        os.makedirs(speaker_dir, exist_ok=True)
        file_path = os.path.join(speaker_dir, f"{line_id}.mp3")

        # Skip if already exists and has size > 0
        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            success_count += 1
            continue

        try:
            # Clean text from mixed language or placeholders if any
            clean_text = text.replace('ז הcraft', 'this experimental craft').replace('weapons', 'weapons').replace('Pilot,', 'Pilot,')
            tts = gTTS(text=clean_text, lang='en', slow=False)
            tts.save(file_path)
            success_count += 1
            if idx % 20 == 0:
                print(f"Progress: {idx}/{total} generated successfully...")
            time.sleep(0.1) # gentle pacing
        except Exception as e:
            print(f"Failed to generate {line_id}: {e}")
            fail_count += 1

    print(f"Generation complete! Success: {success_count}, Failed: {fail_count}")

if __name__ == '__main__':
    generate_all()
