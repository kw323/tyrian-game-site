export enum WeaponType {
    STRAIGHT = 'straight',
    SPREAD = 'spread',
    HOMING = 'homing',
    HEAVY = 'heavy'
}

export interface Weapon {
    type: WeaponType;
    name: string;
    description: string;
    cost: number;
    damage: number;
    fireRate: number; // bullets per second
}

export class WeaponSystem {
    private currentWeapon: WeaponType = WeaponType.STRAIGHT;
    private weapons: Map<WeaponType, Weapon> = new Map();

    constructor() {
        this.initializeWeapons();
    }

    private initializeWeapons(): void {
        this.weapons.set(WeaponType.STRAIGHT, {
            type: WeaponType.STRAIGHT,
            name: 'Straight Shot',
            description: 'Single bullet straight up',
            cost: 0,
            damage: 10,
            fireRate: 6
        });

        this.weapons.set(WeaponType.SPREAD, {
            type: WeaponType.SPREAD,
            name: 'Spread Shot',
            description: 'Multiple bullets in spread pattern',
            cost: 500,
            damage: 8,
            fireRate: 5
        });

        this.weapons.set(WeaponType.HOMING, {
            type: WeaponType.HOMING,
            name: 'Homing Missiles',
            description: 'Bullets that track enemies',
            cost: 1000,
            damage: 15,
            fireRate: 3
        });

        this.weapons.set(WeaponType.HEAVY, {
            type: WeaponType.HEAVY,
            name: 'Heavy Cannon',
            description: 'Large slow bullets with high damage',
            cost: 750,
            damage: 25,
            fireRate: 2
        });
    }

    public getWeapon(type: WeaponType): Weapon | undefined {
        return this.weapons.get(type);
    }

    public getCurrentWeapon(): Weapon | undefined {
        return this.weapons.get(this.currentWeapon);
    }

    public setCurrentWeapon(type: WeaponType): boolean {
        if (this.weapons.has(type)) {
            this.currentWeapon = type;
            return true;
        }
        return false;
    }

    public getCurrentWeaponType(): WeaponType {
        return this.currentWeapon;
    }

    public getAllWeapons(): Weapon[] {
        return Array.from(this.weapons.values());
    }
}
