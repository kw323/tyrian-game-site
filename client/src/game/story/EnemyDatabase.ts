export interface EnemyInfo {
    name: string;
    type: string;
    health: string;
    weapon: string;
    reward: string;
    description: string;
}

export class EnemyDatabase {
    public static readonly ENEMIES: EnemyInfo[] = [
        {
            name: 'Scout Drone',
            type: 'Fast Interceptor',
            health: '1-2 Hits',
            weapon: 'Single Pulse',
            reward: '75 PTS',
            description: 'Lightweight reconnaissance craft. Appears in fast straight or zigzag paths.'
        },
        {
            name: 'Vector Drone',
            type: 'Agile Swarm',
            health: '2 Hits',
            weapon: 'Dual Plasma',
            reward: '135 PTS',
            description: 'Flies in tight chains and executes sweeping arcs across the combat zone.'
        },
        {
            name: 'Titan Tank',
            type: 'Armored Heavy',
            health: '6-8 Hits',
            weapon: 'Heavy Spread',
            reward: '338 PTS',
            description: 'Slow-moving heavy cruiser. Absorbs significant fire and retaliates with wide salvos.'
        },
        {
            name: 'Orbiter Drone',
            type: 'Circular Patrol',
            health: '3 Hits',
            weapon: 'Targeted Arc',
            reward: '225 PTS',
            description: 'Orbits around target zones before diving into the main shipping lanes.'
        },
        {
            name: 'Sentinel',
            type: 'Elite Guardian',
            health: '10 Hits',
            weapon: 'Laser Barrage',
            reward: '450 PTS',
            description: 'Advanced automated defense unit guarding regional sector command.'
        },
        {
            name: 'Evasive Hunter (Every 9 Levels)',
            type: 'Special Pursuit Craft',
            health: '120+ Health',
            weapon: 'Fast Tracking Plasma',
            reward: '1,125+ PTS + VOID LANCE',
            description: 'A fast experimental hunter that patrols in erratic arcs, dashes away from incoming fire, and becomes stronger every ten stages. Defeat it once to recover the secret Void Lance weapon.'
        },
        {
            name: 'Sector Boss (Every 3 Levels)',
            type: 'Command Dreadnought',
            health: '150+ Health + Shield',
            weapon: 'Multi-Way Spread & Lasers',
            reward: '3,750+ PTS',
            description: 'Massive capital ship equipped with multi-layered shields and heavy weapon arrays.'
        }
    ];

    public static getEnemies(): EnemyInfo[] {
        return this.ENEMIES;
    }
}
