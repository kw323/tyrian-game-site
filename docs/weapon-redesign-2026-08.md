# Weapon Redesign: 25 Clear, Balanced Ranks

## Design goals

Each of the 25 displayed ranks must increase either a transparent stat or a visible combat behavior. The shop description must be generated from the same runtime profile that controls firing. Projectile density is deliberately capped: the goal is stronger weapons and clearer identities, not hundreds of entities per second.

| Weapon | Role | 25-rank progression |
|---|---|---|
| Straight Shot | Precise direct fire | Every two ranks adds a narrow parallel bolt; final volley is 13 bolts. Damage and fire rate rise at every rank. |
| Spread Shot | Crowd control | Every two ranks adds one pellet, while the fan angle widens smoothly; final volley is 13 pellets. |
| Homing Missiles | Mobile target pursuit | Damage and fire rate rise every rank; salvos scale from one to five missiles, while speed and turning response scale continuously. |
| Split Bomb | Area denial | Higher ranks add shells, fragment count, blast radius, and a controlled second cascade. Primary shells cap at three. |
| Pulse Laser | Piercing lane control | Damage, frequency, width, and penetration rise every rank. Two secondary rays activate at rank 7 and become wider/stronger with the main beam. |
| Black Hole Projectile | Gravity control | Damage, field radius, field duration, suction, and trace count increase. Traces progress from one to four and suction reaches its cap only at the final rank. |

## Milestone rules

| Ranks | Expected player experience |
|---|---|
| 1–5 | Establish the weapon identity and first visible upgrade. |
| 6–10 | Introduce the main pattern upgrade: extra bolt, wider fan, additional missile, cascade, side ray, or extra gravity trace. |
| 11–15 | Improve tactical effectiveness through penetration, tracking, fragment volume, or field control. |
| 16–20 | Add high-tier pattern enhancement without unbounded entity growth. |
| 21–25 | Final specialization: a capstone volley, high precision, maximum area coverage, or top-tier control effect. |

## Source-of-truth rule

`WeaponRuntimeProfile.ts` provides the projectile pattern and the sentence shown to the player. `Player.ts`, `GameContainer.tsx`, `HomingBullet.ts`, and `BlackHoleBullet.ts` consume the same profile. A new test enumerates all 150 ranks and fails if the displayed description contradicts the runtime profile.

## Balance guardrails

The highest sustained projectile rate remains below the previous misleading 25-projectile/30-rate interpretation. Power costs remain tied to the weapon and rank tables, so high-density and control weapons still demand generator investment. Bosses remain resistant to black-hole suction.
