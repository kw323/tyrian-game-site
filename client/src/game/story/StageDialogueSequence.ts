import voiceLines from '../../../../english_voice_lines.json';
import localizedLines from './locales/dialogue.voice-lines.json';

export type DialogueSpeaker = 'naomi' | 'protagonist' | 'elena' | 'sera' | 'ghost' | 'rahav' | 'archon';
export type DialogueLanguage = 'he' | 'en' | 'ja' | 'zh';

export interface SequencedDialogueLine {
    speaker: DialogueSpeaker;
    name: string;
    message: string;
    voiceLineId: string;
}

interface VoiceLineSource {
    lineId: string;
    stage: number;
    speaker: DialogueSpeaker;
    text: string;
    heText: string;
}

interface LocalizedVoiceLine {
    lineId: string;
    /** English is translated from Hebrew, the canonical campaign source. */
    en?: string;
    ja?: string;
    zh?: string;
}

const CHARACTER_NAMES: Record<DialogueSpeaker, Record<DialogueLanguage, string>> = {
    naomi: { he: 'ד״ר נעמי רן', en: 'Dr. Naomi Ren', ja: 'ナオミ・レン博士', zh: '娜奥米·雷恩博士' },
    protagonist: { he: 'טייס פרויקט Zero', en: 'Program Zero Pilot', ja: 'プロジェクト・ゼロのパイロット', zh: '零号计划飞行员' },
    elena: { he: 'המפקדת אלנה וייל', en: 'Commander Elena Vail', ja: 'エレナ・ヴェール司令官', zh: '埃琳娜·维尔指挥官' },
    sera: { he: 'סרה קיין', en: 'Sera Kane', ja: 'セラ・ケイン', zh: '塞拉·凯恩' },
    ghost: { he: 'גוסט', en: 'GHOST', ja: 'ゴースト', zh: '幽灵' },
    rahav: { he: 'פרופ׳ רהב', en: 'Prof. Rahav', ja: 'ラハブ教授', zh: '拉哈夫教授' },
    archon: { he: 'ארכון', en: 'ARCHON', ja: 'アーコン', zh: '执政官' },
};

const localizedByLineId = new Map<string, LocalizedVoiceLine>(
    (localizedLines as LocalizedVoiceLine[]).map((line) => [line.lineId, line])
);

const linesByStage = (voiceLines as VoiceLineSource[]).reduce<Map<number, VoiceLineSource[]>>((byStage, line) => {
    const lines = byStage.get(line.stage) ?? [];
    lines.push(line);
    byStage.set(line.stage, lines);
    return byStage;
}, new Map());

function getDialogueMessage(line: VoiceLineSource, language: DialogueLanguage): string {
    if (language === 'he') return line.heText;
    const localized = localizedByLineId.get(line.lineId);
    if (language === 'en') return localized?.en || line.text;
    return language === 'ja' ? (localized?.ja || line.text) : (localized?.zh || line.text);
}

/**
 * Returns every authored radio line for a stage in the same order as its voice assets,
 * including the five-line Archon finale briefing.
 */
export function getSequencedStageDialogue(stage: number, language: DialogueLanguage): SequencedDialogueLine[] | undefined {
    const lines = linesByStage.get(stage);
    if (!lines?.length) return undefined;
    return lines.map((line) => ({
        speaker: line.speaker,
        name: CHARACTER_NAMES[line.speaker][language],
        message: getDialogueMessage(line, language),
        voiceLineId: line.lineId,
    }));
}

export function getSequencedDialogueLineCount(stage: number): number {
    return linesByStage.get(stage)?.length ?? 0;
}
