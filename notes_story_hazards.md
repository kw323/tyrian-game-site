## החלטות מימוש — מסך תדריך ומכשולים

המשחק כבר נפתח במסך Control Deck. נוסף מצב showCommsModal עם מסך MISSION COMMS, דיאלוג מדורג, NEXT/ENTER ו-SKIP/ESC. הקרב ממתין ל-startStagePlay. יש לשמור על זרימת Retry, מעבר פרק ו-stage jump.

GravityWell הקיים מושך ישויות ומנטרל אותן במרכז, אך עדיין מופעל רק סביב אירוע משימה מאוחר. יש להקטין אותו, לאפשר drift קטן, ולהוסיף steering כבידתי לקליעי Bullet, EnemyBullet, HomingBullet, HeavyBullet ולייזר. יש להפעיל אותו בתחילת שלב סינגולריות, לאורך כל 60 השניות.

אין מערכת solid obstacles קיימת. Player ו-EnemyAdvanced מגבילים רק גבולות מסך; לכן יתווסף StageHazard/Obstacle עם סוגים asteroid ו-wreck, ו-GameContainer יבצע post-move collision resolution לשחקן, אויבים וקליעים. סוג מכשול לשלב 70+ ייבחר לפי stage/missionType, עם visual readout ב-HUD ובתדריך.

## אימות ויזואלי

צילום מלא של דף הבית מציג את Stage 1 Control Deck בתוך Flight Deck / Ready Room. ה־mission briefing, דמות Dr. Naomi, סוג המשימה וה־FIELD HAZARD מופיעים באזור המשחק. מסך MISSION COMMS עצמו מחובר לפני הקרב בקוד, אך דורש לחיצה על כפתור ה־CONTINUE כדי להיכנס אליו ולכן אינו נלכד בצילום סטטי של מסך הפתיחה.

## אימות Mission Archive Log ואודיו

לאחר חיבור המודאל, צילום מלא של מסך הבית מציג את כפתור MISSION ARCHIVE LOG לצד מסדי האויבים ומערכות השחקן, בצבע ענברי תואם לשפת הקונסולה. שרת הפיתוח הופעל מחדש בהצלחה, עם Vite ready, TypeScript ללא שגיאות ו־health checks תקינים. מסך המודאל עצמו נבנה כ־Codex נגלל עם 100 רשומות, רשומות נעולות, tabs לתדריך ולהודעת intercept, וספירת הודעות שנחשפו.
