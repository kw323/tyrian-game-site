import json
import re

def translate_line(speaker_id, he_text):
    # Professional, humorous and character-consistent translations
    # Elena: Stern, commanding, military
    # Naomi: Obsessed with her ship, threatens with wrenches/fingers
    # Protagonist: Tired, sarcastic, doing all the work
    # Ghost: Tech, bounty hunter, edgy/glitchy
    # Sera: Competitive test pilot
    # Archon: Mysterious ruler / supreme villain

    t = he_text.lower()
    if speaker_id == "elena":
        if "ספינת פיראטים" in he_text or "להשמיד" in he_text:
            return "Pirate vessel sighted. Execute destruction order immediately."
        if "לווי" in he_text or "שיירה" in he_text:
            return "Escort convoy through sector. Zero failures tolerated."
        if "ציד" in he_text or "מבוקש" in he_text:
            return "Official bounty target detected. Eliminate the threat."
        if "חזור" in he_text or "דיווח" in he_text:
            return "Mission accomplished. Report back to base for debriefing."
        if "מפקדה" in he_text or "פקודה" in he_text:
            return "HQ direct order: Hold your position and repel all hostile forces."
        return "Pilot, execute orders without hesitation. Sector security is paramount."

    elif speaker_id == "naomi":
        if "מושלמת" in he_text:
            return "Look at her. Absolutely flawless. Touch her with dirty hands and I will break your fingers."
        if "מפתח" in he_text or "שריטה" in he_text or "אצבע" in he_text:
            return "A scratch on my hull?! I am bringing a heavy wrench right to your helmet!"
        if "נשק" in he_text:
            return "My weapon calibration is a work of art. Use them with respect, pilot."
        if "מנוע" in he_text:
            return "The engines are purring like a kitten. Don't you dare push them too hard!"
        if "אבטחה" in he_text or "טכנולוגיה" in he_text:
            return "That piece of engineering is priceless! Protect it with your life—your life is cheap, my tech is not."
        return "Treat my experimental craft with absolute reverence, pilot!"

    elif speaker_id == "protagonist":
        if "בוקר טוב" in he_text:
            return "Good morning to you too. Thrilled to be here."
        if "אני גם פה" in he_text:
            return "I am right here flying, you know."
        if "זה היה קרוב" in he_text:
            return "It was close because they were shooting back!"
        if "תודה" in he_text:
            return "Crystal clear. Thanks for the vote of confidence."
        if "שריטה" in he_text or "השתקפות" in he_text:
            return "That was just a reflection of the stars, I swear!"
        return "Understood. Doing all the heavy lifting as usual."

    elif speaker_id == "ghost":
        if "פרצתי" in he_text or "מבוקשים" in he_text:
            return "Hey pilot, I bypassed the comms. Got some lucrative bounties for you."
        if "קפטן ראזר" in he_text:
            return "Captain Razer. Half a million credits on his head. Interested?"
        if "צבא" in he_text or "מסריח" in he_text:
            return "Something stinks inside military command. Want to know who's pulling the strings?"
        if "כסף" in he_text:
            return "Credits are transferring to your account. Pleasure doing business."
        return "Ghost on frequency. Keep your eyes open and weapons hot."

    elif speaker_id == "sera":
        if "ניסוי" in he_text or "חללית" in he_text:
            return "Think your ship is fast? Let us test that in active combat, pilot."
        if "קרב" in he_text:
            return "Let's see if your reflexes match your ego."
        return "Impressive piloting. But I am still faster."

    elif speaker_id == "archon":
        return "Insignificant mortals. Your rebellion ends in the void."

    # fallback
    return "Mission parameters updated. Proceed with caution."

def main():
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
        
        parts = line.split(":", 1)
        if len(parts) == 2:
            sp_raw = parts[0].strip()
            text_raw = parts[1].strip()
            text_clean = text_raw.strip("\"“„״'").strip()
            speaker_id = speaker_map.get(sp_raw, "elena")
            if text_clean:
                current_dialogues.append({
                    "speaker": speaker_id,
                    "speaker_raw": sp_raw,
                    "text": text_clean,
                    "text_en": translate_line(speaker_id, text_clean)
                })

    if current_stage is not None:
        stages_dict[current_stage] = current_dialogues

    print(f"Successfully processed {len(stages_dict)} stages.")
    
    # Build clean english voice lines json (no duplicates)
    voice_lines = []
    seen_ids = set()

    for stage_num, dialogues in stages_dict.items():
        for idx, d in enumerate(dialogues):
            # contact vs after
            phase_type = "contact" if idx == 0 else "after"
            line_id = f"stage-{stage_num}-{phase_type}-{idx}"
            if line_id in seen_ids:
                line_id = f"stage-{stage_num}-{phase_type}-{idx}-{d['speaker']}"
            seen_ids.add(line_id)
            
            voice_lines.append({
                "lineId": line_id,
                "stage": stage_num,
                "speaker": d["speaker"],
                "text": d["text_en"],
                "heText": d["text"]
            })

    with open("english_voice_lines_clean.json", "w", encoding="utf-8") as out:
        json.dump(voice_lines, out, ensure_ascii=False, indent=2)

    print(f"Generated {len(voice_lines)} clean English voice lines in english_voice_lines_clean.json")

if __name__ == "__main__":
    main()
