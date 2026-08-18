export interface WeaponSystemInfo {
    name: string;
    type: string;
    description: string;
    maxLevel: number;
    powerConsumption: string;
    upgradeScale: string;
}

export interface GeneratorInfo {
    levelRange: string;
    outputFormula: string;
    description: string;
    capacityNote: string;
}

export interface ShieldInfo {
    levelRange: string;
    baseStats: string;
    maxStats: string;
    description: string;
    upgradeNote: string;
}

export interface ShipTierInfo {
    id: number;
    name: string;
    cost: number;
    weaponCapacity: number;
    generatorCapacity: number;
    description: string;
}

export class PlayerSystemsDatabase {
    public static getWeapons(): WeaponSystemInfo[] {
        return [
            {
                name: 'Straight Shot',
                type: 'Straight',
                description: 'Linear forward projectiles. Excellent direct damage with low power consumption, scaling from 1 bolt up to high-speed multi-bolt salvos.',
                maxLevel: 25,
                powerConsumption: '1.0 - 19.0 power/sec',
                upgradeScale: 'Adds projectile speed, dual barrels, and concentrated density up to 25 parallel tiers.'
            },
            {
                name: 'Spread Shot',
                type: 'Spread',
                description: 'Wide coverage fan pattern. Fires diagonal and lateral projectiles to clear out clustered enemy formations and side swarms.',
                maxLevel: 25,
                powerConsumption: '1.5 - 40.0 power/sec',
                upgradeScale: 'Expands spread angle, adds diagonal angles, and increases projectile count up to 25 angle tiers.'
            },
            {
                name: 'Homing Missiles',
                type: 'Homing',
                description: 'Guided micro-missiles equipped with dynamic target reacquisition. Automatically lock onto the nearest enemy across the playfield.',
                maxLevel: 25,
                powerConsumption: '2.0 - 58.0 power/sec',
                upgradeScale: 'Increases salvo size, tracking agility, and guidance velocity across 25 tiers.'
            },
            {
                name: 'Split Bomb',
                type: 'Heavy',
                description: 'Primary shell that splits into diagonal shrapnel upon impact or range limit. Delivers cascading multi-angle damage clusters.',
                maxLevel: 25,
                powerConsumption: '2.0 - 58.0 power/sec',
                upgradeScale: 'Increases fragment count, shrapnel velocity, cascade tiers, and blast radius up to 25 tiers.'
            },
            {
                name: 'Pulse Laser',
                type: 'Laser',
                description: 'High-energy beam weapon. Pierces instantly across the screen with devastating speed and continuous energy draw.',
                maxLevel: 25,
                powerConsumption: '3.0 - 95.0 power/sec',
                upgradeScale: 'Increases beam thickness, frequency, and controlled multi-target penetration up to 25 tiers.'
            },
            {
                name: 'Black Hole Projectile',
                type: 'Secret / Gravity Well',
                description: 'A recovered artificial singularity awarded for defeating the evasive hunter. On impact it creates a small black hole that damages and pulls nearby small craft; large enemies and bosses resist the suction.',
                maxLevel: 25,
                powerConsumption: '8.0 - 99.0 power/sec',
                upgradeScale: 'Improves field radius, suction strength, damage, and adds secondary gravity traces across 25 tiers.'
            }
        ];
    }

    public static getGenerator(): GeneratorInfo {
        return {
            levelRange: 'Level 1 — Level 50',
            outputFormula: 'Base 15 + (Level * 8.5) power per second',
            description: 'The ship power core. Advanced weapons and active shields consume electricity every second. If power depletes, weapons cannot fire, shields stop regenerating, and the ship moves at half speed.',
            capacityNote: 'Upgrading the generator increases energy recharge rate across 50 tiers. Higher generator levels require upgrading to larger ship hulls.'
        };
    }

    public static getShield(): ShieldInfo {
        return {
            levelRange: 'Level 1 — Level 10',
            baseStats: '50 Max Shield, 5/s Regen Rate',
            maxStats: '320 Max Shield, 23/s Regen Rate',
            description: 'Energy barrier that absorbs incoming enemy fire before hull damage occurs. Automatically regenerates when power is available.',
            upgradeNote: 'Each upgrade increases maximum shield capacity and regeneration speed.'
        };
    }

    public static getShips(): ShipTierInfo[] {
        return [
            {
                id: 0,
                name: 'Starter Fighter',
                cost: 0,
                weaponCapacity: 8,
                generatorCapacity: 10,
                description: 'Agile experimental scout chassis. Supports early weapons up to level 8 and generator tiers up to 10.'
            },
            {
                id: 1,
                name: 'Interceptor',
                cost: 50000,
                weaponCapacity: 14,
                generatorCapacity: 20,
                description: 'Reinforced dual-engine frame. Supports mid-tier weapons up to level 14 and generator tiers up to 20.'
            },
            {
                id: 2,
                name: 'Destroyer',
                cost: 250000,
                weaponCapacity: 19,
                generatorCapacity: 35,
                description: 'Heavy combat platform. Supports advanced pulse weapons up to level 19 and generator tiers up to 35.'
            },
            {
                id: 3,
                name: 'Battleship',
                cost: 1000000,
                weaponCapacity: 24,
                generatorCapacity: 49,
                description: 'Capital-class experimental flagship. Unlocks all 25 weapon levels and all 50 generator tiers.'
            }
        ];
    }
}
