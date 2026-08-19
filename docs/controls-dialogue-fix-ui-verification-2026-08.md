# Controls and Dialogue Fix — UI Verification

**Date:** 2026-08-19

The Settings section was opened in the running game and the Controls modal was verified visually.

| Check | Result |
|---|---|
| Settings route reaches the controls map | Pass |
| Keyboard Flight selector is visible and initially active | Pass |
| Mouse Flight selector is visible | Pass |
| Each mode clearly explains steering and firing behavior | Pass |
| Current-mode status states that keyboard mode prevents mouse steering and firing | Pass |
| Existing key remapping controls remain visible and reachable | Pass |

The selected default is **Keyboard Flight**, which prevents pointer movement inside the combat canvas from steering the ship unless the player explicitly chooses Mouse Flight.

## Dialogue runtime check

A fresh Stage 1 launch was opened in the local game build. The Ready Room opened successfully, and pressing Enter displayed the large pre-mission communications console with the first Hebrew radio transmission, a visible `ENTER // NEXT TRANSMISSION` command, and a separate `ESC // SKIP BRIEFING` command. This confirms the multi-line briefing flow is reachable through the normal launch path; the subsequent Enter input is used to advance the exchange.
The Stage 1 communications console was advanced twice more. It displayed the second line from Naomi and then the third line from the Program Zero Pilot; the final button changed to `ENTER // CONFIRM & LAUNCH`. This visually verifies that the briefing now advances through all three authored dialogue lines rather than stopping after the first line.
