import re
import json

def patch():
    # load clean english lines (which also has the clean hebrew text)
    with open("english_voice_lines_clean.json", "r", encoding="utf-8") as f:
        lines = json.load(f)

    # group by stage and phase
    stages = {}
    for l in lines:
        st = l["stage"]
        phase = "contact" if "contact" in l["lineId"] else "after"
        if st not in stages:
            stages[st] = {"contact": [], "after": []}
        stages[st][phase].append(l)

    with open("client/src/game/story/CampaignSystem.ts", "r", encoding="utf-8") as f:
        content = f.read()

    # We will find the HEBREW_BRIEFINGS dictionary and rewrite it completely
    # But wait, HEBREW_BRIEFINGS has other fields like title, location, objective, etc.
    # We should parse the existing one, update the dialogue fields, and write it back.

    # Instead of full parsing in python, let's use regex to replace dialogueSequence and afterAction
    
    def replacer(match):
        st_str = match.group(1)
        st = int(st_str)
        inner = match.group(2)

        if st not in stages:
            return match.group(0)

        # We want to replace `dialogueSequence: [...]` and `afterAction: {...}` 
        # Actually in the file it is:
        # dialogueSequence: [
        #    { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '...' },
        #    ...
        # ],
        # afterAction: {
        #    speaker: '...', name: '...', message: '...', reward: 1100
        # }
        # Let's just use regex to replace `dialogueSequence: \[.*?\]` with new one
        
        name_map = {
            "elena": "המפקדת אלנה וייל",
            "naomi": "ד״ר נעמי רן",
            "protagonist": "טייס פרויקט Zero",
            "ghost": "גוסט",
            "sera": "סרה",
            "archon": "השליט העליון"
        }

        contact_lines = stages[st]["contact"]
        after_lines = stages[st]["after"]

        new_contact = "dialogueSequence: [\n"
        for i, c in enumerate(contact_lines):
            speaker = c["speaker"]
            name = name_map.get(speaker, speaker)
            msg = c["heText"].replace("'", "\\'")
            new_contact += f"                {{ speaker: '{speaker}', name: '{name}', message: '{msg}' }}"
            if i < len(contact_lines) - 1:
                new_contact += ",\n"
            else:
                new_contact += "\n"
        new_contact += "        ]"

        if after_lines:
            first_after = after_lines[0]
            speaker = first_after["speaker"]
            name = name_map.get(speaker, speaker)
            msg = first_after["heText"].replace("'", "\\'")
            new_after = f"afterAction: {{\n            speaker: '{speaker}',\n            name: '{name}',\n            message: '{msg}',\n            reward: {1000 + st * 100}\n        }}"
        else:
            new_after = "afterAction: {\n            speaker: 'elena',\n            name: 'המפקדת אלנה וייל',\n            message: 'משימה הושלמה.',\n            reward: 1000\n        }"

        # regex sub
        inner_replaced = re.sub(r"dialogueSequence:\s*\[.*?\]", new_contact, inner, flags=re.DOTALL)
        inner_replaced = re.sub(r"afterAction:\s*\{.*?\}", new_after, inner_replaced, flags=re.DOTALL)

        return f"{st_str}: {{{inner_replaced}}}"

    # match ` 1: { ... },` or ` 100: { ... }`
    # this is tricky with regex. Let's do it by finding `    X: {` and finding the matching brace.
    
    new_content = ""
    idx = 0
    while idx < len(content):
        # find `    X: {\n`
        match = re.search(r"^\s+(\d+):\s+\{\n", content[idx:], flags=re.MULTILINE)
        if not match:
            new_content += content[idx:]
            break
        
        start_pos = idx + match.end() - 2 # point to {
        st_num = int(match.group(1))
        
        # find matching brace
        open_braces = 0
        end_pos = start_pos
        for i in range(start_pos, len(content)):
            if content[i] == '{':
                open_braces += 1
            elif content[i] == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_pos = i
                    break
        
        inner = content[start_pos+1:end_pos]
        
        # replace
        if st_num in stages:
            name_map = {
                "elena": "המפקדת אלנה וייל",
                "naomi": "ד״ר נעמי רן",
                "protagonist": "טייס פרויקט Zero",
                "ghost": "גוסט",
                "sera": "סרה",
                "archon": "השליט העליון"
            }

            contact_lines = stages[st_num]["contact"]
            after_lines = stages[st_num]["after"]

            new_contact = "dialogueSequence: [\n"
            for i, c in enumerate(contact_lines):
                speaker = c["speaker"]
                name = name_map.get(speaker, speaker)
                msg = c["heText"].replace("'", "\\'")
                new_contact += f"                {{ speaker: '{speaker}', name: '{name}', message: '{msg}' }}"
                if i < len(contact_lines) - 1:
                    new_contact += ",\n"
                else:
                    new_contact += "\n"
            new_contact += "        ]"

            if after_lines:
                first_after = after_lines[0]
                speaker = first_after["speaker"]
                name = name_map.get(speaker, speaker)
                msg = first_after["heText"].replace("'", "\\'")
                new_after = f"afterAction: {{\n            speaker: '{speaker}',\n            name: '{name}',\n            message: '{msg}',\n            reward: {1000 + st_num * 100}\n        }}"
            else:
                new_after = f"afterAction: {{\n            speaker: 'elena',\n            name: 'המפקדת אלנה וייל',\n            message: 'משימה הושלמה.',\n            reward: {1000 + st_num * 100}\n        }}"

            inner_replaced = re.sub(r"dialogueSequence:\s*\[.*?\]", new_contact, inner, flags=re.DOTALL)
            inner_replaced = re.sub(r"afterAction:\s*\{.*?\}", new_after, inner_replaced, flags=re.DOTALL)
            
            # also replace contact and inMissionComms for fallback
            if contact_lines:
                first_c = contact_lines[0]
                sp = first_c["speaker"]
                nm = name_map.get(sp, sp)
                m = first_c["heText"].replace("'", "\\'")
                new_contact_fallback = f"contact: {{\n            speaker: '{sp}',\n            name: '{nm}',\n            message: '{m}'\n        }}"
                inner_replaced = re.sub(r"contact:\s*\{.*?\}", new_contact_fallback, inner_replaced, flags=re.DOTALL)
            
            if len(contact_lines) > 1:
                second_c = contact_lines[1]
                sp = second_c["speaker"]
                nm = name_map.get(sp, sp)
                m = second_c["heText"].replace("'", "\\'")
                new_inmission = f"inMissionComms: {{\n            speaker: '{sp}',\n            name: '{nm}',\n            message: '{m}'\n        }}"
                inner_replaced = re.sub(r"inMissionComms:\s*\{.*?\}", new_inmission, inner_replaced, flags=re.DOTALL)

            new_content += content[idx:idx + match.start()]
            new_content += f"    {st_num}: {{{inner_replaced}}}"
        else:
            new_content += content[idx:end_pos+1]
            
        idx = end_pos + 1

    with open("client/src/game/story/CampaignSystem.ts", "w", encoding="utf-8") as f:
        f.write(new_content)

    print("CampaignSystem.ts patched successfully.")

if __name__ == "__main__":
    patch()
