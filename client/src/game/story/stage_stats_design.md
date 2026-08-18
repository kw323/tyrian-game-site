# Program Zero // Stage Statistics & Mastery Streaks Architecture

## 1. Executive Summary
To reward precision and consistent tactical execution, Tyrian 2000 introduces a post-mission telemetry and streak mastery system. Players receive granular performance data at the end of every stage—specifically tracking enemy elimination percentages and shield impact metrics—while maintaining consecutive stage streaks that unlock exclusive shielding and weaponry augmentations.

## 2. Post-Mission Telemetry Metrics
Every stage tracks three operational counters from mission start to boss defeat or timer expiration:
- **Enemies Spawned**: Total enemy units initialized by the spawner and wave controller.
- **Enemies Eliminated**: Total enemy units destroyed by player fire, laser beams, heavy blasts, or black hole suction.
- **Elimination Rate (%)**: Calculated as `(Enemies Eliminated / Enemies Spawned) * 100`, clamped between 0% and 100%.
- **Shield Impacts Taken**: Total times the player's energy shield absorbed hostile incoming fire or collision force.

## 3. Streak Mastery & Special Augmentations
Players who maintain clean defensive records or high offensive annihilation rates across multi-stage runs earn permanent operational bonuses that enhance their experimental hull without breaking game balance.

| Mastery System | Requirement | Operational Benefit |
| :--- | :--- | :--- |
| **Aegis Matrix Mastery** | 10 consecutive stages with 0 or <= 1 shield impact per stage. | Grants a permanent +20% shield recharge rate and unlocks an Aegis Overcharge toggle that converts excess shield energy into micro-EMP bursts. |
| **Weapon Overkill Matrix** | 10 consecutive stages with >= 95% enemy elimination rate. | Calibrates all core weapon families to fire secondary resonance tracers that pierce through primary armor plating. |
| **Ghost Recon Streak** | 10 consecutive stages completed without activating tactical abilities. | Increases passive credit bounty by +35% and reduces generator power draw by 12%. |

## 4. Architectural Integration
The statistics tracker operates as a stateless telemetry aggregator within `GameState` and persists across stage transitions in `SaveData`. When a stage completes, the shop UI renders a dedicated tactical readout panel displaying the stage percentage, shield hits, and active streak progress bars.
