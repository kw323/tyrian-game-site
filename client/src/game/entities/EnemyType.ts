import { Entity } from '../core/Entity';

export enum EnemyType {
    STRAIGHT = 'straight',      // Shoots straight down
    HOMING = 'homing',          // Shoots towards player
    ZIGZAG = 'zigzag',          // Zigzag movement, shoots straight
    SWEEPER = 'sweeper'         // Left-right movement, shoots straight
}

export class EnemyAdvanced extends Entity {
    public speed: number;
    public health: number;
    public maxHealth: number;
    public color: string;
    public shootCooldown: number;
    public lastShotTime: number = 0;
    public spawnX: number;
    public timeAlive: number = 0;
    public type: EnemyType;

    constructor(x: number, y: number, width: number, height: number, speed: number, health: number, type: EnemyType) {
        super(x, y, width, height);
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
        this.type = type;
        this.shootCooldown = type === EnemyType.HOMING ? 1.2 : 1.5;

        // Color based on type
        if (type === EnemyType.HOMING) {
            this.color = '#FF6666'; // Brighter red for homing
        } else if (type === EnemyType.ZIGZAG) {
            this.color = '#FF9900'; // Orange for zigzag
        } else if (type === EnemyType.SWEEPER) {
            this.color = '#FF3333'; // Dark red for sweeper
        } else {
            this.color = '#FF3333'; // Standard red
        }
    }

    public update(deltaTime: number): void {
        this.timeAlive += deltaTime;
        
        // Move downwards
        this.y += this.speed * deltaTime * 60;

        // Apply movement pattern
        if (this.type === EnemyType.ZIGZAG) {
            // Zigzag pattern
            this.x = this.spawnX + Math.sin(this.timeAlive * 3) * 60;
        } else if (this.type === EnemyType.SWEEPER) {
            // Left-right sweeping pattern
            const sweepCycle = Math.floor(this.timeAlive / 2) % 2;
            if (sweepCycle === 0) {
                // Moving right
                this.x = this.spawnX + (this.timeAlive % 2) * 80;
            } else {
                // Moving left
                this.x = this.spawnX + 80 - ((this.timeAlive % 2) * 80);
            }
        } else if (this.type === EnemyType.HOMING) {
            // Slight wave pattern for homing enemies
            this.x = this.spawnX + Math.sin(this.timeAlive * 1.5) * 30;
        }

        // Deactivate if off-screen
        if (this.y > 900) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        // Draw enemy ship (inverted triangle pointing down)
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

        // Draw type indicator
        if (this.type === EnemyType.HOMING) {
            ctx.fillStyle = '#FF6666';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
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
        
        if (this.type === EnemyType.HOMING) {
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
        } else {
            // Shoot straight down
            return {
                x: bulletX,
                y: bulletY,
                dirX: 0,
                dirY: 1
            };
        }
    }
}
