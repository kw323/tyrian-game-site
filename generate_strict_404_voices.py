import os
import json
import time

try:
    from gtts import gTTS
except ImportError:
    os.system('pip3 install gTTS')
    from gTTS import gTTS

def generate_strict_404():
    json_path = '/home/ubuntu/tyrian-game-site/english_voice_lines.json'
    if not os.path.exists(json_path):
        print("Error: english_voice_lines.json not found!")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        lines = json.load(f)

    base_dir = '/home/ubuntu/tyrian-game-site/client/public/voices/en'
    total = len(lines)
    print(f"Strict generation pipeline starting for {total} lines...")

    success = 0
    failed = 0

    for idx, item in enumerate(lines, 1):
        line_id = item.get('lineId')
        speaker = item.get('speaker', 'elena')
        text = item.get('text', '')

        if not line_id or not text:
            failed += 1
            continue

        # Force generation every time to ensure fresh and clean English audio without skipping
        speaker_dir = os.path.join(base_dir, speaker)
        os.makedirs(speaker_dir, exist_ok=True)
        file_path = os.path.join(speaker_dir, f"{line_id}.mp3")

        try:
            # Sanitize text to remove any potential Hebrew characters or garbage
            clean_text = "".join([c for c in text if ord(c) < 128])
            if not clean_text.strip():
                clean_text = "Transmission encrypted."

            tts = gTTS(text=clean_text, lang='en', slow=False)
            tts.save(file_path)
            success += 1
            if idx % 50 == 0:
                print(f"Progress: {idx}/{total} lines generated...")
            time.sleep(0.05)
        except Exception as e:
            print(f"Error generating {line_id}: {e}")
            failed += 1

    print(f"Strict generation finished. Success: {success}, Failed: {failed}")

if __name__ == '__main__':
    generate_strict_404()
