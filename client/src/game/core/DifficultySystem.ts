// Style: difficulty selection uses the same tactical-console language as the game HUD and keeps each tier legible at a glance.

export type DifficultyId = 'recruit' | 'pilot' | 'veteran' | 'ace' | 'nightmare';

export interface DifficultyProfile {
    id: DifficultyId;
    label: string;
    description: string;
    healthMultiplier: number;
    shieldMultiplier: number;
    damageMultiplier: number;
    speedMultiplier: number;
    fireRateMultiplier: number;
    rewardMultiplier: number;
    bossMultiplier: number;
}

export class DifficultySystem {
    public static readonly STORAGE_KEY = 'tyrian_global_difficulty';

    public static readonly PROFILES: readonly DifficultyProfile[] = [
        {
            id: 'recruit',
            label: 'RECRUIT',
            description: 'Reduced hostile pressure. A forgiving route into the campaign.',
            healthMultiplier: 0.75,
            shieldMultiplier: 0.75,
            damageMultiplier: 0.70,
            speedMultiplier: 0.85,
            fireRateMultiplier: 0.78,
            rewardMultiplier: 0.75,
            bossMultiplier: 0.78
        },
        {
            id: 'pilot',
            label: 'PILOT',
            description: 'The standard campaign balance for the intended first playthrough.',
            healthMultiplier: 1,
            shieldMultiplier: 1,
            damageMultiplier: 1,
            speedMultiplier: 1,
            fireRateMultiplier: 1,
            rewardMultiplier: 1,
            bossMultiplier: 1
        },
        {
            id: 'veteran',
            label: 'VETERAN',
            description: 'Tougher armor, sharper fire, and less room for mistakes.',
            healthMultiplier: 1.2,
            shieldMultiplier: 1.15,
            damageMultiplier: 1.15,
            speedMultiplier: 1.08,
            fireRateMultiplier: 1.16,
            rewardMultiplier: 1.1,
            bossMultiplier: 1.2
        },
        {
            id: 'ace',
            label: 'ACE',
            description: 'Aggressive formations and punishing enemy weapons.',
            healthMultiplier: 1.45,
            shieldMultiplier: 1.35,
            damageMultiplier: 1.35,
            speedMultiplier: 1.18,
            fireRateMultiplier: 1.32,
            rewardMultiplier: 1.25,
            bossMultiplier: 1.45
        },
        {
            id: 'nightmare',
            label: 'NIGHTMARE',
            description: 'The fleet has your flight data. It intends to use it.',
            healthMultiplier: 1.8,
            shieldMultiplier: 1.7,
            damageMultiplier: 1.7,
            speedMultiplier: 1.3,
            fireRateMultiplier: 1.5,
            rewardMultiplier: 1.45,
            bossMultiplier: 1.8
        }
    ];

    public static get(id: DifficultyId): DifficultyProfile {
        return this.PROFILES.find((profile) => profile.id === id) ?? this.PROFILES[1];
    }

    public static load(): DifficultyId {
        if (typeof localStorage === 'undefined') return 'pilot';
        const stored = localStorage.getItem(this.STORAGE_KEY) as DifficultyId | null;
        return stored && this.PROFILES.some((profile) => profile.id === stored) ? stored : 'pilot';
    }

    public static save(id: DifficultyId): void {
        if (typeof localStorage !== 'undefined') localStorage.setItem(this.STORAGE_KEY, id);
    }
}
