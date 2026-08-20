import { describe, expect, it } from 'vitest';
import { createEnemyVisualProfile } from './EnemyVisualSystem';

describe('EnemyVisualSystem', () => {
    it('gives raider ships deterministic but varied hull palettes per variant', () => {
        const firstRaider = createEnemyVisualProfile('raiders', 'scout', 0);
        const secondRaider = createEnemyVisualProfile('raiders', 'scout', 1);

        expect(firstRaider.silhouette).toBe('raider_dart');
        expect(firstRaider.hull).not.toBe(secondRaider.hull);
        expect(firstRaider.engine).not.toBe(secondRaider.engine);
    });

    it('keeps military hull livery consistent while allowing restrained type trims', () => {
        const scout = createEnemyVisualProfile('military', 'scout');
        const tank = createEnemyVisualProfile('military', 'tank');

        expect(scout.hull).toBe(tank.hull);
        expect(scout.shadow).toBe(tank.shadow);
        expect(scout.trim).not.toBe(tank.trim);
        expect(scout.silhouette).toBe('military_interceptor');
        expect(tank.silhouette).toBe('military_assault');
    });

    it('assigns aliens a recognizable palette and hull family for each combat type', () => {
        const scout = createEnemyVisualProfile('aliens', 'scout');
        const drone = createEnemyVisualProfile('aliens', 'drone');
        const orbiter = createEnemyVisualProfile('aliens', 'orbiter');
        const sentinel = createEnemyVisualProfile('aliens', 'sentinel');

        expect(scout.silhouette).toBe('alien_skimmer');
        expect(drone.silhouette).toBe('alien_manta');
        expect(orbiter.silhouette).toBe('alien_orbiter');
        expect(sentinel.silhouette).toBe('alien_sentinel');
        expect(new Set([scout.hull, drone.hull, orbiter.hull, sentinel.hull]).size).toBe(4);
    });

    it('uses an explicit ship silhouette for the evasive hunter in every faction', () => {
        expect(createEnemyVisualProfile('raiders', 'evasive_hunter').silhouette).toBe('hunter');
        expect(createEnemyVisualProfile('military', 'evasive_hunter').silhouette).toBe('hunter');
        expect(createEnemyVisualProfile('aliens', 'evasive_hunter').silhouette).toBe('hunter');
    });
});
