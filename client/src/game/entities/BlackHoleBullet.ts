import { Entity } from '../core/Entity';
import { Bullet } from './Bullet';
import { getWeaponRuntimeProfile } from '../core/WeaponRuntimeProfile';

// Style: a compact artificial singularity with an accretion disk and a readable gravity field.
export class BlackHoleBullet extends Bullet {
    public readonly level: number;
    public isFriendly = true;
    private readonly hitTargets = new Set<Entity>();
    private readonly affectedTargets = new Set<Entity>();
    private readonly affectCooldowns = new Map<Entity, number>();
    private elapsed = 0;
    private readonly lifetime: number;
    private impactPoint: { x: number; y: number } | null = null;

    constructor(x: number, y: number, damage: number, level: number, angle = 0) {
        super(x, y, 14, 20, 15, damage, '#8b5cf6', angle);
        this.level = level;
        this.lifetime = getWeaponRuntimeProfile('void_lance', level).voidFieldDuration ?? 1.25;
    }

    public update(deltaTime: number): void {
        const distance = this.speed * deltaTime * 60;
        this.x += Math.sin(this.angle) * distance;
        this.y -= Math.cos(this.angle) * distance;
        this.elapsed += deltaTime;

        this.affectCooldowns.forEach((cooldown, target) => {
            const nextCooldown = cooldown - deltaTime;
            if (nextCooldown <= 0) this.affectCooldowns.delete(target);
            else this.affectCooldowns.set(target, nextCooldown);
        });

        if (this.elapsed >= this.lifetime || this.y + this.height < -90 || this.x < -150 || this.x > 1400 || this.y > 1000) {
            this.isActive = false;
        }
    }

    public canHitTarget(target: Entity): boolean {
        return this.isActive && !this.hitTargets.has(target);
    }

    public registerHit(target: Entity): void {
        this.hitTargets.add(target);
        this.impactPoint = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    }

    public getDamageForTarget(): number {
        return this.damage * Math.pow(0.82, this.hitTargets.size);
    }

    public getFieldRadius(): number {
        return getWeaponRuntimeProfile('void_lance', this.level).voidFieldRadius ?? 26;
    }

    public getFieldCenter(): { x: number; y: number } {
        return this.impactPoint ?? { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    public canSuctionTarget(target: Entity): boolean {
        // Never suction the player or friendly entities
        if (target.constructor.name === 'Player' || (target as any).isFriendly) return false;
        // Large enemies and bosses can take direct damage but ignore the gravity pull.
        return target.width <= 36 && target.height <= 32 && !this.affectCooldowns.has(target);
    }

    public isWithinField(target: Entity): boolean {
        const center = this.getFieldCenter();
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;
        return Math.hypot(targetCenterX - center.x, targetCenterY - center.y) <= this.getFieldRadius();
    }

    public registerSuction(target: Entity): void {
        this.affectedTargets.add(target);
        this.affectCooldowns.set(target, 0.2);
    }

    public getSuctionStrength(): number {
        return getWeaponRuntimeProfile('void_lance', this.level).voidSuctionStrength ?? 0.2;
    }

    public getSuctionDamage(): number {
        return Math.max(2, this.damage * (0.12 + this.level * 0.012));
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const pulse = 1 + Math.sin(performance.now() / 80) * 0.08;
        const center = this.getFieldCenter();
        const fieldRadius = this.getFieldRadius();
        const coreRadius = 7 * pulse;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(151, 91, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, fieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(235, 181, 255, 0.42)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, fieldRadius * 0.92, fieldRadius * 0.25, performance.now() / 900, 0, Math.PI * 2);
        ctx.stroke();

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        ctx.shadowColor = '#9b5cff';
        ctx.shadowBlur = 24;
        const trail = ctx.createLinearGradient(0, 24, 0, -16);
        trail.addColorStop(0, 'rgba(41, 12, 89, 0)');
        trail.addColorStop(0.55, 'rgba(148, 78, 255, 0.72)');
        trail.addColorStop(1, 'rgba(255, 239, 255, 0.95)');
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.moveTo(-5, 18);
        ctx.lineTo(5, 18);
        ctx.lineTo(7, -4);
        ctx.lineTo(0, -13);
        ctx.lineTo(-7, -4);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#07030f';
        ctx.beginPath();
        ctx.arc(0, -3, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e8b5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -3, coreRadius * 1.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -3, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
