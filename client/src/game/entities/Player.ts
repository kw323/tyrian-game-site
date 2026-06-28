import { Entity } from '../core/Entity';

export class Player extends Entity {
    public speed: number;
    public color: string = '#00FF88';
    public gunCooldown: number = 0.15;
    public lastShotTime: number = 0;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        super(x, y, width, height);
        this.speed = speed;
    }

    public updateWithInput(deltaTime: number, keys: any, gameWidth: number, gameHeight: number): void {
        if (keys.ArrowUp && this.y > 0) this.y -= this.speed * deltaTime * 60;
        if (keys.ArrowDown && this.y < gameHeight - this.height) this.y += this.speed * deltaTime * 60;
        if (keys.ArrowLeft && this.x > 0) this.x -= this.speed * deltaTime * 60;
        if (keys.ArrowRight && this.x < gameWidth - this.width) this.x += this.speed * deltaTime * 60;
    }

    public update(deltaTime: number): void {
        // Base update, overridden by updateWithInput
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00CCDD';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    public canShoot(currentTime: number): boolean {
        return (currentTime - this.lastShotTime) >= this.gunCooldown;
    }

    public shoot(currentTime: number): { x: number; y: number } {
        this.lastShotTime = currentTime;
        return { x: this.x + this.width / 2, y: this.y };
    }
}
