import { Entity } from '../core/Entity';

export class Enemy extends Entity {
    public speed: number;
    public health: number;
    public maxHealth: number;
    public color: string = '#FF3333';
    public shootCooldown: number = 1.5;
    public lastShotTime: number = 0;
    public spawnX: number;
    public timeAlive: number = 0;

    constructor(x: number, y: number, width: number, height: number, speed: number, health: number) {
        super(x, y, width, height);
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
    }

    public update(deltaTime: number): void {
        this.timeAlive += deltaTime;
        
        // Move downwards with wave pattern (sine wave movement)
        this.y += this.speed * deltaTime * 60;
        this.x = this.spawnX + Math.sin(this.timeAlive * 2) * 40;

        // Deactivate if off-screen
        if (this.y > 900) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;

        // Draw enemy ship (inverted triangle pointing down)
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.moveTo(x, y);                    // Top left
        ctx.lineTo(x + w, y);                // Top right
        ctx.lineTo(x + w / 2, y + h);        // Bottom point
        ctx.closePath();
        ctx.fill();

        // Draw health indicator (small bar)
        const healthPercent = this.health / this.maxHealth;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y - 5, w, 2);
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(x, y - 5, w * healthPercent, 2);
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
