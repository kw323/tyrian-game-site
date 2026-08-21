import { beforeEach, describe, expect, it } from 'vitest';
import { SaveData, SaveSystem } from './SaveSystem';

class MemoryStorage implements Storage {
    private values = new Map<string, string>();

    get length(): number { return this.values.size; }
    clear(): void { this.values.clear(); }
    getItem(key: string): string | null { return this.values.get(key) ?? null; }
    key(index: number): string | null { return Array.from(this.values.keys())[index] ?? null; }
    removeItem(key: string): void { this.values.delete(key); }
    setItem(key: string, value: string): void { this.values.set(key, value); }
}

function savePayload(slotId: number, level: number): Omit<SaveData, 'timestamp'> {
    return {
        slotId: String(slotId),
        slotName: `Test Slot ${slotId}`,
        score: level * 1000,
        level,
        shipId: 0,
        generatorLevel: 1,
        shieldLevel: 1,
        weaponLevels: {},
        currentWeapon: 'straight'
    };
}

describe('SaveSystem paginated slots', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: new MemoryStorage()
        });
    });

    it('keeps legacy slots on the first ten-slot page', () => {
        SaveSystem.saveGame(1, savePayload(1, 4));
        SaveSystem.saveGame(3, savePayload(3, 12));

        const firstPage = SaveSystem.getSlots(0);
        expect(firstPage).toHaveLength(10);
        expect(firstPage[0]?.level).toBe(4);
        expect(firstPage[2]?.level).toBe(12);
        expect(firstPage[9]).toBeNull();
    });

    it('separates saves into ten-slot pages without overwriting earlier pages', () => {
        SaveSystem.saveGame(1, savePayload(1, 2));
        SaveSystem.saveGame(11, savePayload(11, 37));
        SaveSystem.saveGame(20, savePayload(20, 101));

        expect(SaveSystem.getSlots(0)[0]?.level).toBe(2);
        expect(SaveSystem.getSlots(1)[0]?.level).toBe(37);
        expect(SaveSystem.getSlots(1)[9]?.level).toBe(101);
        expect(SaveSystem.getSlotIdsForPage(2)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    });

    it('counts, finds, and deletes manual saves across pages', () => {
        SaveSystem.saveGame(2, savePayload(2, 6));
        SaveSystem.saveGame(27, savePayload(27, 88));

        expect(SaveSystem.getManualSaveCount()).toBe(2);
        expect(SaveSystem.getHighestUsedPage()).toBe(2);
        SaveSystem.deleteSlot(27);
        expect(SaveSystem.getManualSaveCount()).toBe(1);
        expect(SaveSystem.getHighestUsedPage()).toBe(0);
    });
});


describe('SaveSystem full progression persistence', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: new MemoryStorage()
        });
    });

    it('preserves engine progression, rune collection, equipment, and pilot skills', () => {
        const payload: Omit<SaveData, 'timestamp'> = {
            ...savePayload(8, 44),
            engineUpgradeLevel: 5,
            runeState: {
                version: 1,
                inventory: [
                    { id: 'rune-1', runeId: 'assault', tier: 2 },
                    { id: 'rune-2', runeId: 'guard', tier: 1 }
                ],
                loadout: ['rune-1', 'rune-2', null]
            },
            pilotSkillsState: { rank: 19, skills: { hull_integrity: 4 } },
            equipmentState: { equipped: { engine: { id: 'engine-1', level: 4, tier: 2 } } }
        };

        SaveSystem.saveGame(8, payload);
        const restored = SaveSystem.loadGame(8);

        expect(restored?.engineUpgradeLevel).toBe(5);
        expect(restored?.runeState?.loadout).toEqual(['rune-1', 'rune-2', null]);
        expect(restored?.pilotSkillsState).toEqual(payload.pilotSkillsState);
        expect(restored?.equipmentState).toEqual(payload.equipmentState);
    });
});
