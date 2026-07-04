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
            name: 'Starter Fighter',
            cost: 0,
            weaponCapacity: 4,
            generatorCapacity: 0,
            width: 30,
            height: 50,
            description: 'Basic spaceship - supports weapons up to level 4'
        },
        {
            id: 1,
            name: 'Interceptor',
            cost: 50000,
            weaponCapacity: 8,
            generatorCapacity: 3,
            width: 40,
            height: 60,
            description: 'Upgraded fighter - supports weapons up to level 8 and better generators'
        },
        {
            id: 2,
            name: 'Destroyer',
            cost: 250000,
            weaponCapacity: 11,
            generatorCapacity: 5,
            width: 50,
            height: 70,
            description: 'Heavy warship - supports weapons up to level 11 and advanced generators'
        },
        {
            id: 3,
            name: 'Battleship',
            cost: 1000000,
            weaponCapacity: 14,
            generatorCapacity: 10,
            width: 60,
            height: 80,
            description: 'Ultimate vessel - supports all weapons and maximum upgrades'
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
}
