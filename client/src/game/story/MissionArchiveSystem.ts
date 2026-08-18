import type { ContactLine, StageBriefing } from './CampaignSystem';

export interface MissionArchiveEntry {
    stage: number;
    operationCode: string;
    title: string;
    location: string;
    missionType: string;
    speaker: ContactLine['speaker'];
    speakerName: string;
    briefingMessage: string;
    objective: string;
    briefingSeen: boolean;
    briefingCompleted: boolean;
    inMissionComms: ContactLine | null;
    inMissionCommsRevealed: boolean;
    firstSeenAt: number;
    lastUpdatedAt: number;
}

const ARCHIVE_STORAGE_KEY = 'tyrian_mission_archive_v1';
const ARCHIVE_EVENT = 'tyrian:mission-archive-updated';

// Style: the archive is a recovered command record, preserving operational clarity and never exposing sealed intelligence before discovery.
export class MissionArchiveSystem {
    public static readonly storageKey = ARCHIVE_STORAGE_KEY;

    private static readEntries(): MissionArchiveEntry[] {
        const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((entry): entry is MissionArchiveEntry => Boolean(entry && typeof entry === 'object' && typeof (entry as MissionArchiveEntry).stage === 'number'));
        } catch {
            localStorage.removeItem(ARCHIVE_STORAGE_KEY);
            return [];
        }
    }

    private static writeEntries(entries: MissionArchiveEntry[]): void {
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(entries.sort((a, b) => a.stage - b.stage)));
        window.dispatchEvent(new CustomEvent(ARCHIVE_EVENT));
    }

    public static getEntries(): MissionArchiveEntry[] {
        return this.readEntries();
    }

    public static getEntry(stage: number): MissionArchiveEntry | null {
        return this.readEntries().find((entry) => entry.stage === stage) ?? null;
    }

    public static recordBriefing(briefing: StageBriefing, completed: boolean): void {
        const entries = this.readEntries();
        const now = Date.now();
        const existing = entries.find((entry) => entry.stage === briefing.stage);
        const base: MissionArchiveEntry = existing ?? {
            stage: briefing.stage,
            operationCode: briefing.operationCode,
            title: briefing.title,
            location: briefing.location,
            missionType: briefing.missionType,
            speaker: briefing.contact.speaker,
            speakerName: briefing.contact.name,
            briefingMessage: briefing.contact.message,
            objective: briefing.objective,
            briefingSeen: true,
            briefingCompleted: false,
            inMissionComms: null,
            inMissionCommsRevealed: false,
            firstSeenAt: now,
            lastUpdatedAt: now
        };
        Object.assign(base, {
            operationCode: briefing.operationCode,
            title: briefing.title,
            location: briefing.location,
            missionType: briefing.missionType,
            speaker: briefing.contact.speaker,
            speakerName: briefing.contact.name,
            briefingMessage: briefing.contact.message,
            objective: briefing.objective,
            briefingSeen: true,
            briefingCompleted: base.briefingCompleted || completed,
            inMissionComms: base.inMissionComms ?? null,
            lastUpdatedAt: now
        });
        const next = existing ? entries.map((entry) => entry.stage === briefing.stage ? base : entry) : [...entries, base];
        this.writeEntries(next);
    }

    public static recordInMissionComms(briefing: StageBriefing): void {
        const entries = this.readEntries();
        const existing = this.getEntry(briefing.stage);
        const now = Date.now();
        const entry: MissionArchiveEntry = existing ?? {
            stage: briefing.stage,
            operationCode: briefing.operationCode,
            title: briefing.title,
            location: briefing.location,
            missionType: briefing.missionType,
            speaker: briefing.contact.speaker,
            speakerName: briefing.contact.name,
            briefingMessage: briefing.contact.message,
            objective: briefing.objective,
            briefingSeen: false,
            briefingCompleted: false,
            inMissionComms: null,
            inMissionCommsRevealed: false,
            firstSeenAt: now,
            lastUpdatedAt: now
        };
        entry.inMissionComms = briefing.inMissionComms ?? entry.inMissionComms;
        entry.inMissionCommsRevealed = true;
        entry.lastUpdatedAt = now;
        const next = existing ? entries.map((item) => item.stage === briefing.stage ? entry : item) : [...entries, entry];
        this.writeEntries(next);
    }

    public static clear(): void {
        localStorage.removeItem(ARCHIVE_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(ARCHIVE_EVENT));
    }

    public static get updateEventName(): string {
        return ARCHIVE_EVENT;
    }
}

export default MissionArchiveSystem;
