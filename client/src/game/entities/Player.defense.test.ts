import { describe, expect, it } from 'vitest';
import { getShipDefenseProfile } from '../core/ShipDefenseProfile';
import { Player } from './Player';

function createPlayer(): Player {
    return new Player(100, 600, 28, 46, 7.5);
}

describe('Player defensive model', () => {
    it('uses a large numerical hull and a deliberately smaller starter shield', () => {
        const player = createPlayer();
        const starter = getShipDefenseProfile(0);

        expect(player.maxHealth).toBe(starter.hullHealth);
        expect(player.maxShield).toBe(starter.shieldCapacity);
        expect(player.maxHealth).toBeGreaterThan(player.maxShield * 3);
    });

    it('carries damage beyond an empty shield into the hull', () => {
        const player = createPlayer();
        const startingHull = player.health;
        const impact = player.maxShield + 25;

        expect(player.takeDamage(impact)).toBe(false);
        expect(player.shield).toBe(0);
        expect(player.health).toBe(startingHull - 25);
    });

    it('does not regenerate shield during the two-and-a-half-second recovery pause', () => {
        const player = createPlayer();
        player.takeDamage(20);
        const depletedShield = player.shield;

        player.updateWithInput(2.4, {}, 1200, 900);
        expect(player.shield).toBe(depletedShield);
        expect(player.shieldRegenDelay).toBeCloseTo(0.1, 5);

        player.updateWithInput(0.1, {}, 1200, 900);
        expect(player.shield).toBe(depletedShield);
        player.updateWithInput(1, {}, 1200, 900);
        expect(player.shield).toBeCloseTo(depletedShield + player.shieldRegenRate, 5);
    });

    it('scales hull meaningfully between the first and sixth ship class', () => {
        const starter = getShipDefenseProfile(0);
        const flagship = getShipDefenseProfile(5);

        expect(flagship.hullHealth).toBeGreaterThan(starter.hullHealth * 3);
        expect(flagship.shieldCapacity).toBeLessThan(flagship.hullHealth / 4);
    });
});
