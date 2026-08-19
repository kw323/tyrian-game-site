export type ElementalCoreType = 'cryo' | 'fire' | 'corrosion' | 'kinetic' | 'plasma';

export interface ElementalCoreSaveState {
    activeCore?: ElementalCoreType;
    levels?: Partial<Record<ElementalCoreType, number>>;
}

export interface ElementalCoreProfile {
    id: ElementalCoreType;
    name: string;
    color: string;
    level: number;
    rank: number;
    nextCost: number | null;
}

export const ELEMENTAL_CORE_ORDER: readonly ElementalCoreType[] = [
    'cryo',
    'fire',
    'corrosion',
    'kinetic',
    'plasma'
];

const CORE_NAMES: Record<ElementalCoreType, string> = {
    cryo: 'CRYO',
    fire: 'INFERNO',
    corrosion: 'CORROSION',
    kinetic: 'KINETIC',
    plasma: 'PLASMA'
};

const CORE_COLORS: Record<ElementalCoreType, string> = {
    cryo: '#66d9ff',
    fire: '#ff7a32',
    corrosion: '#a8e64a',
    kinetic: '#ffcc66',
    plasma: '#f472ff'
};

const CORE_BASE_COSTS: Record<ElementalCoreType, number> = {
    cryo: 2_000,
    fire: 2_400,
    corrosion: 3_000,
    kinetic: 2_600,
    plasma: 3_400
};

const MAX_CORE_LEVEL = 4; // Five player-facing ranks: I–V.

/**
 * One elemental core is active during a stage. Weapon choice stays fixed in the
 * Ready Room; the pilot can only switch between already-owned core modes in flight.
 */
export class ElementalCoreSystem {
    private activeCore: ElementalCoreType = 'cryo';
    private readonly levels: Record<ElementalCoreType, number> = {
        cryo: 0,
        fire: 0,
        corrosion: 0,
        kinetic: 0,
        plasma: 0
    };

    public getActiveCore(): ElementalCoreType {
        return this.activeCore;
    }

    public selectCore(core: ElementalCoreType): void {
        this.activeCore = core;
    }

    public getLevel(core: ElementalCoreType): number {
        return this.levels[core];
    }

    public getRank(core: ElementalCoreType): number {
        return this.getLevel(core) + 1;
    }

    public getNextCost(core: ElementalCoreType): number | null {
        const level = this.getLevel(core);
        if (level >= MAX_CORE_LEVEL) return null;
        return Math.round(CORE_BASE_COSTS[core] * Math.pow(1.75, level) / 100) * 100;
    }

    public upgrade(core: ElementalCoreType, credits: number): number | null {
        const cost = this.getNextCost(core);
        if (cost === null || credits < cost) return null;
        this.levels[core]++;
        return cost;
    }

    public getProfile(core: ElementalCoreType): ElementalCoreProfile {
        return {
            id: core,
            name: CORE_NAMES[core],
            color: CORE_COLORS[core],
            level: this.getLevel(core),
            rank: this.getRank(core),
            nextCost: this.getNextCost(core)
        };
    }

    public getAllProfiles(): ElementalCoreProfile[] {
        return ELEMENTAL_CORE_ORDER.map((core) => this.getProfile(core));
    }

    public getSaveState(): ElementalCoreSaveState {
        return { activeCore: this.activeCore, levels: { ...this.levels } };
    }

    public loadSaveState(state?: ElementalCoreSaveState): void {
        if (!state) return;
        if (state.activeCore && ELEMENTAL_CORE_ORDER.includes(state.activeCore)) this.activeCore = state.activeCore;
        ELEMENTAL_CORE_ORDER.forEach((core) => {
            const saved = state.levels?.[core];
            if (typeof saved === 'number') this.levels[core] = Math.max(0, Math.min(MAX_CORE_LEVEL, Math.floor(saved)));
        });
    }

    public reset(): void {
        this.activeCore = 'cryo';
        ELEMENTAL_CORE_ORDER.forEach((core) => { this.levels[core] = 0; });
    }

    public getTotalInvestment(): number {
        return ELEMENTAL_CORE_ORDER.reduce((total, core) => {
            const level = this.getLevel(core);
            return total + Array.from({ length: level }, (_, index) => Math.round(CORE_BASE_COSTS[core] * Math.pow(1.75, index) / 100) * 100)
                .reduce((sum, cost) => sum + cost, 0);
        }, 0);
    }
}
