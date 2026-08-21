import { Entity } from '../core/Entity';
import { RuneId, RuneSystem } from '../core/RuneSystem';

export class RuneDropEntity extends Entity {
    public readonly runeId: RuneId;
    private readonly vx: number;
    private readonly vy: number;
    private lifeTimer = 15;
    private floatTime = Math.random() * Math.PI * 2;

    constructor(x: number, y: number, runeId: RuneId) {
        super(x - 20, y - 20, 40, 40);
        this.runeId = runeId;
        this.vx = (Math.random() - 0.5) * 38;
        this.vy = 22 + Math.random() * 28;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.lifeTimer -= deltaTime;
        if (this.lifeTimer <= 0) {
            this.isActive = false;
            return;
        }
        this.floatTime += deltaTime * 3.2;
        this.x += (this.vx + Math.sin(this.floatTime) * 12) * deltaTime;
        this.y += this.vy * deltaTime;
        if (this.x < 24) this.x = 24;
        if (this.x > 1216) this.x = 1216;
        if (this.y > 820) this.isActive = false;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;
        const definition = new RuneSystem().getDefinition(this.runeId);
        const pulse = 1 + Math.sin(this.floatTime * 2.5) * 0.12;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.floatTime * 0.45);
        ctx.shadowColor = definition.color;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = definition.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -16 * pulse);
        ctx.lineTo(14 * pulse, 0);
        ctx.lineTo(0, 16 * pulse);
        ctx.lineTo(-14 * pulse, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(7, 15, 34, 0.92)';
        ctx.fill();
        ctx.rotate(-this.floatTime * 0.45);
        ctx.shadowBlur = 0;
        ctx.fillStyle = definition.color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RUNE', 0, -2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('T1', 0, 10);
        ctx.restore();
    }
}
