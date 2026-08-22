import { Boss } from './Boss';
import { EnemyBullet } from './EnemyBullet';
import { getWeaponRuntimeProfile, type RuntimeWeaponType } from '../core/WeaponRuntimeProfile';

export type SeraMirrorAbility = 'time_lock' | 'void_armor' | 'over_power' | 'phase_cloak' | null;

export interface SeraMirrorLoadout {
    shipTier: number;
    weaponType: string;
    weaponLevel: number;
    weaponFireRate: number;
    weaponDamage: number;
    weaponCost: number;
    maxHull: number;
    maxShield: number;
    shieldRegenRate: number;
    generatorLevel: number;
    generatorOutput: number;
    maxPower: number;
    ability: SeraMirrorAbility;
    abilityLevel: number;
    abilityDuration: number;
    abilityFireMultiplier: number;
    abilityShieldRegenMultiplier: number;
}

export interface SeraShot {
    type: 'straight' | 'spread' | 'homing' | 'heavy' | 'void_lance' | 'arc' | 'laser';
    x: number;
    y: number;
    angle: number;
    isSecondary?: boolean;
}

// Style: Sera's experimental craft is a rival prototype—agile, sharp, and visibly related to Program Zero without duplicating its silhouette.
export class SeraDuelEntity extends Boss {
    private duelTime = 0;
    private shotTimer = 0;
    private duelShotPattern = 0;
    private abilityElapsed = 0;
    private abilityCooldown = 0;
    private abilityActive = false;
    private pilotTarget = { x: 400, y: 650 };
    private threatSnapshot: Array<{ x: number; y: number }> = [];
    private mirrorLoadout: SeraMirrorLoadout | null = null;
    private currentPower = 100;
    private powerOutput = 15;
    private powerMax = 100;

    constructor(x: number, y: number, level: number) {
        super(x, y, level);
        this.maxHealth = 220 + level * 6;
        this.health = this.maxHealth;
        this.maxShield = 180 + level * 4;
        this.shield = this.maxShield;
        this.shieldRegenRate = 8;
        this.shootInterval = 1.15;
        this.color = '#ff557f';
    }

    public setMirrorLoadout(loadout: SeraMirrorLoadout): void {
        this.mirrorLoadout = { ...loadout };
        // Sera receives the pilot's exact weapon profile. Her durability is deliberately
        // larger than the pilot's so the encounter is an extended mirror duel, not a
        // two-volley exchange, while neither side receives a hidden damage discount.
        const volleyPressure = Math.max(10, loadout.weaponDamage * Math.max(1, loadout.weaponFireRate));
        this.maxHealth = Math.max(this.maxHealth, Math.round(Math.max(loadout.maxHull * 3.2, volleyPressure * 42)));
        this.health = this.maxHealth;
        this.maxShield = Math.max(900, Math.round(Math.max(loadout.maxShield * 3, volleyPressure * 11)));
        this.shield = this.maxShield;
        this.shieldRegenRate = Math.max(12, loadout.shieldRegenRate * 1.45);
        this.currentPower = Math.max(900, loadout.maxPower * 1.2);
        this.powerMax = this.currentPower;
        this.powerOutput = Math.max(120, loadout.generatorOutput);
        this.shootInterval = Math.max(0.07, 1 / Math.max(1, loadout.weaponFireRate));
        this.abilityCooldown = 4.5;
    }

    public getMirrorLoadout(): SeraMirrorLoadout | null {
        return this.mirrorLoadout;
    }

    public setPilotTarget(x: number, y: number): void {
        this.pilotTarget = { x, y };
    }

    public setThreatSnapshot(entities: Array<{ x: number; y: number; isActive?: boolean }>): void {
        this.threatSnapshot = entities
            .filter((entity) => entity.isActive !== false)
            .map((entity) => ({ x: entity.x, y: entity.y }));
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.duelTime += deltaTime;
        this.shotTimer += deltaTime;
        this.abilityCooldown = Math.max(0, this.abilityCooldown - deltaTime);

        if (this.mirrorLoadout) {
            this.currentPower = Math.min(this.powerMax, this.currentPower + this.powerOutput * deltaTime);
            const regenMultiplier = this.isOverPowered() ? this.mirrorLoadout.abilityShieldRegenMultiplier : 1;
            if (this.currentPower >= 3 && this.shield < this.maxShield) {
                const shieldGain = this.shieldRegenRate * regenMultiplier * deltaTime;
                this.shield = Math.min(this.maxShield, this.shield + shieldGain);
                this.currentPower = Math.max(0, this.currentPower - Math.min(3 * deltaTime, this.currentPower));
            }
            this.updateMirrorAbility(deltaTime);
        }

        const movementMode = Math.floor(this.duelTime / 5) % 3;
        const lateralAmplitude = movementMode === 0 ? 410 : movementMode === 1 ? 350 : 445;
        const baseX = 600 + Math.sin(this.duelTime * (0.82 + movementMode * 0.11)) * lateralAmplitude
            + Math.sin(this.duelTime * 2.24) * 94;
        const baseY = 132 + Math.cos(this.duelTime * (0.68 + movementMode * 0.08)) * 58;
        let dodgeX = 0;
        for (const threat of this.threatSnapshot) {
            const distance = Math.hypot(threat.x - this.x, threat.y - this.y);
            if (distance < 220 && threat.y < this.y + 110) {
                dodgeX += Math.max(-1, Math.min(1, (this.x - threat.x) / 72));
            }
        }
        const pilotBias = Math.max(-1, Math.min(1, (this.pilotTarget.x - this.x) / 155));
        const targetX = Math.max(52, Math.min(1100, baseX + dodgeX * 210 + pilotBias * 48));
        const targetY = Math.max(64, Math.min(286, baseY + Math.sin(this.duelTime * 1.9) * 16));
        const steering = Math.min(1, deltaTime * 6.2);
        this.x += (targetX - this.x) * steering;
        this.y += (targetY - this.y) * steering;
    }

    private updateMirrorAbility(deltaTime: number): void {
        if (!this.mirrorLoadout?.ability || this.mirrorLoadout.abilityLevel <= 0) return;
        if (this.abilityActive) {
            this.abilityElapsed += deltaTime;
            if (this.abilityElapsed >= this.mirrorLoadout.abilityDuration) {
                this.abilityActive = false;
                this.abilityElapsed = 0;
                this.abilityCooldown = 5.5;
            }
            return;
        }
        if (this.abilityCooldown <= 0 && this.duelTime >= 5 && this.currentPower >= this.powerMax * 0.65) {
            this.abilityActive = true;
            this.abilityElapsed = 0;
        }
    }

    public isMirrorAbilityActive(): boolean {
        return this.abilityActive;
    }

    public isTimeLockingPlayer(): boolean {
        return this.abilityActive && this.mirrorLoadout?.ability === 'time_lock';
    }

    public isVoidArmoredForDuel(): boolean {
        return this.abilityActive && this.mirrorLoadout?.ability === 'void_armor';
    }

    public isOverPowered(): boolean {
        return this.abilityActive && this.mirrorLoadout?.ability === 'over_power';
    }

    public getMirrorAbilityLabel(): string {
        return this.mirrorLoadout?.ability?.toUpperCase() ?? 'NONE';
    }

    public getCurrentPower(): number {
        return this.currentPower;
    }

    public canShoot(currentTime: number): boolean {
        void currentTime;
        return this.shotTimer >= (this.isOverPowered()
            ? this.shootInterval / Math.max(1, this.mirrorLoadout?.abilityFireMultiplier ?? 1)
            : this.shootInterval);
    }

    public shootMirror(): SeraShot[] {
        if (!this.mirrorLoadout || !this.canShoot(0)) return [];
        const cost = this.mirrorLoadout.weaponCost;
        if (!this.isOverPowered() && this.currentPower < cost) return [];
        this.shotTimer = 0;
        if (!this.isOverPowered()) this.currentPower = Math.max(0, this.currentPower - cost);

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        const level = this.mirrorLoadout.weaponLevel;
        const weaponType = this.mirrorLoadout.weaponType;
        const shots: SeraShot[] = [];
        const add = (type: SeraShot['type'], x: number, angle = 0, isSecondary = false): void => {
            shots.push({ type, x, y: centerY, angle, isSecondary });
        };

        const profile = getWeaponRuntimeProfile(weaponType as RuntimeWeaponType, level);
        const fan = (type: SeraShot['type'], count: number, spread: number, spacing: number, secondary = false): void => {
            const midpoint = (count - 1) / 2;
            for (let index = 0; index < count; index++) {
                const normalized = count === 1 ? 0 : (index - midpoint) / midpoint;
                add(type, centerX + (index - midpoint) * spacing, normalized * spread, secondary);
            }
        };

        if (weaponType === 'straight') {
            fan('straight', profile.projectileCount, 0, 10);
        } else if (weaponType === 'spread') {
            fan('spread', profile.projectileCount, profile.spreadAngle ?? 0.42, 10);
        } else if (weaponType === 'homing') {
            fan('homing', profile.projectileCount, 0.08, 14);
        } else if (weaponType === 'heavy') {
            fan('heavy', profile.projectileCount, 0.05, 16);
        } else if (weaponType === 'void_lance') {
            fan('void_lance', profile.projectileCount, 0.12, 0);
        } else if (weaponType === 'arc') {
            add('arc', centerX, 0);
        } else {
            add('laser', centerX, 0);
            const secondaryCount = profile.laserSecondaryBeamCount ?? 0;
            fan('laser', secondaryCount, profile.laserSecondaryAngle ?? 0.14, 0, true);
        }
        return shots;
    }

    public getMirrorShotDamage(type: SeraShot['type'], isSecondary = false): number {
        const baseDamage = this.mirrorLoadout?.weaponDamage ?? 10;
        const multiplier = type === 'heavy' ? 1.25 : type === 'void_lance' ? 1.35 : type === 'arc' ? 1.15 : type === 'laser' && isSecondary ? 0.45 : 1;
        return baseDamage * multiplier;
    }

    public getReward(): number {
        return Math.floor(15500 * 0.75);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const pulse = Math.sin(performance.now() / 180) * 0.5 + 0.5;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowColor = '#ff3e78';
        ctx.shadowBlur = 18 + pulse * 10;
        const hull = ctx.createLinearGradient(-36, -32, 36, 34);
        hull.addColorStop(0, '#ffe6ee');
        hull.addColorStop(0.22, '#ff668f');
        hull.addColorStop(0.58, '#7b2358');
        hull.addColorStop(1, '#21132f');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#ffd3df';
        ctx.lineWidth = 2;
        // Split-crescent silhouette: deliberately unlike the pilot's narrow, centered fighter.
        ctx.beginPath();
        ctx.moveTo(-7, -36);
        ctx.lineTo(18, -28);
        ctx.lineTo(34, -8);
        ctx.lineTo(28, 15);
        ctx.lineTo(9, 34);
        ctx.lineTo(1, 15);
        ctx.lineTo(-20, 29);
        ctx.lineTo(-36, 10);
        ctx.lineTo(-29, -12);
        ctx.lineTo(-16, -27);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Rival-program diagnostics and offset engine nacelles.
        ctx.strokeStyle = 'rgba(90, 241, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-27, -4);
        ctx.lineTo(-6, -18);
        ctx.lineTo(20, -10);
        ctx.moveTo(-24, 12);
        ctx.lineTo(3, 4);
        ctx.lineTo(25, 14);
        ctx.stroke();
        ctx.fillStyle = '#ff9dc0';
        ctx.fillRect(-30, 12, 7, 18);
        ctx.fillStyle = '#a88cff';
        ctx.fillRect(19, 4, 8, 23);
        ctx.fillStyle = 'rgba(255, 105, 170, 0.5)';
        ctx.beginPath();
        ctx.arc(-26, 31, 5 + pulse * 2, 0, Math.PI * 2);
        ctx.arc(23, 31, 5 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-2, -7, 8 + pulse * 2, 5 + pulse, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5af1ff';
        ctx.beginPath();
        ctx.ellipse(-2, -7, 4, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const barWidth = 104;
        const barHeight = 7;
        const left = this.x - barWidth / 2;
        const drawBar = (y: number, value: number, max: number, color: string, label: string): void => {
            ctx.fillStyle = 'rgba(4, 8, 18, 0.9)';
            ctx.fillRect(left - 2, y - 2, barWidth + 4, barHeight + 4);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(left, y, barWidth, barHeight);
            ctx.fillStyle = color;
            ctx.fillRect(left, y, barWidth * Math.max(0, Math.min(value / max, 1)), barHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, this.x, y - 4);
        };
        drawBar(this.y - 53, this.shield, this.maxShield, '#5af1ff', 'SERA SHIELD');
        drawBar(this.y + 43, this.health, this.maxHealth, '#ff557f', 'SERA HULL');
        ctx.fillStyle = this.isMirrorAbilityActive() ? '#c59cff' : '#ff9bb4';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`MIRROR // ${this.getMirrorAbilityLabel()}`, this.x, this.y + 65);
        if (this.shield > 0) {
            const shieldAlpha = Math.min(this.shield / this.maxShield, 1);
            ctx.strokeStyle = `rgba(255, 137, 205, ${0.25 + shieldAlpha * 0.55})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y + this.height / 2, 48 + pulse * 4, Math.PI * 0.18, Math.PI * 1.72);
            ctx.stroke();
            ctx.strokeStyle = `rgba(113, 232, 255, ${0.18 + shieldAlpha * 0.35})`;
            ctx.setLineDash([3, 6]);
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y + this.height / 2, 39 + pulse * 3, -Math.PI * 0.72, Math.PI * 0.76);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
