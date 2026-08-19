export interface SaveData {
    slotId: string;
    slotName: string;
    timestamp: number;
    score: number;
    level: number;
    shipId: number;
    generatorLevel: number;
    shieldLevel: number;
    weaponLevels: Record<string, number>;
    currentWeapon: string;
    tacticalAbilityLevels?: Record<string, number>;
    selectedTacticalAbility?: string;
    tacticalAbilityState?: {
        levels: Record<string, number>;
        selectedAbility: string;
        magazineCapacity?: number;
    };
    maxUnlockedLevel?: number;
}

export class SaveSystem {
    public static readonly SLOTS_PER_PAGE = 10;
    private static readonly SAVE_KEY_PREFIX = 'tyrian_save_slot_';
    private static readonly AUTOSAVE_KEY = 'tyrian_autosave';

    public static getSlots(pageIndex = 0): Array<SaveData | null> {
        const safePageIndex = Math.max(0, Math.floor(pageIndex));
        const firstSlotId = safePageIndex * this.SLOTS_PER_PAGE + 1;
        const slots: Array<SaveData | null> = [];

        for (let offset = 0; offset < this.SLOTS_PER_PAGE; offset++) {
            slots.push(this.loadGame(firstSlotId + offset));
        }
        return slots;
    }

    public static getSlotIdsForPage(pageIndex = 0): number[] {
        const safePageIndex = Math.max(0, Math.floor(pageIndex));
        const firstSlotId = safePageIndex * this.SLOTS_PER_PAGE + 1;
        return Array.from({ length: this.SLOTS_PER_PAGE }, (_, index) => firstSlotId + index);
    }

    public static getManualSaveCount(): number {
        let count = 0;
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key?.startsWith(this.SAVE_KEY_PREFIX) && this.loadGame(Number(key.slice(this.SAVE_KEY_PREFIX.length)))) {
                count++;
            }
        }
        return count;
    }

    public static getHighestUsedPage(): number {
        let highestSlotId = 0;
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (!key?.startsWith(this.SAVE_KEY_PREFIX)) continue;
            const slotId = Number(key.slice(this.SAVE_KEY_PREFIX.length));
            if (Number.isInteger(slotId) && slotId > highestSlotId && this.loadGame(slotId)) highestSlotId = slotId;
        }
        return highestSlotId === 0 ? 0 : Math.floor((highestSlotId - 1) / this.SLOTS_PER_PAGE);
    }

    public static saveGame(slotId: number, data: Omit<SaveData, 'timestamp'>): void {
        const safeSlotId = Math.max(1, Math.floor(slotId));
        const saveData: SaveData = {
            ...data,
            slotId: String(safeSlotId),
            timestamp: Date.now()
        };
        localStorage.setItem(`${this.SAVE_KEY_PREFIX}${safeSlotId}`, JSON.stringify(saveData));
    }

    public static loadGame(slotId: number): SaveData | null {
        const safeSlotId = Math.max(1, Math.floor(slotId));
        const raw = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${safeSlotId}`);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    public static autoSave(data: Omit<SaveData, 'slotId' | 'slotName' | 'timestamp'>): void {
        const saveData: SaveData = {
            ...data,
            slotId: 'auto',
            slotName: `AutoSave (Level ${data.level})`,
            timestamp: Date.now()
        };
        localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
    }

    public static loadAutoSave(): SaveData | null {
        const raw = localStorage.getItem(this.AUTOSAVE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    public static deleteSlot(slotId: number): void {
        const safeSlotId = Math.max(1, Math.floor(slotId));
        localStorage.removeItem(`${SaveSystem.SAVE_KEY_PREFIX}${safeSlotId}`);
    }

    public static deleteAutoSave(): void {
        localStorage.removeItem(this.AUTOSAVE_KEY);
    }
}
