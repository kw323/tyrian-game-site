from pathlib import Path

path = Path('/home/ubuntu/tyrian-game-site/client/src/components/GameContainer.tsx')
text = path.read_text()
needle = "            const shipSystem = new ShipUpgradeSystem();\n\n            // Create player"
replacement = """            const shipSystem = new ShipUpgradeSystem();
            const shopHitboxes: Array<{ id: string; x: number; y: number; width: number; height: number; action: () => void }> = [];
            let hoveredShopItem: string | null = null;
            const generatorCosts = [0, 500, 1000, 1500, 2000, 2500, 5000, 10000, 20000, 40000, 80000, 160000, 320000, 640000, 1280000];

            const syncPlayerWeapon = (type: WeaponType): void => {
                const stats = weaponSystem.getCurrentWeaponStats();
                if (!stats) return;
                const playerWeapon = type === WeaponType.STRAIGHT ? 'straight' : type === WeaponType.SPREAD ? 'spread' : type === WeaponType.HOMING ? 'homing' : 'heavy';
                player.setWeapon(playerWeapon, weaponSystem.getCurrentLevel(type), stats.fireRate, stats.damage);
            };

            const selectWeapon = (type: WeaponType): void => {
                if (weaponSystem.setCurrentWeapon(type)) syncPlayerWeapon(type);
            };

            const upgradeWeapon = (type: WeaponType): void => {
                const result = weaponSystem.upgradeWeapon(type, gameState.score, shipSystem.getCurrentShipId());
                if (!result) return;
                gameState.score = Math.max(0, gameState.score - result.cost + result.refund);
                weaponSystem.setCurrentWeapon(type);
                syncPlayerWeapon(type);
            };

            const downgradeWeapon = (type: WeaponType): void => {
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
            };

            const purchaseShip = (shipId: number): void => {
                if (shipId !== shipSystem.getCurrentShipId() + 1) return;
                const ship = shipSystem.getShip(shipId);
                if (!ship || gameState.score < ship.cost) return;
                const result = shipSystem.upgradeShip(gameState.score);
                if (result) gameState.score -= result.cost;
            };

            // Create player"""
if needle not in text:
    raise SystemExit('anchor not found')
path.write_text(text.replace(needle, replacement, 1))
