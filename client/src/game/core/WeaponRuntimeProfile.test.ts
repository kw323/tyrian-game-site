import { describe, expect, it } from 'vitest';
import { Player } from '../entities/Player';
import { BlackHoleBullet } from '../entities/BlackHoleBullet';
import { HomingBullet } from '../entities/HomingBullet';
import { LaserBullet } from '../entities/LaserBullet';
import { EnemyBullet } from '../entities/EnemyBullet';
import { WeaponType, WeaponUpgradeSystem } from './WeaponUpgradeSystem';
import {
    getHeavyFragmentAngles,
    getWeaponRuntimeProfile,
    getWeaponUpgradeDescription,
    type RuntimeWeaponType
} from './WeaponRuntimeProfile';

const weaponTypes = Object.values(WeaponType) as WeaponType[];

describe('Weapon runtime profile', () => {
    it('keeps every shop description derived from the matching runtime profile', () => {
        const system = new WeaponUpgradeSystem();
        let ranksChecked = 0;

        for (const type of weaponTypes) {
            for (const rank of system.getWeaponLevels(type)) {
                expect(rank.description).toBe(
                    getWeaponUpgradeDescription(type as RuntimeWeaponType, rank.level, rank.damage, rank.fireRate)
                );
                ranksChecked++;
            }
        }

        expect(ranksChecked).toBe(175);
    });

    it('spawns exactly the number of projectiles promised by each rank profile', () => {
        const system = new WeaponUpgradeSystem();
        const player = new Player(500, 700, 48, 48, 7.5);

        for (const type of weaponTypes) {
            for (const rank of system.getWeaponLevels(type)) {
                player.setWeapon(type, rank.level, rank.fireRate, rank.damage);
                const projectiles = player.shoot(rank.level + 1);
                expect(projectiles).toHaveLength(
                    getWeaponRuntimeProfile(type as RuntimeWeaponType, rank.level).projectileCount
                );
            }
        }
    });

    it('applies homing speed and turning upgrades to the missile entity', () => {
        for (const level of [0, 8, 14, 20, 24]) {
            const profile = getWeaponRuntimeProfile('homing', level);
            const missile = new HomingBullet(0, 0, 6, 6, profile.missileSpeed ?? 0, 10, 0, -100, null, profile.missileTurnSpeed);
            expect(missile.speed).toBe(profile.missileSpeed);
            expect(missile.turnSpeed).toBe(profile.missileTurnSpeed);
        }
    });

    it('splits every Split Bomb payload into four diagonal directions', () => {
        for (const level of [0, 14, 20, 24]) {
            const fragmentCount = getWeaponRuntimeProfile('heavy', level).heavyFragmentCount ?? 0;
            const angles = getHeavyFragmentAngles(fragmentCount);
            const quadrants = new Set(angles.map((angle) => `${Math.sign(Math.sin(angle))}:${Math.sign(-Math.cos(angle))}`));

            expect(angles).toHaveLength(fragmentCount);
            expect(angles.every((angle) => Math.abs(Math.sin(angle)) > 0.001)).toBe(true);
            expect(angles.every((angle) => Math.abs(Math.cos(angle)) > 0.001)).toBe(true);
            expect(quadrants).toContain('1:-1');
            expect(quadrants).toContain('-1:-1');
            expect(quadrants).toContain('1:1');
            expect(quadrants).toContain('-1:1');
        }
    });

    it('scales Chain Lightning jump limits while preserving half-damage decay design', () => {
        expect(getWeaponRuntimeProfile('arc', 0).arcChainJumps).toBe(2);
        expect(getWeaponRuntimeProfile('arc', 6).arcChainJumps).toBe(3);
        expect(getWeaponRuntimeProfile('arc', 11).arcChainJumps).toBe(4);
        expect(getWeaponRuntimeProfile('arc', 16).arcChainJumps).toBe(5);
        expect(getWeaponRuntimeProfile('arc', 24).arcChainJumps).toBe(6);
    });

    it('applies laser and gravity-well profile values to their gameplay entities', () => {
        for (const level of [0, 6, 13, 18, 24]) {
            const laserProfile = getWeaponRuntimeProfile('laser', level);
            const primary = new LaserBullet(500, 700, 10, level, true, 0, false);
            expect(primary.beamWidth).toBe(laserProfile.laserPrimaryWidth);
            expect(primary.maxTargets).toBe(laserProfile.laserPrimaryTargets);

            const voidProfile = getWeaponRuntimeProfile('void_lance', level);
            const singularity = new BlackHoleBullet(500, 700, 10, level);
            expect(singularity.speed).toBe(voidProfile.voidProjectileSpeed);
            expect(singularity.getFieldRadius()).toBe(voidProfile.voidFieldRadius);
            expect(singularity.getSuctionStrength()).toBe(voidProfile.voidSuctionStrength);
            expect(singularity.getProjectileCaptureRadius()).toBe(voidProfile.voidProjectileCaptureRadius);

            const hostileShot = new EnemyBullet(510, 650, 6, 6, 5, 4);
            expect(singularity.canSuctionTarget(hostileShot)).toBe(true);
        }
    });

    it('keeps rank-25 advanced weapons in a campaign-scale credit range', () => {
        const system = new WeaponUpgradeSystem();
        const heavy = system.getWeaponLevels(WeaponType.HEAVY);
        const voidLance = system.getWeaponLevels(WeaponType.VOID_LANCE);

        expect(heavy[24].cost).toBeLessThan(250_000);
        expect(voidLance[24].cost).toBeLessThan(1_000_000);
        expect(system.getWeaponInvestment(WeaponType.VOID_LANCE, 24)).toBeLessThan(4_000_000);
    });
});
