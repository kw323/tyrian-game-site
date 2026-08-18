import { describe, expect, it } from 'vitest';
import { getEnemyCombatProfile, getFactionWaveProfile } from './EnemyCombatProfile';
import { EnemyAdvanced, EnemyMovementType, EnemyType } from '../entities/EnemyAdvanced';

function createEnemy(faction: 'raiders' | 'military' | 'aliens', type: EnemyType): EnemyAdvanced {
    return new EnemyAdvanced(400, 120, 32, 28, 1, 20, EnemyMovementType.HOVER, 2, type, 100, false, 0, 1, false, faction);
}

describe('Enemy combat profiles', () => {
    it('preserves a different combat identity for every faction', () => {
        expect(getEnemyCombatProfile('raiders', 'scout').moveMultiplier).toBeGreaterThan(1);
        expect(getEnemyCombatProfile('military', 'drone').shotPattern).toBe('aim_burst');
        expect(getEnemyCombatProfile('aliens', 'sentinel').shotPattern).toBe('plasma_crown');
    });

    it('uses faction-specific wave pressure rather than a universal two-unit wave', () => {
        const raiders = getFactionWaveProfile('raiders');
        const military = getFactionWaveProfile('military');
        const aliens = getFactionWaveProfile('aliens');
        expect(raiders.standardCount).toBe(3);
        expect(raiders.spawnRate).toBeLessThan(aliens.spawnRate);
        expect(military.standardCount).toBe(2);
        expect(military.spawnRate).toBeGreaterThan(aliens.spawnRate);
        expect(aliens.swarmMax).toBeLessThan(raiders.swarmMax);
    });

    it('generates readable faction-specific salvo shapes', () => {
        expect(createEnemy('raiders', EnemyType.DRONE).generateShot(400, 700)).toHaveLength(2);
        expect(createEnemy('raiders', EnemyType.TANK).generateShot(400, 700)).toHaveLength(3);
        expect(createEnemy('military', EnemyType.DRONE).generateShot(400, 700)).toHaveLength(2);
        expect(createEnemy('military', EnemyType.SENTINEL).generateShot(400, 700)).toHaveLength(3);
        expect(createEnemy('aliens', EnemyType.DRONE).generateShot(400, 700)).toHaveLength(2);
        expect(createEnemy('aliens', EnemyType.ORBITER).generateShot(400, 700)).toHaveLength(3);
        expect(createEnemy('aliens', EnemyType.SENTINEL).generateShot(400, 700)).toHaveLength(5);
    });
});
