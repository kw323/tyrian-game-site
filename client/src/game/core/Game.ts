export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private entities: any[] = [];
    private systems: any[] = [];
    private gameState: 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' = 'LOADING';
    private lastFrameTime: number = 0;
    private deltaTime: number = 0;
    private animationFrameId: number | null = null;

    constructor(canvasId: string, width: number, height: number) {
        const canvasElement = document.getElementById(canvasId);
        if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with ID '${canvasId}' not found.`);
        }

        this.canvas = canvasElement;
        this.canvas.width = width;
        this.canvas.height = height;

        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.ctx = context;

        this.init();
    }

    private init(): void {
        console.log('Game initialized. Ready to load assets...');
        this.gameState = 'PLAYING';
    }

    public addEntity(entity: any): void {
        this.entities.push(entity);
    }

    public addSystem(system: any): void {
        this.systems.push(system);
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    public getGameState(): string {
        return this.gameState;
    }

    public setGameState(state: 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'): void {
        this.gameState = state;
    }

    public update(deltaTime: number): void {
        if (this.gameState !== 'PLAYING') return;

        this.entities.forEach(entity => entity.update(deltaTime));
        this.systems.forEach(system => system.update(deltaTime, this.entities));

        this.entities = this.entities.filter(entity => entity.isActive);
    }

    public render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.entities.forEach(entity => entity.render(this.ctx));

        if (this.gameState === 'PLAYING') {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Entities: ${this.entities.length}`, 10, 30);
            this.ctx.fillText(`FPS: ${Math.round(1 / this.deltaTime)}`, 10, 50);
        }
    }

    private gameLoop = (currentTime: number): void => {
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        this.update(this.deltaTime);
        this.render();

        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    public start(): void {
        console.log('Game started.');
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    public stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
