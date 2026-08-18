import { Entity } from '../core/Entity';
import { DifficultyProfile } from '../core/DifficultySystem';
import { EnemyBullet } from './EnemyBullet';

export class Boss extends Entity {
    public health: number;
    public maxHealth: number;
    public shield: number;
    public maxShield: number;
    public shieldRegenRate: number = 5; // Shield regenerates per second
    public shootCooldown: number = 0;
    public shootInterval: number = 1.05; // Fewer salvos with a clear dodge window
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

    constructor(x: number, y: number, level: number) {
        super(x, y, 80, 80);
        this.level = level;
        this.isFinalBoss = level === 101;

        // Stage 101 is the campaign's super-boss: a long, shielded endurance fight.
        this.maxHealth = (this.isFinalBoss ? 24000 : 70 + (level * 35)) * 4;
        this.health = this.maxHealth;

        // The final shield regenerates quickly until the player creates a safe damage window.
        this.maxShield = (this.isFinalBoss ? 14000 : 100 + (level * 20)) * 4;
        this.shield = this.maxShield;
        this.shieldRegenRate = this.isFinalBoss ? 18 : 5;
        this.shootInterval = this.isFinalBoss ? 0.34 : 1.05;
        this.vx = 0;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.slowTimer = Math.max(0, this.slowTimer - deltaTime);
        if (this.slowTimer <= 0) this.movementScale = 1;

        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + (this.shieldRegenRate * deltaTime));
        }

        // Movement pattern - figure-8 or circular
        this.movementTime += deltaTime;
        const movementSpeed = (this.isFinalBoss ? 125 : 60) * this.movementScale;

        if (this.isFinalBoss) {
            // The Archon sweeps, reverses, and drifts vertically instead of sitting on one rail.
            this.vx = Math.sin(this.movementTime * 1.35) * movementSpeed;
            this.y = 150 + Math.sin(this.movementTime * 0.78) * 70;
        } else if (this.movementTime < 4) {
            this.vx = -movementSpeed;
        } else if (this.movementTime < 8) {
            this.vx = movementSpeed;
        } else {
            this.movementTime = 0;
        }

        // Keep boss in bounds
        this.x += this.vx * deltaTime;
        this.x += this.knockbackX * deltaTime * 60;
        this.y += this.knockbackY * deltaTime * 60;
        const knockbackDecay = Math.pow(0.12, deltaTime);
        this.knockbackX *= knockbackDecay;
        this.knockbackY *= knockbackDecay;
        if (this.x < 50) this.x = 50;
        if (this.x > 750) this.x = 750;

        // Update shoot cooldown
        this.shootCooldown += deltaTime;
    }

    public shoot(): EnemyBullet[] {
        const bullets: EnemyBullet[] = [];
        
        if (this.shootCooldown >= this.shootInterval) {
            this.shootCooldown = 0;
            
                const finalPatterns = [
                [0],
                [-0.34, -0.17, 0, 0.17, 0.34],
                [-0.52, -0.26, 0, 0.26, 0.52],
                [-0.70, -0.35, 0, 0.35, 0.70],
                [-0.88, -0.59, -0.30, 0, 0.30, 0.59, 0.88]
            ];
            const angles = this.isFinalBoss
                ? finalPatterns[this.shotPattern % finalPatterns.length]
                : (this.shotPattern % 2 === 0 ? [0] : [-0.16, 0.16]);
            this.shotPattern++;
            for (const angle of angles) {
                const dirX = Math.sin(angle);
                const dirY = Math.cos(angle);
                const bullet = new EnemyBullet(
                    this.x,
                    this.y + this.height / 2,
                    8,
                    8,
                    this.isFinalBoss ? 4.7 : 3.2,
                    this.isFinalBoss ? 22 : 12,
                    dirX,
                    dirY,
                    this.isFinalBoss ? '#FFB000' : '#FF6666'
                );
                bullets.push(bullet);
            }
        }
        
        return bullets;
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
            if (remainingDamage > 0) {
                this.health -= remainingDamage;
            }
        } else {
            this.health -= damage;
        }
    }

    public isAlive(): boolean {
        return this.health > 0;
    }

    public getReward(): number {
        // Boss gives 5000 + 1000 per level
        return Math.floor((5000 + (this.level * 1000)) * 0.75 * this.rewardMultiplier);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        this.draw(ctx);
    }

    // Style: imposing retro-futurist capital ship with readable armor layers and an animated reactor core.
    public draw(ctx: CanvasRenderingContext2D): void {
        const hull = ctx.createLinearGradient(this.x - 42, this.y - 42, this.x + 42, this.y + 42);
        hull.addColorStop(0, '#fff0f0');
        hull.addColorStop(0.18, this.color);
        hull.addColorStop(0.62, '#7f182c');
        hull.addColorStop(1, '#1b1027');
        ctx.save();
        ctx.shadowColor = this.color;
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

        ctx.strokeStyle = 'rgba(255, 90, 150, 0.75)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 57, 22, Math.sin(performance.now() / 800) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        const barWidth = 92;
        const barHeight = 7;
        const drawBar = (y: number, value: number, max: number, color: string, label: string): void => {
            const left = this.x - barWidth / 2;
            ctx.fillStyle = 'rgba(4, 8, 18, 0.9)';
            ctx.fillRect(left - 2, y - 2, barWidth + 4, barHeight + 4);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(left, y, barWidth, barHeight);
            ctx.fillStyle = color;
            ctx.fillRect(left, y, barWidth * Math.max(0, Math.min(value / max, 1)), barHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, this.x, y - 4);
        };
        drawBar(this.y - 62, this.shield, this.maxShield, '#42e9ff', 'SHIELD');
        drawBar(this.y + 54, this.health, this.maxHealth, '#ff4d6d', 'HULL');
        ctx.fillStyle = '#ff6d87';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y + 76);
    }
}
