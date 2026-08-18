from pathlib import Path

path = Path('/home/ubuntu/tyrian-game-site/client/src/components/GameContainer.tsx')
text = path.read_text()
needle = """            window.addEventListener('keydown', handleKeyDown);

            // Start the game"""
replacement = """            const canvas = game.getCanvas();
            const getShopPoint = (event: MouseEvent): { x: number; y: number } => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (event.clientX - rect.left) * (canvas.width / rect.width),
                    y: (event.clientY - rect.top) * (canvas.height / rect.height)
                };
            };

            const handleCanvasMouseMove = (event: MouseEvent): void => {
                if (!gameState.showLevelScreen) {
                    hoveredShopItem = null;
                    canvas.style.cursor = 'default';
                    return;
                }
                const point = getShopPoint(event);
                const hit = shopHitboxes.find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
                hoveredShopItem = hit?.id ?? null;
                canvas.style.cursor = hit ? 'pointer' : 'default';
            };

            const handleCanvasClick = (event: MouseEvent): void => {
                if (!gameState.showLevelScreen) return;
                const point = getShopPoint(event);
                const hit = shopHitboxes.find((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
                if (!hit) return;
                event.preventDefault();
                hit.action();
                handleCanvasMouseMove(event);
            };

            window.addEventListener('keydown', handleKeyDown);
            canvas.addEventListener('mousemove', handleCanvasMouseMove);
            canvas.addEventListener('click', handleCanvasClick);

            // Start the game"""
if needle not in text:
    raise SystemExit('listener anchor not found')
text = text.replace(needle, replacement, 1)
old_cleanup = """                game.stop();
                window.removeEventListener('keydown', handleKeyDown);"""
new_cleanup = """                game.stop();
                window.removeEventListener('keydown', handleKeyDown);
                canvas.removeEventListener('mousemove', handleCanvasMouseMove);
                canvas.removeEventListener('click', handleCanvasClick);
                canvas.style.cursor = 'default';"""
if old_cleanup not in text:
    raise SystemExit('cleanup anchor not found')
path.write_text(text.replace(old_cleanup, new_cleanup, 1))
