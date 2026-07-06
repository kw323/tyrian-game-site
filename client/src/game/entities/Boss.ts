import { Entity } from '../core/Entity';
import { EnemyBullet } from './EnemyBullet';

export class Boss extends Entity {
    public health: number;
    public maxHealth: number;
    public shield: number;
    public maxShield: number;
    public shieldRegenRate: number = 5; // Shield regenerates per second
    public shootCooldown: number = 0;
    public shootInterval: number = 0.3; // Shoot every 0.3 seconds
    public movementTime: number = 0;
    public vx: number = 0;
    public color: string = '#FF3333';
    public level: number;

    constructor(x: number, y: number, level: number) {
        super(x, y, 80, 80);
        this.level = level;
        
        // Boss health scales with level
        this.maxHealth = 50 + (level * 30);
        this.health = this.maxHealth;
        
        // Boss shield
        this.maxShield = 100 + (level * 20);
        this.shield = this.maxShield;
        
        this.vx = 0;
    }

    public update(deltaTime: number): void {
        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + (this.shieldRegenRate * deltaTime));
        }

        // Movement pattern - figure-8 or circular
        this.movementTime += deltaTime;
        const movementSpeed = 60;
        
        if (this.movementTime < 4) {
            // Move left
            this.vx = -movementSpeed;
        } else if (this.movementTime < 8) {
            // Move right
            this.vx = movementSpeed;
        } else {
            this.movementTime = 0;
        }

        // Keep boss in bounds
        this.x += this.vx * deltaTime;
        if (this.x < 50) this.x = 50;
        if (this.x > 750) this.x = 750;

        // Update shoot cooldown
        this.shootCooldown += deltaTime;
    }

    public shoot(): EnemyBullet[] {
        const bullets: EnemyBullet[] = [];
        
        if (this.shootCooldown >= this.shootInterval) {
            this.shootCooldown = 0;
            
            // Boss shoots in a spread pattern
            const angles = [-0.3, -0.15, 0, 0.15, 0.3];
            for (const angle of angles) {
                const dirX = Math.sin(angle);
                const dirY = Math.cos(angle);
                const bullet = new EnemyBullet(
                    this.x,
                    this.y + this.height / 2,
                    8,
                    8,
                    150,
                    15,
                    dirX,
                    dirY,
                    '#FF6666'
                );
                bullets.push(bullet);
            }
        }
        
        return bullets;
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
        return 5000 + (this.level * 1000);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        this.draw(ctx);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // Draw boss body (larger diamond shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 40);
        ctx.lineTo(this.x + 40, this.y);
        ctx.lineTo(this.x, this.y + 40);
        ctx.lineTo(this.x - 40, this.y);
        ctx.closePath();
        ctx.fill();

        // Draw boss cockpit
        ctx.fillStyle = '#FF9999';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);

        // Draw shield bar above boss
        const barWidth = 60;
        const barHeight = 8;
        ctx.strokeStyle = '#00CCFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - barWidth / 2, this.y - 55, barWidth, barHeight);
        
        if (this.shield > 0) {
            ctx.fillStyle = '#00CCFF';
            ctx.fillRect(this.x - barWidth / 2, this.y - 55, (barWidth * this.shield) / this.maxShield, barHeight);
        }

        // Draw health bar below boss
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - barWidth / 2, this.y + 50, barWidth, barHeight);
        
        if (this.health > 0) {
            ctx.fillStyle = '#FF3333';
            ctx.fillRect(this.x - barWidth / 2, this.y + 50, (barWidth * this.health) / this.maxHealth, barHeight);
        }

        // Draw "BOSS" label
        ctx.fillStyle = '#FF3333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y + 75);
    }
}
