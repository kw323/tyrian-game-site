import { Entity } from '../core/Entity';

interface Collision {
    entityA: Entity;
    entityB: Entity;
}

export class CollisionSystem {
    private collisions: Collision[] = [];

    public update(deltaTime: number, entities: Entity[]): void {
        this.collisions = [];

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                if (this.checkCollision(entities[i], entities[j])) {
                    this.collisions.push({
                        entityA: entities[i],
                        entityB: entities[j]
                    });
                }
            }
        }

        this.handleCollisions();
    }

    private checkCollision(entityA: Entity, entityB: Entity): boolean {
        return entityA.x < entityB.x + entityB.width &&
               entityA.x + entityA.width > entityB.x &&
               entityA.y < entityB.y + entityB.height &&
               entityA.y + entityA.height > entityB.y;
    }

    private handleCollisions(): void {
        for (let collision of this.collisions) {
            console.log('Collision detected:', collision.entityA.constructor.name, collision.entityB.constructor.name);
        }
    }

    public getCollisions(): Collision[] {
        return this.collisions;
    }
}
