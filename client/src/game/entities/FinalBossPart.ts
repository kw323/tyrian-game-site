// Style: the final boss is a monumental retro-futurist carrier built from readable layered silhouettes, not a single flat hitbox.

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
    private destroyedParts = 0;
    private phase = 0;

    public constructor(private readonly difficulty: DifficultyProfile) {}

    public createParts(): FinalBossPart[] {
        if (this.parts.length) return this.parts;
        const configs: FinalBossPartConfig[] = [
            { id: 'core', label: 'ARCHON CORE', role: 'core', x: 120, y: 122, width: 560, height: 224, health: 64000, shield: 36000, color: '#d83b5b' },
            { id: 'left-wing', label: 'PORT WING', role: 'wing', x: 42, y: 210, width: 190, height: 142, health: 26000, shield: 12000, color: '#a52349' },
            { id: 'right-wing', label: 'STARBOARD WING', role: 'wing', x: 568, y: 210, width: 190, height: 142, health: 26000, shield: 12000, color: '#a52349' },
            { id: 'left-cannon', label: 'PORT CANNON', role: 'cannon', x: 64, y: 64, width: 176, height: 112, health: 16800, shield: 8800, color: '#ff7b39' },
            { id: 'right-cannon', label: 'STARBOARD CANNON', role: 'cannon', x: 560, y: 64, width: 176, height: 112, health: 16800, shield: 8800, color: '#ff7b39' },
            { id: 'reactor', label: 'VOID REACTOR', role: 'reactor', x: 292, y: 28, width: 216, height: 108, health: 20800, shield: 14400, color: '#b06cff' }
        ];
        configs.forEach((config) => {
            this.parts.push(new FinalBossPart(config, this, this.difficulty));
        });
        return this.parts;
    }

    public markPartDestroyed(): void {
        this.destroyedParts = Math.min(this.parts.length, this.destroyedParts + 1);
        this.phase = Math.min(5, this.destroyedParts);
    }

    public getPhase(): number {
        return this.phase;
    }

    public getDestroyedParts(): number {
        return this.destroyedParts;
    }

    public getTotalParts(): number {
        return this.parts.length;
    }

    public isDefeated(): boolean {
        return this.parts.length > 0 && this.parts.every((part) => !part.isActive || !part.isAlive());
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
    private readonly basePartHealth: number;
    private readonly basePartShield: number;
    private readonly partColor: string;
    private readonly difficulty: DifficultyProfile;
    private phaseShotIndex = 0;
    private timeAlive = 0;

    public constructor(config: FinalBossPartConfig, assembly: FinalBossAssembly, difficulty: DifficultyProfile) {
        super(config.x, config.y, 101);
        this.partId = config.id;
        this.partLabel = config.label;
        this.role = config.role;
        this.assembly = assembly;
        this.difficulty = difficulty;
        this.basePartHealth = config.health;
        this.basePartShield = config.shield;
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
        if (this.isTimeFrozen || !this.isActive) return;
        const phase = this.assembly.getPhase();
        this.shootCooldown += deltaTime;
        const regenMultiplier = this.role === 'reactor' && phase < 4 ? 1.65 : 1;
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * regenMultiplier * deltaTime);
        }
        // The carrier itself holds formation; only its internal systems pulse as phases advance.
        if (this.role === 'reactor') {
            this.y = 28 + Math.sin(this.timeAlive * 1.2) * 7;
        }
        this.timeAlive += deltaTime;
    }

    public shoot(): EnemyBullet[] {
        if (!this.isActive || !this.isAlive()) return [];
        const phase = this.assembly.getPhase();
        const interval = Math.max(0.18, (this.role === 'cannon' ? 0.56 : 0.82) / (1 + phase * 0.16)) / this.difficulty.fireRateMultiplier;
        if (this.shootCooldown < interval) return [];
        this.shootCooldown = 0;
        this.phaseShotIndex++;

        const shots: EnemyBullet[] = [];
        const centerX = this.x + this.width / 2;
        const originY = this.y + this.height - 4;
        const spreadCount = this.role === 'cannon' ? 3 + Math.min(phase, 2) : 1 + Math.min(phase, 3);
        const spread = this.role === 'cannon' ? 0.14 + phase * 0.018 : 0.09 + phase * 0.014;
        for (let i = 0; i < spreadCount; i++) {
            const offset = spreadCount === 1 ? 0 : (i - (spreadCount - 1) / 2) * spread;
            const dirX = Math.sin(offset);
            const dirY = Math.cos(offset);
            const speed = (this.role === 'reactor' ? 4.4 : 4.9) + phase * 0.48;
            const damage = Math.round((this.role === 'cannon' ? 20 : 15) * (1 + phase * 0.18) * this.difficulty.damageMultiplier);
            shots.push(new EnemyBullet(centerX, originY, 10, 10, speed, damage, dirX, dirY, this.partColor, this.role === 'reactor' ? 'plasma' : 'heavy'));
        }

        if (phase >= 3 && (this.phaseShotIndex % 2 === 0 || this.role === 'reactor')) {
            const sideAngles = [-0.42, 0.42];
            sideAngles.forEach((angle) => {
                shots.push(new EnemyBullet(centerX, originY, 8, 8, 5.2 + phase * 0.35, Math.round(12 * this.difficulty.damageMultiplier), Math.sin(angle), Math.cos(angle), '#ffcf5c', 'orb'));
            });
        }
        return shots;
    }

    public takeDamage(amount: number): void {
        if (!this.isActive) return;
        super.takeDamage(amount);
        if (!this.isAlive()) {
            // Collision handling owns the active-flag transition so the parent game loop can register the destroyed part exactly once.
            this.assembly.markPartDestroyed();
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;
        const phase = this.assembly.getPhase();
        const pulse = Math.sin(performance.now() * 0.004 + this.x) * 0.5 + 0.5;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.shadowColor = this.partColor;
        ctx.shadowBlur = 18 + pulse * 12 + phase * 2;
        ctx.fillStyle = this.partColor;
        ctx.strokeStyle = '#ffe8ed';
        ctx.lineWidth = this.role === 'core' ? 3 : 2;
        ctx.beginPath();
        if (this.role === 'core') {
            ctx.moveTo(-this.width / 2, -this.height * 0.22);
            ctx.lineTo(-this.width * 0.35, -this.height / 2);
            ctx.lineTo(this.width * 0.35, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height * 0.22);
            ctx.lineTo(this.width * 0.42, this.height / 2);
            ctx.lineTo(-this.width * 0.42, this.height / 2);
        } else if (this.role === 'wing') {
            ctx.moveTo(-this.width / 2, 0);
            ctx.lineTo(-this.width * 0.25, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height * 0.2);
            ctx.lineTo(this.width * 0.35, this.height / 2);
            ctx.lineTo(-this.width * 0.3, this.height * 0.35);
        } else if (this.role === 'cannon') {
            ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.arc(0, 0, Math.min(this.width, this.height) * 0.44, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1b1027';
        ctx.strokeStyle = '#fff3a6';
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
        ctx.fillText(this.partLabel, this.x + this.width / 2, this.y - 31);
    }

    public getPartBaseHealth(): number {
        return this.basePartHealth;
    }

    public getPartBaseShield(): number {
        return this.basePartShield;
    }
}
