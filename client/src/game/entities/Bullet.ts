import { Entity } from '../core/Entity';

export class Bullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public angle: number = 0; // Angle in radians for diagonal movement

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, color: string = '#FFD700', angle: number = 0) {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.angle = angle;
    }

    public update(deltaTime: number): void {
        // Move in direction based on angle
        // angle 0 = straight up, positive = right, negative = left
        const distance = this.speed * deltaTime * 60;
        this.x += Math.sin(this.angle) * distance;
        this.y -= Math.cos(this.angle) * distance;

        // Deactivate if off-screen
        if (this.y + this.height < 0 || this.x < -50 || this.x > 850) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
