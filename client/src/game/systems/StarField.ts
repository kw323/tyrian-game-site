interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
}

export class StarField {
    private canvasWidth: number;
    private canvasHeight: number;
    private stars: Star[] = [];
    private starCount: number;

    constructor(canvasWidth: number, canvasHeight: number, starCount: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.starCount = starCount;
        this.initStars();
    }

    private initStars(): void {
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                size: Math.random() * 2.5 + 1,
                speed: Math.random() * 3 + 1
            });
        }
    }

    public update(deltaTime: number): void {
        for (let star of this.stars) {
            star.y += star.speed * deltaTime * 60;
            if (star.y > this.canvasHeight) {
                star.y = -5;
                star.x = Math.random() * this.canvasWidth;
                star.speed = Math.random() * 3 + 1;
                star.size = Math.random() * 2.5 + 1;
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        for (let star of this.stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, star.size / 3)})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
