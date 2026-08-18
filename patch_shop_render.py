from pathlib import Path

path = Path('/home/ubuntu/tyrian-game-site/client/src/components/GameContainer.tsx')
text = path.read_text()
start = text.index('                // Level complete screen')
end = text.index('                // Game over screen', start)
replacement = r'''                // Level complete shop screen: two-column layout with mouse hitboxes.
                if (gameState.showLevelScreen) {
                    shopHitboxes.length = 0;
                    ctx.fillStyle = 'rgba(2, 6, 20, 0.96)';
                    ctx.fillRect(0, 0, game.getCanvas().width, game.getCanvas().height);

                    const canvasWidth = game.getCanvas().width;
                    const canvasHeight = game.getCanvas().height;
                    const addButton = (id: string, x: number, y: number, width: number, height: number, action: () => void): void => {
                        shopHitboxes.push({ id, x, y, width, height, action });
                    };
                    const drawButton = (id: string, label: string, x: number, y: number, width: number, height: number, color: string, action: () => void): void => {
                        const isHovered = hoveredShopItem === id;
                        ctx.fillStyle = isHovered ? '#173c4b' : '#0b1e2d';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = isHovered ? '#ffffff' : color;
                        ctx.lineWidth = isHovered ? 2 : 1;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = color;
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, x + width / 2, y + height / 2 + 4);
                        addButton(id, x, y, width, height, action);
                    };
                    const drawCard = (x: number, y: number, width: number, height: number, title: string, accent: string): void => {
                        ctx.fillStyle = '#06121e';
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = accent;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillStyle = accent;
                        ctx.fillRect(x, y, width, 3);
                        ctx.textAlign = 'left';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText(title, x + 16, y + 28);
                    };

                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#00FF88';
                    ctx.font = 'bold 30px Arial';
                    ctx.fillText('LEVEL COMPLETE', canvasWidth / 2, 42);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Level ${gameState.level} complete  •  ${gameState.levelDuration} seconds cleared`, canvasWidth / 2, 70);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(`Available credits: ${gameState.score}`, canvasWidth / 2, 103);
                    ctx.fillStyle = '#94a9b8';
                    ctx.font = '12px Arial';
                    ctx.fillText('Click an item to select it, buy the next level, or upgrade the ship. Keyboard shortcuts remain available.', canvasWidth / 2, 126);

                    const leftX = 28;
                    const rightX = 412;
                    const cardTop = 150;
                    const cardWidth = 360;
                    drawCard(leftX, cardTop, cardWidth, 365, 'WEAPONS', '#00CCDD');
                    drawCard(rightX, cardTop, cardWidth, 365, 'SYSTEMS & SHIPS', '#FFD700');

                    const weaponOptions = [
                        { key: '1', name: 'Straight Shot', type: WeaponType.STRAIGHT, accent: '#8ee7ff' },
                        { key: '2', name: 'Spread Shot', type: WeaponType.SPREAD, accent: '#00FF88' },
                        { key: '3', name: 'Homing Missiles', type: WeaponType.HOMING, accent: '#ff66dd' },
                        { key: '4', name: 'Heavy Cannon', type: WeaponType.HEAVY, accent: '#ffb347' }
                    ];
                    weaponOptions.forEach((weapon, index) => {
                        const rowY = cardTop + 48 + index * 75;
                        const currentLevel = weaponSystem.getCurrentLevel(weapon.type);
                        const levels = weaponSystem.getWeaponLevels(weapon.type);
                        const isSelected = weaponSystem.getCurrentWeapon() === weapon.type;
                        const nextLevel = currentLevel < 0 ? levels[0] : levels[currentLevel + 1];
                        const canAfford = Boolean(nextLevel && gameState.score >= nextLevel.cost);
                        const title = `${weapon.key}. ${weapon.name}`;
                        const status = currentLevel < 0 ? 'NOT OWNED' : `LEVEL ${currentLevel + 1}/15`;
                        ctx.textAlign = 'left';
                        ctx.fillStyle = isSelected ? '#00FF88' : '#e6f1f5';
                        ctx.font = 'bold 13px Arial';
                        ctx.fillText(`${isSelected ? '▶ ' : ''}${title}`, leftX + 16, rowY + 16);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.font = '11px Arial';
                        ctx.fillText(status, leftX + 16, rowY + 34);
                        if (nextLevel) ctx.fillText(`${nextLevel.description}  •  ${nextLevel.cost} pts`, leftX + 16, rowY + 50);
                        else ctx.fillText('MAXIMUM LEVEL', leftX + 16, rowY + 50);

                        addButton(`weapon-select-${weapon.type}`, leftX + 10, rowY, 176, 58, () => selectWeapon(weapon.type));
                        if (nextLevel) {
                            drawButton(`weapon-upgrade-${weapon.type}`, currentLevel < 0 ? 'BUY' : 'UPGRADE', leftX + 194, rowY + 8, 82, 38, canAfford ? '#00FF88' : '#ff6666', () => upgradeWeapon(weapon.type));
                        } else {
                            ctx.fillStyle = '#526874';
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('MAX', leftX + 235, rowY + 31);
                        }
                        if (currentLevel > 0) {
                            drawButton(`weapon-downgrade-${weapon.type}`, 'DOWN', leftX + 282, rowY + 8, 78, 38, '#ffb347', () => downgradeWeapon(weapon.type));
                        }
                    });

                    const generatorY = cardTop + 55;
                    const nextGeneratorCost = generatorCosts[powerSystem.generatorLevel + 1] ?? 0;
                    const generatorCanBuy = powerSystem.canUpgradeGenerator() && gameState.score >= nextGeneratorCost;
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 13px Arial';
                    ctx.fillText(`Generator  •  LEVEL ${powerSystem.generatorLevel + 1}/15`, rightX + 16, generatorY + 12);
                    ctx.fillStyle = '#8ea6b2';
                    ctx.font = '11px Arial';
                    ctx.fillText(`Output: ${powerSystem.getGeneratorOutput().toFixed(0)} power/sec`, rightX + 16, generatorY + 31);
                    ctx.fillText(powerSystem.canUpgradeGenerator() ? `Next level: ${nextGeneratorCost} pts` : 'MAXIMUM LEVEL', rightX + 16, generatorY + 48);
                    drawButton('generator-upgrade', powerSystem.canUpgradeGenerator() ? 'UPGRADE' : 'MAX', rightX + 252, generatorY + 3, 92, 38, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);

                    ctx.fillStyle = '#FFFF00';
                    ctx.font = 'bold 13px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Ships  •  ACTIVE: ${shipSystem.getCurrentShip().name}`, rightX + 16, cardTop + 138);
                    const shipKeys = ['S', 'I', 'D', 'B'];
                    shipSystem.getAllShips().forEach((ship: any, index: number) => {
                        const shipY = cardTop + 157 + index * 43;
                        const currentShipId = shipSystem.getCurrentShipId();
                        const isCurrent = currentShipId === ship.id;
                        const isNext = ship.id === currentShipId + 1;
                        const canBuy = isNext && gameState.score >= ship.cost;
                        ctx.fillStyle = isCurrent ? '#00FF88' : '#dbe9ee';
                        ctx.font = 'bold 11px Arial';
                        ctx.fillText(`${shipKeys[index]}. ${ship.name}`, rightX + 16, shipY + 13);
                        ctx.fillStyle = '#8ea6b2';
                        ctx.font = '10px Arial';
                        ctx.fillText(`Weapon cap ${ship.weaponCapacity}  •  Generator cap ${ship.generatorCapacity}`, rightX + 16, shipY + 28);
                        if (isCurrent) {
                            drawButton(`ship-${ship.id}`, 'ACTIVE', rightX + 260, shipY + 1, 84, 32, '#00FF88', () => undefined);
                        } else if (ship.id < currentShipId) {
                            drawButton(`ship-${ship.id}`, 'OWNED', rightX + 260, shipY + 1, 84, 32, '#526874', () => undefined);
                        } else {
                            drawButton(`ship-${ship.id}`, `${ship.cost} PTS`, rightX + 250, shipY + 1, 94, 32, canBuy ? '#00FF88' : '#ff6666', () => purchaseShip(ship.id));
                        }
                    });

                    const footerY = 555;
                    ctx.fillStyle = '#0b1e2d';
                    ctx.fillRect(28, footerY, canvasWidth - 56, 90);
                    ctx.strokeStyle = '#284b5d';
                    ctx.strokeRect(28, footerY, canvasWidth - 56, 90);
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#94a9b8';
                    ctx.font = '11px Arial';
                    ctx.fillText('Mouse: click weapon name to equip • BUY/UPGRADE to improve • DOWN to refund the last level', 46, footerY + 27);
                    ctx.fillText('Ships are sequential: buy the next tier when you can afford it. Generator upgrades increase recharge speed only.', 46, footerY + 48);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('Keyboard: 1–4 select weapons • G generator • S/I/D/B ships • SPACE continue', 46, footerY + 70);

                    drawButton('continue', 'CONTINUE TO NEXT LEVEL  [SPACE]', 205, 680, 390, 54, '#00FF88', () => {
                        gameState.nextLevel();
                        enemySpawner.reset();
                        enemySpawner.increaseDifficulty();
                        game['entities'] = [player];
                    });
                    ctx.textAlign = 'left';
                }

'''
path.write_text(text[:start] + replacement + text[end:])
