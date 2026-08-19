// Tactical abilities: one equipped combat module, charged through time and enemy defeats.
// The tactical meter stores one base charge plus up to two purchased reserve cartridges.

export enum TacticalAbilityType {
    TIME_LOCK = 'time_lock',
    VOID_ARMOR = 'void_armor',
    OVER_POWER = 'over_power',
    PHASE_CLOAK = 'phase_cloak'
}

export interface TacticalAbilityLevel {
    level: number;
    cost: number;
    duration: number;
    description: string;
    fireMultiplier: number;
    shieldRegenMultiplier: number;
}

export interface TacticalAbilitySaveState {
    levels: Record<string, number>;
    selectedAbility: TacticalAbilityType;
    magazineCapacity?: number;
}

export interface TacticalAbilityStatus {
    type: TacticalAbilityType;
    level: number;
    duration: number;
    description: string;
    unlocked: boolean;
    selected: boolean;
}

export class TacticalAbilitySystem {
    public static readonly REQUIRED_SHIP_TIER = 3; // Destroyer (Mk.4) - the fourth ship in the fleet.
    public static readonly MAX_CHARGE = 100;
    public static readonly MAX_MAGAZINE_CAPACITY = 3;
    public static readonly PASSIVE_CHARGE_SECONDS = 20;
    public static readonly KILL_CHARGE_PERCENT = 0.1;
    private static readonly MAGAZINE_COSTS: Record<number, number> = {
        2: 2_000_000,
        3: 4_000_000
    };

    private readonly levels = new Map<TacticalAbilityType, TacticalAbilityLevel[]>();
    private readonly currentLevels = new Map<TacticalAbilityType, number>();
    private selectedAbility: TacticalAbilityType = TacticalAbilityType.TIME_LOCK;
    private charge = 0;
    private magazineCapacity = 1;
    private active = false;
    private activeElapsed = 0;

    constructor() {
        this.initializeAbilities();
        this.resetProgress();
    }

    private initializeAbilities(): void {
        this.levels.set(TacticalAbilityType.TIME_LOCK, [
            { level: 1, cost: 45000, duration: 2.0, description: 'Freezes enemies and hostile projectiles for 2.0 seconds while the pilot remains mobile.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 2, cost: 90000, duration: 2.3, description: 'Freezes enemies and hostile projectiles for 2.3 seconds while the pilot remains mobile.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 3, cost: 180000, duration: 2.5, description: 'Freezes enemies and hostile projectiles for 2.5 seconds while the pilot remains mobile.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 4, cost: 360000, duration: 2.8, description: 'Freezes enemies and hostile projectiles for 2.8 seconds while the pilot remains mobile.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 5, cost: 720000, duration: 3.0, description: 'Freezes enemies and hostile projectiles for a maximum 3.0-second window.', fireMultiplier: 1, shieldRegenMultiplier: 1 }
        ]);

        this.levels.set(TacticalAbilityType.VOID_ARMOR, [
            { level: 1, cost: 55000, duration: 3.5, description: 'Makes the hull and shield completely immune to combat impacts for 3.5 seconds.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 2, cost: 110000, duration: 3.9, description: 'Makes the hull and shield completely immune to combat impacts for 3.9 seconds.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 3, cost: 220000, duration: 4.3, description: 'Makes the hull and shield completely immune to combat impacts for 4.3 seconds.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 4, cost: 440000, duration: 4.6, description: 'Makes the hull and shield completely immune to combat impacts for 4.6 seconds.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 5, cost: 880000, duration: 5.0, description: 'Makes the hull and shield completely immune to combat impacts for a maximum 5.0 seconds.', fireMultiplier: 1, shieldRegenMultiplier: 1 }
        ]);

        this.levels.set(TacticalAbilityType.OVER_POWER, [
            { level: 1, cost: 65000, duration: 2.0, description: 'Provides unlimited weapon energy and doubles fire and shield regeneration for 2.0 seconds.', fireMultiplier: 2.0, shieldRegenMultiplier: 2.0 },
            { level: 2, cost: 130000, duration: 2.3, description: 'Provides unlimited weapon energy with 2.15× fire and shield regeneration for 2.3 seconds.', fireMultiplier: 2.15, shieldRegenMultiplier: 2.15 },
            { level: 3, cost: 260000, duration: 2.5, description: 'Provides unlimited weapon energy with 2.35× fire and shield regeneration for 2.5 seconds.', fireMultiplier: 2.35, shieldRegenMultiplier: 2.35 },
            { level: 4, cost: 520000, duration: 2.8, description: 'Provides unlimited weapon energy with 2.6× fire and shield regeneration for 2.8 seconds.', fireMultiplier: 2.6, shieldRegenMultiplier: 2.6 },
            { level: 5, cost: 1040000, duration: 3.0, description: 'Provides maximum 2.9× fire and shield regeneration with unlimited weapon energy for 3.0 seconds.', fireMultiplier: 2.9, shieldRegenMultiplier: 2.9 }
        ]);

        // Phase Cloak intentionally retains its original duration ladder.
        this.levels.set(TacticalAbilityType.PHASE_CLOAK, [
            { level: 1, cost: 70000, duration: 4.5, description: 'Cloaks ship and bullets. Enemies stop targeting or dodging your shots. Physical collisions still deal damage.', fireMultiplier: 1.0, shieldRegenMultiplier: 1.0 },
            { level: 2, cost: 140000, duration: 5.2, description: 'Extended optical refraction window.', fireMultiplier: 1.0, shieldRegenMultiplier: 1.0 },
            { level: 3, cost: 280000, duration: 6.0, description: 'Advanced stealth matrix for dense sectors.', fireMultiplier: 1.0, shieldRegenMultiplier: 1.0 },
            { level: 4, cost: 560000, duration: 6.9, description: 'High-grade quantum phase vanishing.', fireMultiplier: 1.0, shieldRegenMultiplier: 1.0 },
            { level: 5, cost: 1120000, duration: 7.9, description: 'Maximum distortion stealth field.', fireMultiplier: 1.0, shieldRegenMultiplier: 1.0 }
        ]);
    }

    private resetProgress(): void {
        this.currentLevels.set(TacticalAbilityType.TIME_LOCK, 0);
        this.currentLevels.set(TacticalAbilityType.VOID_ARMOR, 0);
        this.currentLevels.set(TacticalAbilityType.OVER_POWER, 0);
        this.currentLevels.set(TacticalAbilityType.PHASE_CLOAK, 0);
    }

    public isSystemUnlocked(shipTier: number): boolean {
        return shipTier >= TacticalAbilitySystem.REQUIRED_SHIP_TIER;
    }

    public getAllTypes(): TacticalAbilityType[] {
        return [
            TacticalAbilityType.TIME_LOCK,
            TacticalAbilityType.VOID_ARMOR,
            TacticalAbilityType.OVER_POWER,
            TacticalAbilityType.PHASE_CLOAK
        ];
    }

    public getCurrentLevel(type: TacticalAbilityType): number {
        return this.currentLevels.get(type) ?? 0;
    }

    public getCurrentAbility(): TacticalAbilityType {
        return this.selectedAbility;
    }

    public getAbilityLevel(type: TacticalAbilityType): TacticalAbilityLevel | null {
        const level = this.getCurrentLevel(type);
        if (level <= 0) return null;
        return this.levels.get(type)?.[level - 1] ?? null;
    }

    public getNextAbilityLevel(type: TacticalAbilityType): TacticalAbilityLevel | null {
        const nextLevel = this.getCurrentLevel(type) + 1;
        return this.levels.get(type)?.[nextLevel - 1] ?? null;
    }

    public getStatus(type: TacticalAbilityType, shipTier: number): TacticalAbilityStatus {
        const levelData = this.getAbilityLevel(type);
        return {
            type,
            level: this.getCurrentLevel(type),
            duration: levelData?.duration ?? 0,
            description: levelData?.description ?? 'Module not installed. Purchase it to unlock this ability.',
            unlocked: this.isSystemUnlocked(shipTier) && this.getCurrentLevel(type) > 0,
            selected: this.selectedAbility === type
        };
    }

    public getAllStatuses(shipTier: number): TacticalAbilityStatus[] {
        return this.getAllTypes().map((type) => this.getStatus(type, shipTier));
    }

    public selectAbility(type: TacticalAbilityType, shipTier: number): boolean {
        if (!this.isSystemUnlocked(shipTier) || this.getCurrentLevel(type) <= 0 || this.active) return false;
        this.selectedAbility = type;
        return true;
    }

    public upgradeAbility(type: TacticalAbilityType, score: number, shipTier: number): { cost: number; level: number } | null {
        if (!this.isSystemUnlocked(shipTier) || this.active) return null;
        const next = this.getNextAbilityLevel(type);
        if (!next || score < next.cost) return null;
        this.currentLevels.set(type, next.level);
        if (this.getCurrentLevel(type) === 1 && this.getCurrentLevel(this.selectedAbility) === 0) {
            this.selectedAbility = type;
        }
        return { cost: next.cost, level: next.level };
    }

    /** Credits spent on one tactical module up to its current level. */
    public getAbilityInvestment(type: TacticalAbilityType, level: number = this.getCurrentLevel(type)): number {
        if (level <= 0) return 0;
        return (this.levels.get(type) ?? [])
            .slice(0, Math.min(level, this.levels.get(type)?.length ?? 0))
            .reduce((total, entry) => total + entry.cost, 0);
    }

    public getTotalInvestment(): number {
        return this.getAllTypes().reduce((total, type) => total + this.getAbilityInvestment(type), 0) + this.getMagazineInvestment();
    }

    public getMagazineCapacity(): number {
        return this.magazineCapacity;
    }

    public getMagazineInvestment(): number {
        let total = 0;
        for (let capacity = 2; capacity <= this.magazineCapacity; capacity++) total += TacticalAbilitySystem.MAGAZINE_COSTS[capacity] ?? 0;
        return total;
    }

    public getNextMagazineCost(): number | null {
        const nextCapacity = this.magazineCapacity + 1;
        return nextCapacity <= TacticalAbilitySystem.MAX_MAGAZINE_CAPACITY
            ? TacticalAbilitySystem.MAGAZINE_COSTS[nextCapacity] ?? null
            : null;
    }

    public purchaseMagazine(score: number, shipTier: number): { cost: number; capacity: number } | null {
        if (!this.isSystemUnlocked(shipTier) || this.active) return null;
        const cost = this.getNextMagazineCost();
        if (cost === null || score < cost) return null;
        this.magazineCapacity += 1;
        return { cost, capacity: this.magazineCapacity };
    }

    public getMaxCharge(): number {
        return TacticalAbilitySystem.MAX_CHARGE * this.magazineCapacity;
    }

    public getStoredUses(): number {
        return Math.floor(this.charge / TacticalAbilitySystem.MAX_CHARGE);
    }

    public getCharge(): number {
        return this.charge;
    }

    public getChargePercent(): number {
        return this.charge / this.getMaxCharge();
    }

    public isChargeFull(): boolean {
        return this.charge >= TacticalAbilitySystem.MAX_CHARGE;
    }

    public isChargeAtCapacity(): boolean {
        return this.charge >= this.getMaxCharge();
    }

    public isActive(): boolean {
        return this.active;
    }

    public getActiveTimeRemaining(): number {
        const ability = this.getAbilityLevel(this.selectedAbility);
        return ability ? Math.max(0, ability.duration - this.activeElapsed) : 0;
    }

    public getActiveDuration(): number {
        return this.getAbilityLevel(this.selectedAbility)?.duration ?? 0;
    }

    public addKillCharge(_points: number, shipTier: number): number {
        if (!this.isSystemUnlocked(shipTier) || this.active) return 0;
        const previous = this.charge;
        this.charge = Math.min(this.getMaxCharge(), this.charge + TacticalAbilitySystem.KILL_CHARGE_PERCENT);
        return this.charge - previous;
    }

    public addTimeCharge(deltaTime: number, shipTier: number): number {
        if (!this.isSystemUnlocked(shipTier) || this.active || deltaTime <= 0) return 0;
        const previous = this.charge;
        const chargePerSecond = TacticalAbilitySystem.MAX_CHARGE / TacticalAbilitySystem.PASSIVE_CHARGE_SECONDS;
        this.charge = Math.min(this.getMaxCharge(), this.charge + deltaTime * chargePerSecond);
        return this.charge - previous;
    }

    public activate(shipTier: number): boolean {
        if (!this.isSystemUnlocked(shipTier) || this.active || !this.isChargeFull() || !this.getAbilityLevel(this.selectedAbility)) return false;
        this.charge -= TacticalAbilitySystem.MAX_CHARGE;
        this.active = true;
        this.activeElapsed = 0;
        return true;
    }

    public deactivate(): boolean {
        if (!this.active) return false;
        this.active = false;
        this.activeElapsed = 0;
        return true;
    }

    public update(deltaTime: number): void {
        if (!this.active) return;
        const ability = this.getAbilityLevel(this.selectedAbility);
        if (!ability || ability.duration <= 0) {
            this.deactivate();
            return;
        }
        this.activeElapsed += Math.max(0, deltaTime);
        if (this.activeElapsed >= ability.duration) this.deactivate();
    }

    public resetStage(): void {
        this.charge = 0;
        this.active = false;
        this.activeElapsed = 0;
    }

    public getFireMultiplier(): number {
        return this.active && this.selectedAbility === TacticalAbilityType.OVER_POWER
            ? this.getAbilityLevel(this.selectedAbility)?.fireMultiplier ?? 1
            : 1;
    }

    public getShieldRegenMultiplier(): number {
        return this.active && this.selectedAbility === TacticalAbilityType.OVER_POWER
            ? this.getAbilityLevel(this.selectedAbility)?.shieldRegenMultiplier ?? 1
            : 1;
    }

    public isTimeLocked(): boolean {
        return this.active && this.selectedAbility === TacticalAbilityType.TIME_LOCK;
    }

    public isVoidArmored(): boolean {
        return this.active && this.selectedAbility === TacticalAbilityType.VOID_ARMOR;
    }

    public isPhaseCloaked(): boolean {
        return this.active && this.selectedAbility === TacticalAbilityType.PHASE_CLOAK;
    }

    public hasUnlimitedPower(): boolean {
        return this.active && this.selectedAbility === TacticalAbilityType.OVER_POWER;
    }

    public getSaveState(): TacticalAbilitySaveState {
        return {
            levels: Object.fromEntries(this.currentLevels.entries()),
            selectedAbility: this.selectedAbility,
            magazineCapacity: this.magazineCapacity
        };
    }

    public loadSaveState(state?: Partial<TacticalAbilitySaveState>): void {
        this.resetStage();
        if (!state) return;
        this.getAllTypes().forEach((type) => {
            const savedLevel = Math.max(0, Math.min(this.levels.get(type)?.length ?? 0, Number(state.levels?.[type] ?? 0)));
            this.currentLevels.set(type, savedLevel);
        });
        this.magazineCapacity = Math.max(1, Math.min(TacticalAbilitySystem.MAX_MAGAZINE_CAPACITY, Math.floor(Number(state.magazineCapacity ?? 1))));
        if (state.selectedAbility && this.getCurrentLevel(state.selectedAbility) > 0) {
            this.selectedAbility = state.selectedAbility;
        }
    }

    public reset(): void {
        this.resetStage();
        this.resetProgress();
        this.magazineCapacity = 1;
        this.selectedAbility = TacticalAbilityType.TIME_LOCK;
    }
}
