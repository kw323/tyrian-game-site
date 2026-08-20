import { describe, expect, it } from 'vitest';
import { EngineUpgradeSystem } from './EngineUpgradeSystem';

describe('EngineUpgradeSystem', () => {
    it('starts at baseline speed and applies a controlled two percent per rank', () => {
        const engine = new EngineUpgradeSystem();
        expect(engine.getRank()).toBe(0);
        expect(engine.getBonusPercent()).toBe(0);
        expect(engine.getSpeedMultiplier()).toBe(1);

        expect(engine.upgrade(2000)).toBe(2000);
        expect(engine.getRank()).toBe(1);
        expect(engine.getBonusPercent()).toBe(2);
        expect(engine.getSpeedMultiplier()).toBeCloseTo(1.02);
    });

    it('uses a campaign-scale finite progression and caps at sixteen percent', () => {
        const engine = new EngineUpgradeSystem();
        const costs: number[] = [];
        while (engine.canUpgrade()) {
            const cost = engine.upgrade(100000);
            expect(cost).not.toBeNull();
            costs.push(cost ?? 0);
        }

        expect(costs).toEqual([2000, 3000, 4500, 6500, 9000, 12500, 17000, 23000]);
        expect(engine.getRank()).toBe(8);
        expect(engine.getBonusPercent()).toBe(16);
        expect(engine.getSpeedMultiplier()).toBeCloseTo(1.16);
        expect(engine.getTotalInvestment()).toBe(77500);
        expect(engine.upgrade(100000)).toBeNull();
    });

    it('rejects a purchase without enough credits and clamps loaded save data', () => {
        const engine = new EngineUpgradeSystem();
        expect(engine.upgrade(1999)).toBeNull();
        engine.loadSaveState(99);
        expect(engine.getRank()).toBe(8);
        engine.loadSaveState(-4);
        expect(engine.getRank()).toBe(0);
    });
});
