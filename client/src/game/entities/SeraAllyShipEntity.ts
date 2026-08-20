import { Entity } from '../core/Entity';
import { getWeaponRuntimeProfile } from '../core/WeaponRuntimeProfile';

export interface SeraAllyShot {
    type: 'laser';
    x: number;
    y: number;
    angle: number;
    isSecondary?: boolean;
}

export interface SeraAllyLoadout {
    shipTier: number;
    shipName: string;
    weaponType: 'laser';
    weaponLevel: number;
    weaponDamage: number;
    weaponFireRate: number;
    weaponCost: number;
    maxShield: number;
    shieldRegenRate: number;
    generatorLevel: number;
    generatorOutput: number;
    maxPower: number;
    ability: 'over_power';
    abilityLevel: number;
    abilityDuration: number;
    pilotInvestmentBudget: number;
}

export interface SeraCombatTarget {
    x: number;
    y: number;
    priority: 'boss' | 'mission' | 'threat' | 'enemy';
    healthRatio?: number;
}

export interface SeraThreatSnapshot {
    x: number;
    y: number;
}

export type SeraCombatState = 'HUNT' | 'INTERCEPT' | 'BOSS FOCUS';

// Sera is an autonomous assault wing: she selects targets, changes firing lanes and avoids
// nearby hostile projectiles instead of being locked to a decorative escort orbit.
export class SeraAllyShipEntity extends Entity {
    public readonly isFriendly = true;
    public readonly faction = 'player-allied' as const;
    public readonly color = '#32d8ff';
    public health: number;
    public maxHealth: number;
    public shield: number;
    public maxShield: number;
    public shieldRegenRate: number;
    private readonly loadout: SeraAllyLoadout;
    private combatTime = 0;
    private shotTimer = 0;
    private abilityElapsed = 0;
    private abilityCooldown = 2.5;
    private abilityActive = false;
    private currentPower: number;
    private playerAnchor = { x: 400, y: 760 };
    private combatTarget: SeraCombatTarget | null = null;
    private threats: SeraThreatSnapshot[] = [];
    private combatState: SeraCombatState = 'HUNT';

    constructor(x: number, y: number, loadout: SeraAllyLoadout) {
        super(x, y, 60, 80);
        this.loadout = { ...loadout };
        this.health = 7 + loadout.shipTier * 2;
        this.maxHealth = this.health;
        this.maxShield = loadout.maxShield;
        this.shield = this.maxShield;
        this.shieldRegenRate = loadout.shieldRegenRate;
        this.currentPower = loadout.maxPower;
    }

    public getLoadout(): SeraAllyLoadout {
        return { ...this.loadout };
    }

    public setEscortAnchor(x: number, y: number): void {
        this.playerAnchor = { x, y };
    }

    public setCombatSnapshot(targets: SeraCombatTarget[], threats: SeraThreatSnapshot[]): void {
        this.threats = threats;
        this.combatTarget = targets
            .map((target) => ({ target, score: this.scoreTarget(target) }))
            .sort((a, b) => b.score - a.score)[0]?.target ?? null;
        this.combatState = this.combatTarget?.priority === 'boss'
            ? 'BOSS FOCUS'
            : this.combatTarget?.priority === 'threat'
                ? 'INTERCEPT'
                : 'HUNT';
    }

    private scoreTarget(target: SeraCombatTarget): number {
        const priorityScore = target.priority === 'boss' ? 1000
            : target.priority === 'mission' ? 700
                : target.priority === 'threat' ? 520
                    : 250;
        const distance = Math.hypot(target.x - (this.x + this.width / 2), target.y - this.y);
        const lowHealthBonus = target.healthRatio !== undefined ? (1 - target.healthRatio) * 80 : 0;
        return priorityScore + lowHealthBonus - distance * 0.18;
    }

    public update(deltaTime: number): void {
        if (!this.isActive || this.isTimeFrozen) return;
        this.combatTime += deltaTime;
        this.shotTimer += deltaTime;
        this.abilityCooldown = Math.max(0, this.abilityCooldown - deltaTime);
        this.currentPower = Math.min(this.loadout.maxPower, this.currentPower + this.loadout.generatorOutput * deltaTime);

        if (this.shield < this.maxShield && this.currentPower >= 3) {
            const shieldGain = this.shieldRegenRate * deltaTime;
            this.shield = Math.min(this.maxShield, this.shield + shieldGain);
            this.currentPower = Math.max(0, this.currentPower - Math.min(3 * deltaTime, this.currentPower));
        }

        if (this.abilityActive) {
            this.abilityElapsed += deltaTime;
            if (this.abilityElapsed >= this.loadout.abilityDuration) {
                this.abilityActive = false;
                this.abilityElapsed = 0;
                this.abilityCooldown = 5.5;
            }
        } else if (
            this.abilityCooldown <= 0
            && this.combatTarget
            && this.combatTarget.priority !== 'enemy'
            && this.currentPower >= this.loadout.maxPower * 0.68
        ) {
            this.abilityActive = true;
            this.abilityElapsed = 0;
        }

        this.updateAssaultPosition(deltaTime);
    }

    private updateAssaultPosition(deltaTime: number): void {
        const target = this.combatTarget;
        let targetX = this.playerAnchor.x + 92;
        let targetY = this.playerAnchor.y - 155;
        if (target) {
            targetX = target.x + Math.sin(this.combatTime * 1.35) * 58;
            targetY = Math.max(300, Math.min(690, target.y + (target.priority === 'boss' ? 260 : 190)));
        }

        let dodgeX = 0;
        let dodgeY = 0;
        for (const threat of this.threats) {
            const deltaX = (this.x + this.width / 2) - threat.x;
            const deltaY = (this.y + this.height / 2) - threat.y;
            const distance = Math.hypot(deltaX, deltaY);
            if (distance < 170 && distance > 1) {
                const force = (170 - distance) / 170;
                dodgeX += (deltaX / distance) * 120 * force;
                dodgeY += (deltaY / distance) * 62 * force;
            }
        }

        targetX = Math.max(42, Math.min(736, targetX + dodgeX));
        targetY = Math.max(340, Math.min(760, targetY + dodgeY));
        const steering = Math.min(1, deltaTime * (this.combatState === 'BOSS FOCUS' ? 5.8 : 4.6));
        this.x += (targetX - this.x) * steering;
        this.y += (targetY - this.y) * steering;
    }

    public canShoot(): boolean {
        const effectiveFireRate = this.loadout.weaponFireRate * (this.abilityActive ? 1.72 : 1);
        return this.shotTimer >= Math.max(0.055, 1 / Math.max(1, effectiveFireRate))
            && (this.abilityActive || this.currentPower >= this.loadout.weaponCost);
    }

    public shoot(): SeraAllyShot[] {
        if (!this.canShoot()) return [];
        this.shotTimer = 0;
        if (!this.abilityActive) this.currentPower = Math.max(0, this.currentPower - this.loadout.weaponCost);

        const centerX = this.x + this.width / 2;
        const originY = this.y;
        const targetX = this.combatTarget?.x ?? centerX;
        const targetY = this.combatTarget?.y ?? Math.max(0, originY - 400);
        const primaryAngle = Math.atan2(targetX - centerX, Math.max(40, originY - targetY));
        const shots: SeraAllyShot[] = [{ type: 'laser', x: centerX, y: originY, angle: primaryAngle }];
        const profile = getWeaponRuntimeProfile('laser', this.loadout.weaponLevel);
        const secondaryCount = profile.laserSecondaryBeamCount ?? 0;
        const secondarySpread = profile.laserSecondaryAngle ?? 0.14;
        for (let index = 0; index < secondaryCount; index++) {
            const normalized = secondaryCount === 1 ? 0 : (index - (secondaryCount - 1) / 2) / ((secondaryCount - 1) / 2);
            shots.push({
                type: 'laser',
                x: centerX,
                y: originY,
                angle: primaryAngle + normalized * secondarySpread,
                isSecondary: true
            });
        }
        return shots;
    }

    public getShotDamage(isSecondary = false): number {
        return this.loadout.weaponDamage * (isSecondary ? 0.45 : 1);
    }

    public isOverPowered(): boolean {
        return this.abilityActive;
    }

    public getCombatState(): SeraCombatState {
        return this.combatState;
    }

    public isAlive(): boolean {
        return this.health > 0;
    }

    public takeDamage(damage: number): boolean {
        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield - damage);
            return false;
        }
        this.health -= 1;
        return !this.isAlive();
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;
        const centerX = x + w / 2;
        const pulse = Math.sin(this.combatTime * 5) * 0.5 + 0.5;
        ctx.save();
        ctx.shadowColor = this.abilityActive ? '#ffcf5c' : '#ff4fbc';
        ctx.shadowBlur = this.abilityActive ? 30 : 20;
        const hull = ctx.createLinearGradient(x, y, x + w, y + h);
        hull.addColorStop(0, '#fff0f8');
        hull.addColorStop(0.2, '#ff70b9');
        hull.addColorStop(0.58, '#722d82');
        hull.addColorStop(1, '#171839');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#ffd0ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, y - 7);
        ctx.lineTo(x + w * 0.78, y + h * 0.2);
        ctx.lineTo(x + w, y + h * 0.47);
        ctx.lineTo(x + w * 0.68, y + h * 0.52);
        ctx.lineTo(x + w * 0.82, y + h * 0.82);
        ctx.lineTo(centerX, y + h * 0.7);
        ctx.lineTo(x + w * 0.18, y + h * 0.82);
        ctx.lineTo(x + w * 0.32, y + h * 0.52);
        ctx.lineTo(x, y + h * 0.47);
        ctx.lineTo(x + w * 0.22, y + h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(93, 243, 255, 0.42)';
        ctx.beginPath();
        ctx.moveTo(centerX, y + h * 0.08);
        ctx.lineTo(x + w * 0.64, y + h * 0.44);
        ctx.lineTo(centerX, y + h * 0.6);
        ctx.lineTo(x + w * 0.36, y + h * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b8ffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(centerX, y + h * 0.3, w * 0.13, h * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.abilityActive ? '#ffd166' : '#5af1ff';
        ctx.beginPath();
        ctx.ellipse(centerX, y + h * 0.3, w * 0.07, h * 0.055, 0, 0, Math.PI * 2);
        ctx.fill();

        const flame = ctx.createLinearGradient(centerX, y + h * 0.7, centerX, y + h * 1.15);
        flame.addColorStop(0, '#ffffff');
        flame.addColorStop(0.3, '#5af1ff');
        flame.addColorStop(0.78, '#ff59bb');
        flame.addColorStop(1, 'rgba(255, 65, 181, 0)');
        ctx.fillStyle = flame;
        for (const engineX of [x + w * 0.3, x + w * 0.7]) {
            ctx.beginPath();
            ctx.moveTo(engineX - 3, y + h * 0.7);
            ctx.lineTo(engineX + 3, y + h * 0.7);
            ctx.lineTo(engineX, y + h * (1.08 + 0.04 * Math.sin(performance.now() / 80 + engineX)));
            ctx.closePath();
            ctx.fill();
        }

        if (this.shield > 0) {
            const shieldAlpha = Math.min(this.shield / this.maxShield, 1);
            ctx.strokeStyle = `rgba(90, 241, 255, ${0.28 + shieldAlpha * 0.55})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.ellipse(centerX, y + h / 2, w * 0.9, h * 0.62, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = `rgba(90, 241, 255, ${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, y + h / 2, 55 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#8dffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SERA // ASSAULT WING', centerX, y - 24);
        ctx.fillStyle = this.abilityActive ? '#ffd166' : '#8dffff';
        ctx.fillText(`${this.getCombatState()} // LASER MK-${this.loadout.weaponLevel + 1}${this.abilityActive ? ' // OVER POWER' : ''}`, centerX, y + h + 18);

        const drawBar = (barY: number, value: number, max: number, color: string, label: string): void => {
            const barWidth = 110;
            ctx.fillStyle = 'rgba(4, 8, 18, 0.9)';
            ctx.fillRect(centerX - barWidth / 2 - 2, barY - 2, barWidth + 4, 10);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(centerX - barWidth / 2, barY, barWidth, 6);
            ctx.fillStyle = color;
            ctx.fillRect(centerX - barWidth / 2, barY, barWidth * Math.max(0, Math.min(value / max, 1)), 6);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.fillText(label, centerX, barY - 4);
        };
        drawBar(y - 42, this.shield, this.maxShield, '#5af1ff', 'SERA SHIELD');
        drawBar(y + h + 28, this.health, this.maxHealth, '#ff70b9', 'SERA HULL');
        ctx.restore();
    }
}
