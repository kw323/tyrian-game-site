import { Entity } from '../core/Entity';
import { createEnemyVisualProfile, drawEnemyShip, EnemyVisualProfile } from '../core/EnemyVisualSystem';

export class Enemy extends Entity {
    public speed: number;
    public health: number;
    public maxHealth: number;
    public points: number = 100;
    public rewardGranted: boolean = false;
    public color: string = '#FF3333';
    public shootCooldown: number = 2.8;
    public lastShotTime: number = 0;
    public spawnX: number;
    public timeAlive: number = 0;
    private readonly baseSpeed: number;
    private slowTimer: number = 0;
    private slowMultiplier: number = 1;
    private knockbackX: number = 0;
    private knockbackY: number = 0;
    private visualProfile: EnemyVisualProfile;

    constructor(x: number, y: number, width: number, height: number, speed: number, health: number) {
        super(x, y, width, height);
        this.speed = speed;
        this.baseSpeed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
        this.visualProfile = createEnemyVisualProfile('raiders', 'scout');
        this.color = this.visualProfile.hull;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.timeAlive += deltaTime;
        this.slowTimer = Math.max(0, this.slowTimer - deltaTime);
        this.speed = this.slowTimer > 0 ? this.baseSpeed * this.slowMultiplier : this.baseSpeed;
        
        // Move downwards with wave pattern (sine wave movement)
        this.y += this.speed * deltaTime * 60;
        this.x = this.spawnX + Math.sin(this.timeAlive * 2) * 40;
        this.x += this.knockbackX * deltaTime * 60;
        this.y += this.knockbackY * deltaTime * 60;
        const knockbackDecay = Math.pow(0.08, deltaTime);
        this.knockbackX *= knockbackDecay;
        this.knockbackY *= knockbackDecay;

        // Deactivate if off-screen
        if (this.y > 900) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        drawEnemyShip(ctx, w, h, this.visualProfile, this.timeAlive);
        ctx.restore();

        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = 'rgba(4, 8, 18, 0.9)';
        ctx.fillRect(x - 1, y - 7, w + 2, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffd166' : '#ff4d6d';
        ctx.fillRect(x, y - 6, w * healthPercent, 2);
    }

    public applySlow(multiplier: number, duration: number): void {
        this.slowMultiplier = Math.min(this.slowMultiplier, Math.max(0.35, multiplier));
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    public applyKnockback(forceX: number, forceY: number, resistance = 1): void {
        this.knockbackX = Math.max(-5, Math.min(5, this.knockbackX + forceX * 0.06 * resistance));
        this.knockbackY = Math.max(-5, Math.min(5, this.knockbackY + forceY * 0.06 * resistance));
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.isActive = false;
        }
    }

    public canShoot(currentTime: number): boolean {
        return (currentTime - this.lastShotTime) >= this.shootCooldown;
    }

    public shoot(currentTime: number, playerX: number, playerY: number): { x: number; y: number; dirX: number; dirY: number } {
        this.lastShotTime = currentTime;
        const bulletX = this.x + this.width / 2;
        const bulletY = this.y + this.height;
        
        // Calculate direction towards player
        const dx = playerX - bulletX;
        const dy = playerY - bulletY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
            x: bulletX,
            y: bulletY,
            dirX: dx / distance,
            dirY: dy / distance
        };
    }
}
