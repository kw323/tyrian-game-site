from pathlib import Path

path = Path('/home/ubuntu/tyrian-game-site/client/src/components/GameContainer.tsx')
text = path.read_text()
text = text.replace("weaponSystem.upgradeWeapon(WeaponType.SPREAD, gameState.score)", "weaponSystem.upgradeWeapon(WeaponType.SPREAD, gameState.score, shipSystem.getCurrentShipId())")
text = text.replace("weaponSystem.upgradeWeapon(WeaponType.HOMING, gameState.score)", "weaponSystem.upgradeWeapon(WeaponType.HOMING, gameState.score, shipSystem.getCurrentShipId())")
text = text.replace("weaponSystem.upgradeWeapon(WeaponType.HEAVY, gameState.score)", "weaponSystem.upgradeWeapon(WeaponType.HEAVY, gameState.score, shipSystem.getCurrentShipId())")
path.write_text(text)
