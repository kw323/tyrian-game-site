export interface ShipTier {
    id: number;
    name: string;
    cost: number;
    weaponCapacity: number; // Max weapon level allowed
    generatorCapacity: number; // Max generator level allowed
    width: number; // Ship visual width
    height: number; // Ship visual height
    description: string;
}

export class ShipUpgradeSystem {
    private ships: ShipTier[] = [
        {
            id: 0,
            name: 'Scout Vanguard (Mk.1)',
            cost: 0,
            weaponCapacity: 4,
            generatorCapacity: 8,
            width: 28,
            height: 46,
            description: 'Experimental prototype. Weapon capacity up to level 4, generator up to level 8.'
        },
        {
            id: 1,
            name: 'Interceptor (Mk.2)',
            cost: 45000,
            weaponCapacity: 8,
            generatorCapacity: 16,
            width: 34,
            height: 54,
            description: 'Upgraded combat frame. Weapon capacity up to level 8, generator up to level 16.'
        },
        {
            id: 2,
            name: 'Corvette (Mk.3)',
            cost: 180000,
            weaponCapacity: 12,
            generatorCapacity: 24,
            width: 40,
            height: 62,
            description: 'Reinforced hull. Weapon capacity up to level 12, generator up to level 24.'
        },
        {
            id: 3,
            name: 'Destroyer (Mk.4)',
            cost: 650000,
            weaponCapacity: 16,
            generatorCapacity: 32,
            width: 48,
            height: 70,
            description: 'Heavy warship. Weapon capacity up to level 16, generator up to level 32. Unlocks Special Abilities!'
        },
        {
            id: 4,
            name: 'Dreadnought (Mk.5)',
            cost: 2200000,
            weaponCapacity: 20,
            generatorCapacity: 40,
            width: 56,
            height: 78,
            description: 'Massive capital vessel. Weapon capacity up to level 20, generator up to level 40.'
        },
        {
            id: 5,
            name: 'Archon Flagship (Mk.6)',
            cost: 7500000,
            weaponCapacity: 25,
            generatorCapacity: 50,
            width: 66,
            height: 88,
            description: 'The ultimate flagship. Weapon capacity up to max level 25, generator up to max level 50.'
        }
    ];

    private currentShip: number = 0; // Start with Starter Fighter

    constructor() {}

    public getCurrentShip(): ShipTier {
        return this.ships[this.currentShip];
    }

    public getCurrentShipId(): number {
        return this.currentShip;
    }

    public getShip(id: number): ShipTier | null {
        return this.ships[id] || null;
    }

    public getAllShips(): ShipTier[] {
        return this.ships;
    }

    public canUpgradeShip(): boolean {
        return this.currentShip < this.ships.length - 1;
    }

    public upgradeShip(score: number): { cost: number; newShip: ShipTier } | null {
        if (!this.canUpgradeShip()) return null;

        const nextShip = this.ships[this.currentShip + 1];
        if (score >= nextShip.cost) {
            this.currentShip++;
            return { cost: nextShip.cost, newShip: nextShip };
        }
        return null;
    }

    public canEquipWeapon(weaponLevel: number): boolean {
        const currentShip = this.getCurrentShip();
        return weaponLevel <= currentShip.weaponCapacity;
    }

    public canUpgradeGenerator(generatorLevel: number): boolean {
        const currentShip = this.getCurrentShip();
        return generatorLevel < currentShip.generatorCapacity;
    }

    public getShipDimensions(): { width: number; height: number } {
        const ship = this.getCurrentShip();
        return { width: ship.width, height: ship.height };
    }

    public reset(): void {
        this.currentShip = 0;
    }

    public getNextShipCost(): number {
        if (this.canUpgradeShip()) {
            return this.ships[this.currentShip + 1].cost;
        }
        return 0;
    }

    public getNextShip(): ShipTier | null {
        if (this.canUpgradeShip()) {
            return this.ships[this.currentShip + 1];
        }
        return null;
    }

    public loadSaveState(shipId: number): void {
        this.currentShip = Math.max(0, Math.min(this.ships.length - 1, Math.floor(shipId)));
    }
}
