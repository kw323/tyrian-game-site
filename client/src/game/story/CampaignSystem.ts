export type CharacterId = 'naomi' | 'protagonist' | 'elena' | 'sera' | 'ghost' | 'rahav' | 'archon';
import { getLocalizedBriefing, LocalizedContactLine } from './CampaignBriefingLocalizations';
import { getSequencedStageDialogue } from './StageDialogueSequence';

export type UpgradeBriefingKind = 'weapon' | 'generator' | 'ship';
export type GameplayLanguage = 'he' | 'en' | 'ja' | 'zh';

export interface ContactLine {
    speaker: CharacterId;
    name: string;
    message: string;
    /** Stable voice manifest key for this exact radio line, when voice-over exists. */
    voiceLineId?: string;
}

export interface StageBriefing {
    stage: number;
    chapter: number;
    chapterTitle: string;
    title: string;
    location: string;
    objective: string;
    operationCode: string;
    missionType: string;
    missionTargetName: string;
    bountyReward: number;
    contact: ContactLine;
    inMissionComms?: ContactLine;
    dialogueSequence?: ContactLine[];
    afterAction?: {
        speaker: CharacterId;
        name: string;
        message: string;
        reward: number;
    };
}

export interface UpgradeBriefing {
    speaker: 'naomi';
    title: string;
    message: string;
}

interface ChapterDefinition {
    title: string;
    location: string;
    objective: string;
    stageTitles: string[];
}

export class CampaignSystem {
    public static readonly TOTAL_STAGES = 101;

    private static PORTRAIT_URLS: Record<CharacterId, string> = {
        naomi: '/manus-storage/naomi-anime-v2_251aa177.png',
        protagonist: '/manus-storage/pilot-anime-v2_d70cff53.png',
        elena: '/manus-storage/character-elena-animated_dd6169d9.png',
        sera: '/manus-storage/sera-anime-v2_b1c96d90.png',
        ghost: '/manus-storage/ghost-anime-v2_43325ccc.png',
        rahav: '/manus-storage/rahav-anime-portrait_280d5393.png',
        // The Archon has no portrait asset yet; the dialogue console renders its callsign fallback.
        archon: '/assets/archon-comms-fallback.png'
    };

    private static CHARACTER_NAMES: Record<CharacterId, Record<GameplayLanguage, string>> = {
        naomi: { he: 'ד״ר נעמי רן', en: 'Dr. Naomi Ren', ja: 'ナオミ・レン博士', zh: '娜奥米·雷恩博士' },
        protagonist: { he: 'טייס פרויקט Zero', en: 'Program Zero Pilot', ja: 'プロジェクト・ゼロのパイロット', zh: '零号计划飞行员' },
        elena: { he: 'המפקדת אלנה וייל', en: 'Commander Elena Vail', ja: 'エレナ・ヴェール司令官', zh: '埃琳娜·维尔指挥官' },
        sera: { he: 'סרה קיין', en: 'Sera Kane', ja: 'セラ・ケイン', zh: '塞拉·凯恩' },
        ghost: { he: 'גוסט', en: 'GHOST', ja: 'ゴースト', zh: '幽灵' },
        rahav: { he: 'פרופ׳ רהב', en: 'Prof. Rahav', ja: 'ラハブ教授', zh: '拉哈夫教授' },
        archon: { he: 'ארכון', en: 'ARCHON', ja: 'アーコン', zh: '执政官' }
    };

    private static ENGLISH_CHAPTERS: ChapterDefinition[] = [
        {
            title: 'The Ark-9 Patrols',
            location: 'Ark-9 Outer Corridor',
            objective: 'Keep interstellar routes open while mapping the unknown signal.',
            stageTitles: ['First Watch', 'Dustline Escort', 'Beacon Run', 'Quiet Orbit', 'Broken Convoy', 'Night Transit', 'False Distress', 'Relay Under Fire', 'Unlisted Cargo', 'Noise Pattern']
        },
        {
            title: 'Vanishing Convoys',
            location: 'Meridian Freight Lanes',
            objective: 'Find missing convoys before navigation cores are erased.',
            stageTitles: ['Cold Trail', 'Freight Ghosts', 'Empty Carrier', 'Signal Harvest', 'Three Minutes Dark', 'Unmarked Raiders', 'Salvage Trap', 'Convoy Zero', 'Familiar Weapon', 'No Civilian Logs']
        },
        {
            title: 'The Broken Order',
            location: 'Ark-9 Command Reach',
            objective: 'Follow an impossible order and discover who altered target lists.',
            stageTitles: ['Redacted Coords', 'Friendly Fire', 'Silent Colony', 'Order of Silence', 'Burn Evidence', 'Pilot Report', 'Crossed Line', 'Command Override', 'Cost of Obedience', 'Broken Order']
        },
        {
            title: 'Runaway Protocol',
            location: 'Unregistered Belt',
            objective: 'Survive outside official support and reach the first underground contact.',
            stageTitles: ['Flight Denied', 'No Safe Dock', 'Scrap Ambush', 'Long Burn', 'Static Hand', 'Hidden Fuel', 'Pursuit Wing', 'Dead Channel', 'First Defection', 'Runaway Protocol']
        },
        {
            title: 'Fleet Beneath Fleet',
            location: 'Black Relay Network',
            objective: 'Trace the hidden fleet operating inside both military command structures.',
            stageTitles: ['Black Relay', 'False Colors', 'Ghost Hangar', 'Borrowed Codes', 'Unseen Admiral', 'Fleet Within', 'Keyless Door', 'Signal Burial', 'Architect Mark', 'Hidden Armada']
        },
        {
            title: 'Program Zero',
            location: 'Zero-Test Range',
            objective: 'Recover original records behind the experimental spacecraft program.',
            stageTitles: ['Prototype Wake', 'Four Chassis', 'Missing Flight', 'Engine Room', 'First Pilot', 'Hull Memory', 'Failed War', 'Zero Shadow', 'Upgrade Price', 'Program Zero']
        },
        {
            title: 'Civil War in Orbit',
            location: 'Divided Defense Grid',
            objective: 'Choose trusted military cells before the grid collapses.',
            stageTitles: ['Split Command', 'Friendly Hunters', 'Defector Line', 'Helix Siege', 'Two Flags', 'Loyalty Test', 'War Commanders', 'Last Official Order', 'Doubt Fleet', 'Orbital Civil War']
        },
        {
            title: 'The Gate Network',
            location: 'Ark-9 Gate Array',
            objective: 'Reach the gate network and learn why Ark-9 was built around it.',
            stageTitles: ['Gate One', 'Long Jump', 'Moving Coords', 'Locked Meridian', 'Gatekeepers', 'Through Static', 'War Map', 'Ark Beneath Ark', 'Route Choice', 'Gate Network']
        },
        {
            title: 'The Last Alliance',
            location: 'Coalition Front',
            objective: 'Unite rival forces long enough to reach the war signal source.',
            stageTitles: ['Uneasy Escort', 'Old Enemies', 'Sera Signal', 'Joint Strike', 'No One Alone', 'Broken Formation', 'Debt Repaid', 'Alliance Test', 'One Line', 'Last Alliance']
        },
        {
            title: 'Program Zero Finale',
            location: 'Singularity Core',
            objective: 'Destroy the Archon Mothership and close the gate.',
            stageTitles: ['Final Approach', 'Zero Hour', 'Event Horizon', 'Archon Core', 'The Last Gate']
        }
    ];

    private static HEBREW_BRIEFINGS: Record<number, any> = {
    1: {
        title: 'שלב 1',
        location: 'גזרה 1',
        objective: 'השלם את משימת גזרה 1 ושרוד.',
        operationCode: 'OP-SEC-1',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 1',
        bountyReward: 1100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'טייס, זו החללית הניסיונית. פקודות ממני בלבד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תסתכל עליה. מושלמת. אם תיגע בה בידיים מלוכלכות אני שוברת לך אצבע.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'טייס, זו החללית הניסיונית. פקודות ממני בלבד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תסתכל עליה. היא מושלמת. אם תיגע בה בידיים מלוכלכות אני אשבור לך אצבע.',
            reward: 1100
        }
    },
    2: {
        title: 'שלב 2',
        location: 'גזרה 2',
        objective: 'השלם את משימת גזרה 2 ושרוד.',
        operationCode: 'OP-SEC-2',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 2',
        bountyReward: 1200,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ספינת פיראטים. לפי הפקודה – להשמיד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי הכי מדויקים בגלקסיה. תשתמש בהם יפה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ספינת פיראטים. לפי הפקודה – להשמיד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים מוכנים. תשתמש בהם יפה. היא לא אוהבת רעש מיותר.',
            reward: 1200
        }
    },
    3: {
        title: 'שלב 3',
        location: 'גזרה 3',
        objective: 'השלם את משימת גזרה 3 ושרוד.',
        operationCode: 'OP-SEC-3',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 3',
        bountyReward: 1300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תשמיד מהר.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן כמעט נסדק! אתה טיפש גמור?! בוא הנה!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תשמיד מהר.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נסדק!',
            reward: 1300
        }
    },
    4: {
        title: 'שלב 4',
        location: 'גזרה 4',
        objective: 'השלם את משימת גזרה 4 ושרוד.',
        operationCode: 'OP-SEC-4',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 4',
        bountyReward: 1400,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזרה. דיווח.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי את השריטה. עכשיו היא שוב מושלמת. תביא מטלית.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזרה. דיווח.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי אותה. הבאתי לה מטלית רכה.',
            reward: 1400
        }
    },
    5: {
        title: 'שלב 5',
        location: 'גזרה 5',
        objective: 'השלם את משימת גזרה 5 ושרוד.',
        operationCode: 'OP-SEC-5',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 5',
        bountyReward: 1500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ליווי שיירה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תראה איך היא מחליקה. זו לא חללית, זו יצירת אמנות.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ליווי שיירה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'היא מחליקה בין האסטרואידים כאילו נולדה לזה.',
            reward: 1500
        }
    },
    6: {
        title: 'שלב 6',
        location: 'גזרה 6',
        objective: 'השלם את משימת גזרה 6 ושרוד.',
        operationCode: 'OP-SEC-6',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 6',
        bountyReward: 1600,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תקיפה. הגיב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנוע רעד! אני מביאה לו כוס שמן חם מיד. ואתה תקבל מכה אם זה יקרה שוב!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תקיפה. הגיב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנוע שלה רעד. היא לא אוהבת כשמרעידים אותה.',
            reward: 1600
        }
    },
    7: {
        title: 'שלב 7',
        location: 'גזרה 7',
        objective: 'השלם את משימת גזרה 7 ושרוד.',
        operationCode: 'OP-SEC-7',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 7',
        bountyReward: 1700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיימת. חזור.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי את הקירור. עכשיו היא אפילו יותר מושלמת. תודה לי.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיימת. חזור.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי לה את הקירור. עכשיו היא יותר יציבה.',
            reward: 1700
        }
    },
    8: {
        title: 'שלב 8',
        location: 'גזרה 8',
        objective: 'השלם את משימת גזרה 8 ושרוד.',
        operationCode: 'OP-SEC-8',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 8',
        bountyReward: 1800,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק אני אדפוק לך בראש עם מפתח שבדי.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק עליה אני אדפוק לך בראש.',
            reward: 1800
        }
    },
    9: {
        title: 'שלב 9',
        location: 'גזרה 9',
        objective: 'השלם את משימת גזרה 9 ושרוד.',
        operationCode: 'OP-SEC-9',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 9',
        bountyReward: 1900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אין תנועה. חזור.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון האחרון היה מושלם. אני גאה בה כל כך שאני כמעט בוכה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אין תנועה. חזור.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון האחרון היה מדויק. היא אהבה אותו.',
            reward: 1900
        }
    },
    10: {
        title: 'שלב 10',
        location: 'גזרה 10',
        objective: 'השלם את משימת גזרה 10 ושרוד.',
        operationCode: 'OP-SEC-10',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 10',
        bountyReward: 2000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר ציד מבוקשים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תשמור עליה כמו על חייך. חייך פחות חשובים.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר ציד מבוקשים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תשמור עליה. חייך פחות חשובים ממנה.',
            reward: 2000
        }
    },
    11: {
        title: 'שלב 11',
        location: 'גזרה 11',
        objective: 'השלם את משימת גזרה 11 ושרוד.',
        operationCode: 'OP-SEC-11',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 11',
        bountyReward: 2100,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'היי טייס, פרצתי לערוץ. יש לי מבוקשים עם כסף.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מי זה?'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'היי טייס, פרצתי לערוץ. יש לי מבוקשים עם כסף.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מי זה?',
            reward: 2100
        }
    },
    12: {
        title: 'שלב 12',
        location: 'גזרה 12',
        objective: 'השלם את משימת גזרה 12 ושרוד.',
        operationCode: 'OP-SEC-12',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 12',
        bountyReward: 2200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'קפטן ראזר. חצי מיליון.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'משימה רשמית. לחסל.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'קפטן ראזר. חצי מיליון.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'משימה רשמית. לחסל.',
            reward: 2200
        }
    },
    13: {
        title: 'שלב 13',
        location: 'גזרה 13',
        objective: 'השלם את משימת גזרה 13 ושרוד.',
        operationCode: 'OP-SEC-13',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 13',
        bountyReward: 2300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכתם הזה לא יורד. ניסיתי שלושה סוגי ממסים. היא לא אוהבת אותו.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הוא ליד אוריון.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכתם הזה לא יורד. ניסיתי שלושה סוגי ממסים. היא לא אוהבת אותו.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הוא ליד אוריון.',
            reward: 2300
        }
    },
    14: {
        title: 'שלב 14',
        location: 'גזרה 14',
        objective: 'השלם את משימת גזרה 14 ושרוד.',
        operationCode: 'OP-SEC-14',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 14',
        bountyReward: 2400,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'השמד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן כמעט נשבר! אתה עושה את זה בכוונה?! בוא הנה תיקח אחת!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'השמד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נשבר!',
            reward: 2400
        }
    },
    15: {
        title: 'שלב 15',
        location: 'גזרה 15',
        objective: 'השלם את משימת גזרה 15 ושרוד.',
        operationCode: 'OP-SEC-15',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 15',
        bountyReward: 2500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יפה. הכסף בדרך.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור. דיווח.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יפה. הכסף בדרך.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור. דיווח.',
            reward: 2500
        }
    },
    16: {
        title: 'שלב 16',
        location: 'גזרה 16',
        objective: 'השלם את משימת גזרה 16 ושרוד.',
        operationCode: 'OP-SEC-16',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 16',
        bountyReward: 2600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'ליידי ווקס.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי כמהים אליה. תן להם לעבוד.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'ליידי ווקס.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מחכים.',
            reward: 2600
        }
    },
    17: {
        title: 'שלב 17',
        location: 'גזרה 17',
        objective: 'השלם את משימת גזרה 17 ושרוד.',
        operationCode: 'OP-SEC-17',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 17',
        bountyReward: 2700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אל תיתן לה לברוח.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'ענני האבק של נבולה סל.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אל תיתן לה לברוח.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'ענני האבק של נבולה סל.',
            reward: 2700
        }
    },
    18: {
        title: 'שלב 18',
        location: 'גזרה 18',
        objective: 'השלם את משימת גזרה 18 ושרוד.',
        operationCode: 'OP-SEC-18',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 18',
        bountyReward: 2800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה שריטה!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זו השתקפות של הכוכבים, נשבע!'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'יש לה שריטה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי למה עשית את זה?!',
            reward: 2800
        }
    },
    19: {
        title: 'שלב 19',
        location: 'גזרה 19',
        objective: 'השלם את משימת גזרה 19 ושרוד.',
        operationCode: 'OP-SEC-19',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 19',
        bountyReward: 2900,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עוד אחד מחכה.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'דיווח ואז מנוחה.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עוד אחד מחכה.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'דיווח ואז מנוחה.',
            reward: 2900
        }
    },
    20: {
        title: 'שלב 20',
        location: 'גזרה 20',
        objective: 'השלם את משימת גזרה 20 ושרוד.',
        operationCode: 'OP-SEC-20',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 20',
        bountyReward: 3000,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'משהו בצבא שלכם מסריח.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הריח היחיד שאני מרגישה זה שמן חדש. וקצת זיעה שלך.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'משהו בצבא שלכם מסריח.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הריח היחיד שהיא מרגישה זה שמן חדש. וביג-מק.',
            reward: 3000
        }
    },
    21: {
        title: 'שלב 21',
        location: 'גזרה 21',
        objective: 'השלם את משימת גזרה 21 ושרוד.',
        operationCode: 'OP-SEC-21',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 21',
        bountyReward: 3100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ספינת מבריחים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תראה איך היא מתמרנת. זו לא טיסה, זו ריקוד.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ספינת מבריחים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יוצא.',
            reward: 3100
        }
    },
    22: {
        title: 'שלב 22',
        location: 'גזרה 22',
        objective: 'השלם את משימת גזרה 22 ושרוד.',
        operationCode: 'OP-SEC-22',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 22',
        bountyReward: 3200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הם נושאים משהו שהצבא רוצה.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'בצע.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הם נושאים משהו שהצבא רוצה.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'בצע.',
            reward: 3200
        }
    },
    23: {
        title: 'שלב 23',
        location: 'גזרה 23',
        objective: 'השלם את משימת גזרה 23 ושרוד.',
        operationCode: 'OP-SEC-23',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 23',
        bountyReward: 3300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד כתם קטן ליד הישן!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זה אור מהחלון האחורי...'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד כתם קטן ליד הישן!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זה אור…',
            reward: 3300
        }
    },
    24: {
        title: 'שלב 24',
        location: 'גזרה 24',
        objective: 'השלם את משימת גזרה 24 ושרוד.',
        operationCode: 'OP-SEC-24',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 24',
        bountyReward: 3400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצבא שותק על הפלישות.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי את חיישן הלחץ. עכשיו הוא מדויק כמו שאני אוהבת. כמעט כמוני.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצבא שותק על הפלישות.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי לה את חיישן הלחץ. ניסיתי עוד ממס על הכתם. כלום.',
            reward: 3400
        }
    },
    25: {
        title: 'שלב 25',
        location: 'גזרה 25',
        objective: 'השלם את משימת גזרה 25 ושרוד.',
        operationCode: 'OP-SEC-25',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 25',
        bountyReward: 3500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק קוסמי אני אדפוק אותך עם המפתח השבדי היפה שלי.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק עליה – מפתח שבדי.',
            reward: 3500
        }
    },
    26: {
        title: 'שלב 26',
        location: 'גזרה 26',
        objective: 'השלם את משימת גזרה 26 ושרוד.',
        operationCode: 'OP-SEC-26',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 26',
        bountyReward: 3600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'תנועות חייזריות. הצי מעלים עין.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון האחרון היה מושלם. אני גאה בה יותר ממה שאני גאה בעצמי. וזה הרבה.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'תנועות חייזריות. הצי מעלים עין.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון שלה היה מדויק.',
            reward: 3600
        }
    },
    27: {
        title: 'שלב 27',
        location: 'גזרה 27',
        objective: 'השלם את משימת גזרה 27 ושרוד.',
        operationCode: 'OP-SEC-27',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 27',
        bountyReward: 3700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור מיד. אין רשות להתערב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף פקודה ששומרת עליה. כל הכבוד למי שחשב על זה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזור מיד. אין רשות להתערב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף פקודה ששומרת עליה.',
            reward: 3700
        }
    },
    28: {
        title: 'שלב 28',
        location: 'גזרה 28',
        objective: 'השלם את משימת גזרה 28 ושרוד.',
        operationCode: 'OP-SEC-28',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 28',
        bountyReward: 3800,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יש קשר בין הפלישות לטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הטכנולוגיה היחידה שחשובה היא שלי. מישהו העתיק אותי ואני אמצא אותו.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יש קשר בין הפלישות לטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מישהו העתיק אותה. אני חושדת חזק שזה אבא שלי.',
            reward: 3800
        }
    },
    29: {
        title: 'שלב 29',
        location: 'גזרה 29',
        objective: 'השלם את משימת גזרה 29 ושרוד.',
        operationCode: 'OP-SEC-29',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 29',
        bountyReward: 3900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר תפגוש את סרה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה חללית דומה?! מי העתיק את היצירה שלי?! בטח הפרופסור רהב הטיפש הזה!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר תפגוש את סרה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה חללית דומה. בטח רהב. אף אחד אחר לא מסוגל להבין אותה.',
            reward: 3900
        }
    },
    30: {
        title: 'שלב 30',
        location: 'גזרה 30',
        objective: 'השלם את משימת גזרה 30 ושרוד.',
        operationCode: 'OP-SEC-30',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 30',
        bountyReward: 4000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'דו-קרב. לפי פקודה מלמעלה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם היא תיגע בחללית שלי אני אפרק אותה ואז אבנה אותה מחדש יותר טוב. ואת רהב אני אהרוג.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'דו-קרב. לפי פקודה מלמעלה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם היא תיגע בה אני אפרק אותה. ואת רהב נדבר אחר כך.',
            reward: 4000
        }
    },
    31: {
        title: 'שלב 31',
        location: 'גזרה 31',
        objective: 'השלם את משימת גזרה 31 ושרוד.',
        operationCode: 'OP-SEC-31',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 31',
        bountyReward: 4100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'בעוד שעה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי מוכנים. הם הכי מדויקים. רהב בטח גנב גם את הרעיון שלהם.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'בעוד שעה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מוכנים.',
            reward: 4100
        }
    },
    32: {
        title: 'שלב 32',
        location: 'גזרה 32',
        objective: 'השלם את משימת גזרה 32 ושרוד.',
        operationCode: 'OP-SEC-32',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 32',
        bountyReward: 4200,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'בוא נגמור מהר.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מוכן.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'בוא נגמור מהר.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מוכן.',
            reward: 4200
        }
    },
    33: {
        title: 'שלב 33',
        location: 'גזרה 33',
        objective: 'השלם את משימת גזרה 33 ושרוד.',
        operationCode: 'OP-SEC-33',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 33',
        bountyReward: 4300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תיקו. שניכם חוזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש שריטה! ורהב הטיפש גנב את הטכנולוגיה של הבת שלו! אני אהרוג אותו!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תיקו. שניכם חוזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה שריטה. ורהב כנראה גנב לי חלקים ממנה. אף אחד אחר לא יודע איך היא בנויה.',
            reward: 4300
        }
    },
    34: {
        title: 'שלב 34',
        location: 'גזרה 34',
        objective: 'השלם את משימת גזרה 34 ושרוד.',
        operationCode: 'OP-SEC-34',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 34',
        bountyReward: 4400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי הזמין את הפלישות בכוונה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ואני הזמנתי שקט ורק קיבלתי גנבים ושריטות. רהב, אני יודעת שזה אתה!'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי הזמין את הפלישות בכוונה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'קיבלתי גנבים וכתמים. רהב…',
            reward: 4400
        }
    },
    35: {
        title: 'שלב 35',
        location: 'גזרה 35',
        objective: 'השלם את משימת גזרה 35 ושרוד.',
        operationCode: 'OP-SEC-35',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 35',
        bountyReward: 4500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'פקודות מלמעלה. ממשיכים לציית.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'אילנה, זה רקוב.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'פקודות מלמעלה. ממשיכים לציית.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'אילנה, זה רקוב.',
            reward: 4500
        }
    },
    36: {
        title: 'שלב 36',
        location: 'גזרה 36',
        objective: 'השלם את משימת גזרה 36 ושרוד.',
        operationCode: 'OP-SEC-36',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 36',
        bountyReward: 4600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'סרה עדיין חושבת שהיא הכי טובה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'רק אם היא לא תיפגע. אחרת אני נשארת ואני אהרוג את כולם כולל את רהב מרחוק.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'סרה עדיין חושבת שהיא הכי טובה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תתחיל.',
            reward: 4600
        }
    },
    37: {
        title: 'שלב 37',
        location: 'גזרה 37',
        objective: 'השלם את משימת גזרה 37 ושרוד.',
        operationCode: 'OP-SEC-37',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 37',
        bountyReward: 4700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'משימה נוספת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מפעילה בריחה. המנועים שלי שרים. תשמע איך הם יפים. זה לא אתה, זה הם.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'משימה נוספת.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אילנה, את לא מרגישה שמשהו פה לא בסדר כבר הרבה זמן?',
            reward: 4700
        }
    },
    38: {
        title: 'שלב 38',
        location: 'גזרה 38',
        objective: 'השלם את משימת גזרה 38 ושרוד.',
        operationCode: 'OP-SEC-38',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 38',
        bountyReward: 4800,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עוד מבוקש.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם מישהו ייגע בה במרדף אני אמצא אותו. וגם את רהב.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עוד מבוקש.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'לפעמים אני שואל למי אנחנו באמת עובדים.',
            reward: 4800
        }
    },
    39: {
        title: 'שלב 39',
        location: 'גזרה 39',
        objective: 'השלם את משימת גזרה 39 ושרוד.',
        operationCode: 'OP-SEC-39',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 39',
        bountyReward: 4900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור. דיווח.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אנחנו בורחים, אין זמן למזגן.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזור. דיווח.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'המטרה חוסלה. שוב.',
            reward: 4900
        }
    },
    40: {
        title: 'שלב 40',
        location: 'גזרה 40',
        objective: 'השלם את משימת גזרה 40 ושרוד.',
        operationCode: 'OP-SEC-40',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 40',
        bountyReward: 5000,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי שותק יותר מדי.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אולי נתקן כשנעצור.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי שותק יותר מדי.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'השתיקה הזו מתחילה להרגיש מסוכנת.',
            reward: 5000
        }
    },
    41: {
        title: 'שלב 41',
        location: 'גזרה 41',
        objective: 'השלם את משימת גזרה 41 ושרוד.',
        operationCode: 'OP-SEC-41',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 41',
        bountyReward: 5100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי רעבים. וגם אני רעבה כי המזגן לא עובד ויש לי חם.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ואם נראה משהו שאסור לנו לראות?',
            reward: 5100
        }
    },
    42: {
        title: 'שלב 42',
        location: 'גזרה 42',
        objective: 'השלם את משימת גזרה 42 ושרוד.',
        operationCode: 'OP-SEC-42',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 42',
        bountyReward: 5200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'תנועות חייזריות גדולות. הצי מעלים עין.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'הוא מת לפחות.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'תנועות חייזריות גדולות. הצי מעלים עין.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'כמה פעמים עוד אפשר להעלים עין?',
            reward: 5200
        }
    },
    43: {
        title: 'שלב 43',
        location: 'גזרה 43',
        objective: 'השלם את משימת גזרה 43 ושרוד.',
        operationCode: 'OP-SEC-43',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 43',
        bountyReward: 5300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אין רשות להתערב. חזור.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'נתקן את המזגן אחר כך.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אין רשות להתערב. חזור.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'את באמת עדיין מאמינה שזה רק פקודות?',
            reward: 5300
        }
    },
    44: {
        title: 'שלב 44',
        location: 'גזרה 44',
        objective: 'השלם את משימת גזרה 44 ושרוד.',
        operationCode: 'OP-SEC-44',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 44',
        bountyReward: 5400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יש קשר ברור בין הפלישות לטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אני עדיין לחצתי על הכפתור...'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יש קשר ברור בין הפלישות לטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מישהו משחק משחק גדול מאיתנו.',
            reward: 5400
        }
    },
    45: {
        title: 'שלב 45',
        location: 'גזרה 45',
        objective: 'השלם את משימת גזרה 45 ושרוד.',
        operationCode: 'OP-SEC-45',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 45',
        bountyReward: 5500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר עוד מפגש עם סרה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אני הייתי זה שכיוון...'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר עוד מפגש עם סרה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ואם הפעם זה לא ייגמר בתיקו?',
            reward: 5500
        }
    },
    46: {
        title: 'שלב 46',
        location: 'גזרה 46',
        objective: 'השלם את משימת גזרה 46 ושרוד.',
        operationCode: 'OP-SEC-46',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 46',
        bountyReward: 5600,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אני מורד. בורחים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'פחות חשוב מהמזגן השבור. אני מתה מחום!'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'אני מורד. בורחים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'רק אם היא לא תיפגע. אחרת אני נשארת.',
            reward: 5600
        }
    },
    47: {
        title: 'שלב 47',
        location: 'גזרה 47',
        objective: 'השלם את משימת גזרה 47 ושרוד.',
        operationCode: 'OP-SEC-47',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 47',
        bountyReward: 5700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'מסלול פתוח. תברחו.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי אכלו אותו. מושלמים. ואני עדיין חמה כמו תנור.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'מסלול פתוח. תברחו.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מפעילה בריחה. המנועים שלה יציבים.',
            reward: 5700
        }
    },
    48: {
        title: 'שלב 48',
        location: 'גזרה 48',
        objective: 'השלם את משימת גזרה 48 ושרוד.',
        operationCode: 'OP-SEC-48',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 48',
        bountyReward: 5800,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'כל הצי רודף אחריכם!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי את המזגן! סוף סוף! עכשיו היא שוב מושלמת ואני לא מזיעה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'כל הצי רודף אחריכם!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם מישהו ייגע בה – אני אמצא אותו.',
            reward: 5800
        }
    },
    49: {
        title: 'שלב 49',
        location: 'גזרה 49',
        objective: 'השלם את משימת גזרה 49 ושרוד.',
        operationCode: 'OP-SEC-49',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 49',
        bountyReward: 5900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'טייס, בית דין. נעמי, את תאבדי הכל!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם הם ייגעו בה אני אהפוך אותם לאבק עם אנרגיה מממד מקביל. תראו.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'טייס, בית דין. נעמי, את תאבדי הכל!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנוע שלה רעד. היא עייפה.',
            reward: 5900
        }
    },
    50: {
        title: 'שלב 50',
        location: 'גזרה 50',
        objective: 'השלם את משימת גזרה 50 ושרוד.',
        operationCode: 'OP-SEC-50',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 50',
        bountyReward: 6000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אתם תיתפסו!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תתקרבי! ורהב הטיפש גנב את הטכנולוגיה שלי, אני בטוחה!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אתם תיתפסו!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'נכנסים לחגורת אסטרואידים. היא לא אוהבת צפיפות.',
            reward: 6000
        }
    },
    51: {
        title: 'שלב 51',
        location: 'גזרה 51',
        objective: 'השלם את משימת גזרה 51 ושרוד.',
        operationCode: 'OP-SEC-51',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 51',
        bountyReward: 6100,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'השמשות שלה מלאות באבק!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני עוצרת זמן לרגע. תראו איזה יופי של יכולת. זה לא הטייס, זה אני.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'השמשות שלה מלאות באבק!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'עף לפי חיישנים.',
            reward: 6100
        }
    },
    52: {
        title: 'שלב 52',
        location: 'גזרה 52',
        objective: 'השלם את משימת גזרה 52 ושרוד.',
        operationCode: 'OP-SEC-52',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 52',
        bountyReward: 6200,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכנף שלה שרטה! והכתם עדיין שם! ניסיתי כבר כל חומר ביקום חוץ משפכטל!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן כמעט נסדק מהגל! טייס אתה אשם! ובנוסף רהב גנב לי את הרעיון של המגנים!'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכנף שלה שרטה! והכתם עדיין שם! ניסיתי כבר כל חומר ביקום חוץ משפכטל!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אולי פשוט…',
            reward: 6200
        }
    },
    53: {
        title: 'שלב 53',
        location: 'גזרה 53',
        objective: 'השלם את משימת גזרה 53 ושרוד.',
        operationCode: 'OP-SEC-53',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 53',
        bountyReward: 6300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מערכת ההסוואה שלה מהבהבת!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי אנרגיה מממד מקביל. עכשיו הנשקים שלי חזקים פי שניים. גאווה טהורה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'מערכת ההסוואה שלה מהבהבת!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זה הרטט.',
            reward: 6300
        }
    },
    54: {
        title: 'שלב 54',
        location: 'גזרה 54',
        objective: 'השלם את משימת גזרה 54 ושרוד.',
        operationCode: 'OP-SEC-54',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 54',
        bountyReward: 6400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הגנרטור שלה משתעל!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'אני עדיין כאן מאחור.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הגנרטור שלה משתעל!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מחזיק אותה יציב.',
            reward: 6400
        }
    },
    55: {
        title: 'שלב 55',
        location: 'גזרה 55',
        objective: 'השלם את משימת גזרה 55 ושרוד.',
        operationCode: 'OP-SEC-55',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 55',
        bountyReward: 6500,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש שבבים על הריצפה שלה!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'מה אלה הנתונים האלה?'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'יש שבבים על הריצפה שלה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אחר כך!',
            reward: 6500
        }
    },
    56: {
        title: 'שלב 56',
        location: 'גזרה 56',
        objective: 'השלם את משימת גזרה 56 ושרוד.',
        operationCode: 'OP-SEC-56',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 56',
        bountyReward: 6600,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הניווט שלה מראה שלושה מסלולים!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני עוצרת זמן שוב. תראו. מושלם. הטייס רק לוחץ כפתורים.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הניווט שלה מראה שלושה מסלולים!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'בוחר באחד.',
            reward: 6600
        }
    },
    57: {
        title: 'שלב 57',
        location: 'גזרה 57',
        objective: 'השלם את משימת גזרה 57 ושרוד.',
        operationCode: 'OP-SEC-57',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 57',
        bountyReward: 6700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'השמשות שלה מתחילות להיסדק!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'אתם עוצרים לציד בזמן שאני רודפת אחריכם? חצופים.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'השמשות שלה מתחילות להיסדק!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'עוד קצת.',
            reward: 6700
        }
    },
    58: {
        title: 'שלב 58',
        location: 'גזרה 58',
        objective: 'השלם את משימת גזרה 58 ושרוד.',
        operationCode: 'OP-SEC-58',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 58',
        bountyReward: 6800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכל רוטט עליה!'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "יש לכם חלון קטן. אני מעכבת תגבורת.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכל רוטט עליה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי זה כמעט פגע בי!',
            reward: 6800
        }
    },
    59: {
        title: 'שלב 59',
        location: 'גזרה 59',
        objective: 'השלם את משימת גזרה 59 ושרוד.',
        operationCode: 'OP-SEC-59',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 59',
        bountyReward: 6900,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ההסוואה שלה נשרפה!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'כן. ועוד גנבו לי את הטכנולוגיה. רהב הטיפש. אני אהרוג אותו.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ההסוואה שלה נשרפה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יצאנו!',
            reward: 6900
        }
    },
    60: {
        title: 'שלב 60',
        location: 'גזרה 60',
        objective: 'השלם את משימת גזרה 60 ושרוד.',
        operationCode: 'OP-SEC-60',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 60',
        bountyReward: 7000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'מצאתי אתכם. אני רודפת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף היא נרגעת. עכשיו אפשר לתקן את המזגן שוב. הוא משתעל.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'מצאתי אתכם. אני רודפת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'היא שבורה. ורהב בטח גאה בפח המעופף שהוא בנה לה.',
            reward: 7000
        }
    },
    61: {
        title: 'שלב 61',
        location: 'גזרה 61',
        objective: 'השלם את משימת גזרה 61 ושרוד.',
        operationCode: 'OP-SEC-61',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 61',
        bountyReward: 7100,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני מאחוריכם.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'סוף סוף.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני מאחוריכם.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן. תנצל. היא צריכה רגע. רהב כנראה לא לימד אותה לחכות.',
            reward: 7100
        }
    },
    62: {
        title: 'שלב 62',
        location: 'גזרה 62',
        objective: 'השלם את משימת גזרה 62 ושרוד.',
        operationCode: 'OP-SEC-62',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 62',
        bountyReward: 7200,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה מקבלת פקודות להשמיד. אני מעכבת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי את מערכת עצירת הזמן. עכשיו אפשר שלוש שניות. תראו איזה יופי.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה מקבלת פקודות להשמיד. אני מעכבת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נסדק!',
            reward: 7200
        }
    },
    63: {
        title: 'שלב 63',
        location: 'גזרה 63',
        objective: 'השלם את משימת גזרה 63 ושרוד.',
        operationCode: 'OP-SEC-63',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 63',
        bountyReward: 7300,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'עדיין רודפת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי רעבים. ואני גאה בהם כל כך שאני כמעט שוכחת את רהב.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'עדיין רודפת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי לה אנרגיה. הנשקים שלה יציבים. בניגוד לנשקים הבוהקים של אבא שלי שרק מושכים אש.',
            reward: 7300
        }
    },
    64: {
        title: 'שלב 64',
        location: 'גזרה 64',
        objective: 'השלם את משימת גזרה 64 ושרוד.',
        operationCode: 'OP-SEC-64',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 64',
        bountyReward: 7400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'גל חייזרים קטן.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'לחצתי חזק על הכפתור הפעם.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'גל חייזרים קטן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני רואה.',
            reward: 7400
        }
    },
    65: {
        title: 'שלב 65',
        location: 'גזרה 65',
        objective: 'השלם את משימת גזרה 65 ושרוד.',
        operationCode: 'OP-SEC-65',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 65',
        bountyReward: 7500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, תסתכלי על הנתונים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי אנרגיה גדולה. עכשיו היא זורחת. מושלמת. רהב היה מקנא.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, תסתכלי על הנתונים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הגנרטור שלה עדיין חלש. בניגוד לפח של רהב שרק מרעיש ומרגיז.',
            reward: 7500
        }
    },
    66: {
        title: 'שלב 66',
        location: 'גזרה 66',
        objective: 'השלם את משימת גזרה 66 ושרוד.',
        operationCode: 'OP-SEC-66',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 66',
        bountyReward: 7600,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני ממשיכה… אבל הנתונים…'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי יטפלו. הם הכי טובים. ואני הכי טובה שבנתה אותם.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני ממשיכה… אבל הנתונים…' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן שוב. היא צריכה שקט. לא כמו החללית הרועשת של אבא שלי שהורסת את כל הסאונדסקייפ.',
            reward: 7600
        }
    },
    67: {
        title: 'שלב 67',
        location: 'גזרה 67',
        objective: 'השלם את משימת גזרה 67 ושרוד.',
        operationCode: 'OP-SEC-67',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 67',
        bountyReward: 7700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'באונטי קטן.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אחר כך המכות, עכשיו יורים!'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'באונטי קטן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אתם עוצרים לציד?!',
            reward: 7700
        }
    },
    68: {
        title: 'שלב 68',
        location: 'גזרה 68',
        objective: 'השלם את משימת גזרה 68 ושרוד.',
        operationCode: 'OP-SEC-68',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 68',
        bountyReward: 7800,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'מתקרבת.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'כל הכבוד לנו.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'מתקרבת.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "יש חלון. אני מעכבת תגבורת.',
            reward: 7800
        }
    },
    69: {
        title: 'שלב 69',
        location: 'גזרה 69',
        objective: 'השלם את משימת גזרה 69 ושרוד.',
        operationCode: 'OP-SEC-69',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 69',
        bountyReward: 7900,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הנתונים… וההוראה מחגורה…'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני עוצרת זמן לשלוש שניות מלאות. תראו. מושלם. הטייס רק צופה.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'הנתונים… וההוראה מחגורה…' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'כן. ורהב גנב לי חלקים ממנה. עכשיו הפח שלו הורס לי את הקומפוזיציה של כל הגזרה.',
            reward: 7900
        }
    },
    70: {
        title: 'שלב 70',
        location: 'גזרה 70',
        objective: 'השלם את משימת גזרה 70 ושרוד.',
        operationCode: 'OP-SEC-70',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 70',
        bountyReward: 8000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוצרת. צריכה לחשוב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שרים כשהם יורים. תשמעו. זה בגלל השדרוג שלי.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוצרת. צריכה לחשוב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף. עכשיו אפשר לנסות שוב את הכתם.',
            reward: 8000
        }
    },
    71: {
        title: 'שלב 71',
        location: 'גזרה 71',
        objective: 'השלם את משימת גזרה 71 ושרוד.',
        operationCode: 'OP-SEC-71',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 71',
        bountyReward: 8100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, עוד נתונים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אף אחד לא נוגע.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, עוד נתונים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי לה את הגנרטור.',
            reward: 8100
        }
    },
    72: {
        title: 'שלב 72',
        location: 'גזרה 72',
        objective: 'השלם את משימת גזרה 72 ושרוד.',
        operationCode: 'OP-SEC-72',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 72',
        bountyReward: 8200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'שקט יחסי. רהב שלח הודעה יהירה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המזגן עובד מושלם. המנועים שרים. הנשקים מוכנים. אני גאה בכל סנטימטר.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'שקט יחסי. רהב שלח הודעה יהירה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי לה את עצירת הזמן. בניגוד למה שרהב היה עושה עם העיצוב הכבד שלו.',
            reward: 8200
        }
    },
    73: {
        title: 'שלב 73',
        location: 'גזרה 73',
        objective: 'השלם את משימת גזרה 73 ושרוד.',
        operationCode: 'OP-SEC-73',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 73',
        bountyReward: 8300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'באונטי.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שיבואו. יש לי אנרגיה מממד מקביל ועצירת זמן. הם לא יודעים עם מי הם מתעסקים.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'באונטי.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מוכנים.',
            reward: 8300
        }
    },
    74: {
        title: 'שלב 74',
        location: 'גזרה 74',
        objective: 'השלם את משימת גזרה 74 ושרוד.',
        operationCode: 'OP-SEC-74',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 74',
        bountyReward: 8400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן. היא מקפיאה אותו.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אחר כך!'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוצרת זמן. היא מקפיאה אותו.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יורה.',
            reward: 8400
        }
    },
    75: {
        title: 'שלב 75',
        location: 'גזרה 75',
        objective: 'השלם את משימת גזרה 75 ושרוד.',
        operationCode: 'OP-SEC-75',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 75',
        bountyReward: 8500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "התמונה מתבהרת.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'כל הכבוד.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "התמונה מתבהרת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי לה עוד אנרגיה.',
            reward: 8500
        }
    },
    76: {
        title: 'שלב 76',
        location: 'גזרה 76',
        objective: 'השלם את משימת גזרה 76 ושרוד.',
        operationCode: 'OP-SEC-76',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 76',
        bountyReward: 8600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'גל בינוני.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני עוצרת זמן. שואבת אנרגיה. יורה. הכל מושלם. הטייס רק יושב שם.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'גל בינוני.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה יטפלו. לא כמו הנשקים הבוהקים של רהב שרק מושכים תשומת לב מיותרת.',
            reward: 8600
        }
    },
    77: {
        title: 'שלב 77',
        location: 'גזרה 77',
        objective: 'השלם את משימת גזרה 77 ושרוד.',
        operationCode: 'OP-SEC-77',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 77',
        bountyReward: 8700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה רעד!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלי אכלו אותם לפני שהם הבינו מה קרה. גאווה טהורה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'המגן שלה רעד!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי למה עשית את זה?!',
            reward: 8700
        }
    },
    78: {
        title: 'שלב 78',
        location: 'גזרה 78',
        objective: 'השלם את משימת גזרה 78 ושרוד.',
        operationCode: 'OP-SEC-78',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 78',
        bountyReward: 8800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי אותה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'קסם עם כפתור שאני לוחץ.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'תיקנתי אותה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'תודה.',
            reward: 8800
        }
    },
    79: {
        title: 'שלב 79',
        location: 'גזרה 79',
        objective: 'השלם את משימת גזרה 79 ושרוד.',
        operationCode: 'OP-SEC-79',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 79',
        bountyReward: 8900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, החלון פתוח. אם את עוברת – אני מכסה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנועים שרים, המזגן מושלם, הנשקים מוכנים. אני גאה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, החלון פתוח. אם את עוברת – אני מכסה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן קצר.',
            reward: 8900
        }
    },
    80: {
        title: 'שלב 80',
        location: 'גזרה 80',
        objective: 'השלם את משימת גזרה 80 ושרוד.',
        operationCode: 'OP-SEC-80',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 80',
        bountyReward: 9000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוברת צד. רשמית.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ברוכה הבאה. רק אל תיגעי בחללית שלי. ורהב עדיין ברשימה השחורה.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוברת צד. רשמית.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ברוכה הבאה. רק אל תיגעי בה. והפח המעופף של אבא שלי שיישאר רחוק מהקומפוזיציה.',
            reward: 9000
        }
    },
    81: {
        title: 'שלב 81',
        location: 'גזרה 81',
        objective: 'השלם את משימת גזרה 81 ושרוד.',
        operationCode: 'OP-SEC-81',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 81',
        bountyReward: 9100,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'המנהיג החייזרי בטווח.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'אני תוקפת ראשונה. כי אני הכי טובה.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'המנהיג החייזרי בטווח.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני תוקפת ראשונה! אני יותר מהירה!',
            reward: 9100
        }
    },
    82: {
        title: 'שלב 82',
        location: 'גזרה 82',
        objective: 'השלם את משימת גזרה 82 ושרוד.',
        operationCode: 'OP-SEC-82',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 82',
        bountyReward: 9200,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הוא חזק! אבל אני יותר טובה!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'לא נסוג.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'הוא חזק! אבל אני יותר טובה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ברור. את תמיד הכי טובה.',
            reward: 9200
        }
    },
    83: {
        title: 'שלב 83',
        location: 'גזרה 83',
        objective: 'השלם את משימת גזרה 83 ושרוד.',
        operationCode: 'OP-SEC-83',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 83',
        bountyReward: 9300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי צופה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'לא צריכים אותם.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי צופה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'לא צריכים אותם! אני מסתדרת!',
            reward: 9300
        }
    },
    84: {
        title: 'שלב 84',
        location: 'גזרה 84',
        objective: 'השלם את משימת גזרה 84 ושרוד.',
        operationCode: 'OP-SEC-84',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 84',
        bountyReward: 9400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגנים שלו נחלשים.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'עוד מכה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'המגנים שלו נחלשים.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'עוד מכה! ראית איך אני מדויקת?',
            reward: 9400
        }
    },
    85: {
        title: 'שלב 85',
        location: 'גזרה 85',
        objective: 'השלם את משימת גזרה 85 ושרוד.',
        operationCode: 'OP-SEC-85',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 85',
        bountyReward: 9500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הוא מנסה לברוח.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'אף אחד לא בורח ממני.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הוא מנסה לברוח.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'לא יברח ממני!',
            reward: 9500
        }
    },
    86: {
        title: 'שלב 86',
        location: 'גזרה 86',
        objective: 'השלם את משימת גזרה 86 ושרוד.',
        operationCode: 'OP-SEC-86',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 86',
        bountyReward: 9600,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אנרגיה אחרונה. היא נותנת הכל.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'זהו. ניצחתי.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'אנרגיה אחרונה. היא נותנת הכל.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'זהו! ניצחתי!',
            reward: 9600
        }
    },
    87: {
        title: 'שלב 87',
        location: 'גזרה 87',
        objective: 'השלם את משימת גזרה 87 ושרוד.',
        operationCode: 'OP-SEC-87',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 87',
        bountyReward: 9700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'המנהיג חוסל.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'כי אני פה.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'המנהיג חוסל.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אמרתי שאני הכי טובה!',
            reward: 9700
        }
    },
    88: {
        title: 'שלב 88',
        location: 'גזרה 88',
        objective: 'השלם את משימת גזרה 88 ושרוד.',
        operationCode: 'OP-SEC-88',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 88',
        bountyReward: 9800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד כמה פגמים. תעזור לתקן.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'אני אעזור. כי אני גם הכי טובה בתיקונים.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד כמה פגמים. תעזור לתקן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני אעזור! אני טובה גם בזה!',
            reward: 9800
        }
    },
    89: {
        title: 'שלב 89',
        location: 'גזרה 89',
        objective: 'השלם את משימת גזרה 89 ושרוד.',
        operationCode: 'OP-SEC-89',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 89',
        bountyReward: 9900,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי רוצה את הטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'הם לא יקבלו כלום.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי רוצה את הטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הם לא יקבלו! אני לא אתן!',
            reward: 9900
        }
    },
    90: {
        title: 'שלב 90',
        location: 'גזרה 90',
        objective: 'השלם את משימת גזרה 90 ושרוד.',
        operationCode: 'OP-SEC-90',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 90',
        bountyReward: 10000,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שתי חלליות. היא עדיין יותר מדויקת. אגב, הציון שלך היה רבע נקודה מעל שלה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'שלי יותר טובה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'שתי חלליות. היא עדיין יותר מדויקת. אגב, הציון שלך היה רבע נקודה מעל שלה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'שלי יותר מהירה! ויותר יפה!',
            reward: 10000
        }
    },
    91: {
        title: 'שלב 91',
        location: 'גזרה 91',
        objective: 'השלם את משימת גזרה 91 ושרוד.',
        operationCode: 'OP-SEC-91',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 91',
        bountyReward: 10100,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוזבת. מישהו צריך לסדר את הצי. ואני אעשה את זה הכי טוב!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'בטוחה?'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוזבת. מישהו צריך לסדר את הצי. ואני אעשה את זה הכי טוב!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'בטוחה? לא רוצה להישאר ולריב עוד קצת?',
            reward: 10100
        }
    },
    92: {
        title: 'שלב 92',
        location: 'גזרה 92',
        objective: 'השלם את משימת גזרה 92 ושרוד.',
        operationCode: 'OP-SEC-92',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 92',
        bountyReward: 10200,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני נשארת. מישהו צריך לשמור עליה. רבע הנקודה הזו היא הסיבה שאף אחד אחר לא יטיס אותה. כולל אותך, סרה. במיוחד לא את הפח של אבא שלי.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'תשמרו עליה. ועל עצמכם אם יש זמן.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'אני נשארת. מישהו צריך לשמור עליה. רבע הנקודה הזו היא הסיבה שאף אחד אחר לא יטיס אותה. כולל אותך, סרה. במיוחד לא את הפח של אבא שלי.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'תשמרו על עצמכם! ואני יותר טובה מכולם!',
            reward: 10200
        }
    },
    93: {
        title: 'שלב 93',
        location: 'גזרה 93',
        objective: 'השלם את משימת גזרה 93 ושרוד.',
        operationCode: 'OP-SEC-93',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 93',
        bountyReward: 10300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'אני אעזור מרחוק. ידעתי על הציון.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'סרה קיין',
            message: 'תודה. אני אסדר את הצבא.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'אני אעזור מרחוק. ידעתי על הציון.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'תודה! אני אסתדר!',
            reward: 10300
        }
    },
    94: {
        title: 'שלב 94',
        location: 'גזרה 94',
        objective: 'השלם את משימת גזרה 94 ושרוד.',
        operationCode: 'OP-SEC-94',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 94',
        bountyReward: 10400,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני יוצאת נגד הצי!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תיגעי בחללית שלי מרחוק. אני מרגישה הכל. במיוחד גניבות של רהב.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני יוצאת נגד הצי!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תיגעי בה מרחוק. והפח של אבא שלי שיתרחק מהמסגרת.',
            reward: 10400
        }
    },
    95: {
        title: 'שלב 95',
        location: 'גזרה 95',
        objective: 'השלם את משימת גזרה 95 ושרוד.',
        operationCode: 'OP-SEC-95',
        missionType: 'escort',
        missionTargetName: 'מטרת גזרה 95',
        bountyReward: 10500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עדיין יש חייזרים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ממשיכים.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עדיין יש חייזרים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ממשיכים.',
            reward: 10500
        }
    },
    96: {
        title: 'שלב 96',
        location: 'גזרה 96',
        objective: 'השלם את משימת גזרה 96 ושרוד.',
        operationCode: 'OP-SEC-96',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 96',
        bountyReward: 10600,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'סרה נגד הצבא. אנחנו נגד החייזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'והחללית קודם כל. עם עצירת זמן. תמיד.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'סרה נגד הצבא. אנחנו נגד החייזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'והיא קודם. תמיד.',
            reward: 10600
        }
    },
    97: {
        title: 'שלב 97',
        location: 'גזרה 97',
        objective: 'השלם את משימת גזרה 97 ושרוד.',
        operationCode: 'OP-SEC-97',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 97',
        bountyReward: 10700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ריכוז חדש. הנשקים שלה מוכנים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יוצאים. ואני עושה את העבודה האמיתית.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ריכוז חדש. הנשקים שלה מוכנים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יוצאים.',
            reward: 10700
        }
    },
    98: {
        title: 'שלב 98',
        location: 'גזרה 98',
        objective: 'השלם את משימת גזרה 98 ושרוד.',
        operationCode: 'OP-SEC-98',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 98',
        bountyReward: 10800,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'רגע… אני מנקה את הכתם. עם שפכטל.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'היא עדיין הכי יפה ויש לה את היכולות הכי טובות. ואם תביא שריטה אתה מקבל מכה. ורהב גם.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'רגע… אני מנקה את הכתם. עם שפכטל.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מה?!',
            reward: 10800
        }
    },
    99: {
        title: 'שלב 99',
        location: 'גזרה 99',
        objective: 'השלם את משימת גזרה 99 ושרוד.',
        operationCode: 'OP-SEC-99',
        missionType: 'standard',
        missionTargetName: 'מטרת גזרה 99',
        bountyReward: 10900,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד קרב. שמן חם מוכן. היא תמיד מוכנה. בניגוד לפח של רהב.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'תמיד יהיה עוד. ואני אטיס.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד קרב. שמן חם מוכן. היא תמיד מוכנה. בניגוד לפח של רהב.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'תמיד יהיה עוד.',
            reward: 10900
        }
    },
    100: {
        title: 'שלב 100',
        location: 'גזרה 100',
        objective: 'השלם את משימת גזרה 100 ושרוד.',
        operationCode: 'OP-SEC-100',
        missionType: 'bounty',
        missionTargetName: 'מטרת גזרה 100',
        bountyReward: 11000,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'נשארים נגד החייזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ואני נשארת נגד כל מי שנוגע בה, עם שמן חם, עצירת זמן, ואנרגיה מממד מקביל. ורהב ברשימה.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'נשארים נגד החייזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ואני נשארת נגד כל מי שנוגע בה. עכשיו אתה יודע למה. ורהב עדיין בנה פח שהורס נופים.',
            reward: 11000
        }
    },
        101: {
            title: 'תוכנית Zero // אפילוג גורלי וסיום מוחלט',
            location: 'החלל המוחלט // שער ארק-9',
            objective: 'הבס את ספינת האם של הארכון, סגור את הקשתות העלילתיות והתחל את האפילוג המלא.',
            operationCode: 'OP-FINALE-101',
            missionType: 'singularity',
            missionTargetName: 'ספינת האם העליונה של הארכון',
            bountyReward: 50000,
            contact: {
                speaker: 'ghost',
                name: 'גוסט',
                message: 'הבוס הגדול לפניך, טייס. ספינת האם של הארכון קורנת באנרגיה חשוכה. זה הזמן לסגור חשבון.'
            },
            inMissionComms: {
                speaker: 'elena',
                name: 'המפקדת אלנה וייל',
                message: 'זהו הקרב האחרון על ארק-9. תראה להם ממה עשוי טייס פרויקט Zero!'
            },
            dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הבוס הגדול לפניך, טייס. ספינת האם של הארכון קורנת באנרגיה חשוכה.' },
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'זהו הקרב האחרון על ארק-9. תראה להם ממה עשוי טייס פרויקט Zero!' },
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ותזהר על החללית שלי! פיתחתי אותה לבד מול אבא שלי, לא כדי שאיזה חייזר ימחזר אותה לפחית!' },
                { speaker: 'sera', name: 'סרה קיין', message: 'אני מחפה עליך מאגף שמאל, טייס. אל תדאג, אני אשאיר לך מספיק מקום להיראות הרואי.' },
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'רות סוף. מפעילים את כל המערכות.' }
            ],
            afterAction: {
                speaker: 'naomi',
                name: 'ד״ר נעמי רן',
                message: 'אפילוג מלא: ליבת ספינת האם התפוצצה ברגע שהטייס השמיד את המערכת. סרה משכה אותו מתוך ההריסות, ושניהם יצאו לסיור עצמאי בגבול ארק-9 תוך רמז רומנטי עדין. ד"ר נעמי ביצעה נקמה דיגיטלית מושלמת באביה, פרופסור רחב, ושידרה את שחיתותו לכל הגלקסיה לפני שסגרה עליו את המעבדה. המפקדת אלנה טהרה את הצבא והציעה לטייס ולסרה פיקוד עצמאי. החייזרים נסוגו דרך שערים רחוקים, וגוסט כבר מצא אות חדש בדרק-ווב.',
                reward: 50000
            }
        }
    };

    private static englishBriefings: Record<number, any> = {
    1: {
        title: 'Stage 1',
        location: 'Sector 1',
        objective: 'Complete mission objective in Sector 1 and survive.',
        operationCode: 'OP-SEC-1',
        missionType: 'standard',
        missionTargetName: 'Target Sector 1',
        bountyReward: 1100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'טייס, זו החללית הניסיונית. פקודות ממני בלבד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'טייס, זו החללית הניסיונית. פקודות ממני בלבד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תסתכל עליה. היא מושלמת. אם תיגע בה בידיים מלוכלכות אני אשבור לך אצבע.',
            reward: 1100
        }
    },
    2: {
        title: 'Stage 2',
        location: 'Sector 2',
        objective: 'Complete mission objective in Sector 2 and survive.',
        operationCode: 'OP-SEC-2',
        missionType: 'standard',
        missionTargetName: 'Target Sector 2',
        bountyReward: 1200,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ספינת פיראטים. לפי הפקודה – להשמיד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי הכי מדויקים בגלקסיה. תשתמש בהם יפה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ספינת פיראטים. לפי הפקודה – להשמיד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים מוכנים. תשתמש בהם יפה. היא לא אוהבת רעש מיותר.',
            reward: 1200
        }
    },
    3: {
        title: 'Stage 3',
        location: 'Sector 3',
        objective: 'Complete mission objective in Sector 3 and survive.',
        operationCode: 'OP-SEC-3',
        missionType: 'standard',
        missionTargetName: 'Target Sector 3',
        bountyReward: 1300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תשמיד מהר.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תשמיד מהר.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נסדק!',
            reward: 1300
        }
    },
    4: {
        title: 'Stage 4',
        location: 'Sector 4',
        objective: 'Complete mission objective in Sector 4 and survive.',
        operationCode: 'OP-SEC-4',
        missionType: 'standard',
        missionTargetName: 'Target Sector 4',
        bountyReward: 1400,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזרה. דיווח.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזרה. דיווח.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי אותה. הבאתי לה מטלית רכה.',
            reward: 1400
        }
    },
    5: {
        title: 'Stage 5',
        location: 'Sector 5',
        objective: 'Complete mission objective in Sector 5 and survive.',
        operationCode: 'OP-SEC-5',
        missionType: 'escort',
        missionTargetName: 'Target Sector 5',
        bountyReward: 1500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ליווי שיירה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'תראה איך היא מחליקה. זו לא craft, זו יצירת אמנות.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ליווי שיירה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'היא מחליקה בין האסטרואידים כאילו נולדה לזה.',
            reward: 1500
        }
    },
    6: {
        title: 'Stage 6',
        location: 'Sector 6',
        objective: 'Complete mission objective in Sector 6 and survive.',
        operationCode: 'OP-SEC-6',
        missionType: 'standard',
        missionTargetName: 'Target Sector 6',
        bountyReward: 1600,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תקיפה. הגיב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תקיפה. הגיב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנוע שלה רעד. היא לא אוהבת כשמרעידים אותה.',
            reward: 1600
        }
    },
    7: {
        title: 'Stage 7',
        location: 'Sector 7',
        objective: 'Complete mission objective in Sector 7 and survive.',
        operationCode: 'OP-SEC-7',
        missionType: 'standard',
        missionTargetName: 'Target Sector 7',
        bountyReward: 1700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיימת. חזור.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיימת. חזור.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי לה את הקירור. עכשיו היא יותר יציבה.',
            reward: 1700
        }
    },
    8: {
        title: 'Stage 8',
        location: 'Sector 8',
        objective: 'Complete mission objective in Sector 8 and survive.',
        operationCode: 'OP-SEC-8',
        missionType: 'standard',
        missionTargetName: 'Target Sector 8',
        bountyReward: 1800,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק עליה אני אדפוק לך בראש.',
            reward: 1800
        }
    },
    9: {
        title: 'Stage 9',
        location: 'Sector 9',
        objective: 'Complete mission objective in Sector 9 and survive.',
        operationCode: 'OP-SEC-9',
        missionType: 'standard',
        missionTargetName: 'Target Sector 9',
        bountyReward: 1900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אין תנועה. חזור.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אין תנועה. חזור.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון האחרון היה מדויק. היא אהבה אותו.',
            reward: 1900
        }
    },
    10: {
        title: 'Stage 10',
        location: 'Sector 10',
        objective: 'Complete mission objective in Sector 10 and survive.',
        operationCode: 'OP-SEC-10',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 10',
        bountyReward: 2000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר ציד מבוקשים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר ציד מבוקשים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תשמור עליה. חייך פחות חשובים ממנה.',
            reward: 2000
        }
    },
    11: {
        title: 'Stage 11',
        location: 'Sector 11',
        objective: 'Complete mission objective in Sector 11 and survive.',
        operationCode: 'OP-SEC-11',
        missionType: 'standard',
        missionTargetName: 'Target Sector 11',
        bountyReward: 2100,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'היי טייס, פרצתי לערוץ. יש לי מבוקשים עם כסף.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'היי טייס, פרצתי לערוץ. יש לי מבוקשים עם כסף.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מי זה?',
            reward: 2100
        }
    },
    12: {
        title: 'Stage 12',
        location: 'Sector 12',
        objective: 'Complete mission objective in Sector 12 and survive.',
        operationCode: 'OP-SEC-12',
        missionType: 'standard',
        missionTargetName: 'Target Sector 12',
        bountyReward: 2200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'קפטן ראזר. חצי מיליון.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'Commander Elena Vail',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'קפטן ראזר. חצי מיליון.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'משימה רשמית. לחסל.',
            reward: 2200
        }
    },
    13: {
        title: 'Stage 13',
        location: 'Sector 13',
        objective: 'Complete mission objective in Sector 13 and survive.',
        operationCode: 'OP-SEC-13',
        missionType: 'standard',
        missionTargetName: 'Target Sector 13',
        bountyReward: 2300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכתם הזה לא יורד. ניסיתי שלושה סוגי ממסים. היא לא אוהבת אותו.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'GHOST',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכתם הזה לא יורד. ניסיתי שלושה סוגי ממסים. היא לא אוהבת אותו.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הוא ליד אוריון.',
            reward: 2300
        }
    },
    14: {
        title: 'Stage 14',
        location: 'Sector 14',
        objective: 'Complete mission objective in Sector 14 and survive.',
        operationCode: 'OP-SEC-14',
        missionType: 'standard',
        missionTargetName: 'Target Sector 14',
        bountyReward: 2400,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'השמד.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'השמד.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נשבר!',
            reward: 2400
        }
    },
    15: {
        title: 'Stage 15',
        location: 'Sector 15',
        objective: 'Complete mission objective in Sector 15 and survive.',
        operationCode: 'OP-SEC-15',
        missionType: 'escort',
        missionTargetName: 'Target Sector 15',
        bountyReward: 2500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יפה. הכסף בדרך.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'Commander Elena Vail',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יפה. הכסף בדרך.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור. דיווח.',
            reward: 2500
        }
    },
    16: {
        title: 'Stage 16',
        location: 'Sector 16',
        objective: 'Complete mission objective in Sector 16 and survive.',
        operationCode: 'OP-SEC-16',
        missionType: 'standard',
        missionTargetName: 'Target Sector 16',
        bountyReward: 2600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'ליידי ווקס.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי כמהים אליה. תן להם לעבוד.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'ליידי ווקס.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מחכים.',
            reward: 2600
        }
    },
    17: {
        title: 'Stage 17',
        location: 'Sector 17',
        objective: 'Complete mission objective in Sector 17 and survive.',
        operationCode: 'OP-SEC-17',
        missionType: 'standard',
        missionTargetName: 'Target Sector 17',
        bountyReward: 2700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אל תיתן לה לברוח.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'GHOST',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אל תיתן לה לברוח.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'ענני האבק של נבולה סל.',
            reward: 2700
        }
    },
    18: {
        title: 'Stage 18',
        location: 'Sector 18',
        objective: 'Complete mission objective in Sector 18 and survive.',
        operationCode: 'OP-SEC-18',
        missionType: 'standard',
        missionTargetName: 'Target Sector 18',
        bountyReward: 2800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה שריטה!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'יש לה שריטה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי למה עשית את זה?!',
            reward: 2800
        }
    },
    19: {
        title: 'Stage 19',
        location: 'Sector 19',
        objective: 'Complete mission objective in Sector 19 and survive.',
        operationCode: 'OP-SEC-19',
        missionType: 'standard',
        missionTargetName: 'Target Sector 19',
        bountyReward: 2900,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עוד אחד מחכה.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'Commander Elena Vail',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עוד אחד מחכה.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'דיווח ואז מנוחה.',
            reward: 2900
        }
    },
    20: {
        title: 'Stage 20',
        location: 'Sector 20',
        objective: 'Complete mission objective in Sector 20 and survive.',
        operationCode: 'OP-SEC-20',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 20',
        bountyReward: 3000,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'משהו בצבא שלכם מסריח.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'משהו בצבא שלכם מסריח.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הריח היחיד שהיא מרגישה זה שמן חדש. וביג-מק.',
            reward: 3000
        }
    },
    21: {
        title: 'Stage 21',
        location: 'Sector 21',
        objective: 'Complete mission objective in Sector 21 and survive.',
        operationCode: 'OP-SEC-21',
        missionType: 'standard',
        missionTargetName: 'Target Sector 21',
        bountyReward: 3100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'ספינת מבריחים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'ספינת מבריחים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יוצא.',
            reward: 3100
        }
    },
    22: {
        title: 'Stage 22',
        location: 'Sector 22',
        objective: 'Complete mission objective in Sector 22 and survive.',
        operationCode: 'OP-SEC-22',
        missionType: 'standard',
        missionTargetName: 'Target Sector 22',
        bountyReward: 3200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הם נושאים משהו שהצבא רוצה.'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'Commander Elena Vail',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הם נושאים משהו שהצבא רוצה.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'בצע.',
            reward: 3200
        }
    },
    23: {
        title: 'Stage 23',
        location: 'Sector 23',
        objective: 'Complete mission objective in Sector 23 and survive.',
        operationCode: 'OP-SEC-23',
        missionType: 'standard',
        missionTargetName: 'Target Sector 23',
        bountyReward: 3300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד כתם קטן ליד הישן!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד כתם קטן ליד הישן!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זה אור…',
            reward: 3300
        }
    },
    24: {
        title: 'Stage 24',
        location: 'Sector 24',
        objective: 'Complete mission objective in Sector 24 and survive.',
        operationCode: 'OP-SEC-24',
        missionType: 'standard',
        missionTargetName: 'Target Sector 24',
        bountyReward: 3400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצבא שותק על הפלישות.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצבא שותק על הפלישות.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי לה את חיישן הלחץ. ניסיתי עוד ממס על הכתם. כלום.',
            reward: 3400
        }
    },
    25: {
        title: 'Stage 25',
        location: 'Sector 25',
        objective: 'Complete mission objective in Sector 25 and survive.',
        operationCode: 'OP-SEC-25',
        missionType: 'escort',
        missionTargetName: 'Target Sector 25',
        bountyReward: 3500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם תחזור עם אבק עליה – מפתח שבדי.',
            reward: 3500
        }
    },
    26: {
        title: 'Stage 26',
        location: 'Sector 26',
        objective: 'Complete mission objective in Sector 26 and survive.',
        operationCode: 'OP-SEC-26',
        missionType: 'standard',
        missionTargetName: 'Target Sector 26',
        bountyReward: 3600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'תנועות חייזריות. הצי מעלים עין.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'תנועות חייזריות. הצי מעלים עין.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'התמרון שלה היה מדויק.',
            reward: 3600
        }
    },
    27: {
        title: 'Stage 27',
        location: 'Sector 27',
        objective: 'Complete mission objective in Sector 27 and survive.',
        operationCode: 'OP-SEC-27',
        missionType: 'standard',
        missionTargetName: 'Target Sector 27',
        bountyReward: 3700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור מיד. אין רשות להתערב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזור מיד. אין רשות להתערב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף פקודה ששומרת עליה.',
            reward: 3700
        }
    },
    28: {
        title: 'Stage 28',
        location: 'Sector 28',
        objective: 'Complete mission objective in Sector 28 and survive.',
        operationCode: 'OP-SEC-28',
        missionType: 'standard',
        missionTargetName: 'Target Sector 28',
        bountyReward: 3800,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יש קשר בין הפלישות לטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יש קשר בין הפלישות לטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מישהו העתיק אותה. אני חושדת חזק שזה אבא שלי.',
            reward: 3800
        }
    },
    29: {
        title: 'Stage 29',
        location: 'Sector 29',
        objective: 'Complete mission objective in Sector 29 and survive.',
        operationCode: 'OP-SEC-29',
        missionType: 'standard',
        missionTargetName: 'Target Sector 29',
        bountyReward: 3900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר תפגוש את סרה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'יש לה craft דומה?! מי העתיק את היצירה שלי?! בטח הפרופסור רהב הטיפש הזה!'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר תפגוש את סרה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה חללית דומה. בטח רהב. אף אחד אחר לא מסוגל להבין אותה.',
            reward: 3900
        }
    },
    30: {
        title: 'Stage 30',
        location: 'Sector 30',
        objective: 'Complete mission objective in Sector 30 and survive.',
        operationCode: 'OP-SEC-30',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 30',
        bountyReward: 4000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'דו-קרב. לפי פקודה מלמעלה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אם היא תיגע בcraft שלי אני אפרק אותה ואז אבנה אותה מחדש יותר טוב. ואת רהב אני אהרוג.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'דו-קרב. לפי פקודה מלמעלה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם היא תיגע בה אני אפרק אותה. ואת רהב נדבר אחר כך.',
            reward: 4000
        }
    },
    31: {
        title: 'Stage 31',
        location: 'Sector 31',
        objective: 'Complete mission objective in Sector 31 and survive.',
        operationCode: 'OP-SEC-31',
        missionType: 'standard',
        missionTargetName: 'Target Sector 31',
        bountyReward: 4100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'בעוד שעה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי מוכנים. הם הכי מדויקים. רהב בטח גנב גם את הרעיון שלהם.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'בעוד שעה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מוכנים.',
            reward: 4100
        }
    },
    32: {
        title: 'Stage 32',
        location: 'Sector 32',
        objective: 'Complete mission objective in Sector 32 and survive.',
        operationCode: 'OP-SEC-32',
        missionType: 'standard',
        missionTargetName: 'Target Sector 32',
        bountyReward: 4200,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'בוא נגמור מהר.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'בוא נגמור מהר.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מוכן.',
            reward: 4200
        }
    },
    33: {
        title: 'Stage 33',
        location: 'Sector 33',
        objective: 'Complete mission objective in Sector 33 and survive.',
        operationCode: 'OP-SEC-33',
        missionType: 'standard',
        missionTargetName: 'Target Sector 33',
        bountyReward: 4300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'תיקו. שניכם חוזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'תיקו. שניכם חוזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש לה שריטה. ורהב כנראה גנב לי חלקים ממנה. אף אחד אחר לא יודע איך היא בנויה.',
            reward: 4300
        }
    },
    34: {
        title: 'Stage 34',
        location: 'Sector 34',
        objective: 'Complete mission objective in Sector 34 and survive.',
        operationCode: 'OP-SEC-34',
        missionType: 'standard',
        missionTargetName: 'Target Sector 34',
        bountyReward: 4400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי הזמין את הפלישות בכוונה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי הזמין את הפלישות בכוונה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'קיבלתי גנבים וכתמים. רהב…',
            reward: 4400
        }
    },
    35: {
        title: 'Stage 35',
        location: 'Sector 35',
        objective: 'Complete mission objective in Sector 35 and survive.',
        operationCode: 'OP-SEC-35',
        missionType: 'escort',
        missionTargetName: 'Target Sector 35',
        bountyReward: 4500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'פקודות מלמעלה. ממשיכים לציית.'
        },
        inMissionComms: {
            speaker: 'ghost',
            name: 'GHOST',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'פקודות מלמעלה. ממשיכים לציית.' }
        ],
        afterAction: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'אילנה, זה רקוב.',
            reward: 4500
        }
    },
    36: {
        title: 'Stage 36',
        location: 'Sector 36',
        objective: 'Complete mission objective in Sector 36 and survive.',
        operationCode: 'OP-SEC-36',
        missionType: 'standard',
        missionTargetName: 'Target Sector 36',
        bountyReward: 4600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'סרה עדיין חושבת שהיא הכי טובה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'סרה עדיין חושבת שהיא הכי טובה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תתחיל.',
            reward: 4600
        }
    },
    37: {
        title: 'Stage 37',
        location: 'Sector 37',
        objective: 'Complete mission objective in Sector 37 and survive.',
        operationCode: 'OP-SEC-37',
        missionType: 'standard',
        missionTargetName: 'Target Sector 37',
        bountyReward: 4700,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'משימה נוספת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'משימה נוספת.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אילנה, את לא מרגישה שמשהו פה לא בסדר כבר הרבה זמן?',
            reward: 4700
        }
    },
    38: {
        title: 'Stage 38',
        location: 'Sector 38',
        objective: 'Complete mission objective in Sector 38 and survive.',
        operationCode: 'OP-SEC-38',
        missionType: 'standard',
        missionTargetName: 'Target Sector 38',
        bountyReward: 4800,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עוד מבוקש.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עוד מבוקש.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'לפעמים אני שואל למי אנחנו באמת עובדים.',
            reward: 4800
        }
    },
    39: {
        title: 'Stage 39',
        location: 'Sector 39',
        objective: 'Complete mission objective in Sector 39 and survive.',
        operationCode: 'OP-SEC-39',
        missionType: 'standard',
        missionTargetName: 'Target Sector 39',
        bountyReward: 4900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'חזור. דיווח.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'חזור. דיווח.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'המטרה חוסלה. שוב.',
            reward: 4900
        }
    },
    40: {
        title: 'Stage 40',
        location: 'Sector 40',
        objective: 'Complete mission objective in Sector 40 and survive.',
        operationCode: 'OP-SEC-40',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 40',
        bountyReward: 5000,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי שותק יותר מדי.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי שותק יותר מדי.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'השתיקה הזו מתחילה להרגיש מסוכנת.',
            reward: 5000
        }
    },
    41: {
        title: 'Stage 41',
        location: 'Sector 41',
        objective: 'Complete mission objective in Sector 41 and survive.',
        operationCode: 'OP-SEC-41',
        missionType: 'standard',
        missionTargetName: 'Target Sector 41',
        bountyReward: 5100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'סיור בגבול.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי רעבים. וגם אני רעבה כי המזגן לא עובד ויש לי חם.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'סיור בגבול.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ואם נראה משהו שאסור לנו לראות?',
            reward: 5100
        }
    },
    42: {
        title: 'Stage 42',
        location: 'Sector 42',
        objective: 'Complete mission objective in Sector 42 and survive.',
        operationCode: 'OP-SEC-42',
        missionType: 'standard',
        missionTargetName: 'Target Sector 42',
        bountyReward: 5200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'תנועות חייזריות גדולות. הצי מעלים עין.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'תנועות חייזריות גדולות. הצי מעלים עין.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'כמה פעמים עוד אפשר להעלים עין?',
            reward: 5200
        }
    },
    43: {
        title: 'Stage 43',
        location: 'Sector 43',
        objective: 'Complete mission objective in Sector 43 and survive.',
        operationCode: 'OP-SEC-43',
        missionType: 'standard',
        missionTargetName: 'Target Sector 43',
        bountyReward: 5300,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אין רשות להתערב. חזור.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אין רשות להתערב. חזור.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'את באמת עדיין מאמינה שזה רק פקודות?',
            reward: 5300
        }
    },
    44: {
        title: 'Stage 44',
        location: 'Sector 44',
        objective: 'Complete mission objective in Sector 44 and survive.',
        operationCode: 'OP-SEC-44',
        missionType: 'standard',
        missionTargetName: 'Target Sector 44',
        bountyReward: 5400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'יש קשר ברור בין הפלישות לטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'יש קשר ברור בין הפלישות לטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מישהו משחק משחק גדול מאיתנו.',
            reward: 5400
        }
    },
    45: {
        title: 'Stage 45',
        location: 'Sector 45',
        objective: 'Complete mission objective in Sector 45 and survive.',
        operationCode: 'OP-SEC-45',
        missionType: 'escort',
        missionTargetName: 'Target Sector 45',
        bountyReward: 5500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'מחר עוד מפגש עם סרה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'מחר עוד מפגש עם סרה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ואם הפעם זה לא ייגמר בתיקו?',
            reward: 5500
        }
    },
    46: {
        title: 'Stage 46',
        location: 'Sector 46',
        objective: 'Complete mission objective in Sector 46 and survive.',
        operationCode: 'OP-SEC-46',
        missionType: 'standard',
        missionTargetName: 'Target Sector 46',
        bountyReward: 5600,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אני מורד. בורחים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'אני מורד. בורחים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'רק אם היא לא תיפגע. אחרת אני נשארת.',
            reward: 5600
        }
    },
    47: {
        title: 'Stage 47',
        location: 'Sector 47',
        objective: 'Complete mission objective in Sector 47 and survive.',
        operationCode: 'OP-SEC-47',
        missionType: 'standard',
        missionTargetName: 'Target Sector 47',
        bountyReward: 5700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'מסלול פתוח. תברחו.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי אכלו אותו. מושלמים. ואני עדיין חמה כמו תנור.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'מסלול פתוח. תברחו.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מפעילה בריחה. המנועים שלה יציבים.',
            reward: 5700
        }
    },
    48: {
        title: 'Stage 48',
        location: 'Sector 48',
        objective: 'Complete mission objective in Sector 48 and survive.',
        operationCode: 'OP-SEC-48',
        missionType: 'standard',
        missionTargetName: 'Target Sector 48',
        bountyReward: 5800,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'כל הצי רודף אחריכם!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'כל הצי רודף אחריכם!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אם מישהו ייגע בה – אני אמצא אותו.',
            reward: 5800
        }
    },
    49: {
        title: 'Stage 49',
        location: 'Sector 49',
        objective: 'Complete mission objective in Sector 49 and survive.',
        operationCode: 'OP-SEC-49',
        missionType: 'standard',
        missionTargetName: 'Target Sector 49',
        bountyReward: 5900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'טייס, בית דין. נעמי, את תאבדי הכל!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'טייס, בית דין. נעמי, את תאבדי הכל!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המנוע שלה רעד. היא עייפה.',
            reward: 5900
        }
    },
    50: {
        title: 'Stage 50',
        location: 'Sector 50',
        objective: 'Complete mission objective in Sector 50 and survive.',
        operationCode: 'OP-SEC-50',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 50',
        bountyReward: 6000,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: 'אתם תיתפסו!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'אתם תיתפסו!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'נכנסים לחגורת אסטרואידים. היא לא אוהבת צפיפות.',
            reward: 6000
        }
    },
    51: {
        title: 'Stage 51',
        location: 'Sector 51',
        objective: 'Complete mission objective in Sector 51 and survive.',
        operationCode: 'OP-SEC-51',
        missionType: 'standard',
        missionTargetName: 'Target Sector 51',
        bountyReward: 6100,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'השמשות שלה מלאות באבק!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אני עוצרת זמן לרגע. תראו איזה יופי של יכולת. זה לא הPilot, זה אני.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'השמשות שלה מלאות באבק!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'עף לפי חיישנים.',
            reward: 6100
        }
    },
    52: {
        title: 'Stage 52',
        location: 'Sector 52',
        objective: 'Complete mission objective in Sector 52 and survive.',
        operationCode: 'OP-SEC-52',
        missionType: 'standard',
        missionTargetName: 'Target Sector 52',
        bountyReward: 6200,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכנף שלה שרטה! והכתם עדיין שם! ניסיתי כבר כל חומר ביקום חוץ משפכטל!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'המגן כמעט נסדק מהגל! Pilot אתה אשם! ובנוסף רהב גנב לי את הרעיון של המגנים!'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכנף שלה שרטה! והכתם עדיין שם! ניסיתי כבר כל חומר ביקום חוץ משפכטל!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אולי פשוט…',
            reward: 6200
        }
    },
    53: {
        title: 'Stage 53',
        location: 'Sector 53',
        objective: 'Complete mission objective in Sector 53 and survive.',
        operationCode: 'OP-SEC-53',
        missionType: 'standard',
        missionTargetName: 'Target Sector 53',
        bountyReward: 6300,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מערכת ההסוואה שלה מהבהבת!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'שאבתי אנרגיה מממד מקביל. עכשיו weapons שלי חזקים פי שניים. גאווה טהורה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'מערכת ההסוואה שלה מהבהבת!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'זה הרטט.',
            reward: 6300
        }
    },
    54: {
        title: 'Stage 54',
        location: 'Sector 54',
        objective: 'Complete mission objective in Sector 54 and survive.',
        operationCode: 'OP-SEC-54',
        missionType: 'standard',
        missionTargetName: 'Target Sector 54',
        bountyReward: 6400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הגנרטור שלה משתעל!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הגנרטור שלה משתעל!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'מחזיק אותה יציב.',
            reward: 6400
        }
    },
    55: {
        title: 'Stage 55',
        location: 'Sector 55',
        objective: 'Complete mission objective in Sector 55 and survive.',
        operationCode: 'OP-SEC-55',
        missionType: 'escort',
        missionTargetName: 'Target Sector 55',
        bountyReward: 6500,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'יש שבבים על הריצפה שלה!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'יש שבבים על הריצפה שלה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'אחר כך!',
            reward: 6500
        }
    },
    56: {
        title: 'Stage 56',
        location: 'Sector 56',
        objective: 'Complete mission objective in Sector 56 and survive.',
        operationCode: 'OP-SEC-56',
        missionType: 'standard',
        missionTargetName: 'Target Sector 56',
        bountyReward: 6600,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הניווט שלה מראה שלושה מסלולים!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אני עוצרת זמן שוב. תראו. מושלם. הPilot רק לוחץ כפתורים.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הניווט שלה מראה שלושה מסלולים!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'בוחר באחד.',
            reward: 6600
        }
    },
    57: {
        title: 'Stage 57',
        location: 'Sector 57',
        objective: 'Complete mission objective in Sector 57 and survive.',
        operationCode: 'OP-SEC-57',
        missionType: 'standard',
        missionTargetName: 'Target Sector 57',
        bountyReward: 6700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'השמשות שלה מתחילות להיסדק!'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'השמשות שלה מתחילות להיסדק!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'עוד קצת.',
            reward: 6700
        }
    },
    58: {
        title: 'Stage 58',
        location: 'Sector 58',
        objective: 'Complete mission objective in Sector 58 and survive.',
        operationCode: 'OP-SEC-58',
        missionType: 'standard',
        missionTargetName: 'Target Sector 58',
        bountyReward: 6800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הכל רוטט עליה!'
        },
        inMissionComms: {
            speaker: 'elena',
            name: 'Commander Elena Vail',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'הכל רוטט עליה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי זה כמעט פגע בי!',
            reward: 6800
        }
    },
    59: {
        title: 'Stage 59',
        location: 'Sector 59',
        objective: 'Complete mission objective in Sector 59 and survive.',
        operationCode: 'OP-SEC-59',
        missionType: 'standard',
        missionTargetName: 'Target Sector 59',
        bountyReward: 6900,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ההסוואה שלה נשרפה!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ההסוואה שלה נשרפה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יצאנו!',
            reward: 6900
        }
    },
    60: {
        title: 'Stage 60',
        location: 'Sector 60',
        objective: 'Complete mission objective in Sector 60 and survive.',
        operationCode: 'OP-SEC-60',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 60',
        bountyReward: 7000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'מצאתי אתכם. אני רודפת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'מצאתי אתכם. אני רודפת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'היא שבורה. ורהב בטח גאה בפח המעופף שהוא בנה לה.',
            reward: 7000
        }
    },
    61: {
        title: 'Stage 61',
        location: 'Sector 61',
        objective: 'Complete mission objective in Sector 61 and survive.',
        operationCode: 'OP-SEC-61',
        missionType: 'standard',
        missionTargetName: 'Target Sector 61',
        bountyReward: 7100,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני מאחוריכם.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני מאחוריכם.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן. תנצל. היא צריכה רגע. רהב כנראה לא לימד אותה לחכות.',
            reward: 7100
        }
    },
    62: {
        title: 'Stage 62',
        location: 'Sector 62',
        objective: 'Complete mission objective in Sector 62 and survive.',
        operationCode: 'OP-SEC-62',
        missionType: 'standard',
        missionTargetName: 'Target Sector 62',
        bountyReward: 7200,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה מקבלת פקודות להשמיד. אני מעכבת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה מקבלת פקודות להשמיד. אני מעכבת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה כמעט נסדק!',
            reward: 7200
        }
    },
    63: {
        title: 'Stage 63',
        location: 'Sector 63',
        objective: 'Complete mission objective in Sector 63 and survive.',
        operationCode: 'OP-SEC-63',
        missionType: 'standard',
        missionTargetName: 'Target Sector 63',
        bountyReward: 7300,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'עדיין רודפת.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי רעבים. ואני גאה בהם כל כך שאני כמעט שוכחת את רהב.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'עדיין רודפת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי לה אנרגיה. הנשקים שלה יציבים. בניגוד לנשקים הבוהקים של אבא שלי שרק מושכים אש.',
            reward: 7300
        }
    },
    64: {
        title: 'Stage 64',
        location: 'Sector 64',
        objective: 'Complete mission objective in Sector 64 and survive.',
        operationCode: 'OP-SEC-64',
        missionType: 'standard',
        missionTargetName: 'Target Sector 64',
        bountyReward: 7400,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'גל חייזרים קטן.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'גל חייזרים קטן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני רואה.',
            reward: 7400
        }
    },
    65: {
        title: 'Stage 65',
        location: 'Sector 65',
        objective: 'Complete mission objective in Sector 65 and survive.',
        operationCode: 'OP-SEC-65',
        missionType: 'escort',
        missionTargetName: 'Target Sector 65',
        bountyReward: 7500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, תסתכלי על הנתונים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, תסתכלי על הנתונים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הגנרטור שלה עדיין חלש. בניגוד לפח של רהב שרק מרעיש ומרגיז.',
            reward: 7500
        }
    },
    66: {
        title: 'Stage 66',
        location: 'Sector 66',
        objective: 'Complete mission objective in Sector 66 and survive.',
        operationCode: 'OP-SEC-66',
        missionType: 'standard',
        missionTargetName: 'Target Sector 66',
        bountyReward: 7600,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני ממשיכה… אבל הנתונים…'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי יטפלו. הם הכי טובים. ואני הכי טובה שבנתה אותם.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני ממשיכה… אבל הנתונים…' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן שוב. היא צריכה שקט. לא כמו החללית הרועשת של אבא שלי שהורסת את כל הסאונדסקייפ.',
            reward: 7600
        }
    },
    67: {
        title: 'Stage 67',
        location: 'Sector 67',
        objective: 'Complete mission objective in Sector 67 and survive.',
        operationCode: 'OP-SEC-67',
        missionType: 'standard',
        missionTargetName: 'Target Sector 67',
        bountyReward: 7700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'באונטי קטן.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'באונטי קטן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אתם עוצרים לציד?!',
            reward: 7700
        }
    },
    68: {
        title: 'Stage 68',
        location: 'Sector 68',
        objective: 'Complete mission objective in Sector 68 and survive.',
        operationCode: 'OP-SEC-68',
        missionType: 'standard',
        missionTargetName: 'Target Sector 68',
        bountyReward: 7800,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'מתקרבת.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'מתקרבת.' }
        ],
        afterAction: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "יש חלון. אני מעכבת תגבורת.',
            reward: 7800
        }
    },
    69: {
        title: 'Stage 69',
        location: 'Sector 69',
        objective: 'Complete mission objective in Sector 69 and survive.',
        operationCode: 'OP-SEC-69',
        missionType: 'standard',
        missionTargetName: 'Target Sector 69',
        bountyReward: 7900,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הנתונים… וההוראה מחגורה…'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אני עוצרת זמן לשלוש שניות מלאות. תראו. מושלם. הPilot רק צופה.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'הנתונים… וההוראה מחגורה…' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'כן. ורהב גנב לי חלקים ממנה. עכשיו הפח שלו הורס לי את הקומפוזיציה של כל הגזרה.',
            reward: 7900
        }
    },
    70: {
        title: 'Stage 70',
        location: 'Sector 70',
        objective: 'Complete mission objective in Sector 70 and survive.',
        operationCode: 'OP-SEC-70',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 70',
        bountyReward: 8000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוצרת. צריכה לחשוב.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שרים כשהם יורים. תשמעו. זה בגלל השדרוג שלי.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוצרת. צריכה לחשוב.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'סוף סוף. עכשיו אפשר לנסות שוב את הכתם.',
            reward: 8000
        }
    },
    71: {
        title: 'Stage 71',
        location: 'Sector 71',
        objective: 'Complete mission objective in Sector 71 and survive.',
        operationCode: 'OP-SEC-71',
        missionType: 'standard',
        missionTargetName: 'Target Sector 71',
        bountyReward: 8100,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, עוד נתונים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, עוד נתונים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי לה את הגנרטור.',
            reward: 8100
        }
    },
    72: {
        title: 'Stage 72',
        location: 'Sector 72',
        objective: 'Complete mission objective in Sector 72 and survive.',
        operationCode: 'OP-SEC-72',
        missionType: 'standard',
        missionTargetName: 'Target Sector 72',
        bountyReward: 8200,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'שקט יחסי. רהב שלח הודעה יהירה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'המזגן עובד מושלם. המנועים שרים. weapons מוכנים. אני גאה בכל סנטימטר.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'שקט יחסי. רהב שלח הודעה יהירה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שדרגתי לה את עצירת הזמן. בניגוד למה שרהב היה עושה עם העיצוב הכבד שלו.',
            reward: 8200
        }
    },
    73: {
        title: 'Stage 73',
        location: 'Sector 73',
        objective: 'Complete mission objective in Sector 73 and survive.',
        operationCode: 'OP-SEC-73',
        missionType: 'standard',
        missionTargetName: 'Target Sector 73',
        bountyReward: 8300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'באונטי.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'באונטי.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה מוכנים.',
            reward: 8300
        }
    },
    74: {
        title: 'Stage 74',
        location: 'Sector 74',
        objective: 'Complete mission objective in Sector 74 and survive.',
        operationCode: 'OP-SEC-74',
        missionType: 'standard',
        missionTargetName: 'Target Sector 74',
        bountyReward: 8400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן. היא מקפיאה אותו.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוצרת זמן. היא מקפיאה אותו.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יורה.',
            reward: 8400
        }
    },
    75: {
        title: 'Stage 75',
        location: 'Sector 75',
        objective: 'Complete mission objective in Sector 75 and survive.',
        operationCode: 'OP-SEC-75',
        missionType: 'escort',
        missionTargetName: 'Target Sector 75',
        bountyReward: 8500,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "התמונה מתבהרת.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "התמונה מתבהרת.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שאבתי לה עוד אנרגיה.',
            reward: 8500
        }
    },
    76: {
        title: 'Stage 76',
        location: 'Sector 76',
        objective: 'Complete mission objective in Sector 76 and survive.',
        operationCode: 'OP-SEC-76',
        missionType: 'standard',
        missionTargetName: 'Target Sector 76',
        bountyReward: 8600,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'גל בינוני.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אני עוצרת זמן. שואבת אנרגיה. יורה. הכל מושלם. הPilot רק יושב שם.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'גל בינוני.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'הנשקים שלה יטפלו. לא כמו הנשקים הבוהקים של רהב שרק מושכים תשומת לב מיותרת.',
            reward: 8600
        }
    },
    77: {
        title: 'Stage 77',
        location: 'Sector 77',
        objective: 'Complete mission objective in Sector 77 and survive.',
        operationCode: 'OP-SEC-77',
        missionType: 'standard',
        missionTargetName: 'Target Sector 77',
        bountyReward: 8700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגן שלה רעד!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'weapons שלי אכלו אותם לפני שהם הבינו מה קרה. גאווה טהורה.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'המגן שלה רעד!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'איי למה עשית את זה?!',
            reward: 8700
        }
    },
    78: {
        title: 'Stage 78',
        location: 'Sector 78',
        objective: 'Complete mission objective in Sector 78 and survive.',
        operationCode: 'OP-SEC-78',
        missionType: 'standard',
        missionTargetName: 'Target Sector 78',
        bountyReward: 8800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'תיקנתי אותה.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'תיקנתי אותה.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'תודה.',
            reward: 8800
        }
    },
    79: {
        title: 'Stage 79',
        location: 'Sector 79',
        objective: 'Complete mission objective in Sector 79 and survive.',
        operationCode: 'OP-SEC-79',
        missionType: 'standard',
        missionTargetName: 'Target Sector 79',
        bountyReward: 8900,
        contact: {
            speaker: 'elena',
            name: 'המפקדת אלנה וייל',
            message: '(סודי) "סרה, החלון פתוח. אם את עוברת – אני מכסה.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'המנועים שרים, המזגן מושלם, weapons מוכנים. אני גאה.'
        },
        dialogueSequence: [
                { speaker: 'elena', name: 'המפקדת אלנה וייל', message: '(סודי) "סרה, החלון פתוח. אם את עוברת – אני מכסה.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוצרת זמן קצר.',
            reward: 8900
        }
    },
    80: {
        title: 'Stage 80',
        location: 'Sector 80',
        objective: 'Complete mission objective in Sector 80 and survive.',
        operationCode: 'OP-SEC-80',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 80',
        bountyReward: 9000,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוברת צד. רשמית.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'ברוכה הבאה. רק אל תיגעי בcraft שלי. ורהב עדיין ברשימה השחורה.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוברת צד. רשמית.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ברוכה הבאה. רק אל תיגעי בה. והפח המעופף של אבא שלי שיישאר רחוק מהקומפוזיציה.',
            reward: 9000
        }
    },
    81: {
        title: 'Stage 81',
        location: 'Sector 81',
        objective: 'Complete mission objective in Sector 81 and survive.',
        operationCode: 'OP-SEC-81',
        missionType: 'standard',
        missionTargetName: 'Target Sector 81',
        bountyReward: 9100,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'המנהיג החייזרי בטווח.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'המנהיג החייזרי בטווח.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני תוקפת ראשונה! אני יותר מהירה!',
            reward: 9100
        }
    },
    82: {
        title: 'Stage 82',
        location: 'Sector 82',
        objective: 'Complete mission objective in Sector 82 and survive.',
        operationCode: 'OP-SEC-82',
        missionType: 'standard',
        missionTargetName: 'Target Sector 82',
        bountyReward: 9200,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הוא חזק! אבל אני יותר טובה!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'הוא חזק! אבל אני יותר טובה!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ברור. את תמיד הכי טובה.',
            reward: 9200
        }
    },
    83: {
        title: 'Stage 83',
        location: 'Sector 83',
        objective: 'Complete mission objective in Sector 83 and survive.',
        operationCode: 'OP-SEC-83',
        missionType: 'standard',
        missionTargetName: 'Target Sector 83',
        bountyReward: 9300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי צופה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי צופה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'לא צריכים אותם! אני מסתדרת!',
            reward: 9300
        }
    },
    84: {
        title: 'Stage 84',
        location: 'Sector 84',
        objective: 'Complete mission objective in Sector 84 and survive.',
        operationCode: 'OP-SEC-84',
        missionType: 'standard',
        missionTargetName: 'Target Sector 84',
        bountyReward: 9400,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'המגנים שלו נחלשים.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'המגנים שלו נחלשים.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'עוד מכה! ראית איך אני מדויקת?',
            reward: 9400
        }
    },
    85: {
        title: 'Stage 85',
        location: 'Sector 85',
        objective: 'Complete mission objective in Sector 85 and survive.',
        operationCode: 'OP-SEC-85',
        missionType: 'escort',
        missionTargetName: 'Target Sector 85',
        bountyReward: 9500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הוא מנסה לברוח.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הוא מנסה לברוח.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'לא יברח ממני!',
            reward: 9500
        }
    },
    86: {
        title: 'Stage 86',
        location: 'Sector 86',
        objective: 'Complete mission objective in Sector 86 and survive.',
        operationCode: 'OP-SEC-86',
        missionType: 'standard',
        missionTargetName: 'Target Sector 86',
        bountyReward: 9600,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אנרגיה אחרונה. היא נותנת הכל.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'אנרגיה אחרונה. היא נותנת הכל.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'זהו! ניצחתי!',
            reward: 9600
        }
    },
    87: {
        title: 'Stage 87',
        location: 'Sector 87',
        objective: 'Complete mission objective in Sector 87 and survive.',
        operationCode: 'OP-SEC-87',
        missionType: 'standard',
        missionTargetName: 'Target Sector 87',
        bountyReward: 9700,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'המנהיג חוסל.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'המנהיג חוסל.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אמרתי שאני הכי טובה!',
            reward: 9700
        }
    },
    88: {
        title: 'Stage 88',
        location: 'Sector 88',
        objective: 'Complete mission objective in Sector 88 and survive.',
        operationCode: 'OP-SEC-88',
        missionType: 'standard',
        missionTargetName: 'Target Sector 88',
        bountyReward: 9800,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד כמה פגמים. תעזור לתקן.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד כמה פגמים. תעזור לתקן.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני אעזור! אני טובה גם בזה!',
            reward: 9800
        }
    },
    89: {
        title: 'Stage 89',
        location: 'Sector 89',
        objective: 'Complete mission objective in Sector 89 and survive.',
        operationCode: 'OP-SEC-89',
        missionType: 'standard',
        missionTargetName: 'Target Sector 89',
        bountyReward: 9900,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'הצי רוצה את הטכנולוגיה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'הצי רוצה את הטכנולוגיה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'הם לא יקבלו! אני לא אתן!',
            reward: 9900
        }
    },
    90: {
        title: 'Stage 90',
        location: 'Sector 90',
        objective: 'Complete mission objective in Sector 90 and survive.',
        operationCode: 'OP-SEC-90',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 90',
        bountyReward: 10000,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'שתי חלליות. היא עדיין יותר מדויקת. אגב, הציון שלך היה רבע נקודה מעל שלה.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'שתי חלליות. היא עדיין יותר מדויקת. אגב, הציון שלך היה רבע נקודה מעל שלה.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'שלי יותר מהירה! ויותר יפה!',
            reward: 10000
        }
    },
    91: {
        title: 'Stage 91',
        location: 'Sector 91',
        objective: 'Complete mission objective in Sector 91 and survive.',
        operationCode: 'OP-SEC-91',
        missionType: 'standard',
        missionTargetName: 'Target Sector 91',
        bountyReward: 10100,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני עוזבת. מישהו צריך לסדר את הצי. ואני אעשה את זה הכי טוב!'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני עוזבת. מישהו צריך לסדר את הצי. ואני אעשה את זה הכי טוב!' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'בטוחה? לא רוצה להישאר ולריב עוד קצת?',
            reward: 10100
        }
    },
    92: {
        title: 'Stage 92',
        location: 'Sector 92',
        objective: 'Complete mission objective in Sector 92 and survive.',
        operationCode: 'OP-SEC-92',
        missionType: 'standard',
        missionTargetName: 'Target Sector 92',
        bountyReward: 10200,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אני נשארת. מישהו צריך לשמור עליה. רבע הנקודה הזו היא הסיבה שאף אחד אחר לא יטיס אותה. כולל אותך, סרה. במיוחד לא את הפח של אבא שלי.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'אני נשארת. מישהו צריך לשמור עליה. רבע הנקודה הזו היא הסיבה שאף אחד אחר לא יטיס אותה. כולל אותך, סרה. במיוחד לא את הפח של אבא שלי.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'תשמרו על עצמכם! ואני יותר טובה מכולם!',
            reward: 10200
        }
    },
    93: {
        title: 'Stage 93',
        location: 'Sector 93',
        objective: 'Complete mission objective in Sector 93 and survive.',
        operationCode: 'OP-SEC-93',
        missionType: 'standard',
        missionTargetName: 'Target Sector 93',
        bountyReward: 10300,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'אני אעזור מרחוק. ידעתי על הציון.'
        },
        inMissionComms: {
            speaker: 'sera',
            name: 'Sera Kane',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'אני אעזור מרחוק. ידעתי על הציון.' }
        ],
        afterAction: {
            speaker: 'sera',
            name: 'סרה',
            message: 'תודה! אני אסתדר!',
            reward: 10300
        }
    },
    94: {
        title: 'Stage 94',
        location: 'Sector 94',
        objective: 'Complete mission objective in Sector 94 and survive.',
        operationCode: 'OP-SEC-94',
        missionType: 'standard',
        missionTargetName: 'Target Sector 94',
        bountyReward: 10400,
        contact: {
            speaker: 'sera',
            name: 'סרה',
            message: 'אני יוצאת נגד הצי!'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'אל תיגעי בcraft שלי מרחוק. אני מרגישה הכל. במיוחד גניבות של רהב.'
        },
        dialogueSequence: [
                { speaker: 'sera', name: 'סרה', message: 'אני יוצאת נגד הצי!' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'אל תיגעי בה מרחוק. והפח של אבא שלי שיתרחק מהמסגרת.',
            reward: 10400
        }
    },
    95: {
        title: 'Stage 95',
        location: 'Sector 95',
        objective: 'Complete mission objective in Sector 95 and survive.',
        operationCode: 'OP-SEC-95',
        missionType: 'escort',
        missionTargetName: 'Target Sector 95',
        bountyReward: 10500,
        contact: {
            speaker: 'ghost',
            name: 'גוסט',
            message: 'עדיין יש חייזרים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'ghost', name: 'גוסט', message: 'עדיין יש חייזרים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'ממשיכים.',
            reward: 10500
        }
    },
    96: {
        title: 'Stage 96',
        location: 'Sector 96',
        objective: 'Complete mission objective in Sector 96 and survive.',
        operationCode: 'OP-SEC-96',
        missionType: 'standard',
        missionTargetName: 'Target Sector 96',
        bountyReward: 10600,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'סרה נגד הצבא. אנחנו נגד החייזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'והcraft קודם כל. עם עצירת זמן. תמיד.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'סרה נגד הצבא. אנחנו נגד החייזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'והיא קודם. תמיד.',
            reward: 10600
        }
    },
    97: {
        title: 'Stage 97',
        location: 'Sector 97',
        objective: 'Complete mission objective in Sector 97 and survive.',
        operationCode: 'OP-SEC-97',
        missionType: 'standard',
        missionTargetName: 'Target Sector 97',
        bountyReward: 10700,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ריכוז חדש. הנשקים שלה מוכנים.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ריכוז חדש. הנשקים שלה מוכנים.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'יוצאים.',
            reward: 10700
        }
    },
    98: {
        title: 'Stage 98',
        location: 'Sector 98',
        objective: 'Complete mission objective in Sector 98 and survive.',
        operationCode: 'OP-SEC-98',
        missionType: 'standard',
        missionTargetName: 'Target Sector 98',
        bountyReward: 10800,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'רגע… אני מנקה את הכתם. עם שפכטל.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'רגע… אני מנקה את הכתם. עם שפכטל.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'מה?!',
            reward: 10800
        }
    },
    99: {
        title: 'Stage 99',
        location: 'Sector 99',
        objective: 'Complete mission objective in Sector 99 and survive.',
        operationCode: 'OP-SEC-99',
        missionType: 'standard',
        missionTargetName: 'Target Sector 99',
        bountyReward: 10900,
        contact: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'עוד קרב. שמן חם מוכן. היא תמיד מוכנה. בניגוד לפח של רהב.'
        },
        inMissionComms: {
            speaker: 'protagonist',
            name: 'Program Zero Pilot',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'עוד קרב. שמן חם מוכן. היא תמיד מוכנה. בניגוד לפח של רהב.' }
        ],
        afterAction: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'תמיד יהיה עוד.',
            reward: 10900
        }
    },
    100: {
        title: 'Stage 100',
        location: 'Sector 100',
        objective: 'Complete mission objective in Sector 100 and survive.',
        operationCode: 'OP-SEC-100',
        missionType: 'bounty',
        missionTargetName: 'Target Sector 100',
        bountyReward: 11000,
        contact: {
            speaker: 'protagonist',
            name: 'טייס פרויקט Zero',
            message: 'נשארים נגד החייזרים.'
        },
        inMissionComms: {
            speaker: 'naomi',
            name: 'Dr. Naomi Ren',
            message: 'Sector secure. Maintain tactical readiness and keep weapon energy stable.'
        },
        dialogueSequence: [
                { speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'נשארים נגד החייזרים.' }
        ],
        afterAction: {
            speaker: 'naomi',
            name: 'ד״ר נעמי רן',
            message: 'ואני נשארת נגד כל מי שנוגע בה. עכשיו אתה יודע למה. ורהב עדיין בנה פח שהורס נופים.',
            reward: 11000
        }
    },
        101: {
            title: 'Program Zero Finale // Epilogue & True Ending',
            location: 'Absolute Void // Ark-9 Gateway',
            objective: 'Defeat the Archon Mothership, resolve all character arcs, and experience the full epilogue.',
            operationCode: 'OP-FINALE-101',
            missionType: 'singularity',
            missionTargetName: 'Archon Supreme Mothership',
            bountyReward: 50000,
            contact: {
                speaker: 'ghost',
                name: 'GHOST',
                message: 'The super-boss awaits, pilot. The Archon Mothership is blazing with dark energy. Time to settle this once and for all.'
            },
            inMissionComms: {
                speaker: 'elena',
                name: 'Commander Elena Vail',
                message: 'This is the final battle for Ark-9. Show them what a Program Zero pilot can do!'
            },
            dialogueSequence: [
                { speaker: 'ghost', name: 'GHOST', message: 'The super-boss awaits, pilot. The Archon Mothership is blazing with dark energy.' },
                { speaker: 'elena', name: 'Commander Elena Vail', message: 'This is the final battle for Ark-9. Show them what a Program Zero pilot can do!' },
                { speaker: 'naomi', name: 'Dr. Naomi Ren', message: 'And watch my ship! I built it myself against my father, not so some alien could recycle it into tin foil!' },
                { speaker: 'sera', name: 'Sera Kane', message: 'I am covering your left flank, pilot. Do not worry, I will leave you enough room to look heroic.' },
                { speaker: 'protagonist', name: 'Program Zero Pilot', message: 'Copy that. Engaging all systems.' }
            ],
            afterAction: {
                speaker: 'naomi',
                name: 'Dr. Naomi Ren',
                message: 'TRUE EPILOGUE: The Archon Mothership core detonated in a blinding flash. Sera pulled the pilot from the wreckage, and both set off on an independent patrol along the Ark-9 border with a lingering romantic spark. Dr. Naomi executed a flawless digital payback against her corrupt father, Professor Arch, broadcasting his treason across the galaxy before locking him out of his own lab. Commander Elena purged military command and offered the pilot and Sera an autonomous task force. The alien invaders retreated through distant star-gates, and Ghost already broadcasted a new signal from the dark web.',
                reward: 50000
            }
        }
    };

    public static getChapterNumber(stage: number): number {
        return Math.min(10, Math.floor((stage - 1) / 10) + 1);
    }

    public static getStageBriefing(stage: number, lang: GameplayLanguage = 'en'): StageBriefing {
        const stageNum = Math.max(1, Math.min(this.TOTAL_STAGES, Math.floor(stage)));
        const chapter = this.getChapterNumber(stageNum);
        const chapterDef = this.ENGLISH_CHAPTERS[chapter - 1] || this.ENGLISH_CHAPTERS[0];
        const custom = lang === 'he' ? this.HEBREW_BRIEFINGS[stageNum] : this.englishBriefings[stageNum];
        const localized = lang === 'he' ? undefined : getLocalizedBriefing(lang, stageNum);
        const mergeLocalizedLine = (baseLine: ContactLine, localizedLine?: LocalizedContactLine): ContactLine => localizedLine
            ? { ...baseLine, name: localizedLine.name, message: localizedLine.message }
            : baseLine;

        if (custom) {
            const authoredDialogueSequence = getSequencedStageDialogue(stageNum, lang) as ContactLine[] | undefined;
            return {
                stage: stageNum,
                chapter,
                chapterTitle: chapterDef.title,
                title: localized?.title ?? custom.title,
                location: localized?.location ?? custom.location,
                objective: localized?.objective ?? custom.objective,
                operationCode: custom.operationCode,
                missionType: custom.missionType as any,
                missionTargetName: localized?.missionTargetName ?? custom.missionTargetName,
                bountyReward: custom.bountyReward,
                contact: mergeLocalizedLine(custom.contact, localized?.contact),
                inMissionComms: custom.inMissionComms ? mergeLocalizedLine(custom.inMissionComms, localized?.inMissionComms) : undefined,
                // The authored voice catalog is the source of truth for every multi-line radio exchange.
                dialogueSequence: authoredDialogueSequence ?? custom.dialogueSequence?.map((line: ContactLine, index: number) => mergeLocalizedLine(line, localized?.dialogueSequence[index])),
                afterAction: custom.afterAction ? {
                    ...custom.afterAction,
                    name: localized?.afterAction.name ?? custom.afterAction.name,
                    message: localized?.afterAction.message ?? custom.afterAction.message
                } : undefined
            };
        }

        const missionTypes = ['standard', 'bounty', 'escort', 'recovery', 'defense', 'singularity'];
        const mType = missionTypes[(stageNum * 3) % missionTypes.length];
        const title = chapterDef.stageTitles[(stageNum - 1) % chapterDef.stageTitles.length] || `Stage ${stageNum}`;

        const isHebrew = lang === 'he';
        return {
            stage: stageNum,
            chapter,
            chapterTitle: chapterDef.title,
            title: isHebrew ? `שלב ${title} (גזרה ${stageNum})` : `${title} (Sector ${stageNum})`,
            location: chapterDef.location,
            objective: isHebrew ? 'נקה את האויבים בגזרה ושמור על יציבות הניווט.' : chapterDef.objective,
            operationCode: `OP-SECTOR-${stageNum}`,
            missionType: mType as any,
            missionTargetName: stageNum % 3 === 0 ? (isHebrew ? 'מנהיג כנופיית הברחות' : 'Smuggler Syndicate Leader') : (isHebrew ? 'סיירת משמר הצללים' : 'Shadow Vanguard Cruiser'),
            bountyReward: 1000 + stageNum * 120,
            contact: {
                speaker: stageNum % 2 === 0 ? 'elena' : 'naomi',
                name: stageNum % 2 === 0 ? (isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail') : (isHebrew ? 'ד״ר נעמי רן' : 'Dr. Naomi Ren'),
                message: stageNum % 2 === 0
                    ? (isHebrew ? `גזרה ${stageNum} מציגה חתימות אויב כבדות. שמור על קווי אש מסודרים.` : `Sector ${stageNum} is showing heavy hostile signatures. Maintain disciplined fire lanes.`)
                    : (isHebrew ? `ודא שאתה אוסף את כל רסיסי הקרדיטים בגזרה ${stageNum}! אב-טיפוס הגנרטור שלי לא זול.` : `Make sure you collect every credit shard in Sector ${stageNum}! My generator prototypes are not cheap.`)
            },
            inMissionComms: {
                speaker: 'ghost',
                name: isHebrew ? 'גוסט' : 'GHOST',
                message: isHebrew ? `תצפית גזרה ${stageNum}: תנועה חשודה בקרבת מקום.` : `Sector ${stageNum} recon: suspicious movement nearby.`
            },
            dialogueSequence: [
                {
                    speaker: stageNum % 2 === 0 ? 'elena' : 'naomi',
                    name: stageNum % 2 === 0 ? (isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail') : (isHebrew ? 'ד״ר נעמי רן' : 'Dr. Naomi Ren'),
                    message: isHebrew ? `התכונן לכניסה לגזרה ${stageNum}.` : `Prepare for sector ${stageNum} entry.`
                }
            ],
            afterAction: {
                speaker: 'elena',
                name: isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail',
                message: isHebrew ? `גזרה ${stageNum} טוהרה בהצלחה.` : `Sector ${stageNum} purged successfully.`,
                reward: 1000 + stageNum * 120
            }
        };
    }

    public static getUpgradeBriefing(kind: UpgradeBriefingKind, nameOrLevel?: any, level?: number): UpgradeBriefing {
        const lvl = typeof nameOrLevel === 'number' ? nameOrLevel : (level || 1);
        switch (kind) {
            case 'weapon':
                return {
                    speaker: 'naomi',
                    title: `Weapon Upgrade // Rank ${lvl}`,
                    message: 'Weapon Bay data is the combat source of truth: damage, firing rate, pattern and power cost are shown on the selected rank.'
                };
            case 'generator':
                return {
                    speaker: 'naomi',
                    title: `Generator Core // Level ${lvl}`,
                    message: `Generator output increased. Recharge rate boosted to support heavy weapon loadouts at level ${lvl}!`
                };
            case 'ship':
                return {
                    speaker: 'naomi',
                    title: `Hull Class // Mk. ${lvl}`,
                    message: `Hull upgraded to Mk. ${lvl}! Increased structural integrity and advanced auxiliary slot capacity.`
                };
        }
    }

    public static getWeaponHoverBriefing(kind: UpgradeBriefingKind, weaponName?: any, level?: any): UpgradeBriefing {
        const lvl = typeof level === 'number' ? level : 1;
        if (kind === 'weapon') {
            return {
                speaker: 'naomi',
                title: `${weaponName ?? 'Weapon'} // Rank ${lvl + 1}`,
                message: 'Select the next rank in Weapon Bay to review its exact damage, rate, pattern and power cost.'
            };
        }
        return this.getUpgradeBriefing(kind, lvl);
    }

    public static getPortraitUrl(characterId: CharacterId): string {
        return this.PORTRAIT_URLS[characterId] || this.PORTRAIT_URLS.protagonist;
    }

    public static getCharacterName(characterId: CharacterId, lang: GameplayLanguage = 'en'): string {
        return this.CHARACTER_NAMES[characterId]?.[lang] || characterId;
    }
}
