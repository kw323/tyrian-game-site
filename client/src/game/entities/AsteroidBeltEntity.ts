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

    public takeDamage(amount: number): boolean {
        if (this.kind === 'massive') return false;
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
            ctx.fillStyle = '#4a5568';
            ctx.strokeStyle = '#a0aec0';
            ctx.lineWidth = 3;
        } else if (this.kind === 'fragile') {
            ctx.fillStyle = '#718096';
            ctx.strokeStyle = '#cbd5e0';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#a0aec0';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
