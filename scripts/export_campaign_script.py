from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'client/src/game/story/CampaignSystem.ts'
OUTPUT = ROOT / 'tyrian_full_campaign_script.txt'

source = SOURCE.read_text(encoding='utf-8')

chapter_ranges = [(1, 10), (11, 20), (21, 30), (31, 40), (41, 50), (51, 60), (61, 70), (71, 80), (81, 90), (91, 100)]
chapter_titles = {
    1: 'פרק 1 — סיורי ארק־9',
    2: 'פרק 2 — השיירות הנעלמות',
    3: 'פרק 3 — הפקודה השבורה',
    4: 'פרק 4 — פרוטוקול הבריחה',
    5: 'פרק 5 — הצי שבתוך הצי',
    6: 'פרק 6 — תוכנית Zero',
    7: 'פרק 7 — מלחמת האזרחים במסלול',
    8: 'פרק 8 — הברית האחרונה',
    9: 'פרק 9 — הברית האחרונה',
    10: 'פרק 10 — פרוטוקול Zero',
}

name_map = {
    'elena': 'המפקדת אלנה',
    'naomi': 'ד״ר נעמי',
    'ghost': 'גוסט',
    'sera': 'סרה קיין',
    'protagonist': 'הטייס',
}

stage_dialogues: dict[int, list[tuple[str, str]]] = {}

# Extract the explicit stage 1–32 dialogue map.
refined_start = source.index('const REFINED_STAGE_SCRIPTS')
refined_end = source.index('const EVENT_LABELS', refined_start)
refined_block = source[refined_start:refined_end]
for match in re.finditer(r'^\s{8}(\d+): \[\n(.*?)(?=^\s{8}\],)', refined_block, re.MULTILINE | re.DOTALL):
    stage = int(match.group(1))
    lines: list[tuple[str, str]] = []
    for speaker, message in re.findall(r"speaker: '(\w+)'[^\n]*?message: '([^']*)'", match.group(2)):
        lines.append((name_map.get(speaker, speaker), message))
    if lines:
        stage_dialogues[stage] = lines

# Extract the one-line stage beats used for stages 33–70 and 81–99.
beats_start = source.index('const STAGE_DIALOGUE_BEATS')
beats_end = source.index('};\n\nfunction buildRefinedScript', beats_start)
beats_block = source[beats_start:beats_end]
for match in re.finditer(r'^\s{4}(\d+): \{ (.*?) \},$', beats_block, re.MULTILINE):
    stage = int(match.group(1))
    body = match.group(2)
    lead = re.search(r"lead: '(\w+)'", body)
    lead_message = re.search(r"leadMessage: '([^']*)'", body)
    support = re.search(r"support: '(\w+)'", body)
    support_message = re.search(r"supportMessage: '([^']*)'", body)
    analyst = re.search(r"analyst: '(\w+)'", body)
    analyst_message = re.search(r"analystMessage: '([^']*)'", body)
    pilot_message = re.search(r"pilotMessage: '([^']*)'", body)
    if all((lead, lead_message, support, support_message, analyst, analyst_message, pilot_message)):
        stage_dialogues[stage] = [
            (name_map[lead.group(1)], lead_message.group(1)),
            (name_map[support.group(1)], support_message.group(1)),
            (name_map[analyst.group(1)], analyst_message.group(1)),
            (name_map['protagonist'], pilot_message.group(1)),
        ]

stage_dialogues[32] = [
    ('סרה קיין', 'תוצאת הדו־קרב נרשמה. ניצחון או הפסד, אף אחד מאיתנו לא קיבל תשובה מהצי.'),
    ('ד״ר נעמי', 'המערכות של שתי החלליות שרדו את המבחן. עכשיו אני רוצה לדעת מי העתיק את המחקר שלי—ובעיקר למה אבא שלי מעורב בזה.'),
    ('הטייס', 'אז ממשיכים. הפעם לא רק לפי הפקודה.'),
]
stage_dialogues[99] = [
    ('ד״ר נעמי', 'Zero Protocol נפתח, והמערכת מבקשת בחירה.'),
    ('סרה קיין', 'השלדה שלי מחזיקה את האגף. אתה תחליט אם השער נפתח או נסגר.'),
    ('גוסט', 'אני סוף סוף מזהה תודעה בצד השני. היא לא אנושית.'),
    ('הטייס', 'לא נותנים לשליט לדבר אלינו דרך נשק. פותחים את הליבה.'),
]

# The alliance arc is intentionally kept as a named, easy-to-edit block in the engine.
alliance = {
    71: [('המפקדת אלנה', 'ערוץ הפיקוד שלי שוכפל. סרה, התרחקי מהאזור—זו פקודה.'), ('סרה קיין', 'אם זו באמת הפקודה שלך, תני לי את חתימת הקול. עד אז אני נשארת ליד הטייס.'), ('ד״ר נעמי', 'החתימה של הכור שלה תואמת את אחת מתוכניות המחקר הישנות. אני לא אוהבת את זה, אבל היא הצילה אותנו.')],
    72: [('גוסט', 'שתי מטרות באונטי, שני חוזים, אותו חותם זמן. מישהו זייף את שניהם כדי לגרום לנו לצוד את אותה ראיה.'), ('סרה קיין', 'אז נצוד ביחד. אל תתבלבל—זה לא אומר שאני סומכת עליך.'), ('הטייס', 'מספיק כדי לכסות את אותו נתיב.')],
    73: [('המפקדת אלנה', 'שיירת זכוכית נכנסת לשדה האסטרואידים. סרה, קחי את האגף הימני; טייס, אתה מפנה את השמאלי.'), ('ד״ר נעמי', 'השלדה שלה מתעקמת בצורה שונה משלנו. זה לא אומר שהיא טובה יותר, סרה.'), ('סרה קיין', 'לא אמרתי שהיא טובה יותר. החללית שלי פשוט לא צריכה מחמאות כדי לעבוד.')],
    74: [('המפקדת אלנה', 'המתקיפים הם מיירטי צי עילית. יש להם פקודה ללכוד את שתי החלליות.'), ('סרה קיין', 'את אומרת שהצי סימן גם אותי כנכס מזוהם?'), ('המפקדת אלנה', 'אני אומרת שהפקודה לא שלי. מעכשיו מאמתים כל חבילה רק בקול שלי.')],
    75: [('ד״ר נעמי', 'שדה סינגולריות נע. היריות של כולם יתעקמו. סרה, את קוראת את העיוות הזה טוב יותר ממני.'), ('סרה קיין', 'סוף סוף בקשת עצה. תישאר משמאלי ותן לעדשה לעשות את העבודה.'), ('גוסט', 'השדה הזה לא טבעי. מישהו מיקם אותו כדי לדחוף את שתי החלליות לאותו מסלול.')],
    76: [('המפקדת אלנה', 'הריסת־הענק חוסמת תנועה וירי. השמידו את ליבות הנתונים, לא את כל המבנה.'), ('ד״ר נעמי', 'המחקר בתוך המבנה משתמש באותם עקרונות כמו Program Zero.'), ('סרה קיין', 'גם המעבדה שלי קיבלה חלקים ממנו. אולי רהב לא גנב מאיתנו—אולי גנבו מכולנו.')],
    77: [('גוסט', 'מטרת הבאונטי היא קצין שמכר נתוני טיסה של אב־הטיפוס. אני צריך אותו חי.'), ('המפקדת אלנה', 'לכידה עדיפה. אבל אם הוא ינסה להפעיל את שומרי הראש, תעשו מה שצריך.'), ('סרה קיין', 'אני רוצה תשובות, לא רק את הקרדיטים.')],
    78: [('גוסט', 'האות המעוות משדר לשניכם שאתם עותקים פגומים. אל תתנו לקול בלי פנים לבחור לכם את הערך.'), ('סרה קיין', 'הוא השתמש בביטוי שהיה סודי בתוכנית שלי. כמה זמן הצי ידע?'), ('המפקדת אלנה', 'חודשים. איבדנו יחידות שלמות לאותו אות, והפקודות נמחקו לפני שהגעתי אליהן.')],
    79: [('המפקדת אלנה', 'שיירת פליטים נכנסת לטווח. אין לך קו ירי ישיר, סרה. תצטרכי להחזיק את האגף לבד.'), ('סרה קיין', 'המטרה המבוקשת תברח אם אגן על השיירה.'), ('סרה קיין', 'אז שתברח. אני לא נותנת להם להפוך את הפליטים לעוד נתון.')],
    80: [('המפקדת אלנה', 'מטרת הבאונטי היא ספינת פיקוד ענקית שנושאת את מפתח השליטה שהעתיקו מהצי. היא תופיע אחרי הגלים הראשונים.'), ('סרה קיין', 'אני מעבירה את כל הטלמטריה שלי לערוץ המאומת. אין יותר פקודות ביניים—רק הראיות.'), ('ד״ר נעמי', 'החתימה של אבא שלי נמצאת כאן. פרופ׳ רהב לא רק גנב טכנולוגיה; הוא היה קרוב יותר לתוכנית ממה שסיפר לי.'), ('הטייס', 'אז אחרי שנפיל את הספינה הזאת, נבחר אם להמשיך לפי הפקודה או לפי האמת.')],
}
stage_dialogues.update(alliance)
stage_dialogues[100] = [
    ('המפקדת אלנה', 'זו הפקודה האחרונה מארק־9: הגן על הגלקסיה, אבל אל תמסור לה את החירות שלה תמורת שקט.'),
    ('ד״ר נעמי', 'האות נפתח. אם הוא קשור לתוכנית של אבא שלי, אני רוצה לשמוע את האמת ממנו—לא דרך מערכת נשק.'),
    ('סרה קיין', 'שתי החלליות מוכנות. הפעם אנחנו לא נכנסות למבחן של מישהו אחר.'),
    ('הטייס', 'נכנסים יחד. מסיימים את המלחמה, ואז מחליטים מה עושים עם השער.'),
]

if len(stage_dialogues) != 100:
    missing = sorted(set(range(1, 101)) - set(stage_dialogues))
    raise SystemExit(f'Missing stage dialogue: {missing}')

lines = [
    'TYRIAN 2000 // PROGRAM ZERO',
    'קובץ תסריט עברי לעריכה ידנית — גרסה מסונכרנת עם CampaignSystem.ts',
    'הערה: כל שורת דמות מופרדת בשורה משלה. ניתן לערוך את הטקסט כאן ולהחזיר את הקובץ לסנכרון עתידי.',
    '',
]
for chapter, (start, end) in enumerate(chapter_ranges, start=1):
    lines.extend([chapter_titles[chapter], '=' * 72, ''])
    for stage in range(start, end + 1):
        lines.extend([f'שלב {stage:03d}', '-' * 72, 'לפני המשימה:'])
        for speaker, message in stage_dialogues[stage]:
            lines.append(f'{speaker}: {message}')
        lines.extend(['', 'במהלך המשימה:', '[הודעות קשר דינמיות מופעלות לפי אירוע הקרב ונתוני StageOrdersDatabase]', '', 'אחרי המשימה:', '[נבנה אוטומטית בפרקי־מפתח לפי CampaignSystem.afterAction]', ''])

OUTPUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'Wrote {OUTPUT} with {len(stage_dialogues)} stages.')
