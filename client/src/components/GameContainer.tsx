import { useEffect, useRef, useState } from 'react';
import { Game } from '@/game/core/Game';
import { GameState } from '@/game/core/GameState';
import { Player } from '@/game/entities/Player';
import { Bullet } from '@/game/entities/Bullet';
import { HomingBullet } from '@/game/entities/HomingBullet';
import { HeavyBullet } from '@/game/entities/HeavyBullet';
import { Enemy } from '@/game/entities/Enemy';
import { EnemyAdvanced } from '@/game/entities/EnemyAdvanced';
import { EnemyBullet } from '@/game/entities/EnemyBullet';
import { Explosion } from '@/game/entities/Explosion';
import { WeaponUpgradeSystem, WeaponType } from '@/game/core/WeaponUpgradeSystem';
import { StarField } from '@/game/systems/StarField';
import { InputManager } from '@/game/systems/InputManager';
import { CollisionSystem } from '@/game/systems/CollisionSystem';
import { EnemySpawner } from '@/game/systems/EnemySpawner';
import { PowerSystem } from '@/game/core/PowerSystem';

export function GameContainer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        if (!canvasRef.current || !gameStarted) return;

        try {
            // Initialize game
            const game = new Game('gameCanvas', 800, 900);
            gameRef.current = game;

            // Initialize game state
            const gameState = new GameState();

            // Initialize systems
            const inputManager = new InputManager();
            const starField = new StarField(game.getCanvas().width, game.getCanvas().height, 150);
            const collisionSystem = new CollisionSystem();
            const enemySpawner = new EnemySpawner();
            const weaponSystem = new WeaponUpgradeSystem();
            const powerSystem = new PowerSystem();

            // Create player
            const player = new Player(
                game.getCanvas().width / 2 - 10,
                game.getCanvas().height - 100,
                20,
                50,
                15
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
                if (gameState.gameOver || gameState.isPaused || gameState.showLevelScreen) return;

                const keys = inputManager.getKeys();

                // Update player
                player.updateWithInput(deltaTime, keys, game.getCanvas().width, game.getCanvas().height);

                // Generate power
                powerSystem.generatePower(deltaTime);

                // Reduce player speed if power is low
                if (powerSystem.currentPower < 20) {
                    player.speed = 15 * 0.5; // Half speed when power is low
                } else {
                    player.speed = 15; // Normal speed
                }

                // Handle player shooting
                if (keys.Space && player.canShoot(performance.now() / 1000) && powerSystem.canShoot(player.weaponType, player.weaponLevel)) {
                    const bulletPositions = player.shoot(performance.now() / 1000);
                    const weaponCost = powerSystem.getWeaponCost(player.weaponType, player.weaponLevel);
                    powerSystem.consumePower(weaponCost);
                    
                    bulletPositions.forEach((bulletData: any) => {
                        if (bulletData.type === 'straight') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, player.weaponDamage, '#FFD700', bulletData.angle || 0);
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'spread') {
                            const bullet = new Bullet(bulletData.x, bulletData.y, 8, 8, 25, player.weaponDamage, '#FFD700', bulletData.angle || 0);
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'homing') {
                            // Find nearest enemy
                            let nearestEnemy: any = null;
                            let nearestDist = Infinity;
                            game['entities'].forEach((entity: any) => {
                                if ((entity instanceof Enemy || entity instanceof EnemyAdvanced) && entity.isActive) {
                                    const dist = Math.sqrt((entity.x - bulletData.x) ** 2 + (entity.y - bulletData.y) ** 2);
                                    if (dist < nearestDist) {
                                        nearestDist = dist;
                                        nearestEnemy = entity;
                                    }
                                }
                            });
                            const targetX = nearestEnemy ? nearestEnemy.x + nearestEnemy.width / 2 : bulletData.x;
                            const targetY = nearestEnemy ? nearestEnemy.y + nearestEnemy.height / 2 : -50;
                            const bullet = new HomingBullet(bulletData.x, bulletData.y, 6, 6, 20, player.weaponDamage, targetX, targetY);
                            game.addEntity(bullet);
                        } else if (bulletData.type === 'heavy') {
                            const bullet = new HeavyBullet(bulletData.x, bulletData.y, 16, 16, 15, player.weaponDamage);
                            game.addEntity(bullet);
                        }
                    });
                }

                // Spawn enemies
                const newEnemies = enemySpawner.update(deltaTime, game['entities'], gameState.level);
                newEnemies.forEach(enemy => game.addEntity(enemy));

                // Enemy shooting
                game['entities'].forEach((entity: any) => {
                    if ((entity instanceof Enemy || entity instanceof EnemyAdvanced) && entity.canShoot(performance.now() / 1000)) {
                        const bulletPos = entity.shoot(performance.now() / 1000, player.x + player.width / 2, player.y + player.height / 2);
                        // Enemy bullet speed reduced to 5, shoots towards player
                        const enemyBullet = new EnemyBullet(bulletPos.x, bulletPos.y, 6, 6, 5, 1, bulletPos.dirX, bulletPos.dirY);
                        game.addEntity(enemyBullet);
                    }
                });

                // Call original update
                originalUpdate(deltaTime);

                // Handle collisions
                const collisions = collisionSystem.getCollisions();
                collisions.forEach((collision: any) => {
                    const { entityA, entityB } = collision;

                    // Player bullet hits enemy
                    if ((entityA instanceof Bullet || entityA instanceof HomingBullet || entityA instanceof HeavyBullet) && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        entityB.takeDamage(entityA.damage);
                        entityA.isActive = false;
                        if (!entityB.isActive) {
                            gameState.enemyDefeated();
                            const explosion = new Explosion(entityB.x + entityB.width / 2, entityB.y + entityB.height / 2, 20);
                            game.addEntity(explosion);
                        }
                    } else if ((entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && (entityB instanceof Bullet || entityB instanceof HomingBullet || entityB instanceof HeavyBullet)) {
                        entityA.takeDamage(entityB.damage);
                        entityB.isActive = false;
                        if (!entityA.isActive) {
                            gameState.enemyDefeated();
                            const explosion = new Explosion(entityA.x + entityA.width / 2, entityA.y + entityA.height / 2, 20);
                            game.addEntity(explosion);
                        }
                    }

                    // Enemy bullet hits player
                    if (entityA instanceof EnemyBullet && entityB instanceof Player) {
                        const isDead = player.takeDamage(entityA.damage);
                        entityA.isActive = false;
                        if (isDead) {
                            gameState.gameOver = true;
                        } else {
                            const explosion = new Explosion(player.x + player.width / 2, player.y + player.height / 2, 15);
                            game.addEntity(explosion);
                        }
                    } else if (entityA instanceof Player && entityB instanceof EnemyBullet) {
                        const isDead = player.takeDamage(entityB.damage);
                        entityB.isActive = false;
                        if (isDead) {
                            gameState.gameOver = true;
                        } else {
                            const explosion = new Explosion(player.x + player.width / 2, player.y + player.height / 2, 15);
                            game.addEntity(explosion);
                        }
                    }

                    // Enemy hits player
                    if ((entityA instanceof Enemy || entityA instanceof EnemyAdvanced) && entityB instanceof Player) {
                        const isDead = player.takeDamage(1);
                        entityA.isActive = false;
                        if (isDead) {
                            gameState.gameOver = true;
                        } else {
                            const explosion = new Explosion(entityA.x + entityA.width / 2, entityA.y + entityA.height / 2, 25);
                            game.addEntity(explosion);
                        }
                    } else if (entityA instanceof Player && (entityB instanceof Enemy || entityB instanceof EnemyAdvanced)) {
                        const isDead = player.takeDamage(1);
                        entityB.isActive = false;
                        if (isDead) {
                            gameState.gameOver = true;
                        } else {
                            const explosion = new Explosion(entityB.x + entityB.width / 2, entityB.y + entityB.height / 2, 25);
                            game.addEntity(explosion);
                        }
                    }
                });

                // Update level time and check if level is complete
                gameState.updateLevelTime(performance.now() / 1000);
                if (gameState.isLevelComplete()) {
                    gameState.levelComplete = true;
                    gameState.showLevelScreen = true;
                }
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
                ctx.fillStyle = '#00FF88';
                ctx.font = 'bold 18px Arial';
                ctx.fillText(`Score: ${gameState.score}`, 20, 30);
                ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 20, 55);
                ctx.fillText(`Level: ${gameState.level}`, 20, 80);
                // Display level timer instead of enemy count
                const timeRemaining = gameState.getLevelTimeRemaining();
                const timeMinutes = Math.floor(timeRemaining / 60);
                const timeSeconds = Math.floor(timeRemaining % 60);
                const timeDisplay = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;
                ctx.fillText(`Level Time: ${timeDisplay}`, 20, 105);
                ctx.fillText(`Enemies Killed: ${gameState.enemiesDefeated}`, 20, 130);

                // Draw shield bar
                const barWidth = 150;
                const barHeight = 12;
                const barX = 20;
                const barY = 150;
                ctx.fillStyle = '#333333';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                const shieldPercent = player.shield / player.maxShield;
                ctx.fillStyle = 'rgb(0, ' + Math.floor(200 * shieldPercent) + ', 255)';
                ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);
                ctx.strokeStyle = '#00CCDD';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = '#00CCDD';
                ctx.font = '12px Arial';
                ctx.fillText('Shield: ' + Math.floor(player.shield) + '/' + player.maxShield, barX + 160, barY + 10);

                // Draw power bar
                const powerBarY = 145;
                ctx.fillStyle = '#333333';
                ctx.fillRect(barX, powerBarY, barWidth, barHeight);
                const powerPercent = powerSystem.currentPower / powerSystem.getMaxPower();
                const powerColor = powerPercent > 0.5 ? 'rgb(255, ' + Math.floor(200 * powerPercent) + ', 0)' : 'rgb(255, 0, 0)';
                ctx.fillStyle = powerColor;
                ctx.fillRect(barX, powerBarY, barWidth * powerPercent, barHeight);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, powerBarY, barWidth, barHeight);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Power: ' + Math.floor(powerSystem.currentPower) + '/' + Math.floor(powerSystem.getMaxPower()), barX + 160, powerBarY + 10);

                // Level complete screen
                if (gameState.showLevelScreen) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('LEVEL COMPLETE!', game.getCanvas().width / 2, game.getCanvas().height / 2 - 80);

                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(`Level ${gameState.level} Complete!`, game.getCanvas().width / 2, game.getCanvas().height / 2 - 20);
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Score: ${gameState.score} | Enemies Killed: ${gameState.enemiesDefeated}`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 10);
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(`Next Level Duration: ${gameState.levelDuration + 10} seconds`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 35);
                    
                    ctx.fillStyle = '#00CCDD';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('WEAPONS:', 50, game.getCanvas().height / 2 - 20);
                    ctx.font = '14px Arial';
                    
                    // Display weapon options with current prices and selection indicator
                    const weaponOptions = [
                        { key: '1', name: 'Straight Shot', type: WeaponType.STRAIGHT },
                        { key: '2', name: 'Spread Shot', type: WeaponType.SPREAD },
                        { key: '3', name: 'Homing Missiles', type: WeaponType.HOMING },
                        { key: '4', name: 'Heavy Cannon', type: WeaponType.HEAVY }
                    ];
                    
                    // Display generator upgrade option
                    const generatorYPos = game.getCanvas().height / 2 + 10 + (weaponOptions.length * 25);
                    const generatorCost = powerSystem.generatorLevel < 5 ? 500 + (powerSystem.generatorLevel * 500) : 0;
                    const canUpgradeGenerator = powerSystem.canUpgradeGenerator() && gameState.score >= generatorCost;
                    const generatorColor = canUpgradeGenerator ? '#00FF88' : '#FF6666';
                    const generatorText = powerSystem.canUpgradeGenerator() 
                        ? `G. Generator Upgrade [Lvl ${powerSystem.generatorLevel}] (${generatorCost} pts)`
                        : `G. Generator Upgrade [MAX]`;
                    ctx.fillStyle = generatorColor;
                    ctx.font = '14px Arial';
                    ctx.fillText('  ' + generatorText, 70, generatorYPos);
                    
                    weaponOptions.forEach((weapon, index) => {
                        const yPos = game.getCanvas().height / 2 + 10 + (index * 25);
                        const upgradeInfo = weaponSystem.getWeaponLevels(weapon.type);
                        const currentLevel = weaponSystem.getCurrentLevel(weapon.type);
                        const isSelected = weaponSystem.getCurrentWeapon() === weapon.type;
                        const levels = upgradeInfo;
                        let nextLevel = null;
                        let nextCost = 0;
                        
                        if (currentLevel === -1 && levels.length > 0) {
                            nextLevel = levels[0];
                            nextCost = nextLevel.cost;
                        } else if (currentLevel >= 0 && currentLevel + 1 < levels.length) {
                            nextLevel = levels[currentLevel + 1];
                            nextCost = nextLevel.cost;
                        }
                        
                        const canAfford = nextLevel && gameState.score >= nextCost;
                        const canDowngrade = currentLevel > 0;
                        
                        // Determine display text
                        let displayText = `${weapon.key}. ${weapon.name}`;
                        let cost = 0;
                        let affordabilityColor = '#00CCDD';
                        
                        if (currentLevel === -1) {
                            // Not owned yet
                            if (nextLevel) {
                                cost = nextLevel.cost;
                                displayText += ` (${cost} pts)`;
                                affordabilityColor = canAfford ? '#00FF88' : '#FF6666';
                            }
                        } else {
                            // Already owned
                            displayText += ` [Lvl ${currentLevel + 1}]`;
                            if (nextLevel && currentLevel + 1 < 15) {
                                cost = nextLevel.cost;
                                displayText += ` -> Upgrade (${cost} pts)`;
                                affordabilityColor = canAfford ? '#00FF88' : '#FF6666';
                                if (canDowngrade) {
                                    displayText += ` | Shift+${weapon.key} to downgrade`;
                                }
                            } else {
                                displayText += ` [MAX]`;
                            }
                        }
                        
                        // Draw selection indicator
                        if (isSelected) {
                            ctx.fillStyle = '#00FF88';
                            ctx.fillText('► ' + displayText, 70, yPos);
                        } else {
                            ctx.fillStyle = affordabilityColor;
                            ctx.fillText('  ' + displayText, 70, yPos);
                        }
                    });
                    
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '12px Arial';
                    ctx.fillText('Press SPACE to continue', 50, game.getCanvas().height / 2 + 130);
                    
                    ctx.fillStyle = '#00FF88';
                    ctx.font = '11px Arial';
                    ctx.fillText('Green = Affordable | Red = Not enough points', 50, game.getCanvas().height / 2 + 150);
                    ctx.fillText('Shift+Number to downgrade and get 50% refund', 50, game.getCanvas().height / 2 + 165);
                }

                // Game over screen
                if (gameState.gameOver) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    ctx.fillStyle = '#FF3333';
                    ctx.font = 'bold 48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', game.getCanvas().width / 2, game.getCanvas().height / 2 - 40);

                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(`Final Score: ${gameState.score}`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 20);
                    ctx.fillText(`Level Reached: ${gameState.level}`, game.getCanvas().width / 2, game.getCanvas().height / 2 + 60);
                    
                    ctx.fillStyle = '#00CCDD';
                    ctx.font = '18px Arial';
                    ctx.fillText('Press SPACE to play again', game.getCanvas().width / 2, game.getCanvas().height / 2 + 110);
                    ctx.textAlign = 'left';
                }
            };

            // Handle key presses for weapon selection and level progression
            const handleKeyDown = (e: KeyboardEvent) => {
                // Weapon selection available anytime (except game over)
                if (!gameState.gameOver && !gameState.showLevelScreen) {
                    if (e.key === '1') {
                        e.preventDefault();
                        weaponSystem.setCurrentWeapon(WeaponType.STRAIGHT);
                        const stats = weaponSystem.getCurrentWeaponStats();
                        if (stats) player.setWeapon('straight', weaponSystem.getCurrentLevel(WeaponType.STRAIGHT), stats.fireRate, stats.damage);
                        return;
                    } else if (e.key === '2') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.SPREAD)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('spread', weaponSystem.getCurrentLevel(WeaponType.SPREAD), stats.fireRate, stats.damage);
                        }
                        return;
                    } else if (e.key === '3') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.HOMING)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('homing', weaponSystem.getCurrentLevel(WeaponType.HOMING), stats.fireRate, stats.damage);
                        }
                        return;
                    } else if (e.key === '4') {
                        e.preventDefault();
                        if (weaponSystem.setCurrentWeapon(WeaponType.HEAVY)) {
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('heavy', weaponSystem.getCurrentLevel(WeaponType.HEAVY), stats.fireRate, stats.damage);
                        }
                        return;
                    }
                }

                if (gameState.showLevelScreen) {
                    if (e.key === '1') {
                        e.preventDefault();
                        weaponSystem.setCurrentWeapon(WeaponType.STRAIGHT);
                        const stats = weaponSystem.getCurrentWeaponStats();
                        if (stats) player.setWeapon('straight', weaponSystem.getCurrentLevel(WeaponType.STRAIGHT), stats.fireRate, stats.damage);
                    } else if (e.key === '2') {
                        e.preventDefault();
                        const upgradeInfo = weaponSystem.upgradeWeapon(WeaponType.SPREAD, gameState.score);
                        if (upgradeInfo) {
                            gameState.score = gameState.score - upgradeInfo.cost + upgradeInfo.refund;
                            weaponSystem.setCurrentWeapon(WeaponType.SPREAD);
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('spread', weaponSystem.getCurrentLevel(WeaponType.SPREAD), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === 'Shift' && e.code === 'Digit2') {
                        // Shift+2 to downgrade Spread Shot
                        e.preventDefault();
                        const downgradeInfo = weaponSystem.downgradeWeapon(WeaponType.SPREAD);
                        if (downgradeInfo) {
                            gameState.score += downgradeInfo.refund;
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('spread', weaponSystem.getCurrentLevel(WeaponType.SPREAD), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === '3') {
                        e.preventDefault();
                        const upgradeInfo = weaponSystem.upgradeWeapon(WeaponType.HOMING, gameState.score);
                        if (upgradeInfo) {
                            gameState.score = gameState.score - upgradeInfo.cost + upgradeInfo.refund;
                            weaponSystem.setCurrentWeapon(WeaponType.HOMING);
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('homing', weaponSystem.getCurrentLevel(WeaponType.HOMING), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === 'Shift' && e.code === 'Digit3') {
                        // Shift+3 to downgrade Homing Missiles
                        e.preventDefault();
                        const downgradeInfo = weaponSystem.downgradeWeapon(WeaponType.HOMING);
                        if (downgradeInfo) {
                            gameState.score += downgradeInfo.refund;
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('homing', weaponSystem.getCurrentLevel(WeaponType.HOMING), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === '4') {
                        e.preventDefault();
                        const upgradeInfo = weaponSystem.upgradeWeapon(WeaponType.HEAVY, gameState.score);
                        if (upgradeInfo) {
                            gameState.score = gameState.score - upgradeInfo.cost + upgradeInfo.refund;
                            weaponSystem.setCurrentWeapon(WeaponType.HEAVY);
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('heavy', weaponSystem.getCurrentLevel(WeaponType.HEAVY), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === 'Shift' && e.code === 'Digit4') {
                        // Shift+4 to downgrade Heavy Cannon
                        e.preventDefault();
                        const downgradeInfo = weaponSystem.downgradeWeapon(WeaponType.HEAVY);
                        if (downgradeInfo) {
                            gameState.score += downgradeInfo.refund;
                            const stats = weaponSystem.getCurrentWeaponStats();
                            if (stats) player.setWeapon('heavy', weaponSystem.getCurrentLevel(WeaponType.HEAVY), stats.fireRate, stats.damage);
                        }
                    } else if (e.key === 'g' || e.key === 'G') {
                        e.preventDefault();
                        if (powerSystem.canUpgradeGenerator()) {
                            const cost = 500 + (powerSystem.generatorLevel * 500);
                            if (gameState.score >= cost) {
                                gameState.score -= cost;
                                powerSystem.upgradeGenerator();
                            }
                        }
                    } else if (e.key === ' ') {
                        e.preventDefault();
                        gameState.nextLevel();
                        enemySpawner.reset();
                        enemySpawner.increaseDifficulty();
                        game['entities'] = [player];
                    }
                } else if (gameState.gameOver) {
                    if (e.key === ' ') {
                        e.preventDefault();
                        gameState.reset();
                        enemySpawner.reset();
                        game['entities'] = [player];
                        player.x = game.getCanvas().width / 2 - 10;
                        player.y = game.getCanvas().height - 100;
                        weaponSystem.reset();
                        player.setWeapon('straight', 0, 6, 10);
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            // Start the game
            console.log('Starting game...');
            game.start();

            // Cleanup
            return () => {
                game.stop();
                window.removeEventListener('keydown', handleKeyDown);
            };
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }, [gameStarted]);

    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-green-400 mb-4">Tyrian 2000</h2>
                    <p className="text-gray-300 mb-8 max-w-md">
                        Destroy enemies to complete each level. Each level requires more enemies defeated to progress. Survive and reach the highest level!
                    </p>
                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Start Game
                    </button>
                </div>
            </div>
        );
    }

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
