import re

with open('/home/ubuntu/upload/382564e0-98ea-11f1-a7d0-099665bfddca.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Split by stage headers like **1**, **2**, etc.
stages = re.split(r'\*\*(\d+)\*\*', content)
stage_data = {}

for i in range(1, len(stages), 2):
    stage_num = int(stages[i].strip())
    stage_text = stages[i+1].strip()
    
    # Parse lines of dialogue
    # Format: Speaker: "Message"
    lines = []
    for line in stage_text.split('\n'):
        line = line.strip()
        if not line:
            continue
        match = re.match(r'^([^:]+):\s*"(.*)"\s*$', line)
        if match:
            speaker_name = match.group(1).strip()
            msg = match.group(2).strip()
            lines.append((speaker_name, msg))
        else:
            # fallback if quotes are missing or different
            parts = line.split(':', 1)
            if len(parts) == 2:
                speaker_name = parts[0].strip()
                msg = parts[1].strip().strip('"\'')
                lines.append((speaker_name, msg))
                
    stage_data[stage_num] = lines

print(f"Successfully parsed {len(stage_data)} stages from script.")
for s in [1, 2, 11, 30, 50, 80, 100]:
    if s in stage_data:
        print(f"Stage {s}: {len(stage_data[s])} lines")
        for sp, m in stage_data[s]:
            print(f"  {sp}: {m[:30]}...")
