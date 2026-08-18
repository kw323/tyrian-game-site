import re
import json
from parse_dialogues import parse_file

def main():
    stages_dict = parse_file()
    
    name_map = {
        "elena": "המפקדת אלנה וייל",
        "naomi": "ד״ר נעמי רן",
        "protagonist": "טייס פרויקט Zero",
        "ghost": "גוסט",
        "sera": "סרה",
        "archon": "השליט העליון"
    }

    # Read existing CampaignSystem.ts
    with open("client/src/game/story/CampaignSystem.ts", "r", encoding="utf-8") as f:
        content = f.read()

    # We want to replace stages 1 to 100 or regenerate the campaign stage entries.
    # Let's inspect how stages are defined in CampaignSystem.ts. 
    # Usually it is export const CAMPAIGN_STAGES: Record<number, StageConfig> = { ... };
    
    print(f"Loaded {len(stages_dict)} stages from parsed file.")

if __name__ == "__main__":
    main()
