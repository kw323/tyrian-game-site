import { Entity } from '../core/Entity';

// Style: instantaneous pulse-laser beam; the primary ray is white-hot and secondary rays are thinner cyan traces.
export class LaserBullet extends Entity {
    public readonly damage: number;
    public readonly isPlayerBullet: boolean;
    public readonly level: number;
    public angle: number;
    public readonly isSecondary: boolean;
    public readonly beamWidth: number;
    public readonly maxTargets: number;
    private readonly originX: number;
    private readonly originY: number;
    private readonly lifetime: number;
    private elapsed: number = 0;
    private readonly hitTargets = new Set<Entity>();

    constructor(
        originX: number,
        originY: number,
        damage: number,
        level: number = 0,
        isPlayerBullet: boolean = true,
        angle: number = 0,
        isSecondary: boolean = false
    ) {
        const displayLevel = Math.max(1, level + 1);
        const beamWidth = isSecondary ? Math.max(2.5, 2.5 + displayLevel * 0.4) : 5 + displayLevel * 0.95;
        const beamHeight = Math.max(1, originY);
        const endX = originX + Math.tan(angle) * beamHeight;
        const left = Math.min(originX, endX) - beamWidth / 2;
        const right = Math.max(originX, endX) + beamWidth / 2;
        super(left, 0, Math.max(1, right - left), beamHeight);

        this.originX = originX;
        this.originY = originY;
        this.damage = damage;
        this.level = level;
        this.isPlayerBullet = isPlayerBullet;
        this.angle = angle;
        this.isSecondary = isSecondary;
        this.beamWidth = beamWidth;
        this.maxTargets = isSecondary
            ? Math.max(1, Math.floor((1 + Math.floor(displayLevel / 3)) * 0.6))
            : Math.min(6, 1 + Math.floor(displayLevel / 3));
        this.lifetime = isSecondary ? 0.09 : 0.12;
    }

    public applyGravityBias(x: number, y: number): void {
        const directionX = Math.sin(this.angle) + x;
        const directionY = -Math.cos(this.angle) + y;
        this.angle = Math.atan2(directionX, -directionY);
        const endY = this.isPlayerBullet ? 0 : this.originY + this.originY * 0.08;
        const endX = this.originX + Math.tan(this.angle) * Math.abs(this.originY - endY);
        const left = Math.min(this.originX, endX) - this.beamWidth / 2;
        const right = Math.max(this.originX, endX) + this.beamWidth / 2;
        this.x = left;
        this.y = Math.min(0, endY);
        this.width = Math.max(1, right - left);
        this.height = Math.max(1, Math.abs(this.originY - endY));
    }

    public update(deltaTime: number): void {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.lifetime) {
            this.isActive = false;
        }
    }

    public canHitTarget(target: Entity): boolean {
        return this.isActive && !this.hitTargets.has(target) && this.hitTargets.size < this.maxTargets;
    }

    /** AABB is intentionally broad for the collision system; this keeps the actual ray precise. */
    public intersectsTarget(target: Entity): boolean {
        const endY = this.isPlayerBullet ? 0 : this.originY + this.originY * 0.08;
        const endX = this.originX + Math.tan(this.angle) * Math.abs(this.originY - endY);
        const padding = this.beamWidth / 2;
        const minX = target.x - padding;
        const maxX = target.x + target.width + padding;
        const minY = target.y - padding;
        const maxY = target.y + target.height + padding;
        const dx = endX - this.originX;
        const dy = endY - this.originY;
        let tMin = 0;
        let tMax = 1;

        const clipAxis = (start: number, delta: number, min: number, max: number): boolean => {
            if (Math.abs(delta) < 0.00001) return start >= min && start <= max;
            let t1 = (min - start) / delta;
            let t2 = (max - start) / delta;
            if (t1 > t2) [t1, t2] = [t2, t1];
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
            return tMin <= tMax;
        };

        return clipAxis(this.originX, dx, minX, maxX) && clipAxis(this.originY, dy, minY, maxY);
    }

    public getDamageForTarget(target: Entity): number {
        if (!this.canHitTarget(target)) return 0;
        this.hitTargets.add(target);
        const falloff = Math.pow(0.72, this.hitTargets.size - 1);
        const secondaryMultiplier = this.isSecondary ? 0.45 : 1;
        return this.damage * falloff * secondaryMultiplier;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const progress = Math.min(1, this.elapsed / this.lifetime);
        const fade = Math.max(0, 1 - progress * 0.55);
        const endY = this.isPlayerBullet ? 0 : this.originY + this.originY * 0.08;
        const endX = this.originX + Math.tan(this.angle) * Math.abs(this.originY - endY);
        const coreColor = this.isSecondary ? '#b9f8ff' : '#ffffff';
        const beamColor = this.isSecondary ? '#28b9ff' : '#00d9ff';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = fade;

        ctx.strokeStyle = this.isSecondary ? 'rgba(0, 180, 255, 0.22)' : 'rgba(0, 241, 255, 0.25)';
        ctx.lineWidth = this.beamWidth * 3.3;
        ctx.shadowColor = beamColor;
        ctx.shadowBlur = this.isSecondary ? 12 : 24;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = beamColor;
        ctx.lineWidth = this.beamWidth;
        ctx.shadowBlur = this.isSecondary ? 8 : 18;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = coreColor;
        ctx.lineWidth = Math.max(1.2, this.beamWidth * 0.32);
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        if (!this.isSecondary && this.level >= 5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + Math.min(0.35, this.level * 0.02)})`;
            ctx.lineWidth = Math.max(1, this.beamWidth * 0.12);
            ctx.beginPath();
            ctx.moveTo(this.originX - this.beamWidth * 0.32, this.originY);
            ctx.lineTo(endX - this.beamWidth * 0.32, endY);
            ctx.stroke();
        }

        ctx.restore();
    }
}
