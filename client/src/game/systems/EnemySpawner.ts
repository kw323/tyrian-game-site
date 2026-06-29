import { EnemyAdvanced, EnemyType } from '../entities/EnemyType';

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

            // Spawn wave of enemies with different types based on level
            for (let i = 0; i < this.enemiesPerWave; i++) {
                const x = 100 + i * 250;
                const y = -50;
                let type = EnemyType.STRAIGHT;
                let speed = 2;

                // Vary enemy types based on level
                if (level >= 2) {
                    const typeRandom = Math.random();
                    if (typeRandom < 0.3) {
                        type = EnemyType.HOMING;
                    } else if (typeRandom < 0.6) {
                        type = EnemyType.ZIGZAG;
                    } else if (typeRandom < 0.9) {
                        type = EnemyType.SWEEPER;
                    }
                }

                // Increase speed with level
                speed = 2 + (level - 1) * 0.5;

                const enemy = new EnemyAdvanced(x, y, 30, 25, speed, 2, type);
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
