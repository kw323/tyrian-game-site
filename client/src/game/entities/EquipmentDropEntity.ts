import { Entity } from '../core/Entity';

export class EquipmentDropEntity extends Entity {
    public equipmentType: 'engine' | 'shield' | 'generator' | 'weapon' | 'computer';
    public tier: number;
    public vx: number;
    public vy: number;
    private lifeTimer: number = 14; // Drops persist for 14 seconds before fading
    private floatTime: number = 0;

    constructor(
        x: number,
        y: number,
        equipmentType: 'engine' | 'shield' | 'generator' | 'weapon' | 'computer',
        tier: number
    ) {
        super(x - 18, y - 18, 36, 36);
        this.equipmentType = equipmentType;
        this.tier = Math.max(1, Math.min(5, tier));
        this.vx = (Math.random() - 0.5) * 45;
        this.vy = 25 + Math.random() * 35; // Drifts downward slowly
        this.floatTime = Math.random() * Math.PI * 2;
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.lifeTimer -= deltaTime;
        if (this.lifeTimer <= 0) {
            this.isActive = false;
            return;
        }

        this.floatTime += deltaTime * 3;
        this.x += (this.vx + Math.sin(this.floatTime) * 15) * deltaTime;
        this.y += this.vy * deltaTime;

        // Keep within canvas bounds horizontally
        if (this.x < 30) {
            this.x = 30;
            this.vx *= -1;
        } else if (this.x > 1220) {
            this.x = 1220;
            this.vx *= -1;
        }

        // Remove if off bottom
        if (this.y > 800) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Tier-based color
        const tierColors = ['#FFFFFF', '#22C55E', '#3B82F6', '#EAB308', '#EF4444'];
        const color = tierColors[this.tier - 1] || '#FFFFFF';

        // Outer pulsing glow ring
        const pulse = 1 + Math.sin(this.floatTime * 2) * 0.15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, (this.width / 2) * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner tile background
        ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
        ctx.beginPath();
        ctx.roundRect(-14, -14, 28, 28, 6);
        ctx.fill();
        ctx.stroke();

        // Icon symbol based on equipment type
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let label = 'EQ';
        if (this.equipmentType === 'engine') label = 'ENG';
        else if (this.equipmentType === 'shield') label = 'SHD';
        else if (this.equipmentType === 'generator') label = 'GEN';
        else if (this.equipmentType === 'weapon') label = 'WPN';
        else if (this.equipmentType === 'computer') label = 'CPU';

        ctx.fillText(label, 0, 0);

        // Tier stars or indicator
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px monospace';
        ctx.fillText(`T${this.tier}`, 0, 19);

        ctx.restore();
    }
}
