import re
import json

def extract_lines():
    campaign_path = '/home/ubuntu/tyrian-game-site/client/src/game/story/CampaignSystem.ts'
    with open(campaign_path, 'r', encoding='utf-8') as f:
        content = f.read()

    extracted = []
    
    # Match stage blocks inside englishBriefings or HEBREW_BRIEFINGS / englishBriefings
    # Let's search for patterns like stageNumber: { ... }
    # Or more robustly, find all occurrences of speaker and message in english dictionary
    
    # Split by stage entries (e.g., "1: {", "2: {")
    stages = re.split(r'\n\s*(\d+)\s*:\s*\{', content)
    
    for i in range(1, len(stages), 2):
        stage_num = stages[i]
        block = stages[i+1]
        
        # Check if we are inside englishBriefings section (after englishBriefings definition)
        # We can extract all speaker/message pairs in this block
        speakers = re.findall(r'speaker\s*:\s*[\'"]([^\'"]+)[\'"]', block)
        messages = re.findall(r'message\s*:\s*[\'"]([^\'"]+)[\'"]', block)
        
        # Usually contact is first, afterAction is second
        if len(speakers) >= 1 and len(messages) >= 1:
            extracted.append({
                "lineId": f"stage-{stage_num}-contact",
                "speaker": speakers[0],
                "text": messages[0]
            })
        if len(speakers) >= 2 and len(messages) >= 2:
            extracted.append({
                "lineId": f"stage-{stage_num}-after",
                "speaker": speakers[1],
                "text": messages[1]
            })

    out_path = '/home/ubuntu/tyrian-game-site/english_voice_lines.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)

    print(f"Successfully extracted {len(extracted)} voice lines to {out_path}")

if __name__ == '__main__':
    extract_lines()
