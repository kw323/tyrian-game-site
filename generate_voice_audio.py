import json
import os
import time
from gtts import gTTS

def main():
    if not os.path.exists("english_voice_lines_clean.json"):
        print("english_voice_lines_clean.json not found!")
        return

    with open("english_voice_lines_clean.json", "r", encoding="utf-8") as f:
        lines = json.load(f)

    print(f"Generating voice audio for {len(lines)} lines...")
    
    success_count = 0
    fail_count = 0

    for item in lines:
        line_id = item["lineId"]
        speaker = item["speaker"]
        text = item["text"]

        dir_path = os.path.join("client", "public", "voices", "en", speaker)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, f"{line_id}.mp3")

        # Skip if already exists and non-empty
        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            success_count += 1
            continue

        # Generate with gTTS
        try:
            # Choose accent / tld if desired, e.g. 'com.au' or 'co.uk' or 'com'
            tts = gTTS(text=text, lang='en', tld='com')
            tts.save(file_path)
            success_count += 1
            time.sleep(0.1) # be nice to API
        except Exception as e:
            print(f"Failed to generate {line_id}: {e}")
            fail_count += 1
            # fallback empty valid mp3 or silent file
            with open(file_path, "wb") as bf:
                bf.write(b"ID3")

        if success_count % 50 == 0:
            print(f"Progress: {success_count}/{len(lines)} generated...")

    print(f"Completed! Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    main()
