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
                description: 'Precise forward fire. Damage and fire rate improve on every rank; the volley grows from 1 to 13 parallel bolts, adding one bolt every two ranks.',
                maxLevel: 25,
                powerConsumption: '0.0 - 8.0 power/shot',
                upgradeScale: 'Every rank improves damage and fire rate; every two ranks adds one parallel bolt. Projectile speed stays constant.',
            },
            {
                name: 'Spread Shot',
                type: 'Spread',
                description: 'Crowd-control fan. Damage and fire rate improve on every rank; the pattern grows from 1 to 13 pellets while its firing arc widens smoothly.',
                maxLevel: 25,
                powerConsumption: '0.0 - 17.0 power/shot',
                upgradeScale: 'Every two ranks adds one pellet, and the fan angle expands from ±0.42 to ±0.95 radians.',
            },
            {
                name: 'Homing Missiles',
                type: 'Homing',
                description: 'Guided micro-missiles with live nearest-target reacquisition. Damage, fire rate, flight speed and turning response improve through all 25 ranks.',
                maxLevel: 25,
                powerConsumption: '0.0 - 26.0 power/shot',
                upgradeScale: 'Salvos grow from 1 to 5 missiles at ranks 1, 4, 9, 15 and 21; speed and turning response improve every rank.',
            },
            {
                name: 'Split Bomb',
                type: 'Heavy',
                description: 'Area-denial shell that bursts on impact or range limit. High ranks add shells, fragments, faster shrapnel and controlled secondary pellets.',
                maxLevel: 25,
                powerConsumption: '0.0 - 51.0 power/shot',
                upgradeScale: 'Primary volleys progress from 1 to 3 shells; each shell splits into 4, 5 or 6 fragments, with cascades beginning at rank 8.',
            },
            {
                name: 'Pulse Laser',
                type: 'Laser',
                description: 'Instant high-energy piercing beam. Every rank increases damage, firing rate, beam width and penetration; side rays activate at ranks 7 and 19.',
                maxLevel: 25,
                powerConsumption: '3.0 - 27.0 power/shot',
                upgradeScale: 'The beam grows from 1 to 3 to 5 rays at ranks 1, 7 and 19; primary penetration reaches six targets.',
            },
            {
                name: 'Black Hole Projectile',
                type: 'Secret / Gravity Well',
                description: 'A recovered artificial singularity. On impact it damages and pulls nearby small craft; larger enemies and bosses resist suction.',
                maxLevel: 25,
                powerConsumption: '8.0 - 73.0 power/shot',
                upgradeScale: 'Damage, field radius, duration and suction improve every rank; traces progress from 1 to 4 at ranks 1, 7, 14 and 22.',
            }
        ];
    }

    public static getGenerator(): GeneratorInfo {
        return {
            levelRange: 'Level 1 — Level 50',
            outputFormula: 'Base 15 + (Level * 8.5) power per second',
            description: 'The ship power core. Weapons consume energy for each fired volley. Draining power to zero triggers Reactor Recovery: weapons remain offline until the pool is fully recharged, while the ship continues to move at reduced speed.',
            capacityNote: 'Upgrading the generator increases energy recharge rate across 50 tiers. A stronger generator shortens Reactor Recovery after a full drain; higher generator levels require larger ship hulls.'
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
