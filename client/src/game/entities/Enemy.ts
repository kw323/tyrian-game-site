import { Entity } from '../core/Entity';

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

    constructor(x: number, y: number, width: number, height: number, speed: number, health: number) {
        super(x, y, width, height);
        this.speed = speed;
        this.baseSpeed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
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

    // Style: compact interceptor silhouette with layered armor and a bright cockpit beacon.
    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const radius = Math.min(w, h) / 2;
        const hull = ctx.createLinearGradient(x, y, x + w, y + h);
        hull.addColorStop(0, '#ffffff');
        hull.addColorStop(0.18, this.color);
        hull.addColorStop(0.7, this.color);
        hull.addColorStop(1, '#11162d');

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = hull;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(centerX, y - 3);
        ctx.lineTo(x + w * 0.82, y + h * 0.38);
        ctx.lineTo(x + w + 2, y + h * 0.72);
        ctx.lineTo(x + w * 0.62, y + h * 0.67);
        ctx.lineTo(centerX, y + h + 3);
        ctx.lineTo(x + w * 0.38, y + h * 0.67);
        ctx.lineTo(x - 2, y + h * 0.72);
        ctx.lineTo(x + w * 0.18, y + h * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(17, 28, 56, 0.88)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 1, radius * 0.36, radius * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d8ffff';
        ctx.stroke();
        ctx.fillStyle = '#f6ffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 2, radius * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.18, y + h * 0.48);
        ctx.lineTo(x + w * 0.82, y + h * 0.48);
        ctx.stroke();
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
