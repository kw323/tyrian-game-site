import { Entity } from '../core/Entity';

export class EnemyBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public dirX: number;
    public dirY: number;
    public style: string;
    public isFriendly = false;
    private speedMultiplier = 1;
    private gravitySpeedMultiplier = 1;

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, dirX: number = 0, dirY: number = 1, color: string = '#FF6666', style: string = 'orb') {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.dirX = dirX;
        this.dirY = dirY;
        this.style = style;
    }

    public setSpeedMultiplier(multiplier: number): void {
        this.speedMultiplier = Math.max(0.1, Math.min(1, multiplier));
    }

    /** Applied only while a projectile crosses a Void Lance gravity field. */
    public setGravitySpeedMultiplier(multiplier: number): void {
        this.gravitySpeedMultiplier = Math.max(0.55, Math.min(1, multiplier));
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        const effectiveSpeed = this.speed * this.speedMultiplier * this.gravitySpeedMultiplier;
        this.x += this.dirX * effectiveSpeed * deltaTime * 60;
        this.y += this.dirY * effectiveSpeed * deltaTime * 60;

        // The combat canvas is 1200px wide; keeping the projectile alive through 1250px
        // prevents shots fired on the right flank from vanishing before they leave the arena.
        if (this.y > 950 || this.y < -50 || this.x < -60 || this.x > 1260) {
            this.isActive = false;
        }
    }

    // Style: hostile projectiles use distinct silhouettes so threat type is readable at a glance.
    public render(ctx: CanvasRenderingContext2D): void {
        const radius = Math.max(2, this.width / 2);
        const direction = Math.atan2(this.dirY, this.dirX) + Math.PI / 2;
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.style === 'heavy' ? 18 : 12;

        if (this.style === 'needle') {
            ctx.translate(this.x, this.y);
            ctx.rotate(direction);
            const bolt = ctx.createLinearGradient(0, -12, 0, 12);
            bolt.addColorStop(0, '#ffffff');
            bolt.addColorStop(0.35, this.color);
            bolt.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bolt;
            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(3.5, 7);
            ctx.lineTo(0, 11);
            ctx.lineTo(-3.5, 7);
            ctx.closePath();
            ctx.fill();
        } else if (this.style === 'heavy') {
            const shell = ctx.createRadialGradient(this.x - 2, this.y - 3, 1, this.x, this.y, radius * 2.4);
            shell.addColorStop(0, '#fff1be');
            shell.addColorStop(0.35, this.color);
            shell.addColorStop(1, '#7e2215');
            ctx.fillStyle = shell;
            ctx.strokeStyle = '#ffe6a8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - radius * 1.35);
            ctx.lineTo(this.x + radius * 1.1, this.y - radius * 0.35);
            ctx.lineTo(this.x + radius * 0.8, this.y + radius * 1.1);
            ctx.lineTo(this.x - radius * 0.8, this.y + radius * 1.1);
            ctx.lineTo(this.x - radius * 1.1, this.y - radius * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.style === 'plasma') {
            const orb = ctx.createRadialGradient(this.x - radius * 0.35, this.y - radius * 0.35, 1, this.x, this.y, radius * 1.5);
            orb.addColorStop(0, '#ffffff');
            orb.addColorStop(0.25, this.color);
            orb.addColorStop(1, 'rgba(70, 10, 160, 0.25)');
            ctx.fillStyle = orb;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * 1.65, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.style === 'laser') {
            ctx.translate(this.x, this.y);
            ctx.rotate(direction);
            ctx.fillStyle = 'rgba(255, 242, 180, 0.32)';
            ctx.fillRect(-5, -18, 10, 36);
            ctx.fillStyle = this.color;
            ctx.fillRect(-2.5, -16, 5, 32);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -14, 2, 28);
        } else {
            const orb = ctx.createRadialGradient(this.x - 1, this.y - 1, 1, this.x, this.y, radius * 1.5);
            orb.addColorStop(0, '#ffffff');
            orb.addColorStop(0.3, this.color);
            orb.addColorStop(1, 'rgba(255, 70, 70, 0)');
            ctx.fillStyle = orb;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * 1.25, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
