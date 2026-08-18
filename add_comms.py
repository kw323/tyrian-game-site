import re

with open('client/src/game/story/StageOrdersDatabase.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's write a robust script that processes each stage object in STAGE_ORDERS_DATABASE
# Or we can insert inMissionComms for stages with bounty or defense/escort.

# Let's inspect how stage objects look like:
# {
#     stage: 7, speaker: 'elena', name: 'Commander Elena Vail', code: 'SECTOR-03 // DISTRESS',
#     message: 'We received a false distress call from Sector 3. It was a bait trap—eliminate the ambush wing.',
#     missionType: 'bounty', missionTargetName: 'Ambush Decoy Vessel', bountyReward: 3000
# },

pattern = re.compile(r'\{\s*stage:\s*(\d+),\s*speaker:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',\s*code:\s*\'([^\']+)\',\s*message:\s*\'([^\']+)\',\s*missionType:\s*\'([^\']+)\',\s*missionTargetName:\s*\'([^\']+)\',\s*bountyReward:\s*(\d+)\s*\}', re.DOTALL)

def replacer(match):
    stg = int(match.group(1))
    spk = match.group(2)
    name = match.group(3)
    code = match.group(4)
    msg = match.group(5)
    mtype = match.group(6)
    target = match.group(7)
    reward = match.group(8)

    extra_comms = ""
    if mtype == 'bounty':
        extra_comms = f",\n    inMissionComms: {{ speaker: 'ghost', name: 'GHOST', message: 'Target sighted! Be advised: elite bodyguards are shielding the bounty core. Break their cover first.' }}"
    elif mtype == 'escort':
        extra_comms = f",\n    inMissionComms: {{ speaker: 'elena', name: 'Commander Elena Vail', message: 'Convoy under heavy fire! Hostile flankers are closing on transport units. Hold the line!' }}"
    elif stg % 7 == 0:
        extra_comms = f",\n    inMissionComms: {{ speaker: 'ghost', name: 'GHOST', message: 'Warning! Routine patrol data was spoofed—unregistered strike craft are swarming out of the nebula!' }}"

    return f"{match.group(0)[:-1]}{extra_comms}\n}}"

new_text = pattern.sub(replacer, text)

with open('client/src/game/story/StageOrdersDatabase.ts', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("StageOrdersDatabase enhanced with inMissionComms successfully.")
