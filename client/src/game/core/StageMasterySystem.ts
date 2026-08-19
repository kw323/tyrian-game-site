export interface StageTelemetry {
    level: number;
    enemiesSpawned: number;
    enemiesDefeated: number;
    eliminationPercent: number;
    shieldHits: number;
    shieldDamageAbsorbed: number;
    hullDamageTaken: number;
    totalDamageTaken: number;
    cleanShieldRun: boolean;
    weaponClearRun: boolean;
}

export interface MasteryRewards {
    aegisMasteryUnlocked: boolean;
    weaponMasteryUnlocked: boolean;
}

export interface StageMasterySaveState {
    aegisStreak: number;
    weaponStreak: number;
    aegisMasteryUnlocked: boolean;
    weaponMasteryUnlocked: boolean;
    lastTelemetry: StageTelemetry | null;
}

export interface StageMasteryResult {
    telemetry: StageTelemetry;
    rewards: MasteryRewards;
    aegisStreak: number;
    weaponStreak: number;
}

// Style: tactical telemetry is deterministic, compact, and readable at the end of a high-pressure mission.
export class StageMasterySystem {
    public static readonly STREAK_LENGTH = 10;
    public static readonly MAX_ACCEPTED_SHIELD_HITS = 1;
    public static readonly MAX_ACCEPTED_SHIELD_DAMAGE = 20;
    public static readonly WEAPON_CLEAR_THRESHOLD = 0.95;

    private currentLevel = 1;
    private enemiesSpawned = 0;
    private enemiesDefeated = 0;
    private shieldHits = 0;
    private shieldDamageAbsorbed = 0;
    private hullDamageTaken = 0;
    private finalized = false;
    private aegisStreak = 0;
    private weaponStreak = 0;
    private aegisMasteryUnlocked = false;
    private weaponMasteryUnlocked = false;
    private lastTelemetry: StageTelemetry | null = null;

    public beginStage(level: number): void {
        this.currentLevel = level;
        this.enemiesSpawned = 0;
        this.enemiesDefeated = 0;
        this.shieldHits = 0;
        this.shieldDamageAbsorbed = 0;
        this.hullDamageTaken = 0;
        this.finalized = false;
    }

    public recordEnemySpawn(count = 1): void {
        this.enemiesSpawned += Math.max(0, Math.floor(count));
    }

    public recordEnemyDefeat(count = 1): void {
        this.enemiesDefeated += Math.max(0, Math.floor(count));
    }

    public recordShieldImpact(damageAbsorbed: number): void {
        if (damageAbsorbed <= 0) return;
        this.shieldHits += 1;
        this.shieldDamageAbsorbed += damageAbsorbed;
    }

    public recordPlayerDamage(totalDamage: number, shieldDamageAbsorbed: number): void {
        const safeTotal = Math.max(0, totalDamage);
        const safeShieldDamage = Math.min(safeTotal, Math.max(0, shieldDamageAbsorbed));
        if (safeShieldDamage > 0) this.recordShieldImpact(safeShieldDamage);
        this.hullDamageTaken += Math.max(0, safeTotal - safeShieldDamage);
    }

    public finalizeStage(): StageMasteryResult | null {
        if (this.finalized && this.lastTelemetry) {
            return {
                telemetry: this.lastTelemetry,
                rewards: { aegisMasteryUnlocked: false, weaponMasteryUnlocked: false },
                aegisStreak: this.aegisStreak,
                weaponStreak: this.weaponStreak
            };
        }

        const eliminationPercent = this.enemiesSpawned === 0
            ? 0
            : Math.min(100, (this.enemiesDefeated / this.enemiesSpawned) * 100);
        const cleanShieldRun = this.shieldHits <= StageMasterySystem.MAX_ACCEPTED_SHIELD_HITS
            && this.shieldDamageAbsorbed <= StageMasterySystem.MAX_ACCEPTED_SHIELD_DAMAGE;
        const weaponClearRun = this.enemiesSpawned > 0 && eliminationPercent >= StageMasterySystem.WEAPON_CLEAR_THRESHOLD * 100;
        const totalDamageTaken = this.shieldDamageAbsorbed + this.hullDamageTaken;
        const telemetry: StageTelemetry = {
            level: this.currentLevel,
            enemiesSpawned: this.enemiesSpawned,
            enemiesDefeated: this.enemiesDefeated,
            eliminationPercent,
            shieldHits: this.shieldHits,
            shieldDamageAbsorbed: this.shieldDamageAbsorbed,
            hullDamageTaken: this.hullDamageTaken,
            totalDamageTaken,
            cleanShieldRun,
            weaponClearRun
        };

        this.aegisStreak = cleanShieldRun ? Math.min(StageMasterySystem.STREAK_LENGTH, this.aegisStreak + 1) : 0;
        this.weaponStreak = weaponClearRun ? Math.min(StageMasterySystem.STREAK_LENGTH, this.weaponStreak + 1) : 0;
        const rewards = {
            aegisMasteryUnlocked: !this.aegisMasteryUnlocked && this.aegisStreak >= StageMasterySystem.STREAK_LENGTH,
            weaponMasteryUnlocked: !this.weaponMasteryUnlocked && this.weaponStreak >= StageMasterySystem.STREAK_LENGTH
        };
        if (rewards.aegisMasteryUnlocked) this.aegisMasteryUnlocked = true;
        if (rewards.weaponMasteryUnlocked) this.weaponMasteryUnlocked = true;

        this.lastTelemetry = telemetry;
        this.finalized = true;
        return { telemetry, rewards, aegisStreak: this.aegisStreak, weaponStreak: this.weaponStreak };
    }

    public getLastTelemetry(): StageTelemetry | null {
        return this.lastTelemetry;
    }

    public getAegisStreak(): number {
        return this.aegisStreak;
    }

    public getWeaponStreak(): number {
        return this.weaponStreak;
    }

    public hasAegisMastery(): boolean {
        return this.aegisMasteryUnlocked;
    }

    public hasWeaponMastery(): boolean {
        return this.weaponMasteryUnlocked;
    }

    public getSaveState(): StageMasterySaveState {
        return {
            aegisStreak: this.aegisStreak,
            weaponStreak: this.weaponStreak,
            aegisMasteryUnlocked: this.aegisMasteryUnlocked,
            weaponMasteryUnlocked: this.weaponMasteryUnlocked,
            lastTelemetry: this.lastTelemetry
        };
    }

    public loadSaveState(state: Partial<StageMasterySaveState>): void {
        this.aegisStreak = Math.max(0, Math.min(StageMasterySystem.STREAK_LENGTH, state.aegisStreak ?? 0));
        this.weaponStreak = Math.max(0, Math.min(StageMasterySystem.STREAK_LENGTH, state.weaponStreak ?? 0));
        this.aegisMasteryUnlocked = Boolean(state.aegisMasteryUnlocked);
        this.weaponMasteryUnlocked = Boolean(state.weaponMasteryUnlocked);
        this.lastTelemetry = state.lastTelemetry ?? null;
    }

    public reset(): void {
        this.beginStage(1);
        this.aegisStreak = 0;
        this.weaponStreak = 0;
        this.aegisMasteryUnlocked = false;
        this.weaponMasteryUnlocked = false;
        this.lastTelemetry = null;
    }
}
