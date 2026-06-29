import { Entity } from '../core/Entity';

export class EnemyBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public dirX: number;
    public dirY: number;

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, dirX: number = 0, dirY: number = 1, color: string = '#FF6666') {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.dirX = dirX;
        this.dirY = dirY;
    }

    public update(deltaTime: number): void {
        this.x += this.dirX * this.speed * deltaTime * 60;
        this.y += this.dirY * this.speed * deltaTime * 60;

        if (this.y > 900 || this.x < -50 || this.x > 850) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
