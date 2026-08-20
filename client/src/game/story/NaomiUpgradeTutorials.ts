import type { GameplayLanguage } from './CampaignSystem';

export type NaomiTutorialTopic =
    | 'weapon'
    | 'elemental_core'
    | 'generator'
    | 'shield'
    | 'engine'
    | 'ship'
    | 'time_lock'
    | 'void_armor'
    | 'over_power'
    | 'phase_cloak'
    | 'tactical_magazine';

export interface NaomiUpgradeTutorial {
    title: string;
    message: string;
}

const TUTORIALS: Record<GameplayLanguage, Record<NaomiTutorialTopic, NaomiUpgradeTutorial>> = {
    he: {
        weapon: {
            title: 'ד״ר נעמי // נשק חדש',
            message: 'נשק חדש מותקן רק כאן בחדר המוכנות. בקרב מחליפים ליבה, לא תותח. תן לו דקה במטווח לפני שתתחיל לכוון אותו אליי.'
        },
        elemental_core: {
            title: 'ד״ר נעמי // ליבות יסוד',
            message: 'הליבה משנה את היריות הרגילות שלך. בקרב מחליפים ביניהן עם 1–5 — לא נשקים, 1–5. אני יודעת, זה מבריק.'
        },
        generator: {
            title: 'ד״ר נעמי // גנרטור',
            message: 'הגנרטור ממלא כוח לנשק ולמגן. נשק חזק בלי גנרטור מתאים הוא רק פסל יקר שמבהב באדום. אל תשבש לי את הכיוונון.'
        },
        shield: {
            title: 'ד״ר נעמי // מגן',
            message: 'המגן סופג קודם, הגוף סופג אחר כך — ואת הגוף שלי לא מייצרים מחדש באמצע מערכה. תן למגן להתחדש לפני שאתה נכנס שוב לאש.'
        },
        engine: {
            title: 'ד״ר נעמי // מנועים',
            message: 'כל דרגת מנוע מוסיפה קצת מהירות, לא טיל בליסטי. זה בשביל תיקונים מדויקים בין יריות, לא בשביל שתטוס לתוך קיר.'
        },
        ship: {
            title: 'ד״ר נעמי // גוף חללית',
            message: 'גוף חדש מעניק בסיס חזק יותר ומקום למערכות מתקדמות. בבקשה אל תשרוט את הצבע בפנייה הראשונה — הוא עלה יותר מהשכר שלי.'
        },
        time_lock: {
            title: 'ד״ר נעמי // עצירת זמן',
            message: 'כן, קנית עצירת זמן. ברירת המחדל להפעלה היא {key}. יש לך בערך שלוש שניות להיות גיבור; אל תבזבז אותן על התרשמות עצמית.'
        },
        void_armor: {
            title: 'ד״ר נעמי // שריון ריק',
            message: 'שריון הריק נותן לך חלון קצר לשרוד מגע קטלני. מפעילים עם {key}. הוא לא רישיון לבדוק מקרוב טילים, אז אל תהיה יצירתי.'
        },
        over_power: {
            title: 'ד״ר נעמי // אובר פאוור',
            message: 'אובר פאוור דוחף את מערכות הירי מעבר לרגיל לכמה שניות. מפעילים עם {key}. כן, הוא חזק. לא, זה לא אומר שאין לך מחויבות לכוון.'
        },
        phase_cloak: {
            title: 'ד״ר נעמי // הסוואת פאזה',
            message: 'הסוואת פאזה גורמת לך לחמוק מהפתעות לא נעימות לזמן קצר. מפעילים עם {key}. אל תיעלם לי כשאני צריכה תשובה ברדיו.'
        },
        tactical_magazine: {
            title: 'ד״ר נעמי // מחסנית טקטית',
            message: 'המחסנית מוסיפה שימושים רצופים ליכולת הטקטית. היא יקרה כי היא מצילה חיים; ואני מעדיפה להציל חיים במקום לכתוב דוחות תאונה.'
        }
    },
    en: {
        weapon: {
            title: 'DR. NAOMI // NEW WEAPON',
            message: 'New weapons are fitted here in the Ready Room. In combat you switch cores, not guns. Give it a minute on the range before you point it at me.'
        },
        elemental_core: {
            title: 'DR. NAOMI // ELEMENT CORES',
            message: 'A core changes your standard shots. Switch cores with 1–5 during combat — not weapons, 1–5. I know, it is brilliant.'
        },
        generator: {
            title: 'DR. NAOMI // GENERATOR',
            message: 'The generator refills weapon and shield power. A heavy weapon without the reactor to feed it is just an expensive red warning light. Do not disturb my calibration.'
        },
        shield: {
            title: 'DR. NAOMI // SHIELD',
            message: 'The shield takes the hit first; the hull takes it after that. I cannot print you a new hull halfway through a campaign, so let the shield recover.'
        },
        engine: {
            title: 'DR. NAOMI // ENGINES',
            message: 'Each engine rank adds measured speed, not a ballistic missile. It is for precise corrections between shots, not for flying into a wall.'
        },
        ship: {
            title: 'DR. NAOMI // SHIP HULL',
            message: 'A new hull gives you a stronger base and room for advanced systems. Please do not scratch the paint on your first turn; it cost more than my salary.'
        },
        time_lock: {
            title: 'DR. NAOMI // TIME LOCK',
            message: 'Yes, you bought Time Lock. The default activation key is {key}. You get about three seconds to be a hero; do not spend them admiring yourself.'
        },
        void_armor: {
            title: 'DR. NAOMI // VOID ARMOR',
            message: 'Void Armor gives you a short window to survive lethal contact. Activate it with {key}. It is not a permit to inspect missiles at close range.'
        },
        over_power: {
            title: 'DR. NAOMI // OVER POWER',
            message: 'Over Power pushes your firing systems past normal limits for a few seconds. Activate it with {key}. Yes, it is powerful. No, you still have to aim.'
        },
        phase_cloak: {
            title: 'DR. NAOMI // PHASE CLOAK',
            message: 'Phase Cloak lets you slip past unpleasant surprises for a moment. Activate it with {key}. Do not vanish when I need an answer on the radio.'
        },
        tactical_magazine: {
            title: 'DR. NAOMI // TACTICAL MAGAZINE',
            message: 'The magazine adds consecutive tactical uses. It costs plenty because it saves lives, and I would rather save lives than write accident reports.'
        }
    },
    ja: {
        weapon: {
            title: 'ナオミ博士 // 新兵装',
            message: '新しい武器は準備室で装備します。戦闘中に切り替えるのは武器ではなくコアです。まずは試射してから、私に向けないでください。'
        },
        elemental_core: {
            title: 'ナオミ博士 // エレメントコア',
            message: 'コアは通常弾の性質を変えます。戦闘中は1〜5でコアを切り替えます。武器ではありません。そこ、大事です。'
        },
        generator: {
            title: 'ナオミ博士 // ジェネレーター',
            message: 'ジェネレーターは武器とシールドの電力を回復します。電力のない強力な武器は、高価な赤い警告灯です。調整は私に任せて。'
        },
        shield: {
            title: 'ナオミ博士 // シールド',
            message: 'まずシールド、次に船体です。作戦中に新しい船体は作れません。急ぐ前にシールドを回復させてください。'
        },
        engine: {
            title: 'ナオミ博士 // エンジン',
            message: 'エンジンのランクは少しずつ速度を上げます。弾の間を正確に抜けるためです。壁に突っ込むためではありません。'
        },
        ship: {
            title: 'ナオミ博士 // 船体',
            message: '新しい船体は基礎性能と高度なシステムの余地を増やします。最初の旋回で塗装を傷つけないで。私の給料より高いんです。'
        },
        time_lock: {
            title: 'ナオミ博士 // タイムロック',
            message: 'タイムロックを買いましたね。標準の起動キーは{key}です。英雄になる時間は約3秒。自分に見とれないでください。'
        },
        void_armor: {
            title: 'ナオミ博士 // ヴォイドアーマー',
            message: 'ヴォイドアーマーは致命的な接触を短時間しのぎます。{key}で起動。ミサイルを近くで観察する許可ではありません。'
        },
        over_power: {
            title: 'ナオミ博士 // オーバーパワー',
            message: 'オーバーパワーは数秒間、射撃系を限界以上に押し上げます。{key}で起動。強いですが、照準は必要です。'
        },
        phase_cloak: {
            title: 'ナオミ博士 // フェーズクローク',
            message: 'フェーズクロークは危険を短時間すり抜けさせます。{key}で起動。無線に返事が必要な時に消えないでください。'
        },
        tactical_magazine: {
            title: 'ナオミ博士 // タクティカルマガジン',
            message: 'マガジンは戦術能力の連続使用回数を増やします。高価なのは命を救うからです。事故報告書は増やしたくありません。'
        }
    },
    zh: {
        weapon: {
            title: '娜奥米博士 // 新武器',
            message: '新武器只能在准备室安装。战斗中切换的是核心，不是武器。先去试射，再考虑把它指向我。'
        },
        elemental_core: {
            title: '娜奥米博士 // 元素核心',
            message: '核心会改变普通射击的效果。战斗中按1到5切换核心——不是切换武器。这个区别非常重要。'
        },
        generator: {
            title: '娜奥米博士 // 发电机',
            message: '发电机为武器和护盾补充能量。没有足够供能的重武器，只是一盏昂贵的红色警告灯。别碰我的校准。'
        },
        shield: {
            title: '娜奥米博士 // 护盾',
            message: '护盾先承受打击，之后才是船体。战役中途我可造不出新船体，所以先让护盾恢复。'
        },
        engine: {
            title: '娜奥米博士 // 引擎',
            message: '每级引擎只增加可控的速度，用来在弹幕间精确修正位置，不是让你一头撞上墙。'
        },
        ship: {
            title: '娜奥米博士 // 船体',
            message: '新船体提供更强基础和先进系统空间。请别在第一次转弯就刮花涂装；它比我的工资还贵。'
        },
        time_lock: {
            title: '娜奥米博士 // 时间锁定',
            message: '你买了时间锁定。默认启动键是{key}。你大约有三秒当英雄，可别全花在欣赏自己上。'
        },
        void_armor: {
            title: '娜奥米博士 // 虚空装甲',
            message: '虚空装甲能让你短暂撑过致命接触。按{key}启动。它不是让你近距离观察导弹的许可证。'
        },
        over_power: {
            title: '娜奥米博士 // 超功率',
            message: '超功率会在几秒内把火力推过正常极限。按{key}启动。它很强，但瞄准还是你的工作。'
        },
        phase_cloak: {
            title: '娜奥米博士 // 相位隐形',
            message: '相位隐形能让你短暂避开麻烦。按{key}启动。需要无线电回复时，别突然消失。'
        },
        tactical_magazine: {
            title: '娜奥米博士 // 战术弹匣',
            message: '弹匣会增加战术能力的连续使用次数。它很贵，因为能救命；我宁愿救人，也不想写事故报告。'
        }
    }
};

export function getNaomiUpgradeTutorial(topic: NaomiTutorialTopic, language: GameplayLanguage, abilityKey: string): NaomiUpgradeTutorial {
    const tutorial = TUTORIALS[language][topic];
    return {
        title: tutorial.title,
        message: tutorial.message.replace('{key}', abilityKey)
    };
}

export function getNaomiTutorialStorageKey(topic: NaomiTutorialTopic): string {
    return `tyrian_naomi_upgrade_tutorial_v1_${topic}`;
}
