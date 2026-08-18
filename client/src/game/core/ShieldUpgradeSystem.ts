export interface ShieldLevel {
    level: number;
    cost: number;
    maxShield: number;
    regenRate: number;
    description: string;
    requiredShip?: number;
}

export class ShieldUpgradeSystem {
    public shieldLevel: number = 0;
    private levels: ShieldLevel[] = [
        { level: 0, cost: 0, maxShield: 50, regenRate: 3, description: 'Standard starter shield' },
        { level: 1, cost: 400, maxShield: 75, regenRate: 4, description: 'Reinforced plating' },
        { level: 2, cost: 900, maxShield: 100, regenRate: 5, description: 'Advanced barrier', requiredShip: 0 },
        { level: 3, cost: 1800, maxShield: 135, regenRate: 6, description: 'Heavy energy shield', requiredShip: 1 },
        { level: 4, cost: 3600, maxShield: 175, regenRate: 7, description: 'Interceptor grade matrix', requiredShip: 1 },
        { level: 5, cost: 7200, maxShield: 225, regenRate: 8, description: 'Destroyer shielding', requiredShip: 2 },
        { level: 6, cost: 15000, maxShield: 280, regenRate: 10, description: 'Polarized grid', requiredShip: 2 },
        { level: 7, cost: 32000, maxShield: 350, regenRate: 12, description: 'Battleship aegis', requiredShip: 3 },
        { level: 8, cost: 70000, maxShield: 450, regenRate: 15, description: 'Quantum citadel', requiredShip: 3 },
        { level: 9, cost: 150000, maxShield: 600, regenRate: 20, description: 'Invulnerable horizon', requiredShip: 3 }
    ];

    public getCurrentLevel(): ShieldLevel {
        return this.levels[Math.min(this.shieldLevel, this.levels.length - 1)];
    }

    public canUpgrade(currentScore: number, shipTier: number): boolean {
        if (this.shieldLevel >= this.levels.length - 1) return false;
        const next = this.levels[this.shieldLevel + 1];
        if (next.requiredShip !== undefined && shipTier < next.requiredShip) return false;
        return currentScore >= next.cost;
    }

    public upgrade(currentScore: number, shipTier: number): { cost: number; newLevel: ShieldLevel } | null {
        if (!this.canUpgrade(currentScore, shipTier)) return null;
        const next = this.levels[this.shieldLevel + 1];
        this.shieldLevel++;
        return { cost: next.cost, newLevel: this.getCurrentLevel() };
    }

    public downgrade(): { refund: number; newLevel: ShieldLevel } | null {
        if (this.shieldLevel <= 0) return null;
        const current = this.levels[this.shieldLevel];
        const refund = Math.floor(current.cost * 0.75);
        this.shieldLevel--;
        return { refund, newLevel: this.getCurrentLevel() };
    }

    public reset(): void {
        this.shieldLevel = 0;
    }
}
