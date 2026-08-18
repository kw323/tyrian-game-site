from pathlib import Path

path = Path('/home/ubuntu/tyrian-game-site/client/src/components/GameContainer.tsx')
text = path.read_text()
text = text.replace("""            const downgradeWeapon = (type: WeaponType): void => {
                const result = weaponSystem.downgradeWeapon(type);
                if (!result) return;
                gameState.score += result.refund;
                syncPlayerWeapon(type);
            };

            const upgradeGenerator = (): void => {
                const nextCost = generatorCosts[powerSystem.generatorLevel + 1] ?? 0;
                if (!powerSystem.canUpgradeGenerator() || gameState.score < nextCost) return;
                gameState.score -= nextCost;
                powerSystem.upgradeGenerator();
            };""", """            const downgradeWeapon = (type: WeaponType): void => {
                const result = weaponSystem.downgradeWeapon(type);
                if (!result) return;
                gameState.score += result.refund;
                if (weaponSystem.getCurrentWeapon() === type) syncPlayerWeapon(type);
            };

            const upgradeGenerator = (): void => {
                const nextLevel = powerSystem.generatorLevel + 1;
                const nextCost = generatorCosts[nextLevel] ?? 0;
                const shipAllowsLevel = shipSystem.canUpgradeGenerator(nextLevel);
                if (!powerSystem.canUpgradeGenerator() || !shipAllowsLevel || gameState.score < nextCost) return;
                gameState.score -= nextCost;
                powerSystem.upgradeGenerator();
            };""", 1)
text = text.replace("""                    const generatorCanBuy = powerSystem.canUpgradeGenerator() && gameState.score >= nextGeneratorCost;""", """                    const generatorCanBuy = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) && gameState.score >= nextGeneratorCost;""", 1)
text = text.replace("""                    ctx.fillText(powerSystem.canUpgradeGenerator() ? `Next level: ${nextGeneratorCost} pts` : 'MAXIMUM LEVEL', rightX + 16, generatorY + 48);
                    drawButton('generator-upgrade', powerSystem.canUpgradeGenerator() ? 'UPGRADE' : 'MAX', rightX + 252, generatorY + 3, 92, 38, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);""", """                    const generatorCanAdvance = powerSystem.canUpgradeGenerator() && shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1);
                    const generatorStatus = !powerSystem.canUpgradeGenerator() ? 'MAXIMUM LEVEL' : !shipSystem.canUpgradeGenerator(powerSystem.generatorLevel + 1) ? `Requires a larger ship (cap ${shipSystem.getCurrentShip().generatorCapacity})` : `Next level: ${nextGeneratorCost} pts`;
                    ctx.fillText(generatorStatus, rightX + 16, generatorY + 48);
                    drawButton('generator-upgrade', generatorCanAdvance ? 'UPGRADE' : 'LOCKED', rightX + 252, generatorY + 3, 92, 38, generatorCanBuy ? '#00FF88' : '#ff6666', upgradeGenerator);""", 1)
text = text.replace("""                        if (powerSystem.canUpgradeGenerator()) {
                            const cost = 500 + (powerSystem.generatorLevel * 500);
                            if (gameState.score >= cost) {
                                gameState.score -= cost;
                                powerSystem.upgradeGenerator();
                            }
                        }""", """                        upgradeGenerator();""", 1)
path.write_text(text)
