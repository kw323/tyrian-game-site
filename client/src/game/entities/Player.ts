import { Entity } from '../core/Entity';

export class Player extends Entity {
    public speed: number;
    public color: string = '#00FF88';
    public gunCooldown: number = 0.15;
    public lastShotTime: number = 0;
    public weaponType: string = 'straight';
    public weaponLevel: number = 0;
    public weaponFireRate: number = 6;
    public weaponDamage: number = 10;
    public shield: number = 50;
    public maxShield: number = 50;
    public shieldRegenRate: number = 5; // Shield regenerates per second
    public health: number = 3;
    public maxHealth: number = 3;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        super(x, y, width, height);
        this.speed = speed;
    }

    public updateWithInput(deltaTime: number, keys: any, gameWidth: number, gameHeight: number): void {
        if (keys.ArrowUp && this.y > 0) this.y -= this.speed * deltaTime * 60;
        if (keys.ArrowDown && this.y < gameHeight - this.height) this.y += this.speed * deltaTime * 60;
        if (keys.ArrowLeft && this.x > 0) this.x -= this.speed * deltaTime * 60;
        if (keys.ArrowRight && this.x < gameWidth - this.width) this.x += this.speed * deltaTime * 60;

        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.shield + this.shieldRegenRate * deltaTime, this.maxShield);
        }
    }

    public update(deltaTime: number): void {
        // Base update, overridden by updateWithInput
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;

        // Draw spaceship body (pointed at top, wider at bottom)
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);                    // Top point
        ctx.lineTo(x + w, y + h * 0.3);             // Right wing
        ctx.lineTo(x + w * 0.7, y + h);             // Right bottom
        ctx.lineTo(x + w / 2, y + h * 0.8);         // Center bottom
        ctx.lineTo(x + w * 0.3, y + h);             // Left bottom
        ctx.lineTo(x, y + h * 0.3);                 // Left wing
        ctx.closePath();
        ctx.fill();

        // Draw cockpit/window
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00CCDD';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw engine glow at bottom
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.35, y + h);
        ctx.lineTo(x + w * 0.65, y + h);
        ctx.lineTo(x + w / 2, y + h * 1.15);
        ctx.closePath();
        ctx.fill();

        // Draw shield
        if (this.shield > 0) {
            const shieldAlpha = Math.min(this.shield / this.maxShield, 1);
            ctx.strokeStyle = `rgba(0, 200, 255, ${shieldAlpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    public takeDamage(damage: number): boolean {
        if (this.shield > 0) {
            this.shield -= damage;
            if (this.shield < 0) {
                this.shield = 0;
            }
            return false; // Shield absorbed damage
        } else {
            this.health--;
            return this.health <= 0; // Return true if dead
        }
    }

    public canShoot(currentTime: number): boolean {
        return (currentTime - this.lastShotTime) >= this.gunCooldown;
    }

    public shoot(currentTime: number): any[] {
        this.lastShotTime = currentTime;
        const centerX = this.x + this.width / 2;
        const centerY = this.y;
        const bullets = [];

        if (this.weaponType === 'straight') {
            if (this.weaponLevel === 0) {
                // Level 1: Single bullet
                bullets.push({ x: centerX, y: centerY, type: 'straight', angle: 0 });
            } else if (this.weaponLevel === 1) {
                // Level 2: Faster fire rate
                bullets.push({ x: centerX, y: centerY, type: 'straight', angle: 0 });
            } else if (this.weaponLevel === 2) {
                // Level 3: Even faster
                bullets.push({ x: centerX, y: centerY, type: 'straight', angle: 0 });
            } else if (this.weaponLevel === 3) {
                // Level 4: Rapid fire
                bullets.push({ x: centerX, y: centerY, type: 'straight', angle: 0 });
            } else if (this.weaponLevel >= 4) {
                // Level 5: Extreme speed
                bullets.push({ x: centerX, y: centerY, type: 'straight', angle: 0 });
            }
        } else if (this.weaponType === 'spread') {
            if (this.weaponLevel === 0) {
                // Level 1: One center bullet
                bullets.push({ x: centerX, y: centerY, type: 'spread', angle: 0 });
            } else if (this.weaponLevel === 1) {
                // Level 2: Center + alternating sides (with slight angles)
                bullets.push({ x: centerX, y: centerY, type: 'spread', angle: 0 });
                bullets.push({ x: centerX - 20, y: centerY, type: 'spread', angle: -0.3 });
                bullets.push({ x: centerX + 20, y: centerY, type: 'spread', angle: 0.3 });
            } else if (this.weaponLevel === 2) {
                // Level 3: Center + both sides (with angles)
                bullets.push({ x: centerX - 20, y: centerY, type: 'spread', angle: -0.4 });
                bullets.push({ x: centerX, y: centerY, type: 'spread', angle: 0 });
                bullets.push({ x: centerX + 20, y: centerY, type: 'spread', angle: 0.4 });
            } else if (this.weaponLevel === 3) {
                // Level 4: 5 bullets in spread with angles
                bullets.push({ x: centerX - 30, y: centerY, type: 'spread', angle: -0.5 });
                bullets.push({ x: centerX - 15, y: centerY, type: 'spread', angle: -0.25 });
                bullets.push({ x: centerX, y: centerY, type: 'spread', angle: 0 });
                bullets.push({ x: centerX + 15, y: centerY, type: 'spread', angle: 0.25 });
                bullets.push({ x: centerX + 30, y: centerY, type: 'spread', angle: 0.5 });
            } else if (this.weaponLevel >= 4) {
                // Level 5: Full spread with diagonals
                bullets.push({ x: centerX - 30, y: centerY - 10, type: 'spread', angle: -0.6 });
                bullets.push({ x: centerX - 15, y: centerY, type: 'spread', angle: -0.3 });
                bullets.push({ x: centerX, y: centerY, type: 'spread', angle: 0 });
                bullets.push({ x: centerX + 15, y: centerY, type: 'spread', angle: 0.3 });
                bullets.push({ x: centerX + 30, y: centerY - 10, type: 'spread', angle: 0.6 });
            }
        } else if (this.weaponType === 'homing') {
            if (this.weaponLevel === 0) {
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
            } else if (this.weaponLevel === 1) {
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
            } else if (this.weaponLevel === 2) {
                bullets.push({ x: centerX - 10, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 10, y: centerY, type: 'homing' });
            } else if (this.weaponLevel === 3) {
                bullets.push({ x: centerX - 15, y: centerY, type: 'homing' });
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 15, y: centerY, type: 'homing' });
            } else if (this.weaponLevel >= 4) {
                bullets.push({ x: centerX - 20, y: centerY, type: 'homing' });
                bullets.push({ x: centerX - 7, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 7, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 20, y: centerY, type: 'homing' });
            }
        } else if (this.weaponType === 'heavy') {
            if (this.weaponLevel === 0) {
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel === 1) {
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel === 2) {
                bullets.push({ x: centerX - 12, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 12, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel === 3) {
                bullets.push({ x: centerX - 18, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 18, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 4) {
                bullets.push({ x: centerX - 24, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX - 8, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 8, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 24, y: centerY, type: 'heavy' });
            }
        }

        return bullets;
    }

    public setWeapon(type: string, level: number, fireRate: number, damage: number): void {
        this.weaponType = type;
        this.weaponLevel = level;
        this.weaponFireRate = fireRate;
        this.weaponDamage = damage;
        this.gunCooldown = 1 / fireRate;
    }
}
