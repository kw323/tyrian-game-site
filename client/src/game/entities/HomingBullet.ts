import { Entity } from '../core/Entity';

export class HomingBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public targetX: number;
    public targetY: number;
    public turnSpeed: number = 3; // How quickly it turns towards target

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, targetX: number, targetY: number) {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = '#FF00FF'; // Magenta for homing
        this.targetX = targetX;
        this.targetY = targetY;
    }

    public update(deltaTime: number): void {
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Move towards target
            this.x += dirX * this.speed * deltaTime * 60;
            this.y += dirY * this.speed * deltaTime * 60;
        }

        // Deactivate if off-screen
        if (this.y < -50 || this.x < -50 || this.x > 850 || this.y > 950) {
            this.isActive = false;
        }
    }

    public updateTarget(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        // Draw homing bullet with trail effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}
