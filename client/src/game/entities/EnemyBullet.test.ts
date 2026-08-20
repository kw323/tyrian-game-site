import { describe, expect, it } from 'vitest';
import { EnemyBullet } from './EnemyBullet';

describe('EnemyBullet arena bounds', () => {
    it('keeps a right-flank shot alive throughout the 1200px combat arena', () => {
        const shot = new EnemyBullet(900, 300, 10, 10, 1, 10, 1, 0);
        shot.update(0.01);
        expect(shot.isActive).toBe(true);
    });

    it('removes a projectile only after it has cleared the full right edge', () => {
        const shot = new EnemyBullet(1265, 300, 10, 10, 1, 10, 1, 0);
        shot.update(0.01);
        expect(shot.isActive).toBe(false);
    });
});
