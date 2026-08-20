import type { GameplayLanguage } from './CampaignSystem';

export type EpilogueCharacterId = 'elena' | 'sera' | 'rahav' | 'naomi' | 'protagonist' | 'ghost';

export interface EpilogueScene {
    id: EpilogueCharacterId;
    imageUrl: string;
    characterName: string;
    title: string;
    body: string[];
}

export interface EpilogueInterfaceCopy {
    campaignComplete: string;
    lead: string;
    archive: string;
    credits: string;
    creditsLine: string;
    closingLine: string;
    previous: string;
    next: string;
    returnToTitle: string;
}

const EPILOGUE_INTERFACE_COPY: Record<GameplayLanguage, EpilogueInterfaceCopy> = {
    he: {
        campaignComplete: 'הקמפיין הושלם // אופק חדש',
        lead: 'המלחמה הסתיימה. עכשיו מתחיל הדבר הקשה יותר: לשמור על מה שהצלחנו להציל.',
        archive: 'יומן אפילוג // אחרי הניצחון',
        credits: 'קרדיטים // PROTECT THE STARSHIP',
        creditsLine: 'עיצוב ופיתוח: Manus AI והטייס  •  סיפור אפילוג: צוות פרויקט Zero',
        closingLine: 'הגלקסיה אינה מושלמת — אבל היא בידיים של מי שמנסים לשמור עליה.',
        previous: 'הקודם',
        next: 'הבא',
        returnToTitle: 'חזרה למסך הראשי // תפריט ראשי'
    },
    en: {
        campaignComplete: 'CAMPAIGN COMPLETE // A NEW HORIZON',
        lead: 'The war is over. Now begins the harder task: protecting what was saved.',
        archive: 'EPILOGUE ARCHIVE // AFTER THE VICTORY',
        credits: 'CREDITS // PROTECT THE STARSHIP',
        creditsLine: 'Design & Development: Manus AI and the Pilot  •  Epilogue Story: Project Zero Team',
        closingLine: 'The galaxy is not perfect — but it is in the hands of those trying to protect it.',
        previous: 'PREVIOUS',
        next: 'NEXT',
        returnToTitle: 'RETURN TO TITLE // MAIN MENU'
    },
    ja: {
        campaignComplete: 'キャンペーン完了 // 新たな地平',
        lead: '戦いは終わった。これからは、守り抜いたものを守り続ける時だ。',
        archive: 'エピローグ記録 // 勝利のあと',
        credits: 'クレジット // PROTECT THE STARSHIP',
        creditsLine: 'デザインと開発：Manus AI とパイロット  •  エピローグ：Project Zero チーム',
        closingLine: '銀河は完璧ではない。それでも、守ろうとする者たちの手にある。',
        previous: '前へ',
        next: '次へ',
        returnToTitle: 'タイトル画面へ戻る'
    },
    zh: {
        campaignComplete: '战役完成 // 新的地平线',
        lead: '战争结束了。现在，更困难的任务才刚开始：守护我们所拯救的一切。',
        archive: '尾声档案 // 胜利之后',
        credits: '制作名单 // PROTECT THE STARSHIP',
        creditsLine: '设计与开发：Manus AI 与飞行员  •  尾声故事：Project Zero 团队',
        closingLine: '银河并不完美，但它掌握在努力守护它的人手中。',
        previous: '上一页',
        next: '下一页',
        returnToTitle: '返回标题画面'
    }
};

const EPILOGUE_BY_LANGUAGE: Record<GameplayLanguage, EpilogueScene[]> = {
    // Hebrew is the canonical narrative source. All other localized versions adapt this text.
    he: [
        {
            id: 'elena',
            imageUrl: '/epilogue/ilana_epilogue.png',
            characterName: 'אילנה',
            title: 'המפקדת הכללית',
            body: [
                'אחרי הניצחון על החייזרים, הגלקסיה סוף־סוף קיבלה קצת סדר. אילנה וסרה עשו לצבא ניקוי אורוות יסודי: קצינים מושחתים ומפקדים שהפקירו מושבות גילו שהתירוצים נגמרו קודם.',
                'כשהצבא נפתח מחדש, אילנה התיישבה בכיסא המפקדת הכללית. היא לא הבטיחה שהכול יהיה קל; היא הבטיחה שהצבא יגן על האנשים שהוא נועד להגן עליהם.'
            ]
        },
        {
            id: 'sera',
            imageUrl: '/epilogue/sera_epilogue.png',
            characterName: 'סרה',
            title: 'המגינה הכללית',
            body: [
                'סרה הפכה למפקדת המשטרה הצבאית ולמגינה הכללית של האנושות. היא לא ביקשה משרד גדול; היא ביקשה ספינה מהירה, צוות שלא מפחד לומר לה שהיא מגזימה, והרשאה להגיע ראשונה כשמושבה זקוקה לעזרה.',
                'מי שלא התנהג יפה בצבא — פגש אותה. מי שהציק למושבות — גם. ומי שניסה להסביר לה שזה לא בתחום הסמכות שלה, גילה שסרה מרחיבה תחומי סמכות במהירות גבוהה מאוד.'
            ]
        },
        {
            id: 'rahav',
            imageUrl: '/epilogue/rahav_epilogue.png',
            characterName: 'רהב',
            title: 'האדם שמחזיק את הגלקסיה',
            body: [
                'רהב המשיך להאמין שכל הגלקסיה קיימת בזכותו. הפרויקט החשוב באמת, לדעתו, היה לשדרג את החללית שלו עד שתעקוף את זו של בתו, ד״ר נעמי.',
                'בכל פעם שהמנועים שלו עלו למהירות מלאה, הופיעה על כל המסכים בסביבה הודעה גדולה: „מופעל באמצעות טכנולוגיה גנובה”. רהב מעולם לא הצליח להוכיח מי השתיל אותה.'
            ]
        },
        {
            id: 'naomi',
            imageUrl: '/epilogue/naomi_epilogue.png',
            characterName: 'ד״ר נעמי',
            title: 'תמיד רמה אחת מעל',
            body: [
                'נעמי מעולם לא הודתה שידיה קשורות להודעת המנועים של אביה. היא רק חייכה, לקחה עוד מפתח שוודי, והמשיכה לשדרג את החללית שלה — שכבר הייתה, כמובן, לפחות רמה אחת מעל שלו.',
                'המעבדה שלה הפכה למקום שאליו מגיעים טייסים ומושבות כשמשהו חשוב נשבר. היא תיקנה מגינים, מנועים וציוד הצלה, ושמרה חוק אחד: אף אחד לא נוגע בכלי העבודה שלה בלי רשות. במיוחד אבא שלה.'
            ]
        },
        {
            id: 'protagonist',
            imageUrl: '/epilogue/pilot_epilogue.png',
            characterName: 'הטייס',
            title: 'השביל הפתוח',
            body: [
                'הטייס המשיך לטוס, לחקור ולהגן על המושבות. לפעמים הוא הוביל שיירות בנתיבים שנפתחו מחדש, ולפעמים פשוט הגיע ראשון למקום שמישהו היה צריך בו עזרה. הוא לא חיפש תואר או פסל; הוא העדיף מנועים תקינים והבטחה שעוד מישהו יגיע הביתה.',
                'ובין לבין הוא המשיך לחטוף מנעמי על שריטות שלא היו, אדים שנגרמו מנשימה, ופעם אחת על כך ש״הסתכלת עליה לא בזווית הנכונה״. הוא מעולם לא היה בטוח אם היא צוחקת — ולכן הקפיד מאוד לא לבדוק.'
            ]
        },
        {
            id: 'ghost',
            imageUrl: '/epilogue/ghost_epilogue.png',
            characterName: 'גוסט',
            title: 'ההודעה האחרונה',
            body: [
                'גוסט שלח הודעה אחרונה אחת: „צריך לבדוק משהו. אחזור כשהמידע יהיה אצלי.” ואז נעלם.',
                'לא היה טקס פרידה, לא הייתה כתובת ולא הייתה תשובה לשאלה לאן הוא טס. רק ערוץ תקשורת מוצפן שנשאר פתוח, כאילו יום אחד תופיע בו הודעה נוספת.'
            ]
        }
    ],
    en: [
        {
            id: 'elena',
            imageUrl: '/epilogue/ilana_epilogue.png',
            characterName: 'Ilana',
            title: 'Commander General',
            body: [
                'After the victory over the alien fleet, the galaxy finally found a little order. Ilana and Sera gave the military a thorough cleanup: corrupt officers and commanders who had abandoned colonies learned that excuses ran out first.',
                'When the armed forces reopened, Ilana took the commander general’s chair. She did not promise that everything would be easy; she promised that the military would protect the people it was created to protect.'
            ]
        },
        {
            id: 'sera',
            imageUrl: '/epilogue/sera_epilogue.png',
            characterName: 'Sera',
            title: 'Guardian at Large',
            body: [
                'Sera became commander of military police and humanity’s roaming protector. She did not ask for a large office; she asked for a fast ship, a crew brave enough to tell her when she was overdoing it, and clearance to be first on scene whenever a colony needed help.',
                'Anyone who misbehaved in the military met her. Anyone who harassed a colony met her too. Anyone who claimed that it was outside her authority learned how quickly Sera could expand the definition of authority.'
            ]
        },
        {
            id: 'rahav',
            imageUrl: '/epilogue/rahav_epilogue.png',
            characterName: 'Rahav',
            title: 'The Man Who Runs the Galaxy',
            body: [
                'Rahav continued to believe that the entire galaxy existed because of him. In his view, the truly vital project was upgrading his ship until it outran the craft of his daughter, Dr. Naomi.',
                'Whenever his engines reached full speed, a large message appeared on every nearby display: “Powered by stolen technology.” Rahav never managed to prove who planted it.'
            ]
        },
        {
            id: 'naomi',
            imageUrl: '/epilogue/naomi_epilogue.png',
            characterName: 'Dr. Naomi',
            title: 'Always One Rank Ahead',
            body: [
                'Naomi never admitted that she had anything to do with her father’s engine message. She merely smiled, picked up another wrench, and kept upgrading her own ship — which was, naturally, at least one full rank ahead of his.',
                'Her workshop became the place pilots and colonies called when something important broke. She repaired shields, engines, and rescue equipment, while enforcing one rule: no one touches her tools without permission. Especially her father.'
            ]
        },
        {
            id: 'protagonist',
            imageUrl: '/epilogue/pilot_epilogue.png',
            characterName: 'The Pilot',
            title: 'The Open Route',
            body: [
                'The pilot kept flying, exploring, and protecting the colonies. Sometimes he guided convoys through reopened routes; sometimes he was simply the first person to arrive where help was needed. He never wanted a title or a statue. Working engines and the promise that one more person would make it home were enough.',
                'In between, Naomi continued to scold him over scratches that did not exist, condensation caused by breathing, and once for “looking at her from the wrong angle.” He was never certain whether she was joking, so he wisely chose not to find out.'
            ]
        },
        {
            id: 'ghost',
            imageUrl: '/epilogue/ghost_epilogue.png',
            characterName: 'Ghost',
            title: 'The Last Message',
            body: [
                'Ghost sent one final message: “I need to check something. I will return when the information is in my hands.” Then he disappeared.',
                'There was no farewell ceremony, no address, and no answer to where he had gone. Only an encrypted channel remained open, as though another message might appear there one day.'
            ]
        }
    ],
    ja: [
        {
            id: 'elena',
            imageUrl: '/epilogue/ilana_epilogue.png',
            characterName: 'イラナ',
            title: '総司令官',
            body: [
                '異星人艦隊との戦いが終わり、銀河にはようやく少しの秩序が戻った。イラナとセラは軍の大掃除を断行し、腐敗した将校や植民地を見捨てた司令官たちは、言い訳が先に尽きることを知った。',
                '軍が再編されると、イラナは総司令官の席に就いた。彼女が約束したのは楽な未来ではない。軍が本来守るべき人々を、必ず守るということだった。'
            ]
        },
        {
            id: 'sera',
            imageUrl: '/epilogue/sera_epilogue.png',
            characterName: 'セラ',
            title: '人類の守護者',
            body: [
                'セラは憲兵隊の司令官、そして人類を守る巡回守護者となった。欲しかったのは大きな執務室ではない。速い船、遠慮なく止めてくれる仲間、そして植民地が助けを求めた時に誰より早く飛び込む権限だった。',
                '軍で問題を起こす者は彼女に会う。植民地を脅かす者も同じだ。「管轄外だ」と説明しようとした者は、セラが管轄を光速で広げられることを学んだ。'
            ]
        },
        {
            id: 'rahav',
            imageUrl: '/epilogue/rahav_epilogue.png',
            characterName: 'ラハヴ',
            title: '銀河を動かす男',
            body: [
                'ラハヴは今も、銀河が自分のおかげで成り立っていると信じていた。彼にとって最重要計画は、娘のナオミ博士の船を追い越すまで自分の船を改造することだった。',
                '彼のエンジンが全開になるたび、周囲の画面には大きく「盗用技術で駆動中」と表示された。誰が仕込んだのか、ラハヴは最後まで証明できなかった。'
            ]
        },
        {
            id: 'naomi',
            imageUrl: '/epilogue/naomi_epilogue.png',
            characterName: 'ナオミ博士',
            title: 'いつでも一段上',
            body: [
                'ナオミは父のエンジン表示に関わったことを一度も認めなかった。ただ微笑み、またレンチを手に取り、自分の船を改造し続けた。もちろん父の船より、常に少なくとも一段上だった。',
                '彼女の工房は、重要なものが壊れた時にパイロットや植民地が頼る場所になった。シールド、エンジン、救難装備を直しながら、彼女は一つだけ厳守した。許可なく工具に触れるな。特に父は。'
            ]
        },
        {
            id: 'protagonist',
            imageUrl: '/epilogue/pilot_epilogue.png',
            characterName: 'パイロット',
            title: '開かれた航路',
            body: [
                'パイロットは飛び続け、探検を続け、植民地を守り続けた。再開された航路で輸送船団を導く日もあれば、助けが必要な場所へ最初に駆けつける日もあった。称号や銅像はいらなかった。正常なエンジンと、もう一人が無事に帰れるという約束で十分だった。',
                'その合間にも、ナオミは存在しない傷、呼吸でできた曇り、そして一度は「見る角度が違う」という理由で彼を叱った。冗談かどうか、彼には分からなかった。だから確かめないことにした。'
            ]
        },
        {
            id: 'ghost',
            imageUrl: '/epilogue/ghost_epilogue.png',
            characterName: 'ゴースト',
            title: '最後の通信',
            body: [
                'ゴーストは最後に一通だけ送った。「確認したいことがある。情報を手に入れたら戻る。」そして姿を消した。',
                '別れの式典も、行き先も、どこへ向かったのかという答えもなかった。ただ暗号化された通信回線だけが残った。いつか、そこに次のメッセージが届くかもしれない。'
            ]
        }
    ],
    zh: [
        {
            id: 'elena',
            imageUrl: '/epilogue/ilana_epilogue.png',
            characterName: '伊兰娜',
            title: '最高指挥官',
            body: [
                '击退外星舰队后，银河终于恢复了一点秩序。伊兰娜和塞拉对军队进行了一次彻底整顿；腐败军官和抛弃殖民地的指挥官很快明白，借口总是最先用完的。',
                '军队重组后，伊兰娜坐上了最高指挥官的席位。她没有承诺一切都会轻松；她承诺军队会保护它本应保护的人。'
            ]
        },
        {
            id: 'sera',
            imageUrl: '/epilogue/sera_epilogue.png',
            characterName: '塞拉',
            title: '人类守护者',
            body: [
                '塞拉成为军事警察指挥官，也是守护人类的巡航卫士。她不要大办公室；她要的是一艘快船、一支敢于提醒她别太过头的队伍，以及在殖民地求援时第一个赶到现场的权限。',
                '在军队里惹事的人会见到她。骚扰殖民地的人也会见到她。有人若说“这不归你管”，就会发现塞拉扩展管辖范围的速度非常快。'
            ]
        },
        {
            id: 'rahav',
            imageUrl: '/epilogue/rahav_epilogue.png',
            characterName: '拉哈夫',
            title: '支撑银河的人',
            body: [
                '拉哈夫依然相信，整个银河都是靠他才运转的。在他看来，最重要的项目就是不断升级自己的飞船，直到超过女儿娜奥米博士的那一艘。',
                '每当他的引擎全速运转，附近所有屏幕都会跳出一条醒目的信息：“由偷来的技术驱动”。拉哈夫始终没能证明是谁把它装进去的。'
            ]
        },
        {
            id: 'naomi',
            imageUrl: '/epilogue/naomi_epilogue.png',
            characterName: '娜奥米博士',
            title: '永远领先一级',
            body: [
                '娜奥米从未承认父亲的引擎提示与她有关。她只是微微一笑，拿起另一把扳手，继续升级自己的飞船——当然，它始终至少比父亲的高出一级。',
                '她的工坊成了飞行员和殖民地在重要设备损坏时最信赖的地方。她修理护盾、引擎和救援设备，同时坚持一条规则：未经允许，谁也不能碰她的工具。尤其是她父亲。'
            ]
        },
        {
            id: 'protagonist',
            imageUrl: '/epilogue/pilot_epilogue.png',
            characterName: '飞行员',
            title: '开放的航路',
            body: [
                '飞行员继续飞行、探索并保护殖民地。有时他带领运输船队穿过重新开放的航路，有时他只是第一个赶到需要帮助的地方。他不想要头衔或雕像；运转正常的引擎，以及让更多人平安回家的承诺，就已经足够。',
                '其间，娜奥米仍会因为不存在的划痕、呼吸造成的水汽，以及有一次“你看的角度不对”而训他。他从来不确定她是不是在开玩笑，所以明智地决定不去验证。'
            ]
        },
        {
            id: 'ghost',
            imageUrl: '/epilogue/ghost_epilogue.png',
            characterName: '幽灵',
            title: '最后一条讯息',
            body: [
                '幽灵只留下了一条最后的讯息：“有件事需要确认。等信息到我手里，我会回来。”随后，他消失了。',
                '没有告别仪式，没有地址，也没有人知道他去了哪里。只有一条加密通讯频道始终保持开启，仿佛某一天，那里还会出现下一条讯息。'
            ]
        }
    ]
};

export function getEpilogueScenes(language: GameplayLanguage): EpilogueScene[] {
    return EPILOGUE_BY_LANGUAGE[language];
}

export function getEpilogueInterfaceCopy(language: GameplayLanguage): EpilogueInterfaceCopy {
    return EPILOGUE_INTERFACE_COPY[language];
}
