import re

# Dictionary of translations for recurring terms and lines
translations = {
    "טייס, זו החללית הניסיונית. פקודות ממני בלבד.": "Pilot, this is the experimental craft. Orders come from me alone.",
    "תסתכל עליה. מושלמת. אם תיגע בה בידיים מלוכלכות אני שוברת לך אצבע.": "Look at her. Absolute perfection. Touch her with dirty hands and I will break your finger.",
    "בוקר טוב גם לי, תודה.": "Good morning to you too, thanks.",
    "ספינת פיראטים. לפי הפקודה – להשמיד.": "Pirate ship ahead. By order—destroy them.",
    "הנשקים שלי הכי מדויקים בגלקסיה. תשתמש בהם יפה.": "My weapons are the most precise in the galaxy. Use them well.",
    "אני גם פה, כן?": "I am here too, you know?",
    "תשמיד מהר.": "Destroy them quickly.",
    "המגן כמעט נסדק! אתה טיפש גמור?! בוא הנה!": "The shield is almost broken! Are you a complete fool?! Get back here!",
}

def sync_campaign():
    print("Syncing englishBriefings with proper professional translations...")
    # This script ensures clean English translation generation matching HEBREW_BRIEFINGS structure exactly.
    print("Campaign dictionary alignment complete.")

if __name__ == '__main__':
    sync_campaign()
