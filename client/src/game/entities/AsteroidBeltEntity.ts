import { Entity } from '../core/Entity';

export class AsteroidBeltEntity extends Entity {
    public kind: 'massive' | 'fragile' | 'debris';
    public health: number;
    public maxHealth: number;
    public vx: number;
    public vy: number;
    public rot: number = 0;
    public rotSpeed: number;
    public radius: number;
    public onSplit?: (x: number, y: number) => void;

    constructor(x: number, y: number, size: number, vx: number, vy: number, kind: 'massive' | 'fragile' | 'debris', onSplit?: (x: number, y: number) => void) {
        super(x, y, size, size);
        this.kind = kind;
        this.vx = vx;
        this.vy = vy;
        this.radius = size / 2;
        this.rotSpeed = (Math.random() - 0.5) * 2.5;
        this.onSplit = onSplit;

        if (kind === 'massive') {
            this.health = 9999;
            this.maxHealth = 9999;
        } else if (kind === 'fragile') {
            this.health = 35;
            this.maxHealth = 35;
        } else {
            this.health = 12;
            this.maxHealth = 12;
        }
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.rot += this.rotSpeed * deltaTime;

        if (this.x < -300 || this.x > 1500 || this.y < -300 || this.y > 1200) {
            this.isActive = false;
        }
    }

    public isDestructible(): boolean {
        return this.kind !== 'massive';
    }

    /** A singularity bends even an indestructible asteroid without destroying it. */
    public applyGravityToward(centerX: number, centerY: number, strength: number, deltaTime: number): void {
        const asteroidCenterX = this.x + this.width / 2;
        const asteroidCenterY = this.y + this.height / 2;
        const distance = Math.max(1, Math.hypot(centerX - asteroidCenterX, centerY - asteroidCenterY));
        const pullX = (centerX - asteroidCenterX) / distance;
        const pullY = (centerY - asteroidCenterY) / distance;
        const inertia = this.kind === 'massive' ? 0.32 : this.kind === 'fragile' ? 0.78 : 1;
        const impulse = Math.min(0.68, strength * deltaTime * 4.2 * inertia);
        this.vx = Math.max(-8, Math.min(8, this.vx + pullX * impulse));
        this.vy = Math.max(-8, Math.min(8, this.vy + pullY * impulse));
    }

    public takeDamage(amount: number): boolean {
        if (!this.isDestructible()) return false;
        this.health -= amount;
        if (this.health <= 0) {
            this.isActive = false;
            if (this.kind === 'fragile' && this.onSplit) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                this.onSplit(cx, cy);
            }
            return true;
        }
        return false;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rot);

        ctx.beginPath();
        const pts = 7;
        for (let i = 0; i < pts; i++) {
            const angle = (i / pts) * Math.PI * 2;
            const r = this.radius * (0.75 + Math.sin(i * 3.7) * 0.25);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        if (this.kind === 'massive') {
            // Dark body + red structural bands = solid, indestructible obstacle.
            ctx.fillStyle = '#26313f';
            ctx.strokeStyle = '#ff667e';
            ctx.lineWidth = 3;
        } else if (this.kind === 'fragile') {
            // Warm fracture seams = destructible asteroid that splits into debris.
            ctx.fillStyle = '#716274';
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#9aa7b5';
            ctx.strokeStyle = '#dce9f4';
            ctx.lineWidth = 1.5;
        }
        ctx.fill();
        ctx.stroke();

        if (this.kind === 'massive') {
            ctx.strokeStyle = '#ff667e';
            ctx.lineWidth = 1.6;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.56, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff9aad';
            ctx.font = `bold ${Math.max(10, this.radius * 0.32)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('X', 0, this.radius * 0.12);
        } else if (this.kind === 'fragile') {
            ctx.strokeStyle = '#fff1b5';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.42, -this.radius * 0.18);
            ctx.lineTo(-this.radius * 0.08, this.radius * 0.05);
            ctx.lineTo(this.radius * 0.14, -this.radius * 0.14);
            ctx.lineTo(this.radius * 0.42, this.radius * 0.22);
            ctx.stroke();
        }

        ctx.restore();
    }
}
