import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ChainLightningBullet } from './ChainLightningBullet';

describe('ChainLightningBullet', () => {
    it('uses rank-based jump limits and never strikes the same target twice', () => {
        const bolt = new ChainLightningBullet(100, 500, 40, 24);
        const target = new Enemy(100, 200, 24, 24, 1, 50);

        expect(bolt.chainJumps).toBe(6);
        expect(bolt.canStrike(target)).toBe(true);
        bolt.registerStrike(100, 500, target, 40);
        expect(bolt.hasStruck(target)).toBe(true);
        expect(bolt.canStrike(target)).toBe(false);
    });

    it('keeps the lightning visible briefly after resolving a chain', () => {
        const bolt = new ChainLightningBullet(100, 500, 40, 0);
        bolt.finishChain();
        expect(bolt.isActive).toBe(true);
        bolt.update(0.2);
        expect(bolt.isActive).toBe(false);
    });
});
