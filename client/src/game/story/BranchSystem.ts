export interface BranchRoute {
    id: string;
    title: string;
    description: string;
    difficultyMultiplier: number;
    rewardMultiplier: number;
    backgroundStyle: string;
}

export class BranchSystem {
    public static getAvailableBranches(chapter: number): BranchRoute[] {
        if (chapter % 2 === 1) {
            return [
                {
                    id: 'direct',
                    title: 'Direct Assault Route',
                    description: 'Fly straight through the heavily patrolled defense grid. Higher enemy density, standard rewards.',
                    difficultyMultiplier: 1.15,
                    rewardMultiplier: 1.25,
                    backgroundStyle: 'nebula'
                },
                {
                    id: 'stealth',
                    title: 'Underground Nebula Corridor',
                    description: 'Navigate through plasma storms and asteroid fields. Dangerous obstacles, increased credit drops.',
                    difficultyMultiplier: 1.3,
                    rewardMultiplier: 1.5,
                    backgroundStyle: 'asteroid'
                }
            ];
        } else {
            return [
                {
                    id: 'convoy',
                    title: 'Freight Lane Interception',
                    description: 'Ambush military supply convoys. Heavy armored tanks, massive point bonuses.',
                    difficultyMultiplier: 1.2,
                    rewardMultiplier: 1.4,
                    backgroundStyle: 'deepspace'
                },
                {
                    id: 'command',
                    title: 'Command Outpost Raid',
                    description: 'Strike directly at regional relay stations. Elite enemy guardians and high risk.',
                    difficultyMultiplier: 1.35,
                    rewardMultiplier: 1.7,
                    backgroundStyle: 'citadel'
                }
            ];
        }
    }
}
