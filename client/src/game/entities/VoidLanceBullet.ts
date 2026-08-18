import { Entity } from '../core/Entity';
import { Bullet } from './Bullet';

// Style: secret weapon projectile — a dark-violet lance with a cyan singularity core.
export class VoidLanceBullet extends Bullet {
    public readonly level: number;
    private readonly hitTargets = new Set<Entity>();
    private elapsed = 0;
    private readonly lifetime = 1.55;

    constructor(x: number, y: number, damage: number, level: number, angle = 0) {
        super(x, y, 12, 22, 19, damage, '#b06cff', angle);
        this.level = level;
    }

    public update(deltaTime: number): void {
        const distance = this.speed * deltaTime * 60;
        this.x += Math.sin(this.angle) * distance;
        this.y -= Math.cos(this.angle) * distance;
        this.elapsed += deltaTime;
        if (this.elapsed >= this.lifetime || this.y + this.height < -80 || this.x < -90 || this.x > 890) {
            this.isActive = false;
        }
    }

    public canHitTarget(target: Entity): boolean {
        return this.isActive && !this.hitTargets.has(target);
    }

    public registerHit(target: Entity): void {
        this.hitTargets.add(target);
    }

    public getDamageForTarget(): number {
        return this.damage * Math.pow(0.78, this.hitTargets.size);
    }

    public getSlowFactor(): number {
        return Math.max(0.42, 0.68 - this.level * 0.012);
    }

    public getSlowDuration(): number {
        return 0.75 + this.level * 0.06;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const pulse = 1 + Math.sin(performance.now() / 70) * 0.08;
        const radius = 5 * pulse;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = '#9c4dff';
        ctx.shadowBlur = 22;
        const trail = ctx.createLinearGradient(0, 22, 0, -12);
        trail.addColorStop(0, 'rgba(95, 28, 180, 0)');
        trail.addColorStop(0.45, 'rgba(145, 74, 255, 0.72)');
        trail.addColorStop(1, '#f5e9ff');
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, 18);
        ctx.lineTo(radius * 0.5, 18);
        ctx.lineTo(radius * 0.95, -3);
        ctx.lineTo(0, -12);
        ctx.lineTo(-radius * 0.95, -3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -3, radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6df5ff';
        ctx.beginPath();
        ctx.arc(0, -3, radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
