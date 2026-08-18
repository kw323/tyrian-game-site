import { Entity } from '../core/Entity';

// Style: late-campaign singularities are environmental hazards with a readable event horizon and restrained violet glow.
export class GravityWell extends Entity {
    public readonly radius: number;
    public readonly strength: number;
    private pulseTimer = 0;
    private readonly baseCenterX: number;
    private readonly baseCenterY: number;
    private readonly driftX: number;
    private readonly driftY: number;

    constructor(centerX: number, centerY: number, radius = 42, strength = 2.2) {
        super(centerX - radius, centerY - radius, radius * 2, radius * 2);
        this.collisionEnabled = false;
        this.radius = radius;
        this.strength = strength;
        this.baseCenterX = centerX;
        this.baseCenterY = centerY;
        this.driftX = Math.max(4, radius * 0.12);
        this.driftY = Math.max(3, radius * 0.08);
    }

    public getCenter(): { x: number; y: number } {
        return { x: this.x + this.radius, y: this.y + this.radius };
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.pulseTimer += deltaTime;
        const driftPhase = this.pulseTimer * 0.22;
        const centerX = this.baseCenterX + Math.sin(driftPhase) * this.driftX;
        const centerY = this.baseCenterY + Math.cos(driftPhase * 0.83) * this.driftY;
        this.x = centerX - this.radius;
        this.y = centerY - this.radius;
    }

    public deflectProjectile(projectile: any, deltaTime: number, falloff = 1): void {
        if (!projectile || !projectile.isActive || !this.isWithinInfluence(projectile)) return;
        const center = this.getCenter();
        const projectileCenterX = projectile.x + projectile.width / 2;
        const projectileCenterY = projectile.y + projectile.height / 2;
        const deltaX = center.x - projectileCenterX;
        const deltaY = center.y - projectileCenterY;
        const distance = Math.max(18, Math.hypot(deltaX, deltaY));
        const influenceRadius = this.radius * 1.85;
        const force = Math.max(0, 1 - distance / influenceRadius) * this.strength * falloff * deltaTime * 4.2;
        if (force <= 0) return;
        const radialX = deltaX / distance;
        const radialY = deltaY / distance;

        if (typeof projectile.applyGravityBias === 'function') {
            projectile.applyGravityBias(radialX * force, radialY * force);
            return;
        }

        if (typeof projectile.dirX === 'number' && typeof projectile.dirY === 'number') {
            const nextX = projectile.dirX + radialX * force;
            const nextY = projectile.dirY + radialY * force;
            const magnitude = Math.max(0.001, Math.hypot(nextX, nextY));
            projectile.dirX = nextX / magnitude;
            projectile.dirY = nextY / magnitude;
            return;
        }

        if (typeof projectile.angle === 'number') {
            const directionX = Math.sin(projectile.angle);
            const directionY = -Math.cos(projectile.angle);
            const nextX = directionX + radialX * force;
            const nextY = directionY + radialY * force;
            projectile.angle = Math.atan2(nextX, -nextY);
        }
    }

    public isWithinInfluence(entity: Entity): boolean {
        if (entity === this || !entity.isActive) return false;
        const center = this.getCenter();
        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;
        return Math.hypot(center.x - entityCenterX, center.y - entityCenterY) < this.radius * 1.85;
    }

    public pullEntity(entity: Entity, deltaTime: number, falloff = 1): void {
        if (!this.isWithinInfluence(entity)) return;
        const center = this.getCenter();
        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;
        const deltaX = center.x - entityCenterX;
        const deltaY = center.y - entityCenterY;
        const distance = Math.max(24, Math.hypot(deltaX, deltaY));
        const normalizedForce = Math.min(1, this.strength * falloff * deltaTime * 60 / distance);
        entity.x += deltaX * normalizedForce;
        entity.y += deltaY * normalizedForce;
        if (distance < this.radius * 0.17) entity.isActive = false;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const center = this.getCenter();
        const pulse = Math.sin(this.pulseTimer * 2.4) * 0.5 + 0.5;
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.globalAlpha = 0.86;
        ctx.shadowColor = '#a96cff';
        ctx.shadowBlur = 22 + pulse * 14;
        ctx.strokeStyle = '#a96cff';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.72 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#e3c4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.56, this.radius * 0.2 + pulse * 3, this.pulseTimer * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#020006';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#d8b6ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SINGULARITY', 0, this.radius * 0.9);
        ctx.restore();
    }
}

export default GravityWell;
