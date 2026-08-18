import re
import json

def parse_file():
    with open("/home/ubuntu/upload/pasted_content.txt", "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    stages_dict = {}
    current_stage = None
    current_dialogues = []

    speaker_map = {
        "אילנה": "elena",
        "דר נעמי": "naomi",
        "ד״ר נעמי": "naomi",
        "הטייס": "protagonist",
        "גוסט": "ghost",
        "סרה": "sera",
        "רהב": "archon"
    }

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("נקודה") or line.startswith("הנה") or line.startswith("טקסט") or line.startswith("שלבים"):
            continue
        if line.isdigit():
            if current_stage is not None:
                stages_dict[current_stage] = current_dialogues
            current_stage = int(line)
            current_dialogues = []
            continue
        
        # Try matching speaker: "text"
        parts = line.split(":", 1)
        if len(parts) == 2:
            sp_raw = parts[0].strip()
            text_raw = parts[1].strip()
            # remove quotes
            text_clean = text_raw.strip("\"“„״'").strip()
            speaker_id = speaker_map.get(sp_raw, "elena")
            if text_clean:
                current_dialogues.append({
                    "speaker": speaker_id,
                    "speaker_raw": sp_raw,
                    "text": text_clean
                })

    if current_stage is not None:
        stages_dict[current_stage] = current_dialogues

    print(f"Parsed {len(stages_dict)} stages successfully.")
    return stages_dict

if __name__ == "__main__":
    d = parse_file()
    print("Stage 1:", d.get(1, []))
    print("Stage 2:", d.get(2, []))
    print("Stage 10:", d.get(10, []))
