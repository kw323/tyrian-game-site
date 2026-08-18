# Endgame Combat and Finale Overhaul

## Scope

This change keeps Sera's duel story intact while increasing her movement. Allied Sera is restricted to stages 81–90, uses `OVER POWER` rather than `TIME LOCK`, and operates as an independent aggressive ally. Regular bosses receive rotating combat archetypes, Archon gains a staged subsystem fight, and the finale becomes player-controlled.

## Regular bosses

Normal boss stages cycle through three profiles.

| Profile | Movement | Attack identity | Phase response |
|---|---|---|---|
| Duelist | Fast, evasive lateral arcs | Aimed triple shots and short spread bursts | Changes direction and fires more frequently |
| Siege Carrier | Slow, heavy sweeps | Wide artillery fans | Adds broad salvos at low hull |
| Controller | Figure-eight lane control | Rotating multi-angle shots | Expands zone coverage at low hull |

At 70% and 35% hull, the profile advances a phase. The boss changes movement/volley cadence rather than only gaining numerical health and speed.

## Sera

Sera deploys only from stage 81 through stage 90. She scores enemy targets by priority: active boss, mission target, nearby threatening enemy, then ordinary enemy. She steers toward an aggressive firing position under the selected target, strafes to avoid local projectile threats, and aims laser shots at the selected target. Her states are `HUNT`, `INTERCEPT`, and `BOSS FOCUS`.

`OVER POWER` activates only when Sera has a viable high-value target and enough energy. It temporarily increases her firing cadence and makes support fire free, but never freezes the player, enemies, stage timer, or boss.

## Archon, stage 101

The Archon begins with five outer systems and a protected Void Reactor. Destroying any three outer systems exposes the reactor. The player can therefore choose a route through the carrier instead of destroying every target.

Destroying the exposed reactor starts **Meltdown**. Meltdown is a short final survival sequence, not a death penalty: the remaining Archon systems emit their last high-intensity salvos while the reactor countdown reaches zero. When the countdown finishes, the carrier explodes and the campaign victory flow begins. The player does not have to destroy every remaining system after starting Meltdown.

| State | Objective | Result |
|---|---|---|
| Outer systems | Destroy three of five non-reactor systems | Reactor shields disengage |
| Reactor exposed | Destroy the Void Reactor | Starts Meltdown |
| Meltdown | Survive the countdown | Carrier detonates; victory confirmed |

## Finale and credits

The final screen uses player-controlled pages rather than an eight-second automatic rotation. It includes aftermath, Sera, Naomi/Elena, campaign record, and credits/next signal. `PREVIOUS`, `NEXT`, and `RETURN TO TITLE` buttons provide control and make every page readable at the player's pace.
