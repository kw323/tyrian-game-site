import { Entity } from '../core/Entity';

export class Bullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, color: string = '#FFD700') {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = color;
    }

    public update(deltaTime: number): void {
        this.y -= this.speed * deltaTime * 60;

        if (this.y + this.height < 0) {
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
