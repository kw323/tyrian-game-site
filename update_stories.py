import re

with open('/home/ubuntu/tyrian-game-site/client/src/game/story/StageOrdersDatabase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's update StageOrderEntry interface and STAGE_ORDERS_DATABASE
new_interface = """export type MissionType = 'patrol' | 'defense' | 'escort' | 'bounty' | 'recovery' | 'singularity';

export interface ContactBrief {
    speaker: CharacterId;
    name: string;
    message: string;
}

export interface StageOrderEntry {
    stage: number;
    speaker: CharacterId;
    name: string;
    code: string;
    message: string;
    inMissionComms?: {
        speaker: CharacterId;
        name: string;
        message: string;
    };
    missionType: MissionType;
    missionTargetName: string;
    bountyReward: number;
}
"""

# Replace interface part
content = re.sub(
    r'export type MissionType =.*?\n\s*bountyReward: number;\n\s*\}',
    new_interface.strip(),
    content,
    flags=re.DOTALL
)

with open('/home/ubuntu/tyrian-game-site/client/src/game/story/StageOrdersDatabase.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("StageOrdersDatabase interface updated successfully.")
