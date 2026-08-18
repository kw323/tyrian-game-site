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
    maxUnlockedLevel?: number;
}

export class SaveSystem {
    private static readonly SAVE_KEY_PREFIX = 'tyrian_save_slot_';
    private static readonly AUTOSAVE_KEY = 'tyrian_autosave';

    public static getSlots(): Array<SaveData | null> {
        const slots: Array<SaveData | null> = [];
        for (let i = 1; i <= 3; i++) {
            const raw = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${i}`);
            if (raw) {
                try {
                    slots.push(JSON.parse(raw));
                } catch {
                    slots.push(null);
                }
            } else {
                slots.push(null);
            }
        }
        return slots;
    }

    public static saveGame(slotId: number, data: Omit<SaveData, 'timestamp'>): void {
        const saveData: SaveData = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(`${this.SAVE_KEY_PREFIX}${slotId}`, JSON.stringify(saveData));
    }

    public static loadGame(slotId: number): SaveData | null {
        const raw = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotId}`);
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
        localStorage.removeItem(`${SaveSystem.SAVE_KEY_PREFIX}${slotId}`);
    }

    public static deleteAutoSave(): void {
        localStorage.removeItem(this.AUTOSAVE_KEY);
    }
}
