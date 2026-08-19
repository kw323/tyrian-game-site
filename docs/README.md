# אינדקס תיעוד — Protect The Starship

מסמכים אלה מתעדים את החלטות העיצוב, מצב הנכסים והתחזוקה של גרסת המחשב. המסלול הפעיל הוא **Desktop / Windows**. מסמכי Android נשמרים כהיסטוריה בלבד כדי לאפשר חזרה לעבודה בעתיד, אך אינם מגדירים את יעדי הפיתוח הנוכחיים.

| מסמך | תחום | מצב |
|---|---|---|
| [`desktop-release-status-2026-08.md`](desktop-release-status-2026-08.md) | מצב גרסת המחשב, דרך בדיקה והפצה | פעיל |
| [`voice-assets-status-2026-08.md`](voice-assets-status-2026-08.md) | מיפוי דיבוב, קבצים תקינים וקבצי placeholder | פעיל |
| [`localization-2026-08.md`](localization-2026-08.md) | בורר שפה ותדריכי קמפיין בעברית, אנגלית, יפנית וסינית | מיושם |
| [`testing-tools-2026-08.md`](testing-tools-2026-08.md) | כלי קפיצת שלבים ונקודות לבדיקות ללא שינוי שמירות | פעיל לפיתוח |
| [`menu-ux-proposal-2026-08.md`](menu-ux-proposal-2026-08.md) | תכנון חוויית משתמש לתפריטים גדולים ומבוססי מקלדת | הוחל חלקית |
| [`command-center-redesign-2026-08.md`](command-center-redesign-2026-08.md) | מרכז פיקוד חדש, קיצורי מקלדת ושמירות מדופדפות | מיושם |
| [`weapon-redesign-2026-08.md`](weapon-redesign-2026-08.md) | שישה כלי נשק, 25 דרגות ותיאורי שדרוג | החלטה מיושמת |
| [`reactor-recovery-balance-2026-08.md`](reactor-recovery-balance-2026-08.md) | ריאקטור, פרץ אנרגיה ונעילת התאוששות | החלטה מיושמת |
| [`endgame-overhaul-2026-08.md`](endgame-overhaul-2026-08.md) | בוסים, סרה, Archon, Meltdown ואפילוג | החלטה מיושמת |
| [`android-mobile-design-2026-08.md`](android-mobile-design-2026-08.md) | תכנון Android ראשוני | מושהה |
| [`android-touch-rework-2026-08.md`](android-touch-rework-2026-08.md) | ניסיון התאמת מגע ומסך מלא | מושהה |

## חומרי מקור וכלי עזר

מספר קובצי מקור וכלי עזר נשארו בשורש המאגר כדי לשמר את תהליך יצירת הקמפיין. הם אינם נדרשים להפעלת המשחק ואינם חלק מבניית Windows. הקבצים המרכזיים כוללים את `tyrian_full_campaign_script.txt`, את `english_voice_lines.json`, ואת כלי העיבוד והשחזור בעלי השמות `generate_*`, `parse_*`, `patch_*`, `update_*` ו־`verify_*`.

לפני שימוש בכלי עזר היסטורי, יש לקרוא את הקובץ ואת הנתונים שאליהם הוא כותב. חלק מהכלים נועדו לפעולות חד־פעמיות של עיבוד סיפור או נכסי קול ואינם פקודות הפצה.
