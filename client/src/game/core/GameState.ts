export class GameState {
    public score: number = 0;
    public lives: number = 3;
    public level: number = 1;
    public enemiesDefeated: number = 0;
    public gameOver: boolean = false;
    public isPaused: boolean = false;
    public levelComplete: boolean = false;
    public showLevelScreen: boolean = false;
    public levelStartTime: number = 0;
    public levelDuration: number = 60; // seconds per level (60 + 10 per level)
    public levelTimeElapsed: number = 0;

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
        // This method is deprecated - use time-based progression instead
        return false;
    }

    public updateLevelTime(currentTime: number): void {
        if (this.levelStartTime === 0) {
            this.levelStartTime = currentTime;
        }
        this.levelTimeElapsed = currentTime - this.levelStartTime;
    }

    public isLevelComplete(): boolean {
        return this.levelTimeElapsed >= this.levelDuration;
    }

    public getLevelTimeRemaining(): number {
        return Math.max(0, this.levelDuration - this.levelTimeElapsed);
    }

    public nextLevel(): void {
        this.level++;
        this.levelComplete = false;
        this.showLevelScreen = false;
        this.enemiesDefeated = 0;
        this.levelStartTime = 0;
        this.levelTimeElapsed = 0;
        // Fixed level duration: always 60 seconds
        this.levelDuration = 60;
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
        this.levelStartTime = 0;
        this.levelTimeElapsed = 0;
        this.levelDuration = 60;
    }
}
