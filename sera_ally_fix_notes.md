# Sera Ally Independent Craft — Verification Notes

## Implemented
- Replaced the old `SeraAllyEntity` path with `SeraAllyShipEntity`, a standalone player-side escort craft that does not extend or import Stage 31 duel behavior.
- The craft uses Battleship dimensions (60×80), faces upward, follows the player in the lower-right escort lane, and fires `LaserBullet` instances with `isPlayerBullet=true`, so straight fire travels upward.
- Sera receives an independent late-campaign loadout: maximum Battleship tier, generator level 14, maximum shield package, TIME LOCK level 5, and a high-level laser selected from the pilot's current credits plus accumulated weapon, generator, shield, tactical, and ship investment.
- Allied TIME LOCK freezes hostile entities and hostile bullets only. It does not freeze the player, block player movement, or block player fire.
- Stage 31 remains routed through `SeraDuelEntity` and the mirrored pilot loadout.
- Friendly fire from the player into Sera is disabled; hostile enemy bullets can damage Sera without failing the mission.

## Verification
- `pnpm exec tsc --noEmit` passed.
- `pnpm run build` passed; Vite emitted only the existing chunk-size warning.
- Static routing audit confirms the legacy `SeraAllyEntity.ts` file was removed and Stage 31 still instantiates `SeraDuelEntity`.
- Control Deck screenshot loaded successfully after the changes.

## Manual follow-up
- Play Stage 80 and verify the ally's laser visibly travels toward the top of the playfield.
- Activate the pilot's TIME LOCK while Sera is present and confirm the pilot remains mobile and can fire.
- Observe Sera's independent TIME LOCK during a dense hostile wave.
