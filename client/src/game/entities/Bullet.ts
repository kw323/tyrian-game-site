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
        if (this.y + this.height < 0 || this.x < -50 || this.x > 1250) {
            this.isActive = false;
        }
    }

    // Style: compact energy bolt with a bright core and directional trail.
    public render(ctx: CanvasRenderingContext2D): void {
        const radius = Math.max(2, this.width / 2);
        ctx.save();
        if ((this as any).isCloaked) {
            ctx.globalAlpha = 0.2;
        }
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = (this as any).isCloaked ? 2 : 14;

        const trail = ctx.createLinearGradient(0, radius * 3, 0, -radius);
        trail.addColorStop(0, 'rgba(0, 0, 0, 0)');
        trail.addColorStop(0.55, this.color);
        trail.addColorStop(1, '#ffffff');
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.55, radius * 2.7);
        ctx.lineTo(radius * 0.55, radius * 2.7);
        ctx.lineTo(radius * 0.65, -radius * 0.3);
        ctx.quadraticCurveTo(0, -radius * 1.5, -radius * 0.65, -radius * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
