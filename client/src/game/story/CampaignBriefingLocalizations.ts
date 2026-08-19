import englishBriefings from './locales/briefings.en.json';
import japaneseBriefings from './locales/briefings.ja.json';
import chineseBriefings from './locales/briefings.zh.json';

export type LocalizedBriefingLanguage = 'en' | 'ja' | 'zh';

export interface LocalizedContactLine {
    name: string;
    message: string;
}

export interface LocalizedStageBriefing {
    stage: number;
    title: string;
    location: string;
    objective: string;
    missionTargetName: string;
    contact: LocalizedContactLine;
    inMissionComms: LocalizedContactLine;
    dialogueSequence: LocalizedContactLine[];
    afterAction: LocalizedContactLine;
}

function indexBriefings(briefings: LocalizedStageBriefing[]): Record<number, LocalizedStageBriefing> {
    return briefings.reduce<Record<number, LocalizedStageBriefing>>((indexed, briefing) => {
        indexed[briefing.stage] = briefing;
        return indexed;
    }, {});
}

const LOCALIZED_BRIEFINGS: Record<LocalizedBriefingLanguage, Record<number, LocalizedStageBriefing>> = {
    en: indexBriefings(englishBriefings as LocalizedStageBriefing[]),
    ja: indexBriefings(japaneseBriefings as LocalizedStageBriefing[]),
    zh: indexBriefings(chineseBriefings as LocalizedStageBriefing[])
};

export function getLocalizedBriefing(language: LocalizedBriefingLanguage, stage: number): LocalizedStageBriefing | undefined {
    return LOCALIZED_BRIEFINGS[language][stage];
}
