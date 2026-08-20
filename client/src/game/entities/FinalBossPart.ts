import { Boss } from './Boss';
import { EnemyBullet } from './EnemyBullet';
import { DifficultyProfile } from '../core/DifficultySystem';

export type FinalBossPartRole = 'core' | 'wing' | 'cannon' | 'reactor';

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

export class FinalBossAssembly {
    private readonly parts: FinalBossPart[] = [];
    private readonly destroyedPartIds = new Set<string>();
    private destroyedOuterSystems = 0;
    private reactorExposed = false;
    private meltdownActive = false;
    private meltdownRemaining = 0;
    private meltdownComplete = false;

    public constructor(private readonly difficulty: DifficultyProfile) {}

    public createParts(): FinalBossPart[] {
        if (this.parts.length) return this.parts;
        // All hit zones overlap as one 900px-wide capital ship centred on the 1200px arena.
        // They remain separate damage targets, but no longer look like unrelated shapes drifting at one side.
        const configs: FinalBossPartConfig[] = [
            { id: 'core', label: 'ARCHON CORE', role: 'core', x: 330, y: 142, width: 540, height: 218, health: 64000, shield: 36000, color: '#d83b5b' },
            { id: 'left-wing', label: 'PORT WING', role: 'wing', x: 148, y: 210, width: 232, height: 150, health: 26000, shield: 12000, color: '#a52349' },
            { id: 'right-wing', label: 'STARBOARD WING', role: 'wing', x: 820, y: 210, width: 232, height: 150, health: 26000, shield: 12000, color: '#a52349' },
            { id: 'left-cannon', label: 'PORT CANNON', role: 'cannon', x: 222, y: 126, width: 168, height: 104, health: 16800, shield: 8800, color: '#ff7b39' },
            { id: 'right-cannon', label: 'STARBOARD CANNON', role: 'cannon', x: 810, y: 126, width: 168, height: 104, health: 16800, shield: 8800, color: '#ff7b39' },
            { id: 'reactor', label: 'VOID REACTOR', role: 'reactor', x: 500, y: 70, width: 200, height: 112, health: 20800, shield: 14400, color: '#b06cff' }
        ];
        configs.forEach((config) => this.parts.push(new FinalBossPart(config, this, this.difficulty)));
        return this.parts;
    }

    public update(deltaTime: number): void {
        if (!this.meltdownActive || this.meltdownComplete) return;
        this.meltdownRemaining = Math.max(0, this.meltdownRemaining - deltaTime);
        if (this.meltdownRemaining <= 0) {
            this.meltdownComplete = true;
            this.meltdownActive = false;
        }
    }

    public markPartDestroyed(part: FinalBossPart): void {
        if (this.destroyedPartIds.has(part.partId)) return;
        this.destroyedPartIds.add(part.partId);
        if (part.role === 'reactor') {
            this.startMeltdown();
            return;
        }
        this.destroyedOuterSystems++;
        if (this.destroyedOuterSystems >= 3) {
            this.reactorExposed = true;
        }
    }

    private startMeltdown(): void {
        if (this.meltdownActive || this.meltdownComplete) return;
        this.meltdownActive = true;
        this.meltdownRemaining = 18;
    }

    public getPhase(): number {
        if (this.meltdownActive) return 4;
        if (this.reactorExposed) return 3;
        return Math.min(2, this.destroyedOuterSystems);
    }

    public getDestroyedParts(): number {
        return this.destroyedPartIds.size;
    }

    public getDestroyedOuterSystems(): number {
        return this.destroyedOuterSystems;
    }

    public getTotalParts(): number {
        return this.parts.length;
    }

    public isReactorExposed(): boolean {
        return this.reactorExposed;
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
        if (this.meltdownActive) return `MELTDOWN // SURVIVE ${this.meltdownRemaining.toFixed(1)}s`;
        if (this.meltdownComplete) return 'ARCHON SUPREME // DETONATED';
        if (this.reactorExposed) return 'VOID REACTOR EXPOSED // DESTROY IT';
        return `OUTER SYSTEMS // ${this.destroyedOuterSystems}/3 DESTROYED`;
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
        // Boss defaults are intentionally overridden: final-boss hit zones use the
        // authored flagship dimensions from the assembly configuration.
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
        this.shieldRegenRate = (this.role === 'reactor' ? 15 : 8) * difficulty.bossMultiplier;
        this.shootInterval = 0.9;
        this.color = config.color;
        this.isActive = true;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen || !this.isActive || !this.isAlive()) return;
        const phase = this.assembly.getPhase();
        this.shootCooldown += deltaTime;
        this.timeAlive += deltaTime;
        this.updateFormationMotion(phase);

        const reactorLocked = this.role === 'reactor' && !this.assembly.isReactorExposed();
        const regenMultiplier = reactorLocked ? 2.2 : this.role === 'reactor' && phase < 4 ? 1.45 : 1;
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * regenMultiplier * deltaTime);
        }
    }

    private updateFormationMotion(phase: number): void {
        if (this.role === 'core') {
            this.x = this.baseX + Math.sin(this.timeAlive * 0.43) * (8 + phase * 4);
            this.y = this.baseY + Math.cos(this.timeAlive * 0.71) * 8;
        } else if (this.role === 'wing') {
            const direction = this.partId.startsWith('left') ? -1 : 1;
            this.x = this.baseX + direction * Math.sin(this.timeAlive * 0.66) * (12 + phase * 5);
            this.y = this.baseY + Math.cos(this.timeAlive * 0.88) * 11;
        } else if (this.role === 'cannon') {
            const direction = this.partId.startsWith('left') ? -1 : 1;
            this.x = this.baseX + direction * Math.sin(this.timeAlive * 1.15) * (9 + phase * 3);
            this.y = this.baseY + Math.cos(this.timeAlive * 0.94) * 8;
        } else {
            this.x = this.baseX + Math.sin(this.timeAlive * 0.74) * (18 + phase * 5);
            this.y = this.baseY + Math.sin(this.timeAlive * 1.36) * 10;
        }
    }

    public shoot(): EnemyBullet[] {
        if (!this.isActive || !this.isAlive() || this.assembly.isDefeated()) return [];
        const phase = this.assembly.getPhase();
        const intervalMultiplier = this.assembly.isMeltdownActive() ? 0.7 : 1;
        const interval = Math.max(0.16, ((this.role === 'cannon' ? 0.56 : 0.82) / (1 + phase * 0.16)) * intervalMultiplier) / this.difficulty.fireRateMultiplier;
        if (this.shootCooldown < interval) return [];
        this.shootCooldown = 0;
        this.phaseShotIndex++;

        const shots: EnemyBullet[] = [];
        const centerX = this.x + this.width / 2;
        const originY = this.y + this.height - 4;
        const meltdownBoost = this.assembly.isMeltdownActive() ? 1 : 0;
        const spreadCount = this.role === 'cannon' ? 3 + Math.min(phase + meltdownBoost, 3) : 1 + Math.min(phase, 3);
        const spread = this.role === 'cannon' ? 0.14 + phase * 0.022 : 0.09 + phase * 0.016;
        for (let index = 0; index < spreadCount; index++) {
            const offset = spreadCount === 1 ? 0 : (index - (spreadCount - 1) / 2) * spread;
            const speed = (this.role === 'reactor' ? 4.4 : 4.9) + phase * 0.48 + meltdownBoost * 0.35;
            const damage = Math.round((this.role === 'cannon' ? 20 : 15) * (1 + phase * 0.18) * this.difficulty.damageMultiplier);
            shots.push(new EnemyBullet(centerX, originY, 10, 10, speed, damage, Math.sin(offset), Math.cos(offset), this.partColor, this.role === 'reactor' ? 'plasma' : 'heavy'));
        }
        if (phase >= 3 && (this.phaseShotIndex % 2 === 0 || this.role === 'reactor')) {
            [-0.42, 0.42].forEach((angle) => {
                shots.push(new EnemyBullet(centerX, originY, 8, 8, 5.2 + phase * 0.35, Math.round(12 * this.difficulty.damageMultiplier), Math.sin(angle), Math.cos(angle), '#ffcf5c', 'orb'));
            });
        }
        return shots;
    }

    public takeDamage(amount: number): void {
        if (!this.isActive || this.assembly.isMeltdownActive()) return;
        if (this.role === 'reactor' && !this.assembly.isReactorExposed()) return;
        super.takeDamage(amount);
        if (!this.isAlive() && !this.destructionReported) {
            this.destructionReported = true;
            this.assembly.markPartDestroyed(this);
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;
        const phase = this.assembly.getPhase();
        const pulse = Math.sin(performance.now() * 0.004 + this.x) * 0.5 + 0.5;
        const lockedReactor = this.role === 'reactor' && !this.assembly.isReactorExposed();
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.shadowColor = lockedReactor ? '#67d9ff' : this.partColor;
        ctx.shadowBlur = 18 + pulse * 12 + phase * 2;
        ctx.fillStyle = this.partColor;
        ctx.strokeStyle = lockedReactor ? '#d2f8ff' : '#ffe8ed';
        ctx.lineWidth = this.role === 'core' ? 3 : 2;
        // The core paints its structural spine first, then the overlapping wing/cannon zones
        // complete the silhouette as a single connected flagship.
        if (this.role === 'core') {
            ctx.save();
            ctx.fillStyle = '#1a1b38';
            ctx.strokeStyle = '#8d3557';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.7, this.height * 0.16);
            ctx.lineTo(this.width * 0.7, this.height * 0.16);
            ctx.lineTo(this.width * 0.58, this.height * 0.34);
            ctx.lineTo(-this.width * 0.58, this.height * 0.34);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.beginPath();
        if (this.role === 'core') {
            ctx.moveTo(-this.width / 2, -this.height * 0.18);
            ctx.lineTo(-this.width * 0.32, -this.height / 2);
            ctx.lineTo(this.width * 0.32, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height * 0.18);
            ctx.lineTo(this.width * 0.42, this.height / 2);
            ctx.lineTo(-this.width * 0.42, this.height / 2);
        } else if (this.role === 'wing') {
            ctx.moveTo(-this.width / 2, 0);
            ctx.lineTo(-this.width * 0.25, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height * 0.2);
            ctx.lineTo(this.width * 0.35, this.height / 2);
            ctx.lineTo(-this.width * 0.3, this.height * 0.35);
        } else if (this.role === 'cannon') {
            ctx.moveTo(-this.width / 2, -this.height * 0.34);
            ctx.lineTo(this.width * 0.14, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height * 0.22);
            ctx.lineTo(this.width * 0.42, this.height * 0.28);
            ctx.lineTo(this.width * 0.04, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height * 0.24);
        } else {
            ctx.arc(0, 0, Math.min(this.width, this.height) * 0.44, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (this.role === 'core') {
            ctx.fillStyle = '#2b1739';
            ctx.fillRect(-this.width * 0.24, -this.height * 0.33, this.width * 0.48, this.height * 0.11);
            ctx.fillStyle = '#f2a4bd';
            ctx.fillRect(-this.width * 0.18, -this.height * 0.28, this.width * 0.36, this.height * 0.035);
        } else if (this.role === 'cannon') {
            ctx.fillStyle = '#27152b';
            ctx.fillRect(-this.width * 0.1, -this.height * 0.68, this.width * 0.2, this.height * 0.7);
            ctx.fillStyle = '#fff0bd';
            ctx.fillRect(-this.width * 0.045, -this.height * 0.62, this.width * 0.09, this.height * 0.38);
        }
        ctx.fillStyle = '#1b1027';
        ctx.strokeStyle = lockedReactor ? '#67d9ff' : '#fff3a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(this.width, this.height) * 0.16 + phase * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const barWidth = Math.min(this.width, 190);
        const ratio = Math.max(0, this.health / Math.max(1, this.maxHealth));
        const shieldRatio = Math.max(0, this.shield / Math.max(1, this.maxShield));
        ctx.fillStyle = 'rgba(3, 10, 20, 0.86)';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 26, barWidth, 18);
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 26, barWidth * ratio, 5);
        ctx.fillStyle = '#68d9ff';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 19, barWidth * shieldRatio, 4);
        ctx.fillStyle = '#fff1f5';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        const label = lockedReactor ? 'VOID REACTOR // LOCKED' : this.assembly.isMeltdownActive() ? `${this.partLabel} // MELTDOWN` : this.partLabel;
        ctx.fillText(label, this.x + this.width / 2, this.y - 31);
    }
}
