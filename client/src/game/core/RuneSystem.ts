export type RuneId =
    | 'assault'
    | 'guard'
    | 'radius'
    | 'thrust'
    | 'time_field'
    | 'guidance'
    | 'reactor'
    | 'recovery';

export interface RuneInstance {
    id: string;
    runeId: RuneId;
    tier: number;
}

export interface RuneSaveState {
    version: 1;
    inventory: RuneInstance[];
    loadout: Array<string | null>;
}

export interface RuneDefinition {
    id: RuneId;
    name: string;
    color: string;
    shortName: string;
    description: string;
    drawback: string;
}

export interface RuneCombatProfile {
    projectileScale: number;
    damageMultiplier: number;
    damageTakenMultiplier: number;
    fireRateMultiplier: number;
    movementMultiplier: number;
    enemyBulletSpeedMultiplier: number;
    guidanceAngleRadians: number;
    generatorMultiplier: number;
    shieldRegenMultiplier: number;
    weaponCostMultiplier: number;
    tacticalChargeMultiplier: number;
}

export interface RuneFusionResult {
    success: boolean;
    cost: number;
    rune?: RuneInstance;
    reason?: 'selection' | 'credits' | 'max_tier';
}

export const RUNE_ORDER: readonly RuneId[] = [
    'assault',
    'guard',
    'radius',
    'thrust',
    'time_field',
    'guidance',
    'reactor',
    'recovery'
];

const DEFINITIONS: Record<RuneId, RuneDefinition> = {
    assault: {
        id: 'assault', name: 'ASSAULT RUNE', shortName: 'ASSAULT', color: '#ff7a70',
        description: 'Raises weapon damage for a short offensive window.',
        drawback: 'Slightly lowers shield capacity while active.'
    },
    guard: {
        id: 'guard', name: 'GUARD RUNE', shortName: 'GUARD', color: '#5dd7ff',
        description: 'Reduces incoming damage during dense enemy fire.',
        drawback: 'Slightly reduces fire rate while active.'
    },
    radius: {
        id: 'radius', name: 'RADIUS RUNE', shortName: 'RADIUS', color: '#ffd166',
        description: 'Widened regular shots make moving targets easier to hit.',
        drawback: 'Slightly increases weapon energy use.'
    },
    thrust: {
        id: 'thrust', name: 'THRUST RUNE', shortName: 'THRUST', color: '#72f3b2',
        description: 'Improves movement speed for precision dodging.',
        drawback: 'Slightly reduces shield regeneration.'
    },
    time_field: {
        id: 'time_field', name: 'TIME FIELD RUNE', shortName: 'TIME FIELD', color: '#a78bfa',
        description: 'Slows hostile projectiles without stopping the battle.',
        drawback: 'Slightly slows tactical ability recharge.'
    },
    guidance: {
        id: 'guidance', name: 'GUIDANCE RUNE', shortName: 'GUIDANCE', color: '#f472b6',
        description: 'Gives new shots a limited initial aim correction toward the nearest hostile.',
        drawback: 'Slightly reduces weapon damage; shots never track after launch.'
    },
    reactor: {
        id: 'reactor', name: 'REACTOR RUNE', shortName: 'REACTOR', color: '#fb923c',
        description: 'Improves reactor output for sustained heavy fire.',
        drawback: 'Slightly reduces movement speed.'
    },
    recovery: {
        id: 'recovery', name: 'RECOVERY RUNE', shortName: 'RECOVERY', color: '#34d399',
        description: 'Improves shield regeneration during long encounters.',
        drawback: 'Slightly reduces weapon damage.'
    }
};

const FUSION_COSTS = [2_000, 6_000, 15_000, 35_000] as const;
const MAX_RUNE_TIER = 5;

function clampTier(value: number): number {
    return Math.max(1, Math.min(MAX_RUNE_TIER, Math.floor(value)));
}

function createId(): string {
    return `rune_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Runes are collectible tactical loadout items. Only tier-one copies drop; three
 * matching copies plus credits fuse into the next tier. The player equips three
 * different runes before a mission and can switch only between those slots in flight.
 */
export class RuneSystem {
    public static readonly MAX_TIER = MAX_RUNE_TIER;
    public static readonly SLOT_COUNT = 3;
    private inventory: RuneInstance[] = [];
    private loadout: Array<string | null> = [null, null, null];

    constructor(savedState?: RuneSaveState) {
        this.loadSaveState(savedState);
    }

    public getDefinitions(): RuneDefinition[] {
        return RUNE_ORDER.map((id) => DEFINITIONS[id]);
    }

    public getDefinition(id: RuneId): RuneDefinition {
        return DEFINITIONS[id];
    }

    public getInventory(): RuneInstance[] {
        return this.inventory.map((rune) => ({ ...rune }));
    }

    public getLoadout(): Array<RuneInstance | null> {
        return this.loadout.map((id) => this.inventory.find((rune) => rune.id === id) ?? null);
    }

    public getRune(id: string | null | undefined): RuneInstance | null {
        if (!id) return null;
        const rune = this.inventory.find((item) => item.id === id);
        return rune ? { ...rune } : null;
    }

    public addDropRune(runeId: RuneId): RuneInstance {
        const rune: RuneInstance = { id: createId(), runeId, tier: 1 };
        this.inventory.push(rune);
        return { ...rune };
    }

    public setLoadoutSlot(slotIndex: number, runeId: string | null): boolean {
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= RuneSystem.SLOT_COUNT) return false;
        if (runeId === null) {
            this.loadout[slotIndex] = null;
            return true;
        }
        const rune = this.inventory.find((item) => item.id === runeId);
        if (!rune) return false;
        // A rune may occupy only one slot; duplicate types would make swapping pointless.
        const existingSlot = this.loadout.findIndex((id) => id === runeId);
        if (existingSlot >= 0) this.loadout[existingSlot] = null;
        const duplicateType = this.getLoadout().some((equipped, index) => index !== slotIndex && equipped?.runeId === rune.runeId);
        if (duplicateType) return false;
        this.loadout[slotIndex] = rune.id;
        return true;
    }

    public getFusionCost(rune: RuneInstance): number | null {
        if (rune.tier >= MAX_RUNE_TIER) return null;
        return FUSION_COSTS[rune.tier - 1] ?? null;
    }

    public fuseRunes(runeIds: string[], credits: number): RuneFusionResult {
        if (runeIds.length !== 3 || new Set(runeIds).size !== 3) return { success: false, cost: 0, reason: 'selection' };
        const runes = runeIds.map((id) => this.inventory.find((item) => item.id === id));
        if (runes.some((rune) => !rune)) return { success: false, cost: 0, reason: 'selection' };
        const selected = runes as RuneInstance[];
        const first = selected[0];
        if (!selected.every((rune) => rune.runeId === first.runeId && rune.tier === first.tier)) return { success: false, cost: 0, reason: 'selection' };
        const cost = this.getFusionCost(first);
        if (cost === null) return { success: false, cost: 0, reason: 'max_tier' };
        if (credits < cost) return { success: false, cost, reason: 'credits' };

        const selectedIds = new Set(runeIds);
        this.inventory = this.inventory.filter((rune) => !selectedIds.has(rune.id));
        this.loadout = this.loadout.map((id) => id && selectedIds.has(id) ? null : id);
        const fused: RuneInstance = { id: createId(), runeId: first.runeId, tier: first.tier + 1 };
        this.inventory.push(fused);
        return { success: true, cost, rune: { ...fused } };
    }

    public getCombatProfile(rune: RuneInstance | null): RuneCombatProfile {
        const neutral: RuneCombatProfile = {
            projectileScale: 1,
            damageMultiplier: 1,
            damageTakenMultiplier: 1,
            fireRateMultiplier: 1,
            movementMultiplier: 1,
            enemyBulletSpeedMultiplier: 1,
            guidanceAngleRadians: 0,
            generatorMultiplier: 1,
            shieldRegenMultiplier: 1,
            weaponCostMultiplier: 1,
            tacticalChargeMultiplier: 1
        };
        if (!rune) return neutral;
        const tier = clampTier(rune.tier);
        switch (rune.runeId) {
            case 'assault':
                return { ...neutral, damageMultiplier: 1.08 + tier * 0.025, damageTakenMultiplier: 1.04 + tier * 0.01 };
            case 'guard':
                return { ...neutral, damageTakenMultiplier: 0.96 - tier * 0.025, fireRateMultiplier: 0.94 };
            case 'radius':
                return { ...neutral, projectileScale: 1.12 + tier * 0.05, weaponCostMultiplier: 1.03 + tier * 0.01 };
            case 'thrust':
                return { ...neutral, movementMultiplier: 1.05 + tier * 0.03, shieldRegenMultiplier: 0.92 };
            case 'time_field':
                return { ...neutral, enemyBulletSpeedMultiplier: 0.96 - tier * 0.04, tacticalChargeMultiplier: 0.88 };
            case 'guidance':
                return { ...neutral, damageMultiplier: 0.98, guidanceAngleRadians: 0.06 + tier * 0.058 };
            case 'reactor':
                return { ...neutral, generatorMultiplier: 1.04 + tier * 0.035, movementMultiplier: 0.94 };
            case 'recovery':
                return { ...neutral, shieldRegenMultiplier: 1.08 + tier * 0.04, damageMultiplier: 0.95 };
        }
    }

    public getEffectSummary(rune: RuneInstance): string {
        const tier = clampTier(rune.tier);
        const percent = (value: number): string => `${Math.round(value * 100)}%`;
        switch (rune.runeId) {
            case 'assault': return `+${Math.round((1.08 + tier * 0.025 - 1) * 100)}% DAMAGE // +${Math.round((1.04 + tier * 0.01 - 1) * 100)}% DAMAGE TAKEN`;
            case 'guard': return `-${Math.round((1 - (0.96 - tier * 0.025)) * 100)}% DAMAGE TAKEN // -6% FIRE RATE`;
            case 'radius': return `+${Math.round((1.12 + tier * 0.05 - 1) * 100)}% SHOT SIZE // +${Math.round((1.03 + tier * 0.01 - 1) * 100)}% ENERGY COST`;
            case 'thrust': return `+${Math.round((1.05 + tier * 0.03 - 1) * 100)}% MOVEMENT // -8% SHIELD REGEN`;
            case 'time_field': return `ENEMY BULLETS AT ${percent(0.96 - tier * 0.04)} SPEED // -12% TACTICAL CHARGE`;
            case 'guidance': return `INITIAL AIM ASSIST UP TO ${Math.round((0.06 + tier * 0.058) * 180 / Math.PI)}° // -2% DAMAGE`;
            case 'reactor': return `+${Math.round((1.04 + tier * 0.035 - 1) * 100)}% GENERATOR OUTPUT // -6% MOVEMENT`;
            case 'recovery': return `+${Math.round((1.08 + tier * 0.04 - 1) * 100)}% SHIELD REGEN // -5% DAMAGE`;
        }
    }

    public getSaveState(): RuneSaveState {
        return {
            version: 1,
            inventory: this.getInventory(),
            loadout: [...this.loadout]
        };
    }

    public reset(): void {
        this.inventory = [];
        this.loadout = [null, null, null];
    }

    public loadSaveState(state?: RuneSaveState | unknown): void {
        this.inventory = [];
        this.loadout = [null, null, null];
        if (!state || typeof state !== 'object') return;
        const candidate = state as Partial<RuneSaveState>;
        if (!Array.isArray(candidate.inventory)) return;
        this.inventory = candidate.inventory
            .filter((rune): rune is RuneInstance => Boolean(rune && typeof rune.id === 'string' && RUNE_ORDER.includes(rune.runeId) && typeof rune.tier === 'number'))
            .map((rune) => ({ id: rune.id, runeId: rune.runeId, tier: clampTier(rune.tier) }));
        if (Array.isArray(candidate.loadout)) {
            candidate.loadout.slice(0, RuneSystem.SLOT_COUNT).forEach((id, index) => {
                if (typeof id === 'string' && this.inventory.some((rune) => rune.id === id)) this.loadout[index] = id;
            });
        }
    }
}
