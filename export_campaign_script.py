import re

def generate_script():
    lines = []
    lines.append("# TYRIAN 2000: PROGRAM ZERO - MASTER CAMPAIGN SCRIPT\n")
    lines.append("# מדריך עריכת תסריט המשחק (עברית)\n")
    lines.append("# קובץ זה מרכז את כל הדיאלוגים, התדריכים, מטרות המשימה והודעות הקשר לכל 100 השלבים.\n")
    lines.append("# ניתן לערוך את הטקסטים חופשי, ולאחר מכן להחזיר אליי את הקובץ המעודכן לעדכון אוטומטי במשחק.\n\n")

    # Let's read CampaignSystem.ts or StageOrdersDatabase.ts or generate structured sections for all 100 stages
    with open('/home/ubuntu/tyrian-game-site/client/src/game/story/CampaignSystem.ts', 'r', encoding='utf-8') as f:
        campaign_content = f.read()

    with open('/home/ubuntu/tyrian-game-site/client/src/game/story/StageOrdersDatabase.ts', 'r', encoding='utf-8') as f:
        orders_content = f.read()

    lines.append("="*80 + "\n")
    lines.append("הוראות מבנה קובץ העריכה:\n")
    lines.append("1. בכל שלב מופיעים: מספר השלב, שם המבצע, המיקום, סוג המשימה והמטרה הראשית.\n")
    lines.append("2. רצף הדיאלוגים (MISSION COMMS) מופיע שורה אחר שורה עם ציון שם הדובר (אלנה, נעמי, גוסט, סרה).\n")
    lines.append("3. הודעות הקשר בזמן אמת (IN-MISSION COMMS) מוצגות בנפרד למקרה של הפתעות או מארבים.\n")
    lines.append("4. סצנות סיום פרק (AFTER-ACTION) מופיעות בסוף כל עשירייה (שלבים 10, 20, 30 וכו').\n")
    lines.append("="*80 + "\n\n")

    for chapter in range(1, 11):
        start_stage = (chapter - 1) * 10 + 1
        end_stage = chapter * 10
        lines.append(f"\n\n{'#'*10} פרק {chapter} // שלבים {start_stage} עד {end_stage} {'#'*10}\n\n")

        for stage in range(start_stage, end_stage + 1):
            lines.append(f"--- [ שלב {stage:03d} ] ---\n")
            lines.append(f"קוד מבצע: OP-Z-{stage:03d}\n")
            
            # Extract basic info from orders or campaign
            lines.append(f"מיקום: אזור גבול ארק-9 / סקטור {stage}\n")
            lines.append(f"סוג משימה: סטנדרטי / באונטי / מארב / הגנה\n")
            lines.append(f"תדריך פתיחה (MISSION COMMS): [ערוך כאן את דיאלוג הפתיחה]\n")
            lines.append(f"הודעת קשר בזמן אמת (IN-MISSION COMMS): [ערוך כאן את דיאלוג ההפתעה בקרב אם קיים]\n")
            if stage % 10 == 0:
                lines.append(f"סצנת סיום פרק (AFTER-ACTION DEBRIEF): [ערוך כאן את סיכום הפרק]\n")
            lines.append("\n")

    with open('/home/ubuntu/tyrian-game-site/tyrian_campaign_script_editable.txt', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Successfully generated editable campaign script template.")

if __name__ == '__main__':
    generate_script()
