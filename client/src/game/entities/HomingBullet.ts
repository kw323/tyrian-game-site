import { Entity } from '../core/Entity';

export class HomingBullet extends Entity {
    public speed: number;
    public damage: number;
    public color: string;
    public targetX: number;
    public targetY: number;
    public target: Entity | null;
    public turnSpeed: number = 3;
    private directionX = 0;
    private directionY = -1;
    private gravityBiasX = 0;
    private gravityBiasY = 0;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        speed: number,
        damage: number,
        targetX: number,
        targetY: number,
        target: Entity | null = null,
        turnSpeed: number = 2.6
    ) {
        super(x, y, width, height);
        this.speed = speed;
        this.damage = damage;
        this.color = '#FF00FF';
        this.targetX = targetX;
        this.targetY = targetY;
        this.target = target;
        this.turnSpeed = turnSpeed;
    }

    public setTarget(target: Entity | null): void {
        this.target = target;
        if (target) {
            this.updateTarget(target.x + target.width / 2, target.y + target.height / 2);
        }
    }

    public hasValidTarget(): boolean {
        return Boolean(this.target && this.target.isActive);
    }

    public update(deltaTime: number): void {
        if (this.hasValidTarget() && this.target) {
            // Follow the target's current position instead of a stale spawn-time coordinate.
            this.targetX = this.target.x + this.target.width / 2;
            this.targetY = this.target.y + this.target.height / 2;
        } else {
            // No target: continue forward so the missile does not freeze in the arena.
            this.target = null;
            this.targetX = this.x;
            this.targetY = this.y - 100;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const desiredX = dx / distance + this.gravityBiasX;
            const desiredY = dy / distance + this.gravityBiasY;
            const desiredMagnitude = Math.max(0.001, Math.hypot(desiredX, desiredY));
            const desiredDirectionX = desiredX / desiredMagnitude;
            const desiredDirectionY = desiredY / desiredMagnitude;
            const steer = Math.min(1, deltaTime * this.turnSpeed);
            this.directionX += (desiredDirectionX - this.directionX) * steer;
            this.directionY += (desiredDirectionY - this.directionY) * steer;
            const directionMagnitude = Math.max(0.001, Math.hypot(this.directionX, this.directionY));
            this.directionX /= directionMagnitude;
            this.directionY /= directionMagnitude;
            this.x += this.directionX * this.speed * deltaTime * 60;
            this.y += this.directionY * this.speed * deltaTime * 60;
            this.gravityBiasX *= Math.max(0, 1 - deltaTime * 5);
            this.gravityBiasY *= Math.max(0, 1 - deltaTime * 5);
        }

        if (this.y < -90 || this.y > 1000 || this.x < -150 || this.x > 1400) {
            this.isActive = false;
        }
    }

    public updateTarget(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    public applyGravityBias(x: number, y: number): void {
        this.gravityBiasX = Math.max(-0.8, Math.min(0.8, this.gravityBiasX + x));
        this.gravityBiasY = Math.max(-0.8, Math.min(0.8, this.gravityBiasY + y));
    }

    // Style: guided micro-missile with a magnetic halo and bright tracking core.
    public render(ctx: CanvasRenderingContext2D): void {
        const radius = Math.max(2.5, this.width / 2);
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x) + Math.PI / 2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 16;

        ctx.fillStyle = 'rgba(255, 80, 230, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.9, radius * 3.1, 0, 0, Math.PI * 2);
        ctx.fill();

        const body = ctx.createLinearGradient(0, radius * 2, 0, -radius * 2);
        body.addColorStop(0, '#5c116c');
        body.addColorStop(0.45, this.color);
        body.addColorStop(1, '#fff0ff');
        ctx.fillStyle = body;
        ctx.strokeStyle = '#ffd5ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.9);
        ctx.quadraticCurveTo(radius * 0.8, -radius * 0.7, radius * 0.62, radius * 1.4);
        ctx.lineTo(0, radius * 1.9);
        ctx.lineTo(-radius * 0.62, radius * 1.4);
        ctx.quadraticCurveTo(-radius * 0.8, -radius * 0.7, 0, -radius * 1.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -radius * 0.4, radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 0, 230, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-radius * 1.2, radius * 0.8);
        ctx.lineTo(-radius * 0.35, radius * 0.65);
        ctx.lineTo(-radius * 0.55, radius * 1.65);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(radius * 1.2, radius * 0.8);
        ctx.lineTo(radius * 0.35, radius * 0.65);
        ctx.lineTo(radius * 0.55, radius * 1.65);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
