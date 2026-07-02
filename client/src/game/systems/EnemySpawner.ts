import { EnemyAdvanced, EnemyMovementType } from '../entities/EnemyAdvanced';

export class EnemySpawner {
    private spawnRate: number = 1.5; // seconds between spawns
    private lastSpawnTime: number = 0;
    private waveCount: number = 0;
    private enemiesPerWave: number = 2;
    private totalEnemiesSpawned: number = 0;
    private enemiesRequiredForLevel: number = 15; // Must destroy 15 enemies to complete level

    public update(deltaTime: number, entities: any[], level: number): EnemyAdvanced[] {
        const newEnemies: EnemyAdvanced[] = [];
        const currentTime = performance.now() / 1000;

        if (currentTime - this.lastSpawnTime >= this.spawnRate) {
            this.lastSpawnTime = currentTime;
            this.waveCount++;

            // Spawn wave of enemies with different types and movement patterns based on level
            for (let i = 0; i < this.enemiesPerWave; i++) {
                const x = 100 + i * 250;
                const y = -50;
                
                // Determine movement type based on level
                let movementType = EnemyMovementType.STRAIGHT_DOWN;
                let health = 1 + Math.floor(level / 2); // Health increases with level
                let speed = 2 + (level - 1) * 0.3;
                let difficulty = Math.min(1 + Math.floor(level / 3), 5);

                // Level-based enemy variety
                if (level >= 2) {
                    const typeRandom = Math.random();
                    
                    if (level < 3) {
                        // Levels 2: Introduce zigzag
                        if (typeRandom < 0.5) {
                            movementType = EnemyMovementType.ZIGZAG;
                        }
                    } else if (level < 5) {
                        // Levels 3-4: Add circles and spirals
                        if (typeRandom < 0.3) {
                            movementType = EnemyMovementType.ZIGZAG;
                        } else if (typeRandom < 0.6) {
                            movementType = EnemyMovementType.CIRCLE;
                        } else if (typeRandom < 0.8) {
                            movementType = EnemyMovementType.SPIRAL;
                        }
                    } else {
                        // Levels 5+: All movement types
                        const rand = Math.random();
                        if (rand < 0.2) {
                            movementType = EnemyMovementType.ZIGZAG;
                        } else if (rand < 0.4) {
                            movementType = EnemyMovementType.CIRCLE;
                        } else if (rand < 0.6) {
                            movementType = EnemyMovementType.SPIRAL;
                        } else if (rand < 0.8) {
                            movementType = EnemyMovementType.CENTER_ORBIT;
                        } else {
                            movementType = EnemyMovementType.HOVER;
                        }
                    }
                }

                // Increase health with difficulty
                health = 1 + difficulty;

                const enemy = new EnemyAdvanced(
                    x,
                    y,
                    30,
                    25,
                    speed,
                    health,
                    movementType,
                    difficulty
                );
                
                newEnemies.push(enemy);
                this.totalEnemiesSpawned++;
            }
        }

        return newEnemies;
    }

    public getTotalSpawned(): number {
        return this.totalEnemiesSpawned;
    }

    public getEnemyTypes(): string {
        return 'Mixed';
    }

    public getEnemiesRequiredForLevel(): number {
        return this.enemiesRequiredForLevel;
    }

    public reset(): void {
        this.spawnRate = 1.5;
        this.lastSpawnTime = 0;
        this.waveCount = 0;
        this.enemiesPerWave = 2;
        this.totalEnemiesSpawned = 0;
    }

    public increaseDifficulty(): void {
        this.enemiesPerWave = Math.min(this.enemiesPerWave + 1, 5);
        this.spawnRate = Math.max(this.spawnRate - 0.2, 0.8);
        this.enemiesRequiredForLevel = Math.min(this.enemiesRequiredForLevel + 5, 50);
    }
}
