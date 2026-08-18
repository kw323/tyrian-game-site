# Mobile touch controls verification

The mobile preview at 375px now shows a translucent green virtual joystick at the lower-left of the game canvas, a purple TACTICAL button above a pink FIRE button at the lower-right, and a concise mobile instruction hint below the canvas.

The controls are implemented with Pointer Events. The joystick is clamped to a normalized radius and resets on release/cancel or window blur. FIRE is an auto-fire hold control. TACTICAL is a tap toggle that uses the same activation/deactivation method as the keyboard E key and is guarded from shop, briefing, after-action, and game-over states.

Keyboard movement and joystick movement are merged rather than overriding each other. The desktop path keeps the touch layer hidden. The game viewport has safe-area-aware padding and viewport-fit=cover metadata.

Checks completed after implementation:
- `pnpm exec tsc --noEmit` passed.
- `pnpm run build` passed.
- Mobile screenshot at 375x812 visibly shows the controls in the game canvas.
