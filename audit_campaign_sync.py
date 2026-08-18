import re

def audit_campaign():
    campaign_path = '/home/ubuntu/tyrian-game-site/client/src/game/story/CampaignSystem.ts'
    with open(campaign_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Let's check for mixed language or placeholder markers
    mixed_lang_count = 0
    issues = []

    # Search for lines containing both English words and Hebrew letters or mixed placeholders like "Pilot, זו הcraft"
    for line_num, line in enumerate(content.splitlines(), 1):
        if re.search(r'[א-ת]', line) and re.search(r'[a-zA-Z]', line):
            # Might be inside englishBriefings or HEBREW_BRIEFINGS
            if 'englishBriefings' in content[max(0, line_num-500):line_num] or 'message:' in line:
                mixed_lang_count += 1
                if mixed_lang_count <= 15:
                    issues.append(f"Line {line_num}: {line.strip()}")

    print(f"Total mixed-language lines detected in English/Hebrew dictionaries: {mixed_lang_count}")
    for issue in issues:
        print(issue)

if __name__ == '__main__':
    audit_campaign()
