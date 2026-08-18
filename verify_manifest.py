import json
import os
import re

def main():
    print("=== 1. Checking english_voice_lines.json ===")
    with open("english_voice_lines.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"Total manifest entries: {len(manifest)}")
    line_ids = [item["lineId"] for item in manifest]
    unique_ids = set(line_ids)
    print(f"Unique lineIds: {len(unique_ids)}")
    if len(line_ids) == len(unique_ids):
        print("SUCCESS: No duplicate lineIds in manifest!")
    else:
        print("WARNING: Duplicate lineIds found!")

    for i in range(min(3, len(manifest))):
        item = manifest[i]
        print(f"Entry {i}: ID={item['lineId']}, EN={item['text'][:40]}..., HE={item.get('heText', 'N/A')[:40]}...")

    print("\n=== 2. Checking CampaignSystem.ts stage 1 ===")
    with open("client/src/game/story/CampaignSystem.ts", "r", encoding="utf-8") as f:
        campaign_content = f.read()

    m1 = re.search(r"1:\s*\{.*?\bdialogueSequence:\s*(\[.*?\])", campaign_content, re.DOTALL)
    if m1:
        print("Stage 1 dialogueSequence found in CampaignSystem.ts:")
        print(m1.group(1)[:300])

    print("\n=== 3. Checking actual audio files on disk ===")
    audio_dir = "client/public/voices/en"
    total_mp3 = 0
    if os.path.exists(audio_dir):
        for root, dirs, files in os.walk(audio_dir):
            for file in files:
                if file.endswith(".mp3"):
                    total_mp3 += 1

    print(f"Total .mp3 files found under {audio_dir}: {total_mp3}")

if __name__ == "__main__":
    main()
