import { describe, expect, it } from 'vitest';
import { EngineUpgradeSystem } from './EngineUpgradeSystem';

describe('EngineUpgradeSystem', () => {
    it('starts at baseline speed and applies a controlled two percent per rank', () => {
        const engine = new EngineUpgradeSystem();
        expect(engine.getRank()).toBe(0);
        expect(engine.getBonusPercent()).toBe(0);
        expect(engine.getSpeedMultiplier()).toBe(1);

        expect(engine.upgrade(600)).toBe(600);
        expect(engine.getRank()).toBe(1);
        expect(engine.getBonusPercent()).toBe(2);
        expect(engine.getSpeedMultiplier()).toBeCloseTo(1.02);
    });

    it('uses an affordable finite progression and caps at sixteen percent', () => {
        const engine = new EngineUpgradeSystem();
        const costs: number[] = [];
        while (engine.canUpgrade()) {
            const cost = engine.upgrade(100000);
            expect(cost).not.toBeNull();
            costs.push(cost ?? 0);
        }

        expect(costs).toEqual([600, 800, 1050, 1350, 1750, 2250, 2850, 3600]);
        expect(engine.getRank()).toBe(8);
        expect(engine.getBonusPercent()).toBe(16);
        expect(engine.getSpeedMultiplier()).toBeCloseTo(1.16);
        expect(engine.getTotalInvestment()).toBe(14250);
        expect(engine.upgrade(100000)).toBeNull();
    });

    it('rejects a purchase without enough credits and clamps loaded save data', () => {
        const engine = new EngineUpgradeSystem();
        expect(engine.upgrade(599)).toBeNull();
        engine.loadSaveState(99);
        expect(engine.getRank()).toBe(8);
        engine.loadSaveState(-4);
        expect(engine.getRank()).toBe(0);
    });
});
