import { Entity } from '../core/Entity';

// Style: layered vector explosion with a hot core, debris sparks, smoke wisps, and expanding shock rings.
type ExplosionParticle = {
    angle: number;
    distance: number;
    speed: number;
    size: number;
    life: number;
    drift: number;
    color: string;
};

export class Explosion extends Entity {
    public radius: number;
    public maxRadius: number;
    public duration: number;
    public elapsed: number = 0;
    public color: string;
    private readonly particles: ExplosionParticle[];

    constructor(x: number, y: number, radius: number, duration: number = 0.5, color: string = '#FF8800') {
        super(x, y, radius * 2, radius * 2);
        this.radius = radius;
        this.maxRadius = radius;
        this.duration = duration;
        this.color = color;
        this.particles = Array.from({ length: 22 }, (_, index) => ({
            angle: (index / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.55,
            distance: Math.random() * radius * 0.3,
            speed: radius * (0.8 + Math.random() * 1.6),
            size: Math.max(1.2, radius * (0.045 + Math.random() * 0.095)),
            life: 0.55 + Math.random() * 0.45,
            drift: (Math.random() - 0.5) * radius * 0.35,
            color: index % 4 === 0 ? '#fff7c2' : index % 3 === 0 ? '#ffcf66' : this.color,
        }));
    }

    public update(deltaTime: number): void {
        this.elapsed += deltaTime;
        const progress = Math.min(1, this.elapsed / this.duration);
        this.radius = this.maxRadius * (1 - progress * 0.88);
        this.particles.forEach((particle) => {
            particle.distance += particle.speed * deltaTime;
        });

        if (this.elapsed >= this.duration) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const progress = Math.min(1, this.elapsed / this.duration);
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, Math.max(2, this.radius));
        core.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        core.addColorStop(0.18, `rgba(255, 226, 124, ${alpha * 0.96})`);
        core.addColorStop(0.52, `rgba(255, 111, 38, ${alpha * 0.68})`);
        core.addColorStop(1, `rgba(255, 35, 20, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(2, this.radius), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 220, 112, ${alpha * 0.72})`;
        ctx.lineWidth = Math.max(1, this.maxRadius * 0.055);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.maxRadius * (0.3 + progress * 1.15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 94, 36, ${alpha * 0.42})`;
        ctx.lineWidth = Math.max(1, this.maxRadius * 0.025);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.maxRadius * (0.58 + progress * 0.95), 0, Math.PI * 2);
        ctx.stroke();

        this.particles.forEach((particle) => {
            const particleProgress = Math.min(1, particle.distance / (this.maxRadius * 1.45));
            const particleAlpha = Math.max(0, alpha * particle.life * (1 - particleProgress));
            if (particleAlpha <= 0) return;
            const px = this.x + Math.cos(particle.angle) * particle.distance + particle.drift * progress;
            const py = this.y + Math.sin(particle.angle) * particle.distance + particle.drift * progress;
            const tailX = px - Math.cos(particle.angle) * particle.size * 3.4;
            const tailY = py - Math.sin(particle.angle) * particle.size * 3.4;
            ctx.strokeStyle = `rgba(255, 157, 69, ${particleAlpha * 0.72})`;
            ctx.lineWidth = particle.size;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particleAlpha;
            ctx.beginPath();
            ctx.arc(px, py, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        ctx.restore();
    }
}
