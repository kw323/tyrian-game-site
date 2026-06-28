export class Entity {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public isActive: boolean = true;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public update(deltaTime: number): void {
        // Base update logic, to be overridden by subclasses
    }

    public render(ctx: CanvasRenderingContext2D): void {
        // Base render logic, to be overridden by subclasses
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    public collidesWith(otherEntity: Entity): boolean {
        return this.x < otherEntity.x + otherEntity.width &&
               this.x + this.width > otherEntity.x &&
               this.y < otherEntity.y + otherEntity.height &&
               this.y + this.height > otherEntity.y;
    }
}
