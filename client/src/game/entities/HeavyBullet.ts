import { Entity } from '../core/Entity';

export class HeavyBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number) {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = '#FF9900'; // Orange for heavy
    }

    public update(deltaTime: number): void {
        this.y -= this.speed * deltaTime * 60;

        if (this.y < -50) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;

        // Draw large square bullet
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw inner glow
        ctx.fillStyle = '#FFCC00';
        ctx.fillRect(this.x - this.width / 3, this.y - this.height / 3, this.width * 0.66, this.height * 0.66);

        ctx.shadowBlur = 0;
    }
}
