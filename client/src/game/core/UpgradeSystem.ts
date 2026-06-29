export interface Upgrade {
    name: string;
    description: string;
    cost: number;
    type: 'weapon' | 'shield' | 'health' | 'speed';
}

export class UpgradeSystem {
    public score: number = 0;
    public weaponLevel: number = 1;
    public shieldLevel: number = 1;
    public healthLevel: number = 1;
    public speedLevel: number = 1;

    public getAvailableUpgrades(): Upgrade[] {
        return [
            {
                name: 'Weapon Upgrade',
                description: `Increase bullet damage (Level ${this.weaponLevel})`,
                cost: 500,
                type: 'weapon'
            },
            {
                name: 'Shield Upgrade',
                description: `Increase max shield (Level ${this.shieldLevel})`,
                cost: 400,
                type: 'shield'
            },
            {
                name: 'Health Upgrade',
                description: `Increase max health (Level ${this.healthLevel})`,
                cost: 600,
                type: 'health'
            },
            {
                name: 'Speed Upgrade',
                description: `Increase ship speed (Level ${this.speedLevel})`,
                cost: 300,
                type: 'speed'
            }
        ];
    }

    public canAfford(upgrade: Upgrade): boolean {
        return this.score >= upgrade.cost;
    }

    public purchaseUpgrade(upgrade: Upgrade): boolean {
        if (!this.canAfford(upgrade)) {
            return false;
        }

        this.score -= upgrade.cost;

        switch (upgrade.type) {
            case 'weapon':
                this.weaponLevel++;
                break;
            case 'shield':
                this.shieldLevel++;
                break;
            case 'health':
                this.healthLevel++;
                break;
            case 'speed':
                this.speedLevel++;
                break;
        }

        return true;
    }

    public reset(): void {
        this.score = 0;
        this.weaponLevel = 1;
        this.shieldLevel = 1;
        this.healthLevel = 1;
        this.speedLevel = 1;
    }

    public getWeaponDamage(): number {
        return 10 + this.weaponLevel * 5;
    }

    public getMaxShield(): number {
        return 50 + this.shieldLevel * 25;
    }

    public getMaxHealth(): number {
        return 3 + this.healthLevel;
    }

    public getShipSpeed(): number {
        return 15 + this.speedLevel * 3;
    }
}
