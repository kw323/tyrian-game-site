import { Entity } from '../core/Entity';
import { getWeaponRuntimeProfile } from '../core/WeaponRuntimeProfile';
import { getShipDefenseProfile } from '../core/ShipDefenseProfile';

export class Player extends Entity {
    public speed: number;
    public color: string = '#00FF88';
    public gunCooldown: number = 0.15;
    public baseGunCooldown: number = 0.15;
    public lastShotTime: number = 0;
    public weaponType: string = 'straight';
    public weaponLevel: number = 0;
    public weaponFireRate: number = 6;
    public weaponDamage: number = 10;
    public criticalChance: number = 0;
    public criticalDamageMultiplier: number = 1.75;
    public shield: number = 65;
    public maxShield: number = 65;
    public shieldRegenRate: number = 4;
    public baseShieldRegenRate: number = 4;
    /** Recovery pause after a hit prevents the shield from acting as permanent armor. */
    public shieldRegenDelay: number = 0;
    public health: number = 220;
    public maxHealth: number = 220;
    public weaponMasteryUnlocked: boolean = false;
    public shipTier: number = 0;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        super(x, y, width, height);
        this.speed = speed;
        const profile = getShipDefenseProfile(0);
        this.maxHealth = profile.hullHealth;
        this.health = profile.hullHealth;
        this.maxShield = profile.shieldCapacity;
        this.shield = profile.shieldCapacity;
        this.baseShieldRegenRate = profile.shieldRegenRate;
        this.shieldRegenRate = profile.shieldRegenRate;
    }

    public updateWithInput(deltaTime: number, keys: any, gameWidth: number, gameHeight: number): void {
        const keyboardX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
        const keyboardY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
        const moveX = typeof keys.moveX === 'number' ? keys.moveX : keyboardX;
        const moveY = typeof keys.moveY === 'number' ? keys.moveY : keyboardY;
        const magnitude = Math.hypot(moveX, moveY);
        const normalizer = Math.max(1, magnitude);
        const step = this.speed * deltaTime * 60;
        this.x = Math.max(0, Math.min(gameWidth - this.width, this.x + (moveX / normalizer) * step));
        this.y = Math.max(0, Math.min(gameHeight - this.height, this.y + (moveY / normalizer) * step));

        // The shield recovers only after the craft has been clear of damage for a moment.
        if (this.shieldRegenDelay > 0) {
            const remainingDelay = Math.max(0, this.shieldRegenDelay - deltaTime);
            this.shieldRegenDelay = remainingDelay < 0.0001 ? 0 : remainingDelay;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.shield + this.shieldRegenRate * deltaTime, this.maxShield);
        }
    }

    public update(deltaTime: number): void {
        // Base update, overridden by updateWithInput
    }

    /** Refill combat resources at a stage boundary while preserving upgrades. */
    public resetForStage(spawnX: number, spawnY: number): void {
        this.x = spawnX;
        this.y = spawnY;
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.shieldRegenDelay = 0;
        this.lastShotTime = 0;
        this.isActive = true;
    }

    // Style: luminous retro-futurist vector art; layered hulls and crisp silhouettes must remain readable in dense combat.
    public render(ctx: CanvasRenderingContext2D, isCloaked: boolean = false): void {
        const { x, y, width: w, height: h } = this;
        const centerX = x + w / 2;

        ctx.save();
        if (isCloaked) {
            ctx.globalAlpha = 0.22; // Semi-transparent ghost silhouette when cloaked
        }
        ctx.shadowColor = this.color;
        ctx.shadowBlur = isCloaked ? 4 : 18;

        // Distinct hull color palettes per ship tier (Mk.1 to Mk.6)
        const tierColors = ['#00FF88', '#00E5FF', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
        const activeColor = tierColors[Math.min(5, this.shipTier)] || '#00FF88';

        const hull = ctx.createLinearGradient(x, y, x + w, y + h);
        hull.addColorStop(0, '#ffffff');
        hull.addColorStop(0.18, activeColor);
        hull.addColorStop(0.58, this.shipTier >= 4 ? '#4a1d96' : '#087f9b');
        hull.addColorStop(1, '#031b33');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#b7ffff';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(centerX, y - 2);
        ctx.lineTo(x + w * 0.78, y + h * 0.24);
        ctx.lineTo(x + w, y + h * 0.42);
        ctx.lineTo(x + w * 0.7, y + h * 0.5);
        ctx.lineTo(x + w * 0.84, y + h * 0.92);
        ctx.lineTo(centerX, y + h * 0.75);
        ctx.lineTo(x + w * 0.16, y + h * 0.92);
        ctx.lineTo(x + w * 0.3, y + h * 0.5);
        ctx.lineTo(0 + x, y + h * 0.42);
        ctx.lineTo(x + w * 0.22, y + h * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(180, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(centerX, y + h * 0.12);
        ctx.lineTo(x + w * 0.64, y + h * 0.48);
        ctx.lineTo(centerX, y + h * 0.63);
        ctx.lineTo(x + w * 0.36, y + h * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d5ffff';
        ctx.stroke();

        const cockpit = ctx.createRadialGradient(centerX - 1, y + h * 0.33, 1, centerX, y + h * 0.37, 6);
        cockpit.addColorStop(0, '#ffffff');
        cockpit.addColorStop(0.25, '#7df9ff');
        cockpit.addColorStop(1, '#1764b8');
        ctx.fillStyle = cockpit;
        ctx.beginPath();
        ctx.ellipse(centerX, y + h * 0.35, w * 0.13, h * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        const flame = ctx.createLinearGradient(centerX, y + h * 0.75, centerX, y + h * 1.2);
        flame.addColorStop(0, '#ffffff');
        flame.addColorStop(0.25, '#66e8ff');
        flame.addColorStop(0.7, '#ff9c36');
        flame.addColorStop(1, 'rgba(255, 60, 20, 0)');
        ctx.fillStyle = flame;
        for (const engineX of [x + w * 0.32, x + w * 0.68]) {
            ctx.beginPath();
            ctx.moveTo(engineX - 2, y + h * 0.75);
            ctx.lineTo(engineX + 2, y + h * 0.75);
            ctx.lineTo(engineX, y + h * (1.08 + 0.04 * Math.sin(performance.now() / 80 + engineX)));
            ctx.closePath();
            ctx.fill();
        }

        if (this.shield > 0) {
            const shieldAlpha = Math.min(this.shield / this.maxShield, 1);
            ctx.strokeStyle = `rgba(80, 225, 255, ${0.25 + shieldAlpha * 0.55})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.ellipse(centerX, y + h / 2, w * 0.92, h * 0.62, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    public takeDamage(damage: number): boolean {
        let remainingDamage = Math.max(0, damage);
        if (remainingDamage <= 0) return this.health <= 0;

        this.shieldRegenDelay = 2.5;
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, remainingDamage);
            this.shield -= absorbed;
            remainingDamage -= absorbed;
        }

        // A depleted shield does not discard excess impact damage: it carries into the hull.
        if (remainingDamage > 0) {
            this.health = Math.max(0, this.health - remainingDamage);
        }
        return this.health <= 0;
    }

    public setCombatMultipliers(fireMultiplier: number, shieldRegenMultiplier: number): void {
        const safeFireMultiplier = Math.max(1, fireMultiplier);
        const safeShieldMultiplier = Math.max(1, shieldRegenMultiplier);
        this.gunCooldown = this.baseGunCooldown / safeFireMultiplier;
        this.shieldRegenRate = this.baseShieldRegenRate * safeShieldMultiplier;
    }

    public canShoot(currentTime: number): boolean {
        return (currentTime - this.lastShotTime) >= this.gunCooldown;
    }

    public shoot(currentTime: number): any[] {
        this.lastShotTime = currentTime;
        const centerX = this.x + this.width / 2;
        const centerY = this.y;
        const bullets = [];

        if (this.weaponType === 'straight') {
            const shotCount = getWeaponRuntimeProfile('straight', this.weaponLevel).projectileCount;
            const spacing = 9;
            const midpoint = (shotCount - 1) / 2;
            for (let index = 0; index < shotCount; index++) {
                bullets.push({
                    x: centerX + (index - midpoint) * spacing,
                    y: centerY,
                    type: 'straight',
                    angle: 0
                });
            }
        } else if (this.weaponType === 'spread') {
            const profile = getWeaponRuntimeProfile('spread', this.weaponLevel);
            const spreadCount = profile.projectileCount;
            const maxAngle = profile.spreadAngle ?? 0;
            const midpoint = (spreadCount - 1) / 2;
            for (let index = 0; index < spreadCount; index++) {
                const normalized = spreadCount === 1 ? 0 : (index - midpoint) / midpoint;
                bullets.push({
                    x: centerX + (index - midpoint) * 10,
                    y: centerY,
                    type: 'spread',
                    angle: normalized * maxAngle
                });
            }
        } else if (this.weaponType === 'homing') {
            const profile = getWeaponRuntimeProfile('homing', this.weaponLevel);
            const midpoint = (profile.projectileCount - 1) / 2;
            for (let index = 0; index < profile.projectileCount; index++) {
                bullets.push({
                    x: centerX + (index - midpoint) * 12,
                    y: centerY,
                    type: 'homing',
                    speed: profile.missileSpeed,
                    turnSpeed: profile.missileTurnSpeed
                });
            }
        } else if (this.weaponType === 'heavy') {
            const profile = getWeaponRuntimeProfile('heavy', this.weaponLevel);
            const midpoint = (profile.projectileCount - 1) / 2;
            for (let index = 0; index < profile.projectileCount; index++) {
                bullets.push({ x: centerX + (index - midpoint) * 24, y: centerY, type: 'heavy' });
            }
        } else if (this.weaponType === 'void_lance') {
            const profile = getWeaponRuntimeProfile('void_lance', this.weaponLevel);
            const midpoint = (profile.projectileCount - 1) / 2;
            for (let index = 0; index < profile.projectileCount; index++) {
                bullets.push({
                    x: centerX,
                    y: centerY - 24,
                    type: 'void_lance',
                    angle: (index - midpoint) * 0.08
                });
            }
        } else if (this.weaponType === 'laser') {
            const profile = getWeaponRuntimeProfile('laser', this.weaponLevel);
            bullets.push({ x: centerX, y: centerY, type: 'laser', angle: 0, isSecondary: false });
            const secondaryCount = profile.laserSecondaryBeamCount ?? 0;
            for (let index = 0; index < secondaryCount; index++) {
                const offset = index - (secondaryCount - 1) / 2;
                const angle = offset === 0 ? 0 : Math.sign(offset) * (profile.laserSecondaryAngle ?? 0) * Math.max(1, Math.abs(offset));
                bullets.push({ x: centerX, y: centerY, type: 'laser', angle, isSecondary: true });
            }
        }

        return bullets;
    }

    public setCriticalProfile(chance: number, damageMultiplier: number = 1.75): void {
        this.criticalChance = Math.max(0, Math.min(1, chance));
        this.criticalDamageMultiplier = Math.max(1, damageMultiplier);
    }

    public rollCriticalSalvo(): boolean {
        return this.criticalChance > 0 && Math.random() < this.criticalChance;
    }

    public setWeapon(type: string, level: number, fireRate: number, damage: number): void {
        this.weaponType = type;
        this.weaponLevel = level;
        this.weaponFireRate = fireRate;
        this.weaponDamage = this.weaponMasteryUnlocked ? Math.round(damage * 1.12) : damage;
        this.baseGunCooldown = 1 / fireRate;
        this.gunCooldown = this.baseGunCooldown / (this.weaponMasteryUnlocked ? 1.08 : 1);
    }
}
