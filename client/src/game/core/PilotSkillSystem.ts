export interface PilotSkillNode {
    id: string;
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    pointsInvested: number;
    bonusPerPoint: number;
    statType: 
        | 'hull_integrity' 
        | 'collision_resist' 
        | 'shield_capacity' 
        | 'shield_regen' 
        | 'generator_capacity' 
        | 'generator_output' 
        | 'weapon_damage' 
        | 'fire_rate' 
        | 'projectile_speed' 
        | 'ability_duration'
        | 'crit_chance'
        | 'crit_damage';
    milestonesUnlocked: number[]; // e.g. [5, 10]
}

export class PilotSkillSystem {
    private xp: number = 0;
    private rank: number = 1;
    private skillPoints: number = 0;
    private totalXpForNextRank: number = 250;

    private nodes: Map<string, PilotSkillNode> = new Map([
        ['hull_integrity', {
            id: 'hull_integrity',
            name: 'Hull Structural Integrity',
            description: 'Increases maximum base hull strength by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'hull_integrity',
            milestonesUnlocked: []
        }],
        ['collision_resist', {
            id: 'collision_resist',
            name: 'Impact Dampeners',
            description: 'Reduces collision damage taken from enemies by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'collision_resist',
            milestonesUnlocked: []
        }],
        ['shield_capacity', {
            id: 'shield_capacity',
            name: 'Aegis Shield Capacity',
            description: 'Increases maximum shield capacity by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'shield_capacity',
            milestonesUnlocked: []
        }],
        ['shield_regen', {
            id: 'shield_regen',
            name: 'Resonant Shield Regeneration',
            description: 'Increases shield regeneration rate by +2.5% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.025,
            statType: 'shield_regen',
            milestonesUnlocked: []
        }],
        ['generator_capacity', {
            id: 'generator_capacity',
            name: 'Antimatter Core Capacity',
            description: 'Increases max power capacity by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'generator_capacity',
            milestonesUnlocked: []
        }],
        ['generator_output', {
            id: 'generator_output',
            name: 'Reactor Flux Induction',
            description: 'Increases power generation speed by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'generator_output',
            milestonesUnlocked: []
        }],
        ['weapon_damage', {
            id: 'weapon_damage',
            name: 'Ballistic Caliber & Charge',
            description: 'Increases weapon output damage by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'weapon_damage',
            milestonesUnlocked: []
        }],
        ['fire_rate', {
            id: 'fire_rate',
            name: 'Overclocked Fire Relays',
            description: 'Increases weapon firing rate by +1.8% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.018,
            statType: 'fire_rate',
            milestonesUnlocked: []
        }],
        ['projectile_speed', {
            id: 'projectile_speed',
            name: 'Magnetic Accelerator Coils',
            description: 'Increases projectile flight speed by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'projectile_speed',
            milestonesUnlocked: []
        }],
        ['ability_duration', {
            id: 'ability_duration',
            name: 'Temporal Resonance Matrix',
            description: 'Extends tactical ability active duration by +2% per rank.',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.02,
            statType: 'ability_duration',
            milestonesUnlocked: []
        }],
        ['crit_chance', {
            id: 'crit_chance',
            name: 'Precision Targeting (Crit Chance)',
            description: 'Increases critical hit chance by +0.5% per rank (max +5%).',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.005,
            statType: 'crit_chance',
            milestonesUnlocked: []
        }],
        ['crit_damage', {
            id: 'crit_damage',
            name: 'Destructive Focus (Crit Damage)',
            description: 'Increases critical hit multiplier by +1.5% per rank (max +15%).',
            level: 0,
            maxLevel: 10,
            pointsInvested: 0,
            bonusPerPoint: 0.015,
            statType: 'crit_damage',
            milestonesUnlocked: []
        }]
    ]);

    constructor() {}

    public getXP(): number { return this.xp; }
    public getRank(): number { return this.rank; }
    public getSkillPoints(): number { return this.skillPoints; }
    public getNextRankXpRequirement(): number { return this.totalXpForNextRank; }

    public addXP(amount: number): boolean {
        if (amount <= 0) return false;
        this.xp += amount;
        let leveledUp = false;
        while (this.xp >= this.totalXpForNextRank) {
            this.xp -= this.totalXpForNextRank;
            this.rank++;
            this.skillPoints += 3; // 3 skill points per pilot rank
            this.totalXpForNextRank = Math.floor(this.totalXpForNextRank * 1.35);
            leveledUp = true;
        }
        return leveledUp;
    }

    public getNode(id: string): PilotSkillNode | undefined {
        return this.nodes.get(id);
    }

    public getAllNodes(): PilotSkillNode[] {
        return Array.from(this.nodes.values());
    }

    public investPoint(id: string): boolean {
        const node = this.nodes.get(id);
        if (!node || this.skillPoints <= 0 || node.level >= node.maxLevel) return false;
        node.level++;
        node.pointsInvested++;
        this.skillPoints--;
        return true;
    }

    public consumeSkillPoints(amount: number): void {
        this.skillPoints = Math.max(0, this.skillPoints - amount);
    }

    public resetSkills(): number {
        let refundedCredits = 0;
        let refundedPoints = 0;
        this.nodes.forEach(node => {
            refundedPoints += node.level;
            node.level = 0;
            node.pointsInvested = 0;
            node.milestonesUnlocked.forEach(mLevel => {
                refundedCredits += (mLevel === 5 ? 150000 : 750000);
            });
            node.milestonesUnlocked = [];
        });
        this.skillPoints += refundedPoints;
        return refundedCredits;
    }

    public canUnlockMilestone(id: string, milestoneLevel: number): boolean {
        const node = this.nodes.get(id);
        if (!node) return false;
        if (node.level < milestoneLevel) return false;
        return !node.milestonesUnlocked.includes(milestoneLevel);
    }

    public unlockMilestone(id: string, milestoneLevel: number, currentCredits: number, currentStage: number, currentSkillPoints: number): { success: boolean; cost: number; pointsCost: number; error?: string } {
        const node = this.nodes.get(id);
        if (!node) return { success: false, cost: 0, pointsCost: 0, error: 'Skill not found' };
        if (node.level < milestoneLevel) return { success: false, cost: 0, pointsCost: 0, error: `Requires skill level ${milestoneLevel}` };
        if (node.milestonesUnlocked.includes(milestoneLevel)) return { success: false, cost: 0, pointsCost: 0, error: 'Already unlocked' };

        // Balanced strict requirements: M5 requires 3 skill points, 150,000 credits, and stage >= 25.
        // M10 requires 6 skill points, 750,000 credits, and stage >= 70.
        const cost = milestoneLevel === 5 ? 150000 : 750000;
        const pointsCost = milestoneLevel === 5 ? 3 : 6;
        const requiredStage = milestoneLevel === 5 ? 25 : 70;

        if (currentCredits < cost) return { success: false, cost, pointsCost, error: `Requires ${cost.toLocaleString()} credits` };
        if (currentSkillPoints < pointsCost) return { success: false, cost, pointsCost, error: `Requires ${pointsCost} unspent skill points` };
        if (currentStage < requiredStage) return { success: false, cost, pointsCost, error: `Requires Campaign Stage ${requiredStage}+` };

        node.milestonesUnlocked.push(milestoneLevel);
        return { success: true, cost, pointsCost };
    }

    public getBonusMultiplier(statType: PilotSkillNode['statType']): number {
        const node = this.nodes.get(statType);
        if (!node) return 1.0;
        let baseBonus = 1.0 + (node.level * node.bonusPerPoint);
        // Add balanced milestone perks bonus (+1.5% for M5, +3.5% for M10)
        if (node.milestonesUnlocked.includes(5)) baseBonus += 0.015;
        if (node.milestonesUnlocked.includes(10)) baseBonus += 0.035;
        return baseBonus;
    }

    public getSaveState(): any {
        const nodesState: Record<string, any> = {};
        this.nodes.forEach((node, id) => {
            nodesState[id] = {
                level: node.level,
                pointsInvested: node.pointsInvested,
                milestonesUnlocked: [...node.milestonesUnlocked]
            };
        });
        return {
            xp: this.xp,
            rank: this.rank,
            skillPoints: this.skillPoints,
            totalXpForNextRank: this.totalXpForNextRank,
            nodes: nodesState
        };
    }

    public loadSaveState(state: any): void {
        if (!state) return;
        if (typeof state.xp === 'number') this.xp = state.xp;
        if (typeof state.rank === 'number') this.rank = state.rank;
        if (typeof state.skillPoints === 'number') this.skillPoints = state.skillPoints;
        if (typeof state.totalXpForNextRank === 'number') this.totalXpForNextRank = state.totalXpForNextRank;
        if (state.nodes && typeof state.nodes === 'object') {
            Object.keys(state.nodes).forEach(id => {
                const node = this.nodes.get(id);
                const saved = state.nodes[id];
                if (node && saved) {
                    node.level = Math.max(0, Math.min(node.maxLevel, Number(saved.level) || 0));
                    node.pointsInvested = Math.max(0, Math.min(node.maxLevel, Number(saved.pointsInvested) || 0));
                    if (Array.isArray(saved.milestonesUnlocked)) {
                        node.milestonesUnlocked = [...saved.milestonesUnlocked];
                    }
                }
            });
        }
    }
}
