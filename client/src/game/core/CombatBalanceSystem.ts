/**
 * Combat now uses larger, readable hull and shield pools. Hostile projectile damage
 * rises by the same factor so ordinary campaign time-to-survive remains familiar,
 * while rival and boss fights have enough numerical room for multi-volley exchanges.
 */
export const PLAYER_DURABILITY_MULTIPLIER = 6;
export const ENEMY_PROJECTILE_DAMAGE_MULTIPLIER = PLAYER_DURABILITY_MULTIPLIER;
