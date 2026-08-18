import re

def fix_english():
    campaign_path = '/home/ubuntu/tyrian-game-site/client/src/game/story/CampaignSystem.ts'
    with open(campaign_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Let's verify where englishBriefings starts
    pos = content.find('englishBriefings')
    if pos == -1:
        print("englishBriefings not found")
        return

    # For safety, let's translate or replace common Hebrew phrases inside englishBriefings block with proper English
    # Or even better, ensure englishBriefings is 100% English.
    # Let's inspect a few examples from audit.
    print(f"Found englishBriefings at index {pos}")

if __name__ == '__main__':
    fix_english()
