# Reactor Recovery and High-Rank Weapon Energy Balance

## Intended player loop

High-rank weapons should feel powerful and responsive. The precise Straight Shot can sustain fire with an appropriate late-game generator, while high-area and special weapons can deliver a full-power burst for about 2.5 seconds before causing a reactor recovery cycle. Emptying the reactor is a deliberate risk: firing is disabled until the energy pool is fully restored.

## Rank-25 targets

These targets assume Weapon Mastery increases firing rate by 8% and the Rank-50 generator produces 431.5 energy per second. The ship has a 200-point energy pool.

| Weapon | Rank-25 cost / shot | Rank-25 draw with mastery | Intended behavior at generator Rank 50 |
|---|---:|---:|---|
| Straight Shot | 8 | 259.2 / s | Sustained fire. |
| Spread Shot | 17 | 514.1 / s | About 2.4-second full-power burst. |
| Homing Missiles | 26 | 519.5 / s | About 2.3-second full-power burst. |
| Split Bomb | 51 | 512.5 / s | About 2.5-second full-power burst. |
| Pulse Laser | 27 | 513.2 / s | About 2.5-second full-power burst. |
| Black Hole Projectile | 73 | 512.5 / s | About 2.5-second full-power burst. |

## Reactor recovery

When a paid weapon shot drains energy to zero, the ship enters `REACTOR RECOVERY`. Weapons cannot fire until the energy pool reaches 100%. Recovery uses 60% of normal generator output, making the penalty visible without turning it into a guaranteed death. Movement remains available and no direct hull damage is applied.

At the maximum generator, a fully drained 200-point pool restores in approximately 0.77 seconds. Lower generator ranks recover more slowly, preserving the value of generator upgrades. Reactor recovery is bypassed by the existing unlimited-power tactical effect.
