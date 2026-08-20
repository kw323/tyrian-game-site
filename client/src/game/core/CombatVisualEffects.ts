import type { ElementalCoreType } from './ElementalCoreSystem';
import { getGraphicsQualityProfile, type GraphicsQuality, type GraphicsQualityProfile } from './GraphicsSettings';

export type VisualFaction = 'raiders' | 'military' | 'aliens' | 'neutral';

type ParticleKind = 'spark' | 'ember' | 'shard' | 'mist' | 'ring' | 'trail';

type VisualParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
    alpha: number;
    drag: number;
    kind: ParticleKind;
};

const ELEMENT_COLORS: Record<ElementalCoreType, readonly string[]> = {
    cryo: ['#DDFDFF', '#8FEAFF', '#4BB9FF'],
    fire: ['#FFF2B0', '#FFB347', '#FF5A36'],
    corrosion: ['#EEFFD0', '#B8EF68', '#77B63B'],
    kinetic: ['#FFFFFF', '#FFD166', '#FF9F1C'],
    plasma: ['#FFF2FF', '#F39CFF', '#A16BFF'],
};

const FACTION_COLORS: Record<VisualFaction, readonly string[]> = {
    raiders: ['#FFDB85', '#FF8E42', '#F05A4F'],
    military: ['#DDF8FF', '#78C7EE', '#4C90C4'],
    aliens: ['#F3D8FF', '#C786FF', '#6EE6CA'],
    neutral: ['#FFF2B0', '#FFAD4F', '#FF6B49'],
};

export class CombatVisualEffects {
    private particles: VisualParticle[] = [];
    private engineTimer = 0;
    private readonly quality: GraphicsQualityProfile;

    public constructor(graphicsQuality: GraphicsQuality = 'standard') {
        this.quality = getGraphicsQualityProfile(graphicsQuality);
    }

    public update(deltaTime: number): void {
        this.engineTimer = Math.max(0, this.engineTimer - deltaTime);
        this.particles.forEach((particle) => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            const drag = Math.pow(particle.drag, deltaTime * 60);
            particle.vx *= drag;
            particle.vy *= drag;
            if (particle.kind === 'mist') particle.size += deltaTime * 7;
            if (particle.kind === 'ring') particle.size += deltaTime * 28;
        });
        this.particles = this.particles.filter((particle) => particle.life > 0);
    }

    public spawnPlayerEngineTrail(
        x: number,
        y: number,
        width: number,
        height: number,
        activeCore: ElementalCoreType,
        moveX: number,
        moveY: number,
        intensity = 1,
    ): void {
        if (this.engineTimer > 0) return;
        this.engineTimer = Math.max(0.028, 0.06 - intensity * 0.01);
        const colors = ELEMENT_COLORS[activeCore];
        const lateralDrift = moveX * -18;
        const verticalDrift = 56 + Math.max(0, moveY) * 18;
        const offsets = this.quality.particleMultiplier < 0.7 ? [0] : [-0.22, 0.22];
        for (const offset of offsets) {
            this.addParticle({
                x: x + width * (0.5 + offset),
                y: y + height * 0.77,
                vx: lateralDrift + (Math.random() - 0.5) * 18,
                vy: verticalDrift + Math.random() * 34,
                size: 2.2 + Math.random() * 2.3,
                life: 0.20 + Math.random() * 0.14,
                maxLife: 0.34,
                color: colors[1 + Math.floor(Math.random() * 2)],
                alpha: 0.7,
                drag: 0.86,
                kind: 'trail',
            });
        }
    }

    public spawnElementImpact(x: number, y: number, core: ElementalCoreType, rank: number): void {
        const colors = ELEMENT_COLORS[core];
        const count = Math.max(2, Math.round((4 + Math.min(4, rank)) * this.quality.particleMultiplier));
        for (let index = 0; index < count; index++) {
            const angle = (Math.PI * 2 * index) / count + Math.random() * 0.55;
            const speed = 24 + Math.random() * 42 + rank * 3;
            this.addParticle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 1.8,
                life: 0.18 + Math.random() * 0.18,
                maxLife: 0.36,
                color: colors[index % colors.length],
                alpha: 0.82,
                drag: 0.9,
                kind: core === 'fire' ? 'ember' : core === 'cryo' ? 'shard' : 'spark',
            });
        }
        if ((core === 'plasma' || core === 'kinetic') && this.quality.particleMultiplier >= 0.7) {
            this.addParticle({
                x,
                y,
                vx: 0,
                vy: 0,
                size: 4 + rank,
                life: 0.20,
                maxLife: 0.20,
                color: colors[1],
                alpha: 0.58,
                drag: 1,
                kind: 'ring',
            });
        }
        if (core === 'corrosion' && this.quality.particleMultiplier >= 0.7) {
            this.addParticle({
                x,
                y,
                vx: 0,
                vy: 10,
                size: 4 + rank * 0.6,
                life: 0.42,
                maxLife: 0.42,
                color: colors[1],
                alpha: 0.28,
                drag: 0.97,
                kind: 'mist',
            });
        }
    }

    public spawnFactionExplosion(x: number, y: number, faction: VisualFaction, radius: number): void {
        const colors = FACTION_COLORS[faction];
        const count = Math.max(4, Math.round(Math.min(18, Math.round(radius * 0.35)) * this.quality.particleMultiplier));
        for (let index = 0; index < count; index++) {
            const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.35;
            const speed = radius * (1.1 + Math.random() * 1.5);
            this.addParticle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.4 + Math.random() * Math.max(1.6, radius * 0.07),
                life: 0.30 + Math.random() * 0.42,
                maxLife: 0.72,
                color: colors[index % colors.length],
                alpha: 0.8,
                drag: 0.94,
                kind: faction === 'aliens' ? 'mist' : index % 3 === 0 ? 'shard' : 'spark',
            });
        }
        if (this.quality.particleMultiplier >= 0.7) {
            this.addParticle({
                x,
                y,
                vx: 0,
                vy: 0,
                size: Math.max(8, radius * 0.45),
                life: 0.26,
                maxLife: 0.26,
                color: colors[1],
                alpha: 0.45,
                drag: 1,
                kind: 'ring',
            });
        }
    }

    public renderBehind(ctx: CanvasRenderingContext2D): void {
        this.renderParticles(ctx, new Set<ParticleKind>(['trail', 'mist']));
    }

    public renderOver(ctx: CanvasRenderingContext2D): void {
        this.renderParticles(ctx, new Set<ParticleKind>(['spark', 'ember', 'shard', 'ring']));
    }

    private renderParticles(ctx: CanvasRenderingContext2D, visibleKinds: Set<ParticleKind>): void {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach((particle) => {
            if (!visibleKinds.has(particle.kind)) return;
            const life = Math.max(0, particle.life / particle.maxLife);
            const alpha = particle.alpha * life;
            if (alpha <= 0.015) return;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.kind === 'trail' ? 8 : 5;
            if (particle.kind === 'ring') {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = Math.max(1, particle.size * 0.18);
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.stroke();
                return;
            }
            if (particle.kind === 'shard') {
                ctx.fillStyle = particle.color;
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(Math.atan2(particle.vy, particle.vx));
                ctx.fillRect(-particle.size * 1.8, -particle.size * 0.45, particle.size * 3.6, particle.size * 0.9);
                ctx.restore();
                return;
            }
            if (particle.kind === 'trail' || particle.kind === 'ember') {
                const length = particle.size * (particle.kind === 'trail' ? 4.5 : 2.8);
                const angle = Math.atan2(particle.vy, particle.vx);
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = particle.size;
                ctx.beginPath();
                ctx.moveTo(particle.x - Math.cos(angle) * length, particle.y - Math.sin(angle) * length);
                ctx.lineTo(particle.x, particle.y);
                ctx.stroke();
                return;
            }
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    private addParticle(particle: VisualParticle): void {
        this.particles.push(particle);
        if (this.particles.length > this.quality.maxParticles) {
            this.particles.splice(0, this.particles.length - this.quality.maxParticles);
        }
    }
}
