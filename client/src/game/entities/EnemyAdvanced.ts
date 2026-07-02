import { Entity } from '../core/Entity';

export enum EnemyMovementType {
    STRAIGHT_DOWN = 'straight',
    ZIGZAG = 'zigzag',
    CIRCLE = 'circle',
    SPIRAL = 'spiral',
    CENTER_ORBIT = 'center_orbit',
    HOVER = 'hover'
}

export class EnemyAdvanced extends Entity {
    public speed: number;
    public health: number;
    public maxHealth: number;
    public color: string;
    public shootCooldown: number = 1.5;
    public lastShotTime: number = 0;
    public spawnX: number;
    public spawnY: number;
    public timeAlive: number = 0;
    public movementType: EnemyMovementType;
    public difficulty: number = 1; // 1-5, affects health and behavior

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        speed: number,
        health: number,
        movementType: EnemyMovementType,
        difficulty: number = 1
    ) {
        super(x, y, width, height);
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        this.spawnX = x;
        this.spawnY = y;
        this.movementType = movementType;
        this.difficulty = Math.min(difficulty, 5);
        
        // Color based on difficulty
        const colorMap: { [key: number]: string } = {
            1: '#FF3333',
            2: '#FF6600',
            3: '#FFFF00',
            4: '#FF00FF',
            5: '#00FFFF'
        };
        this.color = colorMap[this.difficulty] || '#FF3333';
    }

    public update(deltaTime: number): void {
        this.timeAlive += deltaTime;
        
        switch (this.movementType) {
            case EnemyMovementType.STRAIGHT_DOWN:
                this.y += this.speed * deltaTime * 60;
                break;
                
            case EnemyMovementType.ZIGZAG:
                this.y += this.speed * deltaTime * 60;
                this.x = this.spawnX + Math.sin(this.timeAlive * 3) * 50;
                break;
                
            case EnemyMovementType.CIRCLE:
                // Start from top, move in circle, then exit
                const circleRadius = 60;
                const circleProgress = (this.timeAlive * this.speed) / 30;
                this.x = this.spawnX + Math.cos(circleProgress) * circleRadius;
                this.y = this.spawnY + Math.sin(circleProgress) * circleRadius + (circleProgress * 20);
                break;
                
            case EnemyMovementType.SPIRAL:
                // Spiral down pattern
                const spiralRadius = 40 + (this.timeAlive * 10);
                const spiralAngle = this.timeAlive * 4;
                this.x = this.spawnX + Math.cos(spiralAngle) * spiralRadius;
                this.y = this.spawnY + Math.sin(spiralAngle) * spiralRadius + (this.timeAlive * this.speed * 30);
                break;
                
            case EnemyMovementType.CENTER_ORBIT:
                // Orbit around center of screen for a while, then leave
                const orbitRadius = 100;
                const centerX = 400;
                const centerY = 300;
                const orbitAngle = this.timeAlive * 2;
                this.x = centerX + Math.cos(orbitAngle) * orbitRadius;
                this.y = centerY + Math.sin(orbitAngle) * orbitRadius;
                
                // After 4 seconds, start moving down
                if (this.timeAlive > 4) {
                    this.y += (this.timeAlive - 4) * this.speed * deltaTime * 60;
                }
                break;
                
            case EnemyMovementType.HOVER:
                // Hover in place with slight bobbing
                this.y = this.spawnY + Math.sin(this.timeAlive * 2) * 20;
                this.x = this.spawnX + Math.cos(this.timeAlive * 1.5) * 15;
                break;
        }

        // Deactivate if far off-screen
        if (this.y > 1000 || this.x < -100 || this.x > 900) {
            this.isActive = false;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const { x, y, width: w, height: h } = this;

        // Draw enemy ship with difficulty indicator
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 + (this.difficulty * 5);
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.closePath();
        ctx.fill();

        // Draw difficulty indicator (spikes/points)
        ctx.shadowBlur = 0;
        for (let i = 1; i < this.difficulty; i++) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x + (w / this.difficulty) * i, y - 3);
            ctx.lineTo(x + (w / this.difficulty) * i - 2, y - 8);
            ctx.lineTo(x + (w / this.difficulty) * i + 2, y - 8);
            ctx.closePath();
            ctx.fill();
        }

        // Draw health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y - 5, w, 2);
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(x, y - 5, w * healthPercent, 2);
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.isActive = false;
        }
    }

    public canShoot(currentTime: number): boolean {
        return (currentTime - this.lastShotTime) >= this.shootCooldown;
    }

    public shoot(currentTime: number, playerX: number, playerY: number): { x: number; y: number; dirX: number; dirY: number } {
        this.lastShotTime = currentTime;
        const bulletX = this.x + this.width / 2;
        const bulletY = this.y + this.height;
        
        // Calculate direction towards player
        const dx = playerX - bulletX;
        const dy = playerY - bulletY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
            x: bulletX,
            y: bulletY,
            dirX: dx / distance,
            dirY: dy / distance
        };
    }
}
