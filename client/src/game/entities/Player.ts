import { Entity } from '../core/Entity';

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
    public shield: number = 50;
    public maxShield: number = 50;
    public shieldRegenRate: number = 5; // Shield regenerates per second
    public baseShieldRegenRate: number = 5;
    public health: number = 4;
    public maxHealth: number = 4;
    public weaponMasteryUnlocked: boolean = false;
    public shipTier: number = 0;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        super(x, y, width, height);
        this.speed = speed;
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

        // Regenerate shield
        if (this.shield < this.maxShield) {
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
        if (this.shield > 0) {
            this.shield -= damage;
            if (this.shield < 0) {
                this.shield = 0;
            }
            return false; // Shield absorbed damage
        } else {
            this.health--;
            return this.health <= 0; // Return true if dead
        }
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
            // Parallel volleys increase at milestone levels instead of every level.
            const shotCount = this.weaponLevel <= 9
                ? 1 + Math.floor(this.weaponLevel / 2)
                : this.weaponLevel - 4;
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
            const spreadCount = this.weaponLevel < 3
                ? (this.weaponLevel === 0 ? 1 : 3)
                : Math.min(10, 5 + Math.floor((this.weaponLevel - 3) / 2));
            const maxAngle = Math.min(0.96, 0.54 + this.weaponLevel * 0.035);
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
            if (this.weaponLevel === 0) {
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
            } else if (this.weaponLevel === 1) {
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
            } else if (this.weaponLevel === 2 || this.weaponLevel === 3) {
                // Two missiles are enough to cover different targets without flooding the screen.
                bullets.push({ x: centerX - 10, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 10, y: centerY, type: 'homing' });
            } else if (this.weaponLevel >= 4) {
                // Cap the volley at three missiles; higher levels improve rate and damage.
                bullets.push({ x: centerX - 14, y: centerY, type: 'homing' });
                bullets.push({ x: centerX, y: centerY, type: 'homing' });
                bullets.push({ x: centerX + 14, y: centerY, type: 'homing' });
            }
        } else if (this.weaponType === 'heavy') {
            // Levels 0-2 (Level 0-2 index): 1 bomb (Levels 1-2 in 0-indexed: level 0 and 1)
            // Levels 2-5: 2 bombs; Levels 6-9: 3 bombs; Level 10-15: 4 bombs; Level 16-19: 8 bombs -> wait, let's map accurately to user request:
            // Levels 0-1 (Level 1-2): 1 bomb
            // Level 2-6 (Level 3-7): 2 bombs (with 3 bombs at level 7-9)
            // Let's implement exact counts: 1 bomb for 0-1, 2 bombs for 2-5, 3 bombs for 6-8, 4 bombs for 9-14, 5 bombs for 15-19, 8 bombs for 20-23, 10 bombs for 24+
            // User requested explicit counts:
            // Levels 1-2: 1 bomb
            // Levels 3-6: 2 bombs
            // Level 7-9: 3 bombs
            // Level 10-15: 4 bombs
            // Level 16-19: 5 bombs (large bombs)
            // Level 20-23: 3 large bombs (wait, user requested: 16 -> 2 large, 20 -> 3 large, 24 -> 4 large, 25 -> 5 large)
            if (this.weaponLevel <= 1) {
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 2 && this.weaponLevel <= 5) {
                bullets.push({ x: centerX - 14, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 14, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 6 && this.weaponLevel <= 8) {
                bullets.push({ x: centerX - 20, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 20, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 9 && this.weaponLevel <= 14) {
                bullets.push({ x: centerX - 28, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX - 10, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 10, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 28, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 15 && this.weaponLevel <= 18) {
                // 15 = 2 large bombs (Levels 16 is 2 large)
                bullets.push({ x: centerX - 20, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 20, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel >= 19 && this.weaponLevel <= 22) {
                // Level 20 = 3 large bombs
                bullets.push({ x: centerX - 28, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 28, y: centerY, type: 'heavy' });
            } else if (this.weaponLevel === 23) {
                // Level 24 = 4 large bombs
                bullets.push({ x: centerX - 32, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX - 12, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 12, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 32, y: centerY, type: 'heavy' });
            } else {
                // Level 25 = 5 large bombs
                bullets.push({ x: centerX - 38, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX - 20, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 20, y: centerY, type: 'heavy' });
                bullets.push({ x: centerX + 38, y: centerY, type: 'heavy' });
            }
        } else if (this.weaponType === 'void_lance') {
            const traceAngles = this.weaponLevel >= 6 ? [-0.1, 0, 0.1] : this.weaponLevel >= 2 ? [-0.08, 0.08] : [0];
            traceAngles.forEach((angle) => {
                // Spawn slightly ahead of the ship nose (centerY - 24) so it never touches or harms the player at birth
                bullets.push({ x: centerX, y: centerY - 24, type: 'void_lance', angle });
            });
        } else if (this.weaponType === 'laser') {
            // The laser is one continuous main beam. At level 7+ it adds two thinner angled beams.
            bullets.push({ x: centerX, y: centerY, type: 'laser', angle: 0, isSecondary: false });
            if (this.weaponLevel >= 6) {
                const secondaryAngle = 0.14 + Math.min(0.08, (this.weaponLevel - 6) * 0.012);
                bullets.push({ x: centerX, y: centerY, type: 'laser', angle: -secondaryAngle, isSecondary: true });
                bullets.push({ x: centerX, y: centerY, type: 'laser', angle: secondaryAngle, isSecondary: true });
            }
        }

        return bullets;
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
