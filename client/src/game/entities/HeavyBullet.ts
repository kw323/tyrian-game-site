import { Entity } from '../core/Entity';

// Style: heavy plasma shell with a faceted silhouette and a controlled impact trail.
export class HeavyBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public readonly angle: number;
    public readonly level: number;
    public onSplit?: (x: number, y: number, level: number, damage: number) => void;
    private remainingDamage: number;
    private remainingForce: number;
    private readonly impactDamage: number;
    private readonly impactForce: number;
    private hasSplit = false;
    private distanceTraveled = 0;
    private isSubFragment = false; // Sub-fragments spawned from split should not trigger another split and should fly until completely offscreen
    private readonly hitCooldowns = new Map<Entity, number>();

    constructor(x: number, y: number, width: number, height: number, speed: number, damage: number, angle = 0, level = 1, onSplit?: (x: number, y: number, level: number, damage: number) => void, isSubFragment = false) {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = level >= 10 ? '#FF3366' : '#FF9900';
        this.angle = angle;
        this.level = level;
        this.onSplit = onSplit;
        this.isSubFragment = isSubFragment;
        this.remainingDamage = Math.max(1, damage * (1.3 + level * 0.05));
        this.impactDamage = Math.max(14, damage * 0.7);
        this.remainingForce = Math.max(30, damage * 4.2);
        this.impactForce = Math.max(12, damage * 0.95);
    }

    public update(deltaTime: number): void {
        const directionX = Math.sin(this.angle);
        const directionY = -Math.cos(this.angle);
        const step = this.speed * deltaTime * 60;
        this.x += directionX * step;
        this.y += directionY * step;
        this.distanceTraveled += step;

        this.hitCooldowns.forEach((cooldown, target) => {
            const nextCooldown = cooldown - deltaTime;
            if (nextCooldown <= 0) this.hitCooldowns.delete(target);
            else this.hitCooldowns.set(target, nextCooldown);
        });

        // If it is a sub-fragment, fly freely. If depleted or out of bounds, trigger secondary onSplit if available.
        if (this.isSubFragment) {
            if (this.y < -120 || this.y > 1050 || this.x < -200 || this.x > 1450 || this.isDepleted()) {
                if (!this.hasSplit) {
                    this.hasSplit = true;
                    if (this.onSplit) this.onSplit(this.x, this.y, this.level, this.damage);
                }
                this.isActive = false;
            }
            return;
        }

        // Primary shell: split right 1 pixel before top screen edge (y <= 1), or out of side bounds, or depletion
        if (this.y <= 1 || this.y > 1000 || this.x < -150 || this.x > 1400 || this.isDepleted()) {
            if (!this.hasSplit) {
                this.hasSplit = true;
                if (this.onSplit) this.onSplit(this.x, this.y, this.level, this.damage);
            }
            this.isActive = false;
        }
    }

    public canImpact(target: Entity): boolean {
        return this.isActive && !this.isDepleted() && !this.hitCooldowns.has(target);
    }

    public consumeImpact(target: Entity): { damage: number; force: number } | null {
        if (!this.canImpact(target)) return null;
        const dealtDamage = Math.min(this.impactDamage, this.remainingDamage);
        const dealtForce = Math.min(this.impactForce, this.remainingForce);
        // Split Bomb explodes / splits immediately on first hit instead of piercing through enemies
        this.remainingDamage = 0;
        this.remainingForce = 0;
        if (!this.hasSplit) {
            this.hasSplit = true;
            if (this.onSplit) this.onSplit(this.x, this.y, this.level, this.damage);
            this.isActive = false;
        }
        return { damage: dealtDamage, force: dealtForce };
    }

    public isDepleted(): boolean {
        return this.remainingDamage <= 0.001 || this.remainingForce <= 0.001;
    }

    public getImpactDirection(): { x: number; y: number } {
        return { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
    }

    public getBlastRadius(): number {
        return Math.min(62, 26 + this.damage * 0.16);
    }

    public getBlastDamage(impactDamage: number): number {
        return Math.max(3, impactDamage * 0.28);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        const shell = ctx.createLinearGradient(-halfW, halfH, halfW, -halfH);
        shell.addColorStop(0, '#8d260f');
        shell.addColorStop(0.35, this.color);
        shell.addColorStop(0.72, '#ffd36a');
        shell.addColorStop(1, '#fff7c2');
        ctx.fillStyle = shell;
        ctx.strokeStyle = '#fff0a6';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, -halfH * 0.42);
        ctx.lineTo(halfW * 0.78, halfH);
        ctx.lineTo(-halfW * 0.78, halfH);
        ctx.lineTo(-halfW, -halfH * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff7c2';
        ctx.beginPath();
        ctx.ellipse(0, -halfH * 0.05, halfW * 0.34, halfH * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 102, 25, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, halfH * 0.52, halfW * 0.38, halfH * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
