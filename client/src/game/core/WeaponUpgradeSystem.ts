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
        // STRAIGHT SHOT - Base weapon, always available
        this.weaponLevels.set(WeaponType.STRAIGHT, [
            { level: 0, cost: 0, damage: 10, fireRate: 6, description: 'Single bullet' },
            { level: 1, cost: 300, damage: 12, fireRate: 7, description: 'Faster shots' },
            { level: 2, cost: 600, damage: 14, fireRate: 8, description: 'Even faster' },
            { level: 3, cost: 1200, damage: 16, fireRate: 9, description: 'Rapid fire' },
            { level: 4, cost: 2400, damage: 18, fireRate: 10, description: 'Extreme speed' }
        ]);

        // SPREAD SHOT
        this.weaponLevels.set(WeaponType.SPREAD, [
            { level: 0, cost: 500, damage: 8, fireRate: 5, description: 'One center bullet' },
            { level: 1, cost: 1000, damage: 8, fireRate: 5, description: 'Center + alternating sides' },
            { level: 2, cost: 2000, damage: 8, fireRate: 5, description: 'Center + both sides' },
            { level: 3, cost: 4000, damage: 9, fireRate: 6, description: '5 bullets in spread' },
            { level: 4, cost: 8000, damage: 10, fireRate: 7, description: 'Full spread pattern' }
        ]);

        // HOMING MISSILES
        this.weaponLevels.set(WeaponType.HOMING, [
            { level: 0, cost: 1000, damage: 15, fireRate: 3, description: 'Single homing missile' },
            { level: 1, cost: 2000, damage: 15, fireRate: 4, description: 'Faster missiles' },
            { level: 2, cost: 4000, damage: 16, fireRate: 4, description: 'Two missiles' },
            { level: 3, cost: 8000, damage: 17, fireRate: 5, description: 'Three missiles' },
            { level: 4, cost: 16000, damage: 18, fireRate: 6, description: 'Four missiles' }
        ]);

        // HEAVY CANNON
        this.weaponLevels.set(WeaponType.HEAVY, [
            { level: 0, cost: 750, damage: 25, fireRate: 2, description: 'Single heavy shot' },
            { level: 1, cost: 1500, damage: 25, fireRate: 2.5, description: 'Faster reload' },
            { level: 2, cost: 3000, damage: 27, fireRate: 2.5, description: 'Two heavy shots' },
            { level: 3, cost: 6000, damage: 28, fireRate: 3, description: 'Three shots' },
            { level: 4, cost: 12000, damage: 30, fireRate: 3.5, description: 'Heavy barrage' }
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

    public upgradeWeapon(type: WeaponType, score: number): { cost: number; refund: number } | null {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);

        if (!levels) return null;

        // If not owned yet, buy first level
        if (actualLevel === -1) {
            const firstLevel = levels[0];
            if (score < firstLevel.cost) return null; // Not enough score
            this.currentLevel.set(type, 0);
            return { cost: firstLevel.cost, refund: 0 };
        }

        // If already owned, upgrade to next level
        if (actualLevel + 1 < levels.length) {
            const nextLevel = levels[actualLevel + 1];
            if (score < nextLevel.cost) return null; // Not enough score
            const currentLevelStats = levels[actualLevel];
            const refund = Math.floor(currentLevelStats.cost * 0.5); // Get 50% back
            this.currentLevel.set(type, actualLevel + 1);
            return { cost: nextLevel.cost, refund };
        }

        return null; // Already at max level
    }

    public canUpgrade(type: WeaponType, score: number): boolean {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);
        if (!levels) return false;

        if (actualLevel === -1) {
            // Can buy first level if have enough score
            return score >= levels[0].cost;
        }
        // Can upgrade to next level if have enough score
        if (actualLevel + 1 < levels.length) {
            return score >= levels[actualLevel + 1].cost;
        }
        return false;
    }

    public canDowngrade(type: WeaponType): boolean {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        return actualLevel > 0; // Can downgrade if above level 0
    }

    public downgradeWeapon(type: WeaponType): { refund: number } | null {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);

        if (!levels || actualLevel <= 0) return null; // Can't downgrade

        const currentLevelStats = levels[actualLevel];
        const refund = Math.floor(currentLevelStats.cost * 0.5); // Get 50% back
        this.currentLevel.set(type, actualLevel - 1);
        return { refund };
    }

    public getUpgradeInfo(type: WeaponType): { current: WeaponLevel | null; next: WeaponLevel | null } {
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);

        if (!levels) return { current: null, next: null };

        const current = actualLevel >= 0 ? levels[actualLevel] : null;
        const next = actualLevel + 1 < levels.length ? levels[actualLevel + 1] : null;

        return { current, next };
    }

    public getAllWeaponStatus(): Array<{ type: WeaponType; level: number; maxLevel: number }> {
        return [
            { type: WeaponType.STRAIGHT, level: this.currentLevel.get(WeaponType.STRAIGHT) || 0, maxLevel: 4 },
            { type: WeaponType.SPREAD, level: this.currentLevel.get(WeaponType.SPREAD) || -1, maxLevel: 4 },
            { type: WeaponType.HOMING, level: this.currentLevel.get(WeaponType.HOMING) || -1, maxLevel: 4 },
            { type: WeaponType.HEAVY, level: this.currentLevel.get(WeaponType.HEAVY) || -1, maxLevel: 4 }
        ];
    }

    public reset(): void {
        this.currentWeapon = WeaponType.STRAIGHT;
        this.currentLevel.set(WeaponType.STRAIGHT, 0);
        this.currentLevel.set(WeaponType.SPREAD, -1);
        this.currentLevel.set(WeaponType.HOMING, -1);
        this.currentLevel.set(WeaponType.HEAVY, -1);
    }
}
