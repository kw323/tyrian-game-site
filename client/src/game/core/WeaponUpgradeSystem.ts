export enum WeaponType {
    STRAIGHT = 'straight',
    SPREAD = 'spread',
    HOMING = 'homing',
    HEAVY = 'heavy'
}

export interface WeaponLevel {
    level: number;
    cost: number;
    damage: number;
    fireRate: number;
    description: string;
    requiredShip?: number; // Minimum ship tier required
}

export class WeaponUpgradeSystem {
    private weaponLevels: Map<WeaponType, WeaponLevel[]> = new Map();
    private currentWeapon: WeaponType = WeaponType.STRAIGHT;
    private currentLevel: Map<WeaponType, number> = new Map();

    constructor() {
        this.initializeWeapons();
        // All weapons start at level 0 (free straight shot)
        this.currentLevel.set(WeaponType.STRAIGHT, 0);
        this.currentLevel.set(WeaponType.SPREAD, -1); // Not owned
        this.currentLevel.set(WeaponType.HOMING, -1);
        this.currentLevel.set(WeaponType.HEAVY, -1);
    }

    private initializeWeapons(): void {
        // STRAIGHT SHOT - Base weapon, always available (15 levels)
        this.weaponLevels.set(WeaponType.STRAIGHT, [
            { level: 0, cost: 0, damage: 10, fireRate: 6, description: 'Single bullet' },
            { level: 1, cost: 300, damage: 12, fireRate: 7, description: 'Faster shots' },
            { level: 2, cost: 600, damage: 14, fireRate: 8, description: 'Even faster' },
            { level: 3, cost: 1200, damage: 16, fireRate: 9, description: 'Rapid fire' },
            { level: 4, cost: 2400, damage: 18, fireRate: 10, description: 'Extreme speed' },
            { level: 5, cost: 4800, damage: 20, fireRate: 11, description: 'Ultra rapid' },
            { level: 6, cost: 9600, damage: 22, fireRate: 12, description: 'Blazing speed' },
            { level: 7, cost: 19200, damage: 24, fireRate: 13, description: 'Inferno', requiredShip: 1 },
            { level: 8, cost: 38400, damage: 26, fireRate: 14, description: 'Supernova', requiredShip: 1 },
            { level: 9, cost: 76800, damage: 28, fireRate: 15, description: 'Hyperdrive', requiredShip: 2 },
            { level: 10, cost: 153600, damage: 30, fireRate: 16, description: 'Quantum burst', requiredShip: 2 },
            { level: 11, cost: 307200, damage: 32, fireRate: 17, description: 'Stellar cannon', requiredShip: 2 },
            { level: 12, cost: 614400, damage: 34, fireRate: 18, description: 'Cosmic ray', requiredShip: 3 },
            { level: 13, cost: 1228800, damage: 36, fireRate: 19, description: 'Black hole', requiredShip: 3 },
            { level: 14, cost: 2457600, damage: 40, fireRate: 20, description: 'Ultimate power', requiredShip: 3 }
        ]);

        // SPREAD SHOT (15 levels)
        this.weaponLevels.set(WeaponType.SPREAD, [
            { level: 0, cost: 500, damage: 8, fireRate: 5, description: 'One center bullet' },
            { level: 1, cost: 1000, damage: 8, fireRate: 5, description: 'Center + alternating sides' },
            { level: 2, cost: 2000, damage: 8, fireRate: 5, description: 'Center + both sides' },
            { level: 3, cost: 4000, damage: 9, fireRate: 6, description: '5 bullets in spread' },
            { level: 4, cost: 8000, damage: 10, fireRate: 7, description: 'Full spread pattern' },
            { level: 5, cost: 16000, damage: 11, fireRate: 8, description: 'Wide spread' },
            { level: 6, cost: 32000, damage: 12, fireRate: 9, description: 'Massive spread' },
            { level: 7, cost: 64000, damage: 13, fireRate: 10, description: 'Explosive spread', requiredShip: 1 },
            { level: 8, cost: 128000, damage: 14, fireRate: 11, description: 'Cascade', requiredShip: 1 },
            { level: 9, cost: 256000, damage: 15, fireRate: 12, description: 'Storm', requiredShip: 2 },
            { level: 10, cost: 512000, damage: 16, fireRate: 13, description: 'Tempest', requiredShip: 2 },
            { level: 11, cost: 1024000, damage: 17, fireRate: 14, description: 'Maelstrom', requiredShip: 2 },
            { level: 12, cost: 2048000, damage: 18, fireRate: 15, description: 'Cyclone', requiredShip: 3 },
            { level: 13, cost: 4096000, damage: 19, fireRate: 16, description: 'Tornado', requiredShip: 3 },
            { level: 14, cost: 8192000, damage: 20, fireRate: 17, description: 'Apocalypse', requiredShip: 3 }
        ]);

        // HOMING MISSILES (15 levels)
        this.weaponLevels.set(WeaponType.HOMING, [
            { level: 0, cost: 1000, damage: 15, fireRate: 3, description: 'Single homing missile' },
            { level: 1, cost: 2000, damage: 15, fireRate: 4, description: 'Faster missiles' },
            { level: 2, cost: 4000, damage: 16, fireRate: 4, description: 'Two missiles' },
            { level: 3, cost: 8000, damage: 17, fireRate: 5, description: 'Three missiles' },
            { level: 4, cost: 16000, damage: 18, fireRate: 6, description: 'Four missiles' },
            { level: 5, cost: 32000, damage: 19, fireRate: 7, description: 'Five missiles' },
            { level: 6, cost: 64000, damage: 20, fireRate: 8, description: 'Six missiles' },
            { level: 7, cost: 128000, damage: 21, fireRate: 9, description: 'Swarm', requiredShip: 1 },
            { level: 8, cost: 256000, damage: 22, fireRate: 10, description: 'Missile barrage', requiredShip: 1 },
            { level: 9, cost: 512000, damage: 23, fireRate: 11, description: 'Guided arsenal', requiredShip: 2 },
            { level: 10, cost: 1024000, damage: 24, fireRate: 12, description: 'Targeting matrix', requiredShip: 2 },
            { level: 11, cost: 2048000, damage: 25, fireRate: 13, description: 'Missile network', requiredShip: 2 },
            { level: 12, cost: 4096000, damage: 26, fireRate: 14, description: 'Homing nexus', requiredShip: 3 },
            { level: 13, cost: 8192000, damage: 27, fireRate: 15, description: 'Seeking fury', requiredShip: 3 },
            { level: 14, cost: 16384000, damage: 30, fireRate: 16, description: 'Guided devastation', requiredShip: 3 }
        ]);

        // HEAVY CANNON (15 levels)
        this.weaponLevels.set(WeaponType.HEAVY, [
            { level: 0, cost: 750, damage: 25, fireRate: 2, description: 'Single heavy shot' },
            { level: 1, cost: 1500, damage: 25, fireRate: 2.5, description: 'Faster reload' },
            { level: 2, cost: 3000, damage: 27, fireRate: 2.5, description: 'Two heavy shots' },
            { level: 3, cost: 6000, damage: 28, fireRate: 3, description: 'Three shots' },
            { level: 4, cost: 12000, damage: 30, fireRate: 3.5, description: 'Heavy barrage' },
            { level: 5, cost: 24000, damage: 32, fireRate: 4, description: 'Massive damage' },
            { level: 6, cost: 48000, damage: 34, fireRate: 4.5, description: 'Devastating' },
            { level: 7, cost: 96000, damage: 36, fireRate: 5, description: 'Annihilator', requiredShip: 1 },
            { level: 8, cost: 192000, damage: 38, fireRate: 5.5, description: 'Obliterator', requiredShip: 1 },
            { level: 9, cost: 384000, damage: 40, fireRate: 6, description: 'Pulsar cannon', requiredShip: 2 },
            { level: 10, cost: 768000, damage: 42, fireRate: 6.5, description: 'Plasma cannon', requiredShip: 2 },
            { level: 11, cost: 1536000, damage: 44, fireRate: 7, description: 'Laser array', requiredShip: 2 },
            { level: 12, cost: 3072000, damage: 46, fireRate: 7.5, description: 'Particle beam', requiredShip: 3 },
            { level: 13, cost: 6144000, damage: 48, fireRate: 8, description: 'Quantum cannon', requiredShip: 3 },
            { level: 14, cost: 12288000, damage: 50, fireRate: 8.5, description: 'Dimensional rift', requiredShip: 3 }
        ]);
    }

    public getWeaponLevels(type: WeaponType): WeaponLevel[] {
        return this.weaponLevels.get(type) || [];
    }

    public getCurrentLevel(type: WeaponType): number {
        const level = this.currentLevel.get(type);
        return level !== undefined ? level : -1;
    }

    public setCurrentWeapon(type: WeaponType): boolean {
        const level = this.currentLevel.get(type);
        if (level !== undefined && level >= 0) {
            this.currentWeapon = type;
            return true;
        }
        return false;
    }

    public getCurrentWeapon(): WeaponType {
        return this.currentWeapon;
    }

    public getCurrentWeaponStats(): WeaponLevel | null {
        const level = this.currentLevel.get(this.currentWeapon);
        if (level === undefined || level < 0) return null;
        const levels = this.weaponLevels.get(this.currentWeapon);
        if (!levels) return null;
        return levels[level] || null;
    }

    public upgradeWeapon(type: WeaponType, score: number, currentShip: number = 0): { cost: number; refund: number } | null {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);

        if (!levels) return null;

        // If weapon not owned, buy level 0
        if (actualLevel === -1) {
            const nextLevel = levels[0];
            if (nextLevel && score >= nextLevel.cost) {
                // Check ship requirement
                if (nextLevel.requiredShip && currentShip < nextLevel.requiredShip) {
                    return null; // Need better ship
                }
                this.currentLevel.set(type, 0);
                return { cost: nextLevel.cost, refund: 0 };
            }
            return null;
        }

        // Upgrade to next level
        if (actualLevel + 1 < levels.length) {
            const nextLevel = levels[actualLevel + 1];
            const currentLevelData = levels[actualLevel];
            if (nextLevel && score >= nextLevel.cost) {
                // Check ship requirement
                if (nextLevel.requiredShip && currentShip < nextLevel.requiredShip) {
                    return null; // Need better ship
                }
                this.currentLevel.set(type, actualLevel + 1);
                const refund = Math.floor(currentLevelData.cost * 0.5);
                return { cost: nextLevel.cost, refund };
            }
        }
        return null;
    }

    public downgradeWeapon(type: WeaponType): { refund: number } | null {
        const currentLevel = this.currentLevel.get(type);
        if (currentLevel === undefined || currentLevel <= 0) return null;

        const levels = this.weaponLevels.get(type);
        if (!levels) return null;

        const currentLevelData = levels[currentLevel];
        if (!currentLevelData) return null;

        this.currentLevel.set(type, currentLevel - 1);
        const refund = Math.floor(currentLevelData.cost * 0.5);
        return { refund };
    }

    public reset(): void {
        this.currentWeapon = WeaponType.STRAIGHT;
        this.currentLevel.set(WeaponType.STRAIGHT, 0);
        this.currentLevel.set(WeaponType.SPREAD, -1);
        this.currentLevel.set(WeaponType.HOMING, -1);
        this.currentLevel.set(WeaponType.HEAVY, -1);
    }

    public getWeaponRequiredShip(type: WeaponType, level: number): number {
        const levels = this.weaponLevels.get(type);
        if (!levels || level < 0 || level >= levels.length) return 0;
        return levels[level].requiredShip || 0;
    }
}
