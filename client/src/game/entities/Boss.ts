import { Entity } from '../core/Entity';
import { DifficultyProfile } from '../core/DifficultySystem';
import { EnemyBullet } from './EnemyBullet';

export type BossCombatProfile = 'duelist' | 'siege' | 'controller';

const BOSS_PROFILES: BossCombatProfile[] = ['duelist', 'siege', 'controller'];

export class Boss extends Entity {
    public health: number;
    public maxHealth: number;
    public shield: number;
    public maxShield: number;
    public shieldRegenRate: number = 5;
    public shootCooldown: number = 0;
    public shootInterval: number = 1.05;
    public readonly isFinalBoss: boolean;
    public movementTime: number = 0;
    public vx: number = 0;
    public color: string = '#FF3333';
    private knockbackX: number = 0;
    private knockbackY: number = 0;
    private slowTimer: number = 0;
    private movementScale: number = 1;
    public level: number;
    public rewardMultiplier = 1;
    private difficultyApplied = false;
    private shotPattern: number = 0;
    private readonly combatProfile: BossCombatProfile;
    private combatPhase = 0;

    constructor(x: number, y: number, level: number) {
        super(x, y, 80, 80);
        this.level = level;
        this.isFinalBoss = level === 101;
        this.combatProfile = BOSS_PROFILES[Math.max(0, Math.floor((Math.max(3, level) - 3) / 3)) % BOSS_PROFILES.length];

        this.maxHealth = (this.isFinalBoss ? 24000 : 70 + (level * 35)) * 4;
        this.health = this.maxHealth;
        this.maxShield = (this.isFinalBoss ? 14000 : 100 + (level * 20)) * 4;
        this.shield = this.maxShield;
        this.shieldRegenRate = this.isFinalBoss ? 18 : 5;
        this.shootInterval = this.isFinalBoss ? 0.34 : 1.05;
    }

    public getCombatProfile(): BossCombatProfile {
        return this.combatProfile;
    }

    public getCombatPhase(): number {
        return this.combatPhase;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.slowTimer = Math.max(0, this.slowTimer - deltaTime);
        if (this.slowTimer <= 0) this.movementScale = 1;

        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * deltaTime);
        }

        this.movementTime += deltaTime;
        if (!this.isFinalBoss) this.updateCombatPhase();
        this.updateMovement(deltaTime);

        this.shootCooldown += deltaTime;
    }

    private updateCombatPhase(): void {
        const hullRatio = this.health / Math.max(1, this.maxHealth);
        const nextPhase = hullRatio <= 0.35 ? 2 : hullRatio <= 0.70 ? 1 : 0;
        this.combatPhase = Math.max(this.combatPhase, nextPhase);
    }

    private updateMovement(deltaTime: number): void {
        const movementSpeed = (this.isFinalBoss ? 125 : 60) * this.movementScale;
        if (this.isFinalBoss) {
            this.vx = Math.sin(this.movementTime * 1.35) * movementSpeed;
            this.y = 150 + Math.sin(this.movementTime * 0.78) * 70;
            this.x += this.vx * deltaTime;
        } else {
            const phaseBoost = this.combatPhase * 0.14;
            let targetX = 400;
            let targetY = 118;
            if (this.combatProfile === 'duelist') {
                targetX = 400 + Math.sin(this.movementTime * (1.12 + phaseBoost)) * (215 + this.combatPhase * 20)
                    + Math.sin(this.movementTime * 2.6) * 42;
                targetY = 112 + Math.cos(this.movementTime * 1.4) * (24 + this.combatPhase * 6);
            } else if (this.combatProfile === 'siege') {
                targetX = 400 + Math.sin(this.movementTime * (0.38 + phaseBoost * 0.4)) * 260;
                targetY = 106 + Math.cos(this.movementTime * 0.52) * 18;
            } else {
                targetX = 400 + Math.sin(this.movementTime * (0.78 + phaseBoost)) * 205
                    + Math.sin(this.movementTime * 1.68) * 92;
                targetY = 126 + Math.cos(this.movementTime * 0.66) * (46 + this.combatPhase * 9);
            }
            const steering = Math.min(1, deltaTime * (this.combatProfile === 'duelist' ? 4.8 : 2.8));
            this.x += (targetX - this.x) * steering;
            this.y += (targetY - this.y) * steering;
        }

        this.x += this.knockbackX * deltaTime * 60;
        this.y += this.knockbackY * deltaTime * 60;
        const knockbackDecay = Math.pow(0.12, deltaTime);
        this.knockbackX *= knockbackDecay;
        this.knockbackY *= knockbackDecay;
        this.x = Math.max(50, Math.min(750, this.x));
        this.y = Math.max(64, Math.min(290, this.y));
    }

    public shoot(): EnemyBullet[] {
        if (this.shootCooldown < this.getEffectiveShootInterval()) return [];
        this.shootCooldown = 0;
        const bullets: EnemyBullet[] = [];
        const angles = this.getShotAngles();
        const speed = this.isFinalBoss ? 4.7 : this.getProjectileSpeed();
        const damage = this.isFinalBoss ? 22 : this.getProjectileDamage();
        const color = this.isFinalBoss ? '#FFB000' : this.getProfileColor();
        for (const angle of angles) {
            bullets.push(new EnemyBullet(
                this.x,
                this.y + this.height / 2,
                8,
                8,
                speed,
                damage,
                Math.sin(angle),
                Math.cos(angle),
                color
            ));
        }
        this.shotPattern++;
        return bullets;
    }

    private getEffectiveShootInterval(): number {
        if (this.isFinalBoss) return this.shootInterval;
        const phaseMultiplier = this.combatProfile === 'duelist' ? 0.17 : this.combatProfile === 'siege' ? 0.10 : 0.13;
        return Math.max(0.28, this.shootInterval * (1 - this.combatPhase * phaseMultiplier));
    }

    private getShotAngles(): number[] {
        if (this.isFinalBoss) {
            const finalPatterns = [
                [0],
                [-0.34, -0.17, 0, 0.17, 0.34],
                [-0.52, -0.26, 0, 0.26, 0.52],
                [-0.70, -0.35, 0, 0.35, 0.70],
                [-0.88, -0.59, -0.30, 0, 0.30, 0.59, 0.88]
            ];
            return finalPatterns[this.shotPattern % finalPatterns.length];
        }
        if (this.combatProfile === 'duelist') {
            const dart = this.shotPattern % 3 === 0 ? 0 : this.shotPattern % 3 === 1 ? -0.18 : 0.18;
            return this.combatPhase === 2 ? [dart - 0.10, dart, dart + 0.10] : [dart];
        }
        if (this.combatProfile === 'siege') {
            const count = 3 + this.combatPhase * 2;
            const arc = 0.30 + this.combatPhase * 0.15;
            return Array.from({ length: count }, (_, index) => count === 1 ? 0 : ((index / (count - 1)) - 0.5) * arc * 2);
        }
        const rotation = ((this.shotPattern % 5) - 2) * 0.11;
        const count = 3 + this.combatPhase;
        return Array.from({ length: count }, (_, index) => rotation + (index - (count - 1) / 2) * 0.18);
    }

    private getProjectileSpeed(): number {
        const base = this.combatProfile === 'duelist' ? 4.4 : this.combatProfile === 'siege' ? 3.35 : 3.85;
        return base + this.combatPhase * 0.32;
    }

    private getProjectileDamage(): number {
        const base = this.combatProfile === 'duelist' ? 13 : this.combatProfile === 'siege' ? 16 : 14;
        return Math.round(base * (1 + this.combatPhase * 0.18));
    }

    private getProfileColor(): string {
        return this.combatProfile === 'duelist' ? '#ff6b9b' : this.combatProfile === 'siege' ? '#ff9f43' : '#a66bff';
    }

    public applyDifficulty(profile: DifficultyProfile): void {
        if (this.difficultyApplied) return;
        this.difficultyApplied = true;
        this.maxHealth = Math.max(1, Math.round(this.maxHealth * profile.bossMultiplier));
        this.health = this.maxHealth;
        this.maxShield = Math.max(0, Math.round(this.maxShield * profile.shieldMultiplier * profile.bossMultiplier));
        this.shield = this.maxShield;
        this.shieldRegenRate *= profile.fireRateMultiplier;
        this.shootInterval = Math.max(0.12, this.shootInterval / profile.fireRateMultiplier);
        this.rewardMultiplier = profile.rewardMultiplier;
    }

    public applySlow(multiplier: number, duration: number): void {
        this.movementScale = Math.min(this.movementScale, Math.max(0.72, multiplier));
        this.slowTimer = Math.max(this.slowTimer, duration * 0.55);
    }

    public applyKnockback(forceX: number, forceY: number, resistance = 0.18): void {
        this.knockbackX = Math.max(-2.5, Math.min(2.5, this.knockbackX + forceX * 0.04 * resistance));
        this.knockbackY = Math.max(-1.5, Math.min(1.5, this.knockbackY + forceY * 0.04 * resistance));
    }

    public takeDamage(damage: number): void {
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, damage);
            this.shield -= shieldDamage;
            const remainingDamage = damage - shieldDamage;
            if (remainingDamage > 0) this.health -= remainingDamage;
        } else {
            this.health -= damage;
        }
    }

    public isAlive(): boolean {
        return this.health > 0;
    }

    public getReward(): number {
        return Math.floor((5000 + this.level * 1000) * 0.75 * this.rewardMultiplier);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        this.draw(ctx);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const accent = this.isFinalBoss ? this.color : this.getProfileColor();
        const hull = ctx.createLinearGradient(this.x - 42, this.y - 42, this.x + 42, this.y + 42);
        hull.addColorStop(0, '#fff0f0');
        hull.addColorStop(0.18, accent);
        hull.addColorStop(0.62, '#7f182c');
        hull.addColorStop(1, '#1b1027');
        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = 24;
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#ffd0d8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 48);
        ctx.lineTo(this.x + 28, this.y - 19);
        ctx.lineTo(this.x + 48, this.y - 5);
        ctx.lineTo(this.x + 30, this.y + 14);
        ctx.lineTo(this.x + 20, this.y + 48);
        ctx.lineTo(this.x, this.y + 28);
        ctx.lineTo(this.x - 20, this.y + 48);
        ctx.lineTo(this.x - 30, this.y + 14);
        ctx.lineTo(this.x - 48, this.y - 5);
        ctx.lineTo(this.x - 28, this.y - 19);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 220, 230, 0.72)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(this.x - 32, this.y - 8);
        ctx.lineTo(this.x + 32, this.y - 8);
        ctx.moveTo(this.x - 24, this.y + 18);
        ctx.lineTo(this.x + 24, this.y + 18);
        ctx.stroke();

        const core = ctx.createRadialGradient(this.x - 4, this.y - 6, 1, this.x, this.y, 16);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.25, '#ff9bb5');
        core.addColorStop(1, '#7b173e');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 2, 14, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffe5ed';
        ctx.stroke();
        ctx.restore();

        const barWidth = 92;
        const drawBar = (y: number, value: number, max: number, color: string, label: string): void => {
            const left = this.x - barWidth / 2;
            ctx.fillStyle = 'rgba(4, 8, 18, 0.9)';
            ctx.fillRect(left - 2, y - 2, barWidth + 4, 11);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(left, y, barWidth, 7);
            ctx.fillStyle = color;
            ctx.fillRect(left, y, barWidth * Math.max(0, Math.min(value / max, 1)), 7);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, this.x, y - 4);
        };
        drawBar(this.y - 62, this.shield, this.maxShield, '#42e9ff', 'SHIELD');
        drawBar(this.y + 54, this.health, this.maxHealth, '#ff4d6d', 'HULL');
        ctx.fillStyle = accent;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const label = this.isFinalBoss ? 'ARCHON SUPREME' : `${this.combatProfile.toUpperCase()} // PHASE ${this.combatPhase + 1}`;
        ctx.fillText(label, this.x, this.y + 76);
    }
}
