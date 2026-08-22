export type StageCombatEvent = 'standard' | 'swarm' | 'single' | 'ambush';
export type StageFaction = 'raiders' | 'military' | 'aliens';

interface EnemyBlueprint {
    type: EnemyType;
    movement: EnemyMovementType;
    width: number;
    height: number;
    baseHealth: number;
    healthPerLevel: number;
    speed: number;
    difficulty: number;
    points: number;
}

import { EnemyType, EnemyMovementType, EnemyAdvanced } from '../entities/EnemyAdvanced';
import { DifficultyProfile, DifficultySystem } from '../core/DifficultySystem';
import { getFactionWaveProfile } from '../core/EnemyCombatProfile';

export class EnemySpawner {
    /** Three fragments are needed; later signals provide recovery opportunities if one escapes. */
    public static readonly RESEARCH_COURIER_STAGES = [17, 37, 47, 67, 77, 97] as const;
    public static readonly RESEARCH_COURIER_APPEAR_AT = 28;
    public static readonly RESEARCH_COURIER_ESCAPE_AFTER = 5;
    private spawnRate: number = 1.5;
    private lastSpawnTime: number = 0;
    private waveCount: number = 0;
    private enemiesPerWave: number = 2;
    private totalEnemiesSpawned: number = 0;
    private enemiesRequiredForLevel: number = 15;
    private specialSpawnedForLevel: boolean = false;
    private stageCombatEvent: StageCombatEvent = 'standard';
    private currentStage: number = 1;
    private difficultyProfile: DifficultyProfile = DifficultySystem.get('pilot');

    public setDifficultyProfile(profile: DifficultyProfile): void {
        this.difficultyProfile = profile;
    }

    public configureStage(event: StageCombatEvent, stage: number = 1): void {
        this.stageCombatEvent = event;
        this.currentStage = stage;
    }

    public getFactionForStage(stage: number): StageFaction {
        // Bounty stages (multiples of 3) can feature raider bounties even in other sectors
        if (stage % 3 === 0 && stage <= 90) return 'raiders';
        if (stage <= 20) return 'raiders';
        if (stage <= 40) return 'military';
        if (stage <= 60) return 'aliens';
        if (stage <= 80) return 'military';
        return 'aliens';
    }

    public update(_deltaTime: number, _entities: any[], level: number, stageElapsed = 0): EnemyAdvanced[] {
        const newEnemies: EnemyAdvanced[] = [];
        // The Archon fight owns every reinforcement wave. Stage 101 must not receive
        // normal sector spawns, otherwise unrelated small craft dilute the scripted battle.
        if (level === 101) return newEnemies;
        const currentTime = performance.now() / 1000;
        const faction = this.getFactionForStage(level);
        const waveProfile = getFactionWaveProfile(faction);

        if (currentTime - this.lastSpawnTime < waveProfile.spawnRate) return newEnemies;

        this.lastSpawnTime = currentTime;
        this.waveCount++;

        // The singularity weapon is recovered from three rare alien research ships. They
        // appear only midway through selected non-boss missions and stay exposed for a short
        // five-second capture window, instead of being granted by every ninth-stage elite.
        const isResearchOpportunity = EnemySpawner.RESEARCH_COURIER_STAGES.includes(level as typeof EnemySpawner.RESEARCH_COURIER_STAGES[number]);
        if (isResearchOpportunity && stageElapsed >= EnemySpawner.RESEARCH_COURIER_APPEAR_AT && !this.specialSpawnedForLevel) {
            this.specialSpawnedForLevel = true;
            const blueprint = this.getBlueprint(EnemyType.EVASIVE_HUNTER, level, 'aliens');
            const difficultyTier = Math.floor(Math.max(0, level - 1) / 10);
            const health = Math.round((blueprint.baseHealth + Math.floor(level * blueprint.healthPerLevel)) * 1.35);
            const special = new EnemyAdvanced(
                520,
                72,
                blueprint.width,
                blueprint.height,
                blueprint.speed + difficultyTier * 0.12,
                health,
                blueprint.movement,
                blueprint.difficulty,
                blueprint.type,
                Math.floor((blueprint.points + difficultyTier * 240) * 0.75),
                false,
                0,
                1,
                true,
                'aliens'
            );
            special.applyDifficulty(this.difficultyProfile);
            special.points = Math.round(special.points * this.difficultyProfile.rewardMultiplier);
            this.totalEnemiesSpawned++;
            return [special];
        }

        const availableTypes = this.getAvailableTypes(level, faction);
        const chainableTypes = availableTypes.filter((type) => type !== EnemyType.SENTINEL);
        const singleType = availableTypes[Math.min(availableTypes.length - 1, Math.floor(Math.max(0, level - 1) / 8))];
        const eventType = this.stageCombatEvent === 'single'
            ? singleType
            : this.stageCombatEvent === 'swarm'
                ? availableTypes[(level + 1) % availableTypes.length]
                : null;
        const isAmbushWave = this.stageCombatEvent === 'ambush' && this.waveCount === 1;
        const isChainWave = level >= 2 && (this.waveCount % 3 === 0 || isAmbushWave);
        const waveType = eventType ?? (isChainWave
            ? chainableTypes[Math.floor(Math.random() * chainableTypes.length)]
            : null);
        const escalation = Math.floor(Math.max(0, level - 1) / 25);
        const count = this.stageCombatEvent === 'swarm'
            ? Math.min(waveProfile.swarmMin + escalation, waveProfile.swarmMax)
            : isAmbushWave
                ? Math.min(waveProfile.ambushMin + escalation, waveProfile.ambushMax)
                : this.stageCombatEvent === 'single'
                    ? Math.min(waveProfile.singleMin + Math.floor(escalation / 2), waveProfile.singleMax)
                    : isChainWave
                        ? Math.min(waveProfile.chainMin + escalation, waveProfile.chainMax)
                        : waveProfile.standardCount;
        const chainStartX = 50 + Math.random() * 1040;

        for (let i = 0; i < count; i++) {
            const enemyType = waveType ?? availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const blueprint = this.getBlueprint(enemyType, level, faction);
            const ambushSide = i % 2 === 0 ? 0 : 1;
            const x = isAmbushWave
                ? ambushSide === 0
                    ? 10 + i * 18
                    : Math.max(8, 1144 - blueprint.width - i * 18)
                : isChainWave
                    ? Math.max(8, Math.min(1152 - blueprint.width - 8, chainStartX - blueprint.width / 2))
                    : 8 + Math.random() * (1144 - blueprint.width);
            const y = -50 - (isChainWave ? i * (blueprint.height + (isAmbushWave ? 16 : 9)) : Math.random() * 70);
            const health = blueprint.baseHealth + Math.floor(Math.max(0, level - 1) * blueprint.healthPerLevel);
            const enemySpeed = blueprint.speed * (isChainWave ? 1.15 : 1) + Math.max(0, level - 2) * 0.04;
            const enemy = new EnemyAdvanced(
                x,
                y,
                blueprint.width,
                blueprint.height,
                enemySpeed,
                health,
                blueprint.movement,
                blueprint.difficulty,
                blueprint.type,
                Math.floor((blueprint.points + Math.max(0, level - 2) * 15) * 0.75),
                isChainWave,
                i,
                count,
                false,
                faction
            );
            enemy.applyDifficulty(this.difficultyProfile);
            enemy.points = Math.round(enemy.points * this.difficultyProfile.rewardMultiplier);
            newEnemies.push(enemy);
            this.totalEnemiesSpawned++;
        }

        return newEnemies;
    }

    private getAvailableTypes(level: number, faction: StageFaction): EnemyType[] {
        if (level < 2) return [EnemyType.SCOUT];
        if (faction === 'raiders') {
            return [EnemyType.SCOUT, EnemyType.DRONE, EnemyType.TANK];
        }
        if (faction === 'military') {
            return [EnemyType.SCOUT, EnemyType.DRONE, EnemyType.TANK, EnemyType.SENTINEL];
        }
        // Aliens have orbiter and center-orbit sentinel
        return [EnemyType.SCOUT, EnemyType.DRONE, EnemyType.ORBITER, EnemyType.SENTINEL];
    }

    private getBlueprint(type: EnemyType, _level: number, faction: StageFaction): EnemyBlueprint {
        let movement = EnemyMovementType.STRAIGHT_DOWN;
        if (faction === 'raiders') {
            movement = EnemyMovementType.STRAIGHT_DOWN; // Raiders rush straight down and try to pass
        } else if (faction === 'military') {
            movement = EnemyMovementType.HOVER; // Military holds lines and fires more
        } else {
            movement = EnemyMovementType.CIRCLE; // Aliens use organic/circular movement
        }

        switch (type) {
            case EnemyType.DRONE:
                return {
                    type,
                    movement: faction === 'raiders' ? EnemyMovementType.STRAIGHT_DOWN : movement,
                    width: 28,
                    height: 24,
                    baseHealth: 3,
                    healthPerLevel: 0.7,
                    speed: faction === 'raiders' ? 1.4 : 1.15,
                    difficulty: 2,
                    points: 180
                };
            case EnemyType.TANK:
                return {
                    type,
                    movement: faction === 'military' ? EnemyMovementType.HOVER : movement,
                    width: 42,
                    height: 34,
                    baseHealth: 8,
                    healthPerLevel: 1.2,
                    speed: 0.65,
                    difficulty: 4,
                    points: 450
                };
            case EnemyType.ORBITER:
                return {
                    type,
                    movement: EnemyMovementType.CIRCLE,
                    width: 34,
                    height: 30,
                    baseHealth: 5,
                    healthPerLevel: 0.9,
                    speed: 1.15,
                    difficulty: 3,
                    points: 300
                };
            case EnemyType.SENTINEL:
                return {
                    type,
                    movement: faction === 'aliens' ? EnemyMovementType.CENTER_ORBIT : EnemyMovementType.HOVER,
                    width: 38,
                    height: 34,
                    baseHealth: 7,
                    healthPerLevel: 1.1,
                    speed: 0.95,
                    difficulty: 5,
                    points: 600
                };
            case EnemyType.EVASIVE_HUNTER:
                return {
                    type,
                    movement: EnemyMovementType.HOVER,
                    width: 46,
                    height: 38,
                    baseHealth: 120,
                    healthPerLevel: 7,
                    speed: 1.55,
                    difficulty: 5,
                    points: 1500
                };
            case EnemyType.SCOUT:
            default:
                return {
                    type: EnemyType.SCOUT,
                    movement: faction === 'raiders' ? EnemyMovementType.STRAIGHT_DOWN : EnemyMovementType.ZIGZAG,
                    width: 24,
                    height: 21,
                    baseHealth: 2,
                    healthPerLevel: 0.5,
                    speed: faction === 'raiders' ? 1.5 : 1.35,
                    difficulty: 1,
                    points: 100
                };
        }
    }

    public getTotalSpawned(): number {
        return this.totalEnemiesSpawned;
    }

    public getEnemyTypes(): string {
        return 'Scout, Drone, Tank, Orbiter, Sentinel, Evasive Hunter';
    }

    public getEnemiesRequiredForLevel(): number {
        return this.enemiesRequiredForLevel;
    }

    public reset(): void {
        this.spawnRate = 1.5;
        this.lastSpawnTime = 0;
        this.waveCount = 0;
        this.enemiesPerWave = 2;
        this.enemiesRequiredForLevel = 15;
        this.specialSpawnedForLevel = false;
        this.stageCombatEvent = 'standard';
        this.currentStage = 1;
    }

    public increaseDifficulty(): void {
        this.enemiesPerWave = Math.min(this.enemiesPerWave + 1, 5);
        this.spawnRate = Math.max(this.spawnRate - 0.2, 0.8);
        this.enemiesRequiredForLevel = Math.min(this.enemiesRequiredForLevel + 5, 50);
    }
}
