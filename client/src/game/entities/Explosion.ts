import { Entity } from '../core/Entity';

export class Explosion extends Entity {
    public radius: number;
    public maxRadius: number;
    public duration: number;
    public elapsed: number = 0;
    public color: string;

    constructor(x: number, y: number, radius: number, duration: number = 0.5, color: string = '#FF8800') {
        super(x, y, radius * 2, radius * 2);
        this.radius = radius;
        this.maxRadius = radius;
        this.duration = duration;
        this.color = color;
    }

    public update(deltaTime: number): void {
        this.elapsed += deltaTime;
        this.radius = this.maxRadius * (1 - this.elapsed / this.duration);

        if (this.elapsed >= this.duration) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = 1 - this.elapsed / this.duration;
        ctx.fillStyle = `rgba(255, 136, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
