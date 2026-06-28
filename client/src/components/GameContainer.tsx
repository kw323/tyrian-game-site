import { useEffect, useRef } from 'react';
import { Game } from '@/game/core/Game';
import { Player } from '@/game/entities/Player';
import { Bullet } from '@/game/entities/Bullet';
import { StarField } from '@/game/systems/StarField';
import { InputManager } from '@/game/systems/InputManager';
import { CollisionSystem } from '@/game/systems/CollisionSystem';

export function GameContainer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        try {
            // Initialize game
            const game = new Game('gameCanvas', 800, 600);
            gameRef.current = game;

            // Initialize systems
            const inputManager = new InputManager();
            const starField = new StarField(game.getCanvas().width, game.getCanvas().height, 150);
            const collisionSystem = new CollisionSystem();

            // Create player
            const player = new Player(
                game.getCanvas().width / 2 - 15,
                game.getCanvas().height - 80,
                30,
                30,
                200
            );
            game.addEntity(player);

            // Add systems
            game.addSystem(starField);
            game.addSystem(collisionSystem);

            // Store original methods
            const originalUpdate = game.update.bind(game);
            const originalRender = game.render.bind(game);

            // Override update
            game.update = function(deltaTime: number) {
                const keys = inputManager.getKeys();

                // Update player
                player.updateWithInput(deltaTime, keys, game.getCanvas().width, game.getCanvas().height);

                // Handle shooting
                if (keys.Space && player.canShoot(performance.now() / 1000)) {
                    const bulletPos = player.shoot(performance.now() / 1000);
                    const bullet = new Bullet(bulletPos.x, bulletPos.y, 8, 8, 400, 10, '#FFD700');
                    game.addEntity(bullet);
                }

                // Call original update
                originalUpdate(deltaTime);
            };

            // Override render
            game.render = function() {
                const ctx = game.getContext();
                ctx.clearRect(0, 0, game.getCanvas().width, game.getCanvas().height);
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                // Render starfield first
                starField.render(ctx);

                // Render entities
                game['entities'].forEach((entity: any) => entity.render(ctx));

                // Render UI
                if (game.getGameState() === 'PLAYING') {
                    ctx.fillStyle = '#666';
                    ctx.font = '14px Arial';
                    ctx.fillText(`Entities: ${game['entities'].length}`, 10, 30);
                    ctx.fillText(`FPS: ${Math.round(1 / game['deltaTime'])}`, 10, 50);
                }
            };

            // Start the game
            console.log('Starting game...');
            game.start();

            // Cleanup
            return () => {
                game.stop();
            };
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <canvas
                ref={canvasRef}
                id="gameCanvas"
                className="border-2 border-green-500 bg-black shadow-lg shadow-green-500/50"
            />
            <div className="text-center text-sm text-gray-400">
                <p>Use <span className="text-green-400 font-semibold">Arrow Keys</span> to move</p>
                <p>Press <span className="text-green-400 font-semibold">Space</span> to shoot</p>
            </div>
        </div>
    );
}
