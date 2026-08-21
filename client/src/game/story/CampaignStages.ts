export interface StageDefinition {
    stageNumber: number;
    chapter: number;
    title: string;
    region: string;
    description: string;
    objective: string;
    isBossStage: boolean;
}

export class CampaignStages {
    private static stages: StageDefinition[] = [];

    public static initialize(): void {
        if (this.stages.length > 0) return;

        const regions = [
            'Ark-9 Perimeter & Orbital Hub',
            'Nebula Ion Storm Corridor',
            'Asteroid Mining Belt Alpha',
            'Outer Rim Smuggler Outpost',
            'Sera Kane Interception Fleet',
            'Deep Space Relay Citadel',
            'Automated Dreadnought Shipyard',
            'Command Nexus Alpha Centauri',
            'Program Zero Core Horizon',
            'The Final Singularity Gate',
            'Archon Singularity Gate'
        ];

        for (let i = 1; i <= 101; i++) {
            const chapter = i === 101 ? 11 : Math.floor((i - 1) / 10) + 1;
            const isBoss = i === 101 || i % 3 === 0;
            const region = regions[chapter - 1] ?? 'Unknown Sector';
            let title = `Stage ${i}: Sector Patrol`;
            let desc = `Defend transport routes and eliminate rogue automated units in sector ${i}.`;
            let obj = 'Survive for 60 seconds and eliminate hostile forces.';

            if (i === 101) {
                title = 'Stage 101: Archon Supreme // Final Singularity';
                desc = 'Destroy the Archon defense grid, expose the void reactor, and survive its final meltdown.';
                obj = 'Defeat Archon Supreme by surviving the reactor meltdown.';
            } else if (isBoss) {
                title = `Stage ${i}: Sector Commander Dreadnought`;
                desc = `Heavy capital ship threat detected. Engage and neutralize regional flagship.`;
                obj = 'Defeat the Sector Boss or survive the onslaught.';
            } else if (i % 5 === 0) {
                title = `Stage ${i}: Elite Interceptor Swarm`;
                desc = `High-speed enemy chains patrolling supply lines. Exercise tactical positioning.`;
                obj = 'Clear elite formations and secure navigation beacons.';
            } else if (i % 2 === 0) {
                title = `Stage ${i}: Nebula Ambush`;
                desc = `Heavy sensor interference and dense enemy formations in the nebula cloud.`;
                obj = 'Navigate hazards and maintain energy equilibrium.';
            }

            this.stages.push({
                stageNumber: i,
                chapter,
                title,
                region,
                description: desc,
                objective: obj,
                isBossStage: isBoss
            });
        }
    }

    public static getStage(stageNumber: number): StageDefinition {
        this.initialize();
        const index = Math.max(0, Math.min(stageNumber - 1, this.stages.length - 1));
        return this.stages[index];
    }

    public static getAllStages(): StageDefinition[] {
        this.initialize();
        return this.stages;
    }
}
