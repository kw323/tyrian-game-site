import { Boss } from './Boss';
import { EnemyBullet } from './EnemyBullet';
import { DifficultyProfile } from '../core/DifficultySystem';

export type FinalBossPartRole = 'core' | 'front_cannon' | 'rear_battery';

export interface FinalBossPartConfig {
    id: string;
    label: string;
    role: FinalBossPartRole;
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    shield: number;
    color: string;
}

/**
 * The Archon is one connected capital ship with five exposed combat systems.
 * Phase 1 destroys its two forward guns, phase 2 the two rear batteries, then
 * phase 3 exposes the command core. Reinforcement swarms are released by the
 * flagship itself during a short cease-fire, never by the sector spawner.
 */
export class FinalBossAssembly {
    private readonly parts: FinalBossPart[] = [];
    private readonly destroyedPartIds = new Set<string>();
    private meltdownActive = false;
    private meltdownRemaining = 0;
    private meltdownComplete = false;
    private reinforcementTimer = 0;
    private reinforcementWindup = 0;
    private pendingAlienWave = false;

    public constructor(private readonly difficulty: DifficultyProfile) {}

    public createParts(): FinalBossPart[] {
        if (this.parts.length) return this.parts;
        const configs: FinalBossPartConfig[] = [
            // The two forward batteries overlap the prow and are the only powered targets at launch.
            { id: 'front-port', label: 'PORT FORWARD BATTERY', role: 'front_cannon', x: 392, y: 118, width: 172, height: 126, health: 30000, shield: 16000, color: '#ff7148' },
            { id: 'front-starboard', label: 'STARBOARD FORWARD BATTERY', role: 'front_cannon', x: 636, y: 118, width: 172, height: 126, health: 30000, shield: 16000, color: '#ff7148' },
            // Rear systems form the broad attached wings and stay dormant until the prow is gone.
            { id: 'rear-port', label: 'PORT REAR BATTERY', role: 'rear_battery', x: 180, y: 250, width: 292, height: 166, health: 36000, shield: 20000, color: '#b64478' },
            { id: 'rear-starboard', label: 'STARBOARD REAR BATTERY', role: 'rear_battery', x: 728, y: 250, width: 292, height: 166, health: 36000, shield: 20000, color: '#b64478' },
            { id: 'core', label: 'ARCHON COMMAND CORE', role: 'core', x: 360, y: 166, width: 480, height: 258, health: 76000, shield: 42000, color: '#d83b5b' }
        ];
        configs.forEach((config) => this.parts.push(new FinalBossPart(config, this, this.difficulty)));
        return this.parts;
    }

    public update(deltaTime: number): void {
        if (this.meltdownActive && !this.meltdownComplete) {
            this.meltdownRemaining = Math.max(0, this.meltdownRemaining - deltaTime);
            if (this.meltdownRemaining <= 0) {
                this.meltdownComplete = true;
                this.meltdownActive = false;
            }
            return;
        }
        if (this.meltdownComplete || this.getPhase() < 2) return;

        if (this.reinforcementWindup > 0) {
            this.reinforcementWindup = Math.max(0, this.reinforcementWindup - deltaTime);
            if (this.reinforcementWindup <= 0) this.pendingAlienWave = true;
            return;
        }
        this.reinforcementTimer += deltaTime;
        const phaseInterval = this.getPhase() === 2 ? 15 : 11;
        if (this.reinforcementTimer >= phaseInterval) {
            this.reinforcementTimer = 0;
            // The entire ship pauses fire briefly while it launches one alien pattern.
            this.reinforcementWindup = 1.8;
        }
    }

    public consumeAlienWaveRequest(): number | null {
        if (!this.pendingAlienWave) return null;
        this.pendingAlienWave = false;
        return 20;
    }

    public isReinforcementWindup(): boolean {
        return this.reinforcementWindup > 0;
    }

    public markPartDestroyed(part: FinalBossPart): void {
        if (this.destroyedPartIds.has(part.partId)) return;
        this.destroyedPartIds.add(part.partId);
        if (part.role === 'core') {
            this.startMeltdown();
        }
    }

    private startMeltdown(): void {
        if (this.meltdownActive || this.meltdownComplete) return;
        this.meltdownActive = true;
        this.meltdownRemaining = 6.5;
        this.reinforcementWindup = 0;
        this.pendingAlienWave = false;
    }

    public getPhase(): 1 | 2 | 3 | 4 {
        if (this.meltdownActive || this.meltdownComplete) return 4;
        const frontsDestroyed = this.countDestroyed('front_cannon');
        const rearsDestroyed = this.countDestroyed('rear_battery');
        if (frontsDestroyed < 2) return 1;
        if (rearsDestroyed < 2) return 2;
        return 3;
    }

    public isPartEnabled(part: FinalBossPart): boolean {
        if (this.meltdownActive || this.meltdownComplete) return false;
        const phase = this.getPhase();
        return (phase === 1 && part.role === 'front_cannon')
            || (phase === 2 && part.role === 'rear_battery')
            || (phase === 3 && part.role === 'core');
    }

    public canPartFire(part: FinalBossPart): boolean {
        return this.isPartEnabled(part) && !this.isReinforcementWindup();
    }

    private countDestroyed(role: FinalBossPartRole): number {
        return this.parts.filter((part) => part.role === role && this.destroyedPartIds.has(part.partId)).length;
    }

    public getDestroyedParts(): number {
        return this.destroyedPartIds.size;
    }

    public getDestroyedOuterSystems(): number {
        return this.countDestroyed('front_cannon') + this.countDestroyed('rear_battery');
    }

    public getTotalParts(): number {
        return this.parts.length;
    }

    /** Compatibility name retained for the HUD and previous save-path logic. */
    public isReactorExposed(): boolean {
        return this.getPhase() >= 3;
    }

    public isMeltdownActive(): boolean {
        return this.meltdownActive;
    }

    public getMeltdownRemaining(): number {
        return this.meltdownRemaining;
    }

    public isDefeated(): boolean {
        return this.meltdownComplete;
    }

    public getObjectiveLabel(): string {
        if (this.meltdownActive) return `ARCHON CORE COLLAPSE // ${this.meltdownRemaining.toFixed(1)}s`;
        if (this.meltdownComplete) return 'ARCHON SUPREME // DETONATED';
        if (this.isReinforcementWindup()) return 'ARCHON HANGAR OPENING // PREPARE FOR ALIEN SWARM';
        const phase = this.getPhase();
        if (phase === 1) return `FORWARD BATTERIES // ${this.countDestroyed('front_cannon')}/2 DESTROYED`;
        if (phase === 2) return `REAR BATTERIES // ${this.countDestroyed('rear_battery')}/2 DESTROYED`;
        return 'ARCHON COMMAND CORE EXPOSED // DESTROY IT';
    }

    public getParts(): readonly FinalBossPart[] {
        return this.parts;
    }
}

export class FinalBossPart extends Boss {
    public readonly partId: string;
    public readonly partLabel: string;
    public readonly role: FinalBossPartRole;
    public readonly assembly: FinalBossAssembly;
    private readonly baseX: number;
    private readonly baseY: number;
    private readonly partColor: string;
    private readonly difficulty: DifficultyProfile;
    private phaseShotIndex = 0;
    private timeAlive = 0;
    private destructionReported = false;

    public constructor(config: FinalBossPartConfig, assembly: FinalBossAssembly, difficulty: DifficultyProfile) {
        super(config.x, config.y, 101);
        this.width = config.width;
        this.height = config.height;
        this.partId = config.id;
        this.partLabel = config.label;
        this.role = config.role;
        this.assembly = assembly;
        this.difficulty = difficulty;
        this.baseX = config.x;
        this.baseY = config.y;
        this.partColor = config.color;
        this.maxHealth = Math.floor(config.health * difficulty.bossMultiplier);
        this.health = this.maxHealth;
        this.maxShield = Math.floor(config.shield * difficulty.bossMultiplier);
        this.shield = this.maxShield;
        this.shieldRegenRate = (this.role === 'core' ? 12 : 8) * difficulty.bossMultiplier;
        this.shootInterval = 0.8;
        this.color = config.color;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen || !this.isActive || !this.isAlive()) return;
        this.shootCooldown += deltaTime;
        this.timeAlive += deltaTime;
        this.updateFormationMotion();
        if (!this.assembly.isPartEnabled(this)) return;
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * deltaTime);
        }
    }

    private updateFormationMotion(): void {
        const drift = Math.sin(this.timeAlive * 0.52) * 7;
        const sway = Math.cos(this.timeAlive * 0.69) * 5;
        this.x = this.baseX + drift;
        this.y = this.baseY + sway;
    }

    public shoot(): EnemyBullet[] {
        if (!this.isActive || !this.isAlive() || !this.assembly.canPartFire(this)) return [];
        const phase = this.assembly.getPhase();
        const interval = (this.role === 'front_cannon' ? 0.74 : this.role === 'rear_battery' ? 0.48 : 0.34) / this.difficulty.fireRateMultiplier;
        if (this.shootCooldown < interval) return [];
        this.shootCooldown = 0;
        this.phaseShotIndex++;

        const shots: EnemyBullet[] = [];
        const centerX = this.x + this.width / 2;
        const originY = this.y + this.height - 6;
        const spreadCount = this.role === 'front_cannon' ? 2 : this.role === 'rear_battery' ? 4 : 7;
        const spread = this.role === 'front_cannon' ? 0.12 : this.role === 'rear_battery' ? 0.16 : 0.19;
        const midpoint = (spreadCount - 1) / 2;
        for (let index = 0; index < spreadCount; index++) {
            const angle = (index - midpoint) * spread;
            const speed = this.role === 'front_cannon' ? 4.6 : this.role === 'rear_battery' ? 5 : 5.35;
            const damage = this.role === 'front_cannon' ? 14 : this.role === 'rear_battery' ? 15 : 13;
            shots.push(new EnemyBullet(centerX, originY, 9, 9, speed, damage, Math.sin(angle), Math.cos(angle), this.partColor, this.role === 'core' ? 'plasma' : 'heavy'));
        }
        // Rear batteries introduce a small, slow homing missile to force movement rather than raw damage racing.
        if (this.role === 'rear_battery' && this.phaseShotIndex % 3 === 0) {
            shots.push(new EnemyBullet(centerX, originY, 8, 14, 2.2, 11, 0, 1, '#ffcf5c', 'archon_missile'));
        }
        return shots;
    }

    public takeDamage(amount: number): void {
        if (!this.isActive || !this.assembly.isPartEnabled(this)) return;
        super.takeDamage(amount);
        if (!this.isAlive() && !this.destructionReported) {
            this.destructionReported = true;
            this.assembly.markPartDestroyed(this);
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;
        const phase = this.assembly.getPhase();
        const enabled = this.assembly.isPartEnabled(this);
        const pulse = Math.sin(performance.now() * 0.004 + this.x) * 0.5 + 0.5;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.globalAlpha = enabled ? 1 : 0.44;
        ctx.shadowColor = enabled ? this.partColor : '#4a6b82';
        ctx.shadowBlur = enabled ? 18 + pulse * 12 : 6;
        ctx.fillStyle = this.partColor;
        ctx.strokeStyle = enabled ? '#fff0f5' : '#90a4b4';
        ctx.lineWidth = this.role === 'core' ? 4 : 2;

        ctx.beginPath();
        if (this.role === 'core') {
            // A complete central hull: dorsal spine, armoured belly and engine bridge.
            ctx.moveTo(-this.width * 0.5, this.height * 0.12);
            ctx.lineTo(-this.width * 0.32, -this.height * 0.46);
            ctx.lineTo(this.width * 0.32, -this.height * 0.46);
            ctx.lineTo(this.width * 0.5, this.height * 0.12);
            ctx.lineTo(this.width * 0.36, this.height * 0.48);
            ctx.lineTo(-this.width * 0.36, this.height * 0.48);
        } else if (this.role === 'front_cannon') {
            ctx.moveTo(-this.width * 0.42, this.height * 0.38);
            ctx.lineTo(-this.width * 0.2, -this.height * 0.5);
            ctx.lineTo(this.width * 0.2, -this.height * 0.5);
            ctx.lineTo(this.width * 0.42, this.height * 0.38);
            ctx.lineTo(0, this.height * 0.5);
        } else {
            ctx.moveTo(-this.width * 0.5, this.height * 0.18);
            ctx.lineTo(-this.width * 0.28, -this.height * 0.42);
            ctx.lineTo(this.width * 0.5, -this.height * 0.12);
            ctx.lineTo(this.width * 0.3, this.height * 0.48);
            ctx.lineTo(-this.width * 0.34, this.height * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (this.role === 'core') {
            ctx.fillStyle = '#21122f';
            ctx.fillRect(-this.width * 0.24, -this.height * 0.28, this.width * 0.48, this.height * 0.13);
            ctx.fillStyle = '#f6b0c7';
            ctx.fillRect(-this.width * 0.18, -this.height * 0.22, this.width * 0.36, this.height * 0.035);
            ctx.strokeStyle = '#7c2b55';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.64, this.height * 0.18);
            ctx.lineTo(this.width * 0.64, this.height * 0.18);
            ctx.stroke();
        } else if (this.role === 'front_cannon') {
            ctx.fillStyle = '#1d1027';
            ctx.fillRect(-this.width * 0.09, -this.height * 0.68, this.width * 0.18, this.height * 0.7);
            ctx.fillStyle = '#fff0bd';
            ctx.fillRect(-this.width * 0.04, -this.height * 0.64, this.width * 0.08, this.height * 0.42);
        } else {
            ctx.fillStyle = '#251432';
            ctx.fillRect(-this.width * 0.22, -this.height * 0.14, this.width * 0.44, this.height * 0.22);
            ctx.fillStyle = '#ffcf5c';
            ctx.fillRect(-this.width * 0.16, -this.height * 0.08, this.width * 0.32, this.height * 0.09);
        }

        ctx.fillStyle = '#160b22';
        ctx.strokeStyle = enabled ? '#fff3a6' : '#6f8492';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(this.width, this.height) * 0.14 + phase * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const barWidth = Math.min(this.width, 190);
        const ratio = Math.max(0, this.health / Math.max(1, this.maxHealth));
        const shieldRatio = Math.max(0, this.shield / Math.max(1, this.maxShield));
        ctx.fillStyle = 'rgba(3, 10, 20, 0.86)';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 26, barWidth, 18);
        ctx.fillStyle = enabled ? '#ff4d6d' : '#526874';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 26, barWidth * ratio, 5);
        ctx.fillStyle = enabled ? '#68d9ff' : '#526874';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 19, barWidth * shieldRatio, 4);
        ctx.fillStyle = '#fff1f5';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enabled ? this.partLabel : `${this.partLabel} // STANDBY`, this.x + this.width / 2, this.y - 31);
    }
}
