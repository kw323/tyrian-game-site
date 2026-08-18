import { Entity } from '@/game/core/Entity';

export type StageHazardKind = 'asteroid' | 'wreck';

// Style: late-campaign hazards use large readable silhouettes and operational markings rather than noisy particle clutter.
export class StageHazard extends Entity {
    public readonly kind: StageHazardKind;
    public readonly rotationSpeed: number;
    private rotation = 0;
    private readonly seed: number;

    constructor(x: number, y: number, width: number, height: number, kind: StageHazardKind, seed = Math.random() * 10) {
        super(x, y, width, height);
        this.kind = kind;
        this.seed = seed;
        this.rotationSpeed = kind === 'asteroid' ? 0.15 + (seed % 0.2) : 0.04 + (seed % 0.08);
        this.collisionEnabled = true;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.rotation += deltaTime * this.rotationSpeed;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.shadowColor = this.kind === 'asteroid' ? '#d97845' : '#3cb5c8';
        ctx.shadowBlur = 16;

        if (this.kind === 'asteroid') {
            const radiusX = this.width * 0.46;
            const radiusY = this.height * 0.46;
            ctx.fillStyle = '#6f4237';
            ctx.strokeStyle = '#e1a06b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 * i) / 10;
                const variance = 0.82 + ((Math.sin(this.seed * 7 + i * 3.1) + 1) * 0.09);
                const px = Math.cos(angle) * radiusX * variance;
                const py = Math.sin(angle) * radiusY * variance;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(38, 19, 21, 0.7)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(
                    (Math.sin(this.seed + i * 1.7) * radiusX * 0.35),
                    (Math.cos(this.seed * 0.7 + i * 2) * radiusY * 0.32),
                    Math.max(3, Math.min(this.width, this.height) * (0.08 + i * 0.02)),
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#183846';
            ctx.strokeStyle = '#65d8e7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.48, -this.height * 0.25);
            ctx.lineTo(-this.width * 0.2, -this.height * 0.48);
            ctx.lineTo(this.width * 0.45, -this.height * 0.4);
            ctx.lineTo(this.width * 0.5, this.height * 0.22);
            ctx.lineTo(this.width * 0.18, this.height * 0.48);
            ctx.lineTo(-this.width * 0.4, this.height * 0.36);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#c2f7ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.3, -this.height * 0.15);
            ctx.lineTo(this.width * 0.32, this.height * 0.15);
            ctx.moveTo(-this.width * 0.18, this.height * 0.3);
            ctx.lineTo(this.width * 0.1, -this.height * 0.32);
            ctx.stroke();
            ctx.fillStyle = '#ffb84d';
            ctx.fillRect(-this.width * 0.08, -this.height * 0.08, this.width * 0.16, this.height * 0.16);
        }

        ctx.restore();
    }
}

export default StageHazard;
