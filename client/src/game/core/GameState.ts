export class GameState {
    public score: number = 0;
    public lives: number = 3;
    public level: number = 1;
    public enemiesDefeated: number = 0;
    public gameOver: boolean = false;
    public isPaused: boolean = false;
    public levelComplete: boolean = false;
    public showLevelScreen: boolean = false;

    public addScore(points: number): void {
        this.score += points;
    }

    public loseLife(): void {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver = true;
        }
    }

    public gainLife(): void {
        this.lives++;
    }

    public enemyDefeated(): void {
        this.enemiesDefeated++;
        this.addScore(100);
    }

    public completeLevelCheck(enemiesRequiredForLevel: number): boolean {
        if (this.enemiesDefeated >= enemiesRequiredForLevel) {
            this.levelComplete = true;
            this.showLevelScreen = true;
            return true;
        }
        return false;
    }

    public nextLevel(): void {
        this.level++;
        this.levelComplete = false;
        this.showLevelScreen = false;
        this.enemiesDefeated = 0;
    }

    public togglePause(): void {
        this.isPaused = !this.isPaused;
    }

    public reset(): void {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemiesDefeated = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.levelComplete = false;
        this.showLevelScreen = false;
    }
}
