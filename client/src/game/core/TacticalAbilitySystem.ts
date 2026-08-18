// Tactical Abilities: one equipped combat module, charged only by enemy defeats, with runtime state kept separate from upgrades.

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

    private readonly levels = new Map<TacticalAbilityType, TacticalAbilityLevel[]>();
    private readonly currentLevels = new Map<TacticalAbilityType, number>();
    private selectedAbility: TacticalAbilityType = TacticalAbilityType.TIME_LOCK;
    private charge = 0;
    private active = false;
    private activeElapsed = 0;

    constructor() {
        this.initializeAbilities();
        this.resetProgress();
    }

    private initializeAbilities(): void {
        this.levels.set(TacticalAbilityType.TIME_LOCK, [
            { level: 1, cost: 45000, duration: 4.0, description: 'Freezes enemies and enemy projectiles while the pilot remains mobile.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 2, cost: 90000, duration: 4.6, description: 'Longer lock window with a more reliable freeze field.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 3, cost: 180000, duration: 5.2, description: 'Extended temporal lock for dense formations.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 4, cost: 360000, duration: 5.9, description: 'High-grade temporal control for elite waves.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 5, cost: 720000, duration: 6.7, description: 'Maximum controlled time fracture.', fireMultiplier: 1, shieldRegenMultiplier: 1 }
        ]);

        this.levels.set(TacticalAbilityType.VOID_ARMOR, [
            { level: 1, cost: 55000, duration: 4.5, description: 'Makes the hull and shield completely immune to combat impacts.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 2, cost: 110000, duration: 5.1, description: 'Longer phase armor with a smoother activation window.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 3, cost: 220000, duration: 5.8, description: 'Sustained immunity against dense enemy patterns.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 4, cost: 440000, duration: 6.5, description: 'Reinforced void shell for boss encounters.', fireMultiplier: 1, shieldRegenMultiplier: 1 },
            { level: 5, cost: 880000, duration: 7.3, description: 'Maximum hull phase stability.', fireMultiplier: 1, shieldRegenMultiplier: 1 }
        ]);

        this.levels.set(TacticalAbilityType.OVER_POWER, [
            { level: 1, cost: 65000, duration: 5.0, description: 'Provides unlimited weapon energy and doubles fire and shield regeneration rates.', fireMultiplier: 2.0, shieldRegenMultiplier: 2.0 },
            { level: 2, cost: 130000, duration: 5.5, description: 'Longer reactor surge with a stronger combat rhythm.', fireMultiplier: 2.15, shieldRegenMultiplier: 2.15 },
            { level: 3, cost: 260000, duration: 6.0, description: 'Triples the practical pressure on weapons and shield recovery.', fireMultiplier: 2.35, shieldRegenMultiplier: 2.35 },
            { level: 4, cost: 520000, duration: 6.6, description: 'High-output surge for prolonged attack windows.', fireMultiplier: 2.6, shieldRegenMultiplier: 2.6 },
            { level: 5, cost: 1040000, duration: 7.2, description: 'Maximum reactor overdrive without changing the ship permanently.', fireMultiplier: 2.9, shieldRegenMultiplier: 2.9 }
        ]);

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

    /** Credits spent on one tactical module up to its current level. */
    public getAbilityInvestment(type: TacticalAbilityType, level: number = this.getCurrentLevel(type)): number {
        if (level <= 0) return 0;
        return (this.levels.get(type) ?? [])
            .slice(0, Math.min(level, this.levels.get(type)?.length ?? 0))
            .reduce((total, entry) => total + entry.cost, 0);
    }

    public getTotalInvestment(): number {
        return this.getAllTypes().reduce((total, type) => total + this.getAbilityInvestment(type), 0);
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

    public getCharge(): number {
        return this.charge;
    }

    public getChargePercent(): number {
        return this.charge / TacticalAbilitySystem.MAX_CHARGE;
    }

    public isChargeFull(): boolean {
        return this.charge >= TacticalAbilitySystem.MAX_CHARGE;
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
        // Each enemy kill contributes exactly 0.5% of the tactical meter.
        const previous = this.charge;
        this.charge = Math.min(TacticalAbilitySystem.MAX_CHARGE, this.charge + 0.5);
        return this.charge - previous;
    }

    public addTimeCharge(deltaTime: number, shipTier: number): number {
        if (!this.isSystemUnlocked(shipTier) || this.active || deltaTime <= 0) return 0;
        // The Sera duel has no ordinary enemies, so it charges at 5% per second.
        const previous = this.charge;
        this.charge = Math.min(TacticalAbilitySystem.MAX_CHARGE, this.charge + deltaTime * 5);
        return this.charge - previous;
    }

    public activate(shipTier: number): boolean {
        if (!this.isSystemUnlocked(shipTier) || this.active || !this.isChargeFull() || !this.getAbilityLevel(this.selectedAbility)) return false;
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
        this.charge = Math.max(0, this.charge - (TacticalAbilitySystem.MAX_CHARGE / ability.duration) * Math.max(0, deltaTime));
        if (this.charge <= 0 || this.activeElapsed >= ability.duration) {
            this.charge = Math.max(0, this.charge);
            this.deactivate();
        }
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
            selectedAbility: this.selectedAbility
        };
    }

    public loadSaveState(state?: Partial<TacticalAbilitySaveState>): void {
        this.resetStage();
        if (!state) return;
        this.getAllTypes().forEach((type) => {
            const savedLevel = Math.max(0, Math.min(this.levels.get(type)?.length ?? 0, Number(state.levels?.[type] ?? 0)));
            this.currentLevels.set(type, savedLevel);
        });
        if (state.selectedAbility && this.getCurrentLevel(state.selectedAbility) > 0) {
            this.selectedAbility = state.selectedAbility;
        }
    }

    public reset(): void {
        this.resetStage();
        this.resetProgress();
        this.selectedAbility = TacticalAbilityType.TIME_LOCK;
    }
}
