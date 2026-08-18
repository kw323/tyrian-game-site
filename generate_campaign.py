import re

with open('/home/ubuntu/upload/382564e0-98ea-11f1-a7d0-099665bfddca.txt', 'r', encoding='utf-8') as f:
    content = f.read()

stages = re.split(r'\*\*(\d+)\*\*', content)
stage_data = {}

for i in range(1, len(stages), 2):
    stage_num = int(stages[i].strip())
    stage_text = stages[i+1].strip()
    
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
            parts = line.split(':', 1)
            if len(parts) == 2:
                speaker_name = parts[0].strip()
                msg = parts[1].strip().strip('"\'')
                lines.append((speaker_name, msg))
                
    stage_data[stage_num] = lines

def get_speaker_id(name):
    name_clean = name.strip()
    if 'נעמי' in name_clean:
        return 'naomi'
    elif 'אלנה' in name_clean or 'אילנה' in name_clean:
        return 'elena'
    elif 'גוסט' in name_clean:
        return 'ghost'
    elif 'סרה' in name_clean:
        return 'sera'
    else:
        return 'protagonist'

def get_speaker_display_name(speaker_id):
    if speaker_id == 'naomi':
        return 'ד״ר נעמי רן'
    elif speaker_id == 'elena':
        return 'המפקדת אלנה וייל'
    elif speaker_id == 'ghost':
        return 'גוסט'
    elif speaker_id == 'sera':
        return 'סרה קיין'
    else:
        return 'טייס פרויקט Zero'

hb_blocks = []
for s in range(1, 101):
    lines = stage_data.get(s, [('אלנה', 'טייס, צא לדרך.'), ('דר נעמי', 'שמור על החללית!'), ('הטייס', 'הבנתי.')])
    
    first_sp = get_speaker_id(lines[0][0])
    first_name = get_speaker_display_name(first_sp)
    first_msg = lines[0][1].replace("'", "\\'")
    
    in_mission = lines[1] if len(lines) > 1 else lines[0]
    im_sp = get_speaker_id(in_mission[0])
    im_name = get_speaker_display_name(im_sp)
    im_msg = in_mission[1].replace("'", "\\'")
    
    diag_entries = []
    for sp_raw, msg in lines:
        sp_id = get_speaker_id(sp_raw)
        sp_disp = get_speaker_display_name(sp_id)
        escaped_msg = msg.replace("'", "\\'")
        diag_entries.append(f"                {{ speaker: '{sp_id}', name: '{sp_disp}', message: '{escaped_msg}' }}")
    
    diag_str = ",\n".join(diag_entries)
    
    last_raw, last_msg = lines[-1]
    aa_sp = get_speaker_id(last_raw)
    aa_name = get_speaker_display_name(aa_sp)
    escaped_last = last_msg.replace("'", "\\'")
    
    hb_blocks.append(f"""    {s}: {{
        title: 'שלב {s}',
        location: 'גזרה {s}',
        objective: 'השלם את משימת גזרה {s} ושרוד.',
        operationCode: 'OP-SEC-{s}',
        missionType: '{"bounty" if s % 10 == 0 else ("escort" if s % 5 == 0 else "standard")}',
        missionTargetName: 'מטרת גזרה {s}',
        bountyReward: {1000 + s * 100},
        contact: {{
            speaker: '{first_sp}',
            name: '{first_name}',
            message: '{first_msg}'
        }},
        inMissionComms: {{
            speaker: '{im_sp}',
            name: '{im_name}',
            message: '{im_msg}'
        }},
        dialogueSequence: [
{diag_str}
        ],
        afterAction: {{
            speaker: '{aa_sp}',
            name: '{aa_name}',
            message: '{escaped_last}',
            reward: {1000 + s * 100}
        }}
    }}""")

hb_code = ",\n".join(hb_blocks)

ts_content = f"""export type CharacterId = 'naomi' | 'protagonist' | 'elena' | 'sera' | 'ghost';
export type UpgradeBriefingKind = 'weapon' | 'generator' | 'ship';
export type GameplayLanguage = 'he' | 'en';

export interface ContactLine {{
    speaker: CharacterId;
    name: string;
    message: string;
}}

export interface StageBriefing {{
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
    afterAction?: {{
        speaker: CharacterId;
        name: string;
        message: string;
        reward: number;
    }};
}}

export interface UpgradeBriefing {{
    speaker: 'naomi';
    title: string;
    message: string;
}}

interface ChapterDefinition {{
    title: string;
    location: string;
    objective: string;
    stageTitles: string[];
}}

export class CampaignSystem {{
    public static readonly TOTAL_STAGES = 101;

    private static PORTRAIT_URLS: Record<CharacterId, string> = {{
        naomi: '/manus-storage/character-dr-naomi_baa4ea05.png',
        protagonist: '/manus-storage/character-protagonist_d15cec4b.png',
        elena: '/manus-storage/commander-elena-portrait_532cb72a.png',
        sera: '/manus-storage/sera-kane-portrait_43903ee0.png',
        ghost: '/manus-storage/ghost-portrait_bc766946.png'
    }};

    private static CHARACTER_NAMES: Record<CharacterId, Record<GameplayLanguage, string>> = {{
        naomi: {{ he: 'ד״ר נעמי רן', en: 'Dr. Naomi Ren' }},
        protagonist: {{ he: 'טייס פרויקט Zero', en: 'Program Zero Pilot' }},
        elena: {{ he: 'המפקדת אלנה וייל', en: 'Commander Elena Vail' }},
        sera: {{ he: 'סרה קיין', en: 'Sera Kane' }},
        ghost: {{ he: 'גוסט', en: 'GHOST' }}
    }};

    private static ENGLISH_CHAPTERS: ChapterDefinition[] = [
        {{
            title: 'The Ark-9 Patrols',
            location: 'Ark-9 Outer Corridor',
            objective: 'Keep interstellar routes open while mapping the unknown signal.',
            stageTitles: ['First Watch', 'Dustline Escort', 'Beacon Run', 'Quiet Orbit', 'Broken Convoy', 'Night Transit', 'False Distress', 'Relay Under Fire', 'Unlisted Cargo', 'Noise Pattern']
        }},
        {{
            title: 'Vanishing Convoys',
            location: 'Meridian Freight Lanes',
            objective: 'Find missing convoys before navigation cores are erased.',
            stageTitles: ['Cold Trail', 'Freight Ghosts', 'Empty Carrier', 'Signal Harvest', 'Three Minutes Dark', 'Unmarked Raiders', 'Salvage Trap', 'Convoy Zero', 'Familiar Weapon', 'No Civilian Logs']
        }},
        {{
            title: 'The Broken Order',
            location: 'Ark-9 Command Reach',
            objective: 'Follow an impossible order and discover who altered target lists.',
            stageTitles: ['Redacted Coords', 'Friendly Fire', 'Silent Colony', 'Order of Silence', 'Burn Evidence', 'Pilot Report', 'Crossed Line', 'Command Override', 'Cost of Obedience', 'Broken Order']
        }},
        {{
            title: 'Runaway Protocol',
            location: 'Unregistered Belt',
            objective: 'Survive outside official support and reach the first underground contact.',
            stageTitles: ['Flight Denied', 'No Safe Dock', 'Scrap Ambush', 'Long Burn', 'Static Hand', 'Hidden Fuel', 'Pursuit Wing', 'Dead Channel', 'First Defection', 'Runaway Protocol']
        }},
        {{
            title: 'Fleet Beneath Fleet',
            location: 'Black Relay Network',
            objective: 'Trace the hidden fleet operating inside both military command structures.',
            stageTitles: ['Black Relay', 'False Colors', 'Ghost Hangar', 'Borrowed Codes', 'Unseen Admiral', 'Fleet Within', 'Keyless Door', 'Signal Burial', 'Architect Mark', 'Hidden Armada']
        }},
        {{
            title: 'Program Zero',
            location: 'Zero-Test Range',
            objective: 'Recover original records behind the experimental spacecraft program.',
            stageTitles: ['Prototype Wake', 'Four Chassis', 'Missing Flight', 'Engine Room', 'First Pilot', 'Hull Memory', 'Failed War', 'Zero Shadow', 'Upgrade Price', 'Program Zero']
        }},
        {{
            title: 'Civil War in Orbit',
            location: 'Divided Defense Grid',
            objective: 'Choose trusted military cells before the grid collapses.',
            stageTitles: ['Split Command', 'Friendly Hunters', 'Defector Line', 'Helix Siege', 'Two Flags', 'Loyalty Test', 'War Commanders', 'Last Official Order', 'Doubt Fleet', 'Orbital Civil War']
        }},
        {{
            title: 'The Gate Network',
            location: 'Ark-9 Gate Array',
            objective: 'Reach the gate network and learn why Ark-9 was built around it.',
            stageTitles: ['Gate One', 'Long Jump', 'Moving Coords', 'Locked Meridian', 'Gatekeepers', 'Through Static', 'War Map', 'Ark Beneath Ark', 'Route Choice', 'Gate Network']
        }},
        {{
            title: 'The Last Alliance',
            location: 'Coalition Front',
            objective: 'Unite rival forces long enough to reach the war signal source.',
            stageTitles: ['Uneasy Escort', 'Old Enemies', 'Sera Signal', 'Joint Strike', 'No One Alone', 'Broken Formation', 'Debt Repaid', 'Alliance Test', 'One Line', 'Last Alliance']
        }},
        {{
            title: 'Program Zero Finale',
            location: 'Singularity Core',
            objective: 'Destroy the Archon Mothership and close the gate.',
            stageTitles: ['Final Approach', 'Zero Hour', 'Event Horizon', 'Archon Core', 'The Last Gate']
        }}
    ];

    private static HEBREW_BRIEFINGS: Record<number, {{ title: string; location: string; objective: string; operationCode: string; missionType: string; missionTargetName: string; bountyReward: number; contact: ContactLine; inMissionComms?: ContactLine; dialogueSequence?: ContactLine[]; afterAction?: {{ speaker: CharacterId; name: string; message: string; reward: number; }}; }}> = {{
{hb_code},
        101: {{
            title: 'תוכנית Zero // סיום אפי ואפילוג',
            location: 'החלל המוחלט',
            objective: 'הבס את ספינת האם העליונה, סקור את קרדיטים המפתחים ותיהנה מהאפילוג!',
            operationCode: 'OP-EPILOGUE-101',
            missionType: 'singularity',
            missionTargetName: 'ספינת האם העליונה של הארכון',
            bountyReward: 50000,
            contact: {{
                speaker: 'ghost',
                name: 'גוסט',
                message: 'אזהרה! שליט החייזרים העליון מוציא את הנשק האולטימטיבי שלו: רשימת קרדיטים שלא ניתן לדלג עליה וביורוקרטיה קיומית!'
            }},
            inMissionComms: {{
                speaker: 'elena',
                name: 'המפקדת אלנה וייל',
                message: 'כל היחידות, עמדו הכינו! המלחמה נגמרה, השחיתות טוהרה, והמפתחים סוף סוף הולכים לתפוס תנומה ראויה!'
            }},
            dialogueSequence: [
                {{ speaker: 'ghost', name: 'גוסט', message: 'אזהרה! שליט החייזרים העליון מוציא את הנשק האולטימטיבי שלו: רשימת קרדיטים שלא ניתן לדלג עליה וביורוקרטיה קיומית!' }},
                {{ speaker: 'elena', name: 'המפקדת אלנה וייל', message: 'כל היחידות, עמדו הכינו! המלחמה נגמרה, השחיתות טוהרה, והמפתחים סוף סוף הולכים לתפוס תנומה ראויה!' }},
                {{ speaker: 'naomi', name: 'ד״ר נעמי רן', message: 'ולגבי מה שקרה אחר כך... בואו נבדוק את יומני האפילוג!' }},
                {{ speaker: 'protagonist', name: 'טייס פרויקט Zero', message: 'תריצו קרדיטים! הרווחנו כל פיקסל.' }}
            ],
            afterAction: {{
                speaker: 'naomi',
                name: 'ד״ר נעמי רן',
                message: 'אפילוג: נעמי פתחה ספא יוקרתי במימון פטנטים של גנרטורים; אלנה פרשה לכתוב ספר זיכרונות מתובל על אדמירלים מושחתים; גוסט נעלם לתוך פורום דרק-ווב בין-גלקטי; סרה הקימה ליגת מירוצי ספינות מתחרה; והפולשים החייזרים נסוגו בחזרה לערפילית שלהם אחרי שגילו שמחירי הקפה שלנו גבוהים מדי. קרדיטים: נוצר על ידי Manus AI וטייס ראשי.',
                reward: 50000
            }}
        }}
    }};

    private static englishBriefings: Record<number, any> = {{
        1: {{
            title: 'First Watch',
            location: 'Ark-9 Outer Corridor',
            objective: 'Intercept rogue scouts before they breach outer navigation buoys.',
            operationCode: 'OP-DAWN-01',
            missionType: 'standard',
            missionTargetName: 'Scout Raider Leader',
            bountyReward: 1500,
            contact: {{
                speaker: 'elena',
                name: 'Commander Elena Vail',
                message: 'Pilot, we have unauthorized signature anomalies near Ark-9. Purge them before civilian traffic panics.'
            }},
            inMissionComms: {{
                speaker: 'naomi',
                name: 'Dr. Naomi Ren',
                message: 'And please protect the experimental hull! It is not insured against asteroid hits or pirate rust.'
            }},
            dialogueSequence: [
                {{ speaker: 'elena', name: 'Commander Elena Vail', message: 'Pilot, we have unauthorized signature anomalies near Ark-9.' }},
                {{ speaker: 'naomi', name: 'Dr. Naomi Ren', message: 'Keep my hull clean or I will dock your pay!' }},
                {{ speaker: 'protagonist', name: 'Program Zero Pilot', message: 'Understood. Thrusters online.' }}
            ],
            afterAction: {{
                speaker: 'elena',
                name: 'Commander Elena Vail',
                message: 'Ark-9 corridor secured from scout raiders. Excellent flight, pilot!',
                reward: 1500
            }}
        }},
        101: {{
            title: 'Program Zero Finale // Epilogue',
            location: 'Absolute Void',
            objective: 'Defeat the Archon Mothership, review developer credits, and enjoy the epilogue!',
            operationCode: 'OP-EPILOGUE-101',
            missionType: 'singularity',
            missionTargetName: 'Archon Supreme Mothership',
            bountyReward: 50000,
            contact: {{
                speaker: 'ghost',
                name: 'GHOST',
                message: 'Warning! The Supreme Alien Overlord deploys its ultimate weapon: unskippable developer credits and existential bureaucracy!'
            }},
            inMissionComms: {{
                speaker: 'elena',
                name: 'Commander Elena Vail',
                message: 'All units, stand down! The war is over, the corruption is purged, and the developers are finally taking a well-deserved nap!'
            }},
            dialogueSequence: [
                {{ speaker: 'ghost', name: 'GHOST', message: 'Warning! The Supreme Alien Overlord deploys its ultimate weapon: unskippable credits!' }},
                {{ speaker: 'elena', name: 'Commander Elena Vail', message: 'All units, stand down! The war is over!' }},
                {{ speaker: 'naomi', name: 'Dr. Naomi Ren', message: 'And as for what happened next... let us check the epilogue logs!' }},
                {{ speaker: 'protagonist', name: 'Program Zero Pilot', message: 'Roll credits! We earned every pixel.' }}
            ],
            afterAction: {{
                speaker: 'naomi',
                name: 'Dr. Naomi Ren',
                message: 'EPILOGUE: Naomi opened a luxury spa funded by generator patents; Elena retired to write a spicy memoir about corrupt admirals; Ghost vanished into an intergalactic dark web forum; Sera started a rival spacecraft drift-racing league; and the alien invaders retreated back to their home nebula after discovering our coffee prices are too high. Developer Credits: Created by Manus AI & Master Pilot.',
                reward: 50000
            }}
        }}
    }};

    public static getChapterNumber(stage: number): number {{
        return Math.min(10, Math.floor((stage - 1) / 10) + 1);
    }}

    public static getStageBriefing(stage: number, lang: GameplayLanguage = 'en'): StageBriefing {{
        const stageNum = Math.max(1, Math.min(this.TOTAL_STAGES, Math.floor(stage)));
        const chapter = this.getChapterNumber(stageNum);
        const chapterDef = this.ENGLISH_CHAPTERS[chapter - 1] || this.ENGLISH_CHAPTERS[0];
        const custom = lang === 'he' ? this.HEBREW_BRIEFINGS[stageNum] : this.englishBriefings[stageNum];

        if (custom) {{
            return {{
                stage: stageNum,
                chapter,
                chapterTitle: chapterDef.title,
                title: custom.title,
                location: custom.location,
                objective: custom.objective,
                operationCode: custom.operationCode,
                missionType: custom.missionType as any,
                missionTargetName: custom.missionTargetName,
                bountyReward: custom.bountyReward,
                contact: custom.contact,
                inMissionComms: custom.inMissionComms,
                dialogueSequence: custom.dialogueSequence,
                afterAction: custom.afterAction
            }};
        }}

        const missionTypes = ['standard', 'bounty', 'escort', 'recovery', 'defense', 'singularity'];
        const mType = missionTypes[(stageNum * 3) % missionTypes.length];
        const title = chapterDef.stageTitles[(stageNum - 1) % chapterDef.stageTitles.length] || `Stage ${{stageNum}}`;

        const isHebrew = lang === 'he';
        return {{
            stage: stageNum,
            chapter,
            chapterTitle: chapterDef.title,
            title: isHebrew ? `שלב ${{title}} (גזרה ${{stageNum}})` : `${{title}} (Sector ${{stageNum}})`,
            location: chapterDef.location,
            objective: isHebrew ? 'נקה את האויבים בגזרה ושמור על יציבות הניווט.' : chapterDef.objective,
            operationCode: `OP-SECTOR-${{stageNum}}`,
            missionType: mType as any,
            missionTargetName: stageNum % 3 === 0 ? (isHebrew ? 'מנהיג כנופיית הברחות' : 'Smuggler Syndicate Leader') : (isHebrew ? 'סיירת משמר הצללים' : 'Shadow Vanguard Cruiser'),
            bountyReward: 1000 + stageNum * 120,
            contact: {{
                speaker: stageNum % 2 === 0 ? 'elena' : 'naomi',
                name: stageNum % 2 === 0 ? (isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail') : (isHebrew ? 'ד״ר נעמי רן' : 'Dr. Naomi Ren'),
                message: stageNum % 2 === 0
                    ? (isHebrew ? `גזרה ${{stageNum}} מציגה חתימות אויב כבדות. שמור על קווי אש מסודרים.` : `Sector ${{stageNum}} is showing heavy hostile signatures. Maintain disciplined fire lanes.`)
                    : (isHebrew ? `ודא שאתה אוסף את כל רסיסי הקרדיטים בגזרה ${{stageNum}}! אב-טיפוס הגנרטור שלי לא זול.` : `Make sure you collect every credit shard in Sector ${{stageNum}}! My generator prototypes are not cheap.`)
            }},
            inMissionComms: {{
                speaker: 'ghost',
                name: isHebrew ? 'גוסט' : 'GHOST',
                message: isHebrew ? `תצפית גזרה ${{stageNum}}: תנועה חשודה בקרבת מקום.` : `Sector ${{stageNum}} recon: suspicious movement nearby.`
            }},
            dialogueSequence: [
                {{
                    speaker: stageNum % 2 === 0 ? 'elena' : 'naomi',
                    name: stageNum % 2 === 0 ? (isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail') : (isHebrew ? 'ד״ר נעמי רן' : 'Dr. Naomi Ren'),
                    message: isHebrew ? `התכונן לכניסה לגזרה ${{stageNum}}.` : `Prepare for sector ${{stageNum}} entry.`
                }}
            ],
            afterAction: {{
                speaker: 'elena',
                name: isHebrew ? 'המפקדת אלנה וייל' : 'Commander Elena Vail',
                message: isHebrew ? `גזרה ${{stageNum}} טוהרה בהצלחה.` : `Sector ${{stageNum}} purged successfully.`,
                reward: 1000 + stageNum * 120
            }}
        }};
    }}

    public static getUpgradeBriefing(kind: UpgradeBriefingKind, nameOrLevel?: any, level?: number): UpgradeBriefing {{
        const lvl = typeof nameOrLevel === 'number' ? nameOrLevel : (level || 1);
        switch (kind) {{
            case 'weapon':
                return {{
                    speaker: 'naomi',
                    title: `Weapon Upgrade // Level ${{lvl}}`,
                    message: lvl === 1
                        ? 'Direct forward fire unlocked. Standard plasma output.'
                        : `Advanced dispersion patterns added! Level ${{lvl}} weapon architecture expanded. Watch the generator draw!`
                }};
            case 'generator':
                return {{
                    speaker: 'naomi',
                    title: `Generator Core // Level ${{lvl}}`,
                    message: `Generator output increased. Recharge rate boosted to support heavy weapon loadouts at level ${{lvl}}!`
                }};
            case 'ship':
                return {{
                    speaker: 'naomi',
                    title: `Hull Class // Mk. ${{lvl}}`,
                    message: `Hull upgraded to Mk. ${{lvl}}! Increased structural integrity and advanced auxiliary slot capacity.`
                }};
        }}
    }}

    public static getWeaponHoverBriefing(kind: UpgradeBriefingKind, weaponName?: any, level?: any): UpgradeBriefing {{
        const lvl = typeof level === 'number' ? level : 1;
        return this.getUpgradeBriefing(kind, lvl);
    }}

    public static getPortraitUrl(characterId: CharacterId): string {{
        return this.PORTRAIT_URLS[characterId] || this.PORTRAIT_URLS.protagonist;
    }}

    public static getCharacterName(characterId: CharacterId, lang: GameplayLanguage = 'en'): string {{
        return this.CHARACTER_NAMES[characterId]?.[lang] || characterId;
    }}
}}
"""

with open('/home/ubuntu/tyrian-game-site/client/src/game/story/CampaignSystem.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("CampaignSystem.ts successfully rewritten with flexible signature for getWeaponHoverBriefing.")
