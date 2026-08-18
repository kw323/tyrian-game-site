export enum EnemyMovementType {
    STRAIGHT_DOWN = 'straight',
    ZIGZAG = 'zigzag',
    CIRCLE = 'circle',
    SPIRAL = 'spiral',
    CENTER_ORBIT = 'center_orbit',
    HOVER = 'hover'
}

export enum EnemyType {
    SCOUT = 'scout',
    DRONE = 'drone',
    TANK = 'tank',
    ORBITER = 'orbiter',
    SENTINEL = 'sentinel',
    EVASIVE_HUNTER = 'evasive_hunter'
}

export type EnemyBulletStyle = 'needle' | 'orb' | 'heavy' | 'plasma' | 'laser';

export interface EnemyShot {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    damage: number;
    color: string;
    style: EnemyBulletStyle;
}

import { Entity } from '../core/Entity';
import { AsteroidBeltEntity } from './AsteroidBeltEntity';
import { DifficultyProfile } from '../core/DifficultySystem';

export class EnemyAdvanced extends Entity {
    public speed: number;
    private readonly baseSpeed: number;
    private slowTimer: number = 0;
    private slowMultiplier: number = 1;
    public health: number;
    public maxHealth: number;
    public color: string;
    public shootCooldown: number = 1.5;
    public lastShotTime: number = 0;
    public spawnX: number;
    public timeAlive: number = 0;
    public movementType: EnemyMovementType;
    public difficulty: number = 1;
    public enemyType: EnemyType;
    public points: number;
    public rewardGranted: boolean = false;
    public readonly isSpecial: boolean;
    public bulletColor: string;
    public bulletStyle: EnemyBulletStyle;
    public isChainMember: boolean = false;
    public chainIndex: number = 0;
    public chainSize: number = 1;
    private chainTime: number = 0;
    private hasEnteredScreen: boolean = false;
    private knockbackX: number = 0;
    private knockbackY: number = 0;
    public faction: 'raiders' | 'military' | 'aliens' = 'raiders';
    private difficultyProfile: DifficultyProfile | null = null;
    private baseShootCooldown = 1.5;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        speed: number,
        health: number,
        movementType: EnemyMovementType,
        difficulty: number = 1,
        enemyType: EnemyType = EnemyType.SCOUT,
        points: number = 100,
        isChainMember: boolean = false,
        chainIndex: number = 0,
        chainSize: number = 1,
        isSpecial = false,
        faction: 'raiders' | 'military' | 'aliens' = 'raiders'
    ) {
        super(x, y, width, height);
        this.speed = speed;
        this.baseSpeed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
        this.movementType = movementType;
        this.difficulty = Math.min(difficulty, 5);
        this.enemyType = enemyType;
        this.points = points;
        this.isChainMember = isChainMember;
        this.chainIndex = chainIndex;
        this.chainSize = chainSize;
        this.isSpecial = isSpecial;
        this.faction = faction;
        this.chainTime = -chainIndex * 0.55;
        this.color = '#2EE6A6';
        this.bulletColor = '#8FFFF4';
        this.bulletStyle = 'needle';
        this.configureType();
        this.baseShootCooldown = this.shootCooldown;
        if (this.isChainMember) this.shootCooldown *= 1.25;
        this.baseShootCooldown = this.shootCooldown;
    }

    private configureType(): void {
        switch (this.enemyType) {
            case EnemyType.SCOUT:
                if (this.faction === 'raiders') {
                    this.color = '#FF7043';
                    this.bulletColor = '#FFAB91';
                    this.bulletStyle = 'needle';
                    this.shootCooldown = 3.8;
                } else if (this.faction === 'military') {
                    this.color = '#4DA6FF';
                    this.bulletColor = '#80D8FF';
                    this.bulletStyle = 'orb';
                    this.shootCooldown = 1.6;
                } else {
                    this.color = '#C77DFF';
                    this.bulletColor = '#E0A8FF';
                    this.bulletStyle = 'plasma';
                    this.shootCooldown = 2.2;
                }
                break;
            case EnemyType.DRONE:
                if (this.faction === 'raiders') {
                    this.color = '#D84315';
                    this.bulletColor = '#FFCCBC';
                    this.bulletStyle = 'orb';
                    this.shootCooldown = 3.2;
                } else if (this.faction === 'military') {
                    this.color = '#29B6F6';
                    this.bulletColor = '#B3E5FC';
                    this.bulletStyle = 'heavy';
                    this.shootCooldown = 1.4;
                } else {
                    this.color = '#AB47BC';
                    this.bulletColor = '#E1BEE7';
                    this.bulletStyle = 'plasma';
                    this.shootCooldown = 2.0;
                }
                break;
            case EnemyType.TANK:
                if (this.faction === 'raiders') {
                    this.color = '#BF360C';
                    this.bulletColor = '#FFCCBC';
                    this.bulletStyle = 'heavy';
                    this.shootCooldown = 4.0;
                } else if (this.faction === 'military') {
                    this.color = '#0288D1';
                    this.bulletColor = '#81D4FA';
                    this.bulletStyle = 'laser';
                    this.shootCooldown = 1.8;
                } else {
                    this.color = '#7B1FA2';
                    this.bulletColor = '#CE93D8';
                    this.bulletStyle = 'plasma';
                    this.shootCooldown = 2.5;
                }
                break;
            case EnemyType.ORBITER:
                this.color = '#C77DFF';
                this.bulletColor = '#E0A8FF';
                this.bulletStyle = 'plasma';
                this.shootCooldown = 2.5;
                break;
            case EnemyType.SENTINEL:
                if (this.faction === 'military') {
                    this.color = '#01579B';
                    this.bulletColor = '#4FC3F7';
                    this.bulletStyle = 'laser';
                    this.shootCooldown = 1.5;
                } else {
                    this.color = '#F2D45C';
                    this.bulletColor = '#FFF0A6';
                    this.bulletStyle = 'laser';
                    this.shootCooldown = 2.0;
                }
                break;
            case EnemyType.EVASIVE_HUNTER:
                this.color = '#FF5C9A';
                this.bulletColor = '#FFB3D1';
                this.bulletStyle = 'plasma';
                this.shootCooldown = 2.15;
                break;
        }
    }

    private clampHorizontal(value: number): number {
        return Math.max(8, Math.min(1152 - this.width - 8, value));
    }

    public applyDifficulty(profile: DifficultyProfile): void {
        this.difficultyProfile = profile;
        this.maxHealth = Math.max(1, Math.round(this.maxHealth * profile.healthMultiplier));
        this.health = this.maxHealth;
        this.speed = this.baseSpeed * profile.speedMultiplier;
        this.shootCooldown = this.baseShootCooldown / profile.fireRateMultiplier;
    }

    public takeDamage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) {
            this.isActive = false;
        }
    }

    private threatSnapshot: Entity[] = [];
    public setThreatSnapshot(entities: Entity[]): void {
        this.threatSnapshot = entities;
    }

    public canShoot(_currentTime: number): boolean {
        return this.hasEnteredScreen && this.timeAlive - this.lastShotTime >= this.shootCooldown;
    }

    public shoot(_currentTime: number, playerX: number, playerY: number): EnemyShot | null {
        if (!this.hasEnteredScreen) return null;
        if (this.timeAlive - this.lastShotTime < this.shootCooldown) return null;
        this.lastShotTime = this.timeAlive;
        return this.generateShot(playerX, playerY);
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.timeAlive += deltaTime;
        if (this.difficultyProfile) {
            this.speed = this.slowTimer > 0 ? this.speed : this.baseSpeed * this.difficultyProfile.speedMultiplier;
        }
        if (this.slowTimer > 0) {
            this.slowTimer = Math.max(0, this.slowTimer - deltaTime);
            if (this.slowTimer === 0) this.speed = this.baseSpeed;
        }

        if (this.knockbackX !== 0 || this.knockbackY !== 0) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;
            this.knockbackX *= 0.82;
            this.knockbackY *= 0.82;
            if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;
        }

        let avoidanceX = 0;
        let avoidanceY = 0;
        if (this.threatSnapshot && this.threatSnapshot.length > 0) {
            for (const entity of this.threatSnapshot) {
                if (entity instanceof AsteroidBeltEntity && entity.isActive) {
                    const cx = entity.x + entity.width / 2;
                    const cy = entity.y + entity.height / 2;
                    const myCx = this.x + this.width / 2;
                    const myCy = this.y + this.height / 2;
                    const dx = myCx - cx;
                    const dy = myCy - cy;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 160 && dist > 1) {
                        const weight = (160 - dist) / 160;
                        avoidanceX += (dx / dist) * weight * 3.0;
                        avoidanceY += (dy / dist) * weight * 2.0;
                    }
                }
            }
        }

        if (this.isChainMember) {
            this.updateChainMovement(deltaTime);
        } else {
            switch (this.movementType) {
                case EnemyMovementType.STRAIGHT_DOWN:
                    this.y += this.speed * deltaTime * 60 * 1.3;
                    break;
                case EnemyMovementType.ZIGZAG:
                    this.y += this.speed * deltaTime * 60 * 0.8;
                    this.x = this.clampHorizontal(this.spawnX + Math.sin(this.timeAlive * 3.5) * 75);
                    break;
                case EnemyMovementType.CIRCLE:
                    this.y += this.speed * deltaTime * 60 * 0.7;
                    this.x = this.clampHorizontal(this.spawnX + Math.cos(this.timeAlive * 2.8) * 85);
                    break;
                case EnemyMovementType.SPIRAL:
                    this.y += this.speed * deltaTime * 60 * 0.75;
                    this.x = this.clampHorizontal(this.spawnX + Math.sin(this.timeAlive * 4) * (20 + this.timeAlive * 12));
                    break;
                case EnemyMovementType.CENTER_ORBIT: {
                    const targetY = 160 + Math.sin(this.timeAlive * 2) * 50;
                    if (this.y < targetY) {
                        this.y += this.speed * deltaTime * 60 * 1.1;
                    } else {
                        this.y += Math.cos(this.timeAlive * 3) * 0.6;
                    }
                    this.x = this.clampHorizontal(400 + Math.sin(this.timeAlive * 1.8) * 220);
                    break;
                }
                case EnemyMovementType.HOVER:
                default:
                    if (this.y < 140) {
                        this.y += this.speed * deltaTime * 60 * 0.9;
                    } else {
                        this.y += Math.sin(this.timeAlive * 1.5) * 0.4;
                    }
                    this.x = this.clampHorizontal(this.spawnX + Math.sin(this.timeAlive * 1.5) * 40);
                    break;
            }
        }

        this.x = this.clampHorizontal(this.x + avoidanceX);
        this.y += avoidanceY;

        if (this.y > -10 && this.y < 900) {
            this.hasEnteredScreen = true;
        }

        if (this.y > 900) {
            this.isActive = false;
        }
    }

    private updateChainMovement(deltaTime: number): void {
        this.chainTime += deltaTime * 1.25;
        const progress = Math.max(0, this.chainTime);
        const targetY = 60 + progress * 65 + this.chainIndex * 26;
        if (this.y < targetY) {
            this.y += this.speed * deltaTime * 60 * 1.2;
        } else {
            this.y = targetY;
        }
        this.x = this.clampHorizontal(this.spawnX + Math.sin(progress * 2.5 + this.chainIndex * 0.4) * 55);
    }

    public generateShot(playerX: number, playerY: number): EnemyShot {
        const centerX: number = Number(this.x) + Number(this.width) / 2;
        const centerY: number = Number(this.y) + Number(this.height) / 2;
        let dirX: number = 0;
        let dirY: number = 1;

        if (this.faction !== 'raiders' && this.enemyType !== EnemyType.SCOUT) {
            const angle = Math.atan2(playerY - centerY, playerX - centerX);
            dirX = Math.cos(angle);
            dirY = Math.sin(angle);
            if (dirY < 0.2) dirY = 0.2;
        }

        const profile = this.difficultyProfile;
        const speed: number = Number((this.bulletStyle === 'laser' ? 6.5 : this.bulletStyle === 'heavy' ? 4.2 : 5.0) * (profile?.speedMultiplier ?? 1));
        const damage: number = Number((this.enemyType === EnemyType.TANK ? 2 : this.enemyType === EnemyType.EVASIVE_HUNTER ? 3 : 1) * (profile?.damageMultiplier ?? 1));

        const shot: EnemyShot = {
            x: Number(centerX - 3),
            y: Number(centerY),
            dirX: Number(dirX),
            dirY: Number(dirY),
            speed: Number(speed),
            damage: Number(damage),
            color: String(this.bulletColor),
            style: this.bulletStyle
        };
        return shot;
    }

    public applyKnockback(dx: number, dy: number): void {
        this.knockbackX = dx;
        this.knockbackY = dy;
    }

    public slowDown(multiplier: number, duration: number): void {
        this.slowMultiplier = multiplier;
        this.speed = this.baseSpeed * multiplier;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;

        if (this.faction === 'raiders') {
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.lineTo(0, this.height / 3);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.faction === 'military') {
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 3);
            ctx.lineTo(this.width / 3, this.height / 2);
            ctx.lineTo(-this.width / 3, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#8FFFF4';
            ctx.beginPath();
            ctx.arc(0, -2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
