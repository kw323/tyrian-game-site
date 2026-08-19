import { Entity } from '../core/Entity';
import { Bullet } from './Bullet';
import { getWeaponRuntimeProfile } from '../core/WeaponRuntimeProfile';

interface LightningSegment {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    damage: number;
}

/** A fixed-electricity projectile that resolves into a short-lived visible chain. */
export class ChainLightningBullet extends Bullet {
    public readonly level: number;
    public readonly chainJumps: number;
    public readonly chainRange: number;
    private readonly struckTargets = new Set<Entity>();
    private readonly segments: LightningSegment[] = [];
    private resolved = false;
    private visualTime = 0;

    constructor(x: number, y: number, damage: number, level: number, angle = 0) {
        const profile = getWeaponRuntimeProfile('arc', level);
        super(x, y, 7, 18, profile.arcProjectileSpeed ?? 13, damage, '#f8ff79', angle);
        this.level = level;
        this.chainJumps = profile.arcChainJumps ?? 2;
        this.chainRange = profile.arcChainRange ?? 158;
    }

    public update(deltaTime: number): void {
        if (this.resolved) {
            this.visualTime -= deltaTime;
            if (this.visualTime <= 0) this.isActive = false;
            return;
        }
        super.update(deltaTime);
    }

    public canStrike(target: Entity): boolean {
        return this.isActive && !this.resolved && !this.struckTargets.has(target);
    }

    public registerStrike(fromX: number, fromY: number, target: Entity, damage: number): void {
        const toX = target.x + target.width / 2;
        const toY = target.y + target.height / 2;
        this.segments.push({ fromX, fromY, toX, toY, damage });
        this.struckTargets.add(target);
    }

    public hasStruck(target: Entity): boolean {
        return this.struckTargets.has(target);
    }

    public finishChain(): void {
        this.resolved = true;
        this.visualTime = 0.16;
        this.x = -1000;
        this.y = -1000;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.resolved) super.render(ctx);
        if (!this.segments.length) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        this.segments.forEach((segment, index) => {
            const alpha = Math.max(0.16, 0.96 - index * 0.11);
            ctx.strokeStyle = `rgba(245, 255, 110, ${alpha})`;
            ctx.shadowColor = '#8ce8ff';
            ctx.shadowBlur = 14;
            ctx.lineWidth = Math.max(1.4, 4.2 - index * 0.42);
            ctx.beginPath();
            ctx.moveTo(segment.fromX, segment.fromY);
            const midX = (segment.fromX + segment.toX) / 2 + Math.sin(index * 11 + performance.now() / 45) * 11;
            const midY = (segment.fromY + segment.toY) / 2 + Math.cos(index * 7 + performance.now() / 45) * 8;
            ctx.lineTo(midX, midY);
            ctx.lineTo(segment.toX, segment.toY);
            ctx.stroke();
        });
        ctx.restore();
    }
}
