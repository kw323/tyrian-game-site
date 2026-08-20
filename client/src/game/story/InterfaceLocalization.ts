import type { GameplayLanguage } from './CampaignSystem';
import type { GraphicsQuality } from '../core/GraphicsSettings';

export interface InterfaceText {
    sections: Record<'game' | 'upgrades' | 'saves' | 'settings' | 'intel' | 'exit', string>;
    graphics: string;
    graphicsDescription: string;
    quality: Record<GraphicsQuality, { label: string; detail: string }>;
    music: string;
    language: string;
    difficulty: string;
    controls: string;
    openControls: string;
    standardDisplay: string;
    gameHeading: string;
    resumeStage: (stage: number) => string;
    newCampaign: string;
    continueMission: string;
    newMission: string;
    stageMap: string;
    savedCheckpoint: string;
    noCheckpoint: string;
    acknowledge: string;
}

const COPY: Record<GameplayLanguage, InterfaceText> = {
    he: {
        sections: { game: 'משחק', upgrades: 'שדרוגים', saves: 'שמירה / טעינה', settings: 'הגדרות', intel: 'מודיעין', exit: 'יציאה' },
        graphics: 'גרפיקה',
        graphicsDescription: 'האיכות משנה רק עומק רקע, חלקיקים ואפקטים חזותיים — לא קושי, נזק או מהירות.',
        quality: {
            performance: { label: 'ביצועים', detail: 'פחות חלקיקים ורקע קל יותר' },
            standard: { label: 'רגיל', detail: 'האיזון המומלץ בין מראה לביצועים' },
            high: { label: 'גבוה', detail: 'יותר כוכבים, ערפיליות ואפקטים' },
        },
        music: 'מוזיקה', language: 'שפה', difficulty: 'רמת קושי', controls: 'שליטה', openControls: 'פתיחת מיפוי מקשים',
        standardDisplay: 'תצוגה ברורה עם טקסט גדול פעילה', gameHeading: 'פקודות טיסה ראשיות',
        resumeStage: (stage) => `המשך משלב ${stage}`, newCampaign: 'התחל את מערכת ארק־9', continueMission: 'המשך משימה', newMission: 'משימה חדשה', stageMap: 'מפת שלבים',
        savedCheckpoint: 'נקודת שמירה פעילה', noCheckpoint: 'אין נקודת שמירה פעילה', acknowledge: 'הבנתי // המשך',
    },
    en: {
        sections: { game: 'Game', upgrades: 'Upgrades', saves: 'Save / Load', settings: 'Settings', intel: 'Intel', exit: 'Exit' },
        graphics: 'Graphics', graphicsDescription: 'Quality changes only background depth, particles, and visual effects — never difficulty, damage, or speed.',
        quality: {
            performance: { label: 'Performance', detail: 'Fewer particles and a lighter background' },
            standard: { label: 'Standard', detail: 'Recommended balance of visuals and performance' },
            high: { label: 'High', detail: 'More stars, nebulae, and visual effects' },
        },
        music: 'Music', language: 'Language', difficulty: 'Difficulty', controls: 'Controls', openControls: 'Open control map',
        standardDisplay: 'High-contrast display and large text are active', gameHeading: 'Primary flight orders',
        resumeStage: (stage) => `Resume from Stage ${stage}`, newCampaign: 'Begin the Ark-9 campaign', continueMission: 'Continue mission', newMission: 'New mission', stageMap: 'Stage map',
        savedCheckpoint: 'Active checkpoint', noCheckpoint: 'No active checkpoint', acknowledge: 'Acknowledged // Continue',
    },
    ja: {
        sections: { game: 'ゲーム', upgrades: '強化', saves: 'セーブ / ロード', settings: '設定', intel: '情報', exit: '終了' },
        graphics: 'グラフィック', graphicsDescription: '画質は背景の奥行き、粒子、視覚効果だけを変更します。難易度、ダメージ、速度は変わりません。',
        quality: {
            performance: { label: 'パフォーマンス', detail: '粒子と背景を軽量化' },
            standard: { label: '標準', detail: '見た目と動作の推奨バランス' },
            high: { label: '高', detail: '星雲、星、視覚効果を増加' },
        },
        music: '音楽', language: '言語', difficulty: '難易度', controls: '操作', openControls: '操作設定を開く',
        standardDisplay: '高コントラストと大きな文字を使用中', gameHeading: '主要飛行命令',
        resumeStage: (stage) => `ステージ ${stage} から再開`, newCampaign: 'ARK-9キャンペーンを開始', continueMission: '任務を続ける', newMission: '新規任務', stageMap: 'ステージマップ',
        savedCheckpoint: '有効なチェックポイント', noCheckpoint: '有効なチェックポイントなし', acknowledge: '了解 // 続行',
    },
    zh: {
        sections: { game: '游戏', upgrades: '升级', saves: '保存 / 读取', settings: '设置', intel: '情报', exit: '退出' },
        graphics: '图形', graphicsDescription: '画质只改变背景景深、粒子和视觉效果，不会改变难度、伤害或速度。',
        quality: {
            performance: { label: '性能', detail: '减少粒子并简化背景' },
            standard: { label: '标准', detail: '画面与性能的推荐平衡' },
            high: { label: '高', detail: '更多星星、星云和视觉效果' },
        },
        music: '音乐', language: '语言', difficulty: '难度', controls: '控制', openControls: '打开按键设置',
        standardDisplay: '已启用高对比度和大字号', gameHeading: '主要飞行命令',
        resumeStage: (stage) => `从第 ${stage} 关继续`, newCampaign: '开始方舟9号战役', continueMission: '继续任务', newMission: '新任务', stageMap: '关卡地图',
        savedCheckpoint: '当前检查点', noCheckpoint: '没有当前检查点', acknowledge: '了解 // 继续',
    }
};

export function getInterfaceText(language: GameplayLanguage): InterfaceText {
    return COPY[language];
}
