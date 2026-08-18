import { Entity } from '../core/Entity';
import { DifficultyProfile } from '../core/DifficultySystem';

// Style: tactical objectives are active combatants with readable silhouettes, not passive placeholder boxes.
export interface MissionTargetShot {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    damage: number;
    color: string;
    style: 'needle' | 'pulse';
}

export class MissionTargetEntity extends Entity {
    public maxHealth: number;
    public health: number;
    public targetName: string;
    public missionType: string;
    public reward: number;
    public color: string;
    private pulseTimer = 0;
    private fireTimer = 0;
    private readonly startY: number;
    private readonly phase: number;
    private readonly convoyIndex: number;
    private horizontalDirection = 1;
    private difficultyProfile: DifficultyProfile | null = null;
    private baseMoveSpeed = 1;
    private baseFireCooldown = 1;
    private baseShotSpeed = 1;
    private baseShotDamage = 1;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        targetName: string,
        missionType: string,
        reward: number,
        convoyIndex = 0
    ) {
        super(x, y, width, height);
        this.targetName = targetName;
        this.missionType = missionType;
        this.reward = reward;
        this.startY = y;
        this.phase = convoyIndex * 0.9 + x * 0.004;
        this.convoyIndex = convoyIndex;
        this.maxHealth = (missionType === 'defense' ? 120 : missionType === 'escort' ? 90 : missionType === 'bounty' ? 80 : missionType === 'singularity' ? 150 : 40) * 4;
        this.health = this.maxHealth;
        this.baseMoveSpeed = missionType === 'bounty' ? 150 : missionType === 'escort' ? 46 : 0;
        this.baseFireCooldown = missionType === 'bounty' ? 1.7 : 2.8;
        this.baseShotSpeed = missionType === 'bounty' ? 2.45 : 2.05;
        this.baseShotDamage = missionType === 'bounty' ? 5 : 3;
        this.color = missionType === 'defense' ? '#00ffd5' : missionType === 'escort' ? '#5ab8ff' : missionType === 'bounty' ? '#ff66aa' : missionType === 'singularity' ? '#b06cff' : '#ffb700';
    }

    public applyDifficulty(profile: DifficultyProfile): void {
        this.difficultyProfile = profile;
        this.maxHealth = Math.max(1, Math.round(this.maxHealth * profile.healthMultiplier));
        this.health = this.maxHealth;
        this.reward = Math.round(this.reward * profile.rewardMultiplier);
    }

    public update(deltaTime: number): void {
        if (this.isTimeFrozen) return;
        this.pulseTimer += deltaTime * 4;
        this.fireTimer += deltaTime;

        if (this.missionType === 'bounty') {
            // The wanted ship sweeps the upper field, changes altitude, and bounces before escaping.
            this.x += this.horizontalDirection * this.baseMoveSpeed * (this.difficultyProfile?.speedMultiplier ?? 1) * deltaTime;
            this.y = this.startY + Math.sin(this.pulseTimer * 0.55 + this.phase) * 44;
            if (this.x < 46 || this.x + this.width > 754) {
                this.horizontalDirection *= -1;
                this.x = Math.max(46, Math.min(754 - this.width, this.x));
            }
        } else if (this.missionType === 'escort') {
            // Convoy units cross the combat lane while maintaining staggered vertical spacing.
            this.x += this.baseMoveSpeed * (this.difficultyProfile?.speedMultiplier ?? 1) * deltaTime;
            this.y = this.startY + Math.sin(this.pulseTimer * 0.6 + this.phase) * 18;
            if (this.x > 840) this.isActive = false;
        }
    }

    public takeDamage(amount: number): boolean {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    public isDefensiveObjective(): boolean {
        // Escort units are combatants, not a protection-failure mechanic. Defense remains available for a future true defense event.
        return this.missionType === 'defense';
    }

    public canShoot(): boolean {
        if (!this.isActive || (this.missionType !== 'bounty' && this.missionType !== 'escort')) return false;
        const cooldown = this.baseFireCooldown / (this.difficultyProfile?.fireRateMultiplier ?? 1);
        if (this.fireTimer < cooldown) return false;
        this.fireTimer = 0;
        return true;
    }

    public shootAt(targetX: number, targetY: number): MissionTargetShot {
        const originX = this.x + this.width / 2;
        const originY = this.y + this.height;
        const deltaX = targetX - originX;
        const deltaY = targetY - originY;
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const isBounty = this.missionType === 'bounty';
        return {
            x: originX,
            y: originY,
            dirX: deltaX / distance,
            dirY: deltaY / distance,
            speed: this.baseShotSpeed * (this.difficultyProfile?.speedMultiplier ?? 1),
            damage: this.baseShotDamage * (this.difficultyProfile?.damageMultiplier ?? 1),
            color: isBounty ? '#ff66aa' : '#5ab8ff',
            style: isBounty ? 'pulse' : 'needle'
        };
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const pulse = Math.sin(this.pulseTimer) * 0.5 + 0.5;

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 + pulse * 8;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = 'rgba(4, 18, 32, 0.88)';
        ctx.lineWidth = 2;

        if (this.missionType === 'defense') {
            // Station defense remains a distinct visual for future true defense events.
            ctx.beginPath();
            ctx.arc(centerX, centerY, w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#72ffe1';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, w / 2 + 9 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00ffd5';
            ctx.fillRect(centerX - 3, y - 8, 6, 16);
            ctx.fillRect(x - 8, centerY - 3, 16, 6);
        } else if (this.missionType === 'escort') {
            // Convoy unit: broad freighter hull, cargo spine, staggered engines, and a running light.
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x + 12, y + 8);
            ctx.lineTo(x + w - 10, y + 8);
            ctx.lineTo(x + w, centerY);
            ctx.lineTo(x + w - 10, y + h - 8);
            ctx.lineTo(x + 12, y + h - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#8bd4ff';
            ctx.fillRect(x + 15, centerY - 8, w - 30, 16);
            ctx.fillStyle = '#4b9fff';
            ctx.fillRect(x - 8, centerY - 10, 8, 7);
            ctx.fillRect(x - 8, centerY + 3, 8, 7);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + w - 9, centerY, 3 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#b9e8ff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`CONVOY ${this.convoyIndex + 1}`, centerX, y + h + 24);
        } else if (this.missionType === 'bounty') {
            // Wanted target: angular interceptor with visible engine flare and a hot pink threat core.
            ctx.beginPath();
            ctx.moveTo(centerX, y);
            ctx.lineTo(x + w, y + h * 0.68);
            ctx.lineTo(centerX + 7, y + h);
            ctx.lineTo(centerX, y + h * 0.76);
            ctx.lineTo(centerX - 7, y + h);
            ctx.lineTo(x, y + h * 0.68);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff3366';
            ctx.fillRect(centerX - 5, y + h * 0.3, 10, 9);
            ctx.fillStyle = '#ffb1d2';
            ctx.fillRect(centerX - 3, y + h + 2, 6, 10 + pulse * 5);
            ctx.strokeStyle = '#ffb1d2';
            ctx.beginPath();
            ctx.moveTo(x - 8, centerY);
            ctx.lineTo(x + 5, centerY);
            ctx.moveTo(x + w - 5, centerY);
            ctx.lineTo(x + w + 8, centerY);
            ctx.stroke();
        } else if (this.missionType === 'singularity') {
            ctx.beginPath();
            ctx.arc(centerX, centerY, w * 0.35 + pulse * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#e0b3ff';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, w * 0.62, h * 0.23 + pulse * 3, this.pulseTimer * 0.25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, w * 0.23, h * 0.62, -this.pulseTimer * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4 + pulse * 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Recovery / patrol visual retained for data-only stages that do not spawn a combat target.
            ctx.fillRect(x + 8, y + 12, w - 16, h - 12);
            ctx.strokeRect(x + 8, y + 12, w - 16, h - 12);
            ctx.beginPath();
            ctx.moveTo(centerX, y + 12);
            ctx.lineTo(centerX, y - 8);
            ctx.moveTo(centerX - 7, y - 2);
            ctx.lineTo(centerX, y - 8);
            ctx.lineTo(centerX + 7, y - 2);
            ctx.stroke();
            ctx.fillStyle = '#fff2a3';
            ctx.fillRect(x + 15, centerY - 4, 5, 8);
            ctx.fillRect(x + 24, centerY - 8, 5, 12);
            ctx.fillRect(x + 33, centerY - 12, 5, 16);
        }

        const barWidth = Math.max(52, w + 10);
        const barX = centerX - barWidth / 2;
        const barY = y - 18;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, 5);
        ctx.fillStyle = this.color;
        ctx.fillRect(barX, barY, barWidth * Math.max(0, this.health / this.maxHealth), 5);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.missionType.toUpperCase(), centerX, y + h + (this.missionType === 'escort' ? 36 : 14));
        ctx.restore();
    }
}

export default MissionTargetEntity;
