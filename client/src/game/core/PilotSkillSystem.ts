export type PilotSkillBranch = 'survival' | 'reactor' | 'combat';

export type PilotSkillId =
    | 'hull_integrity'
    | 'collision_resist'
    | 'aegis_protocol'
    | 'generator_output'
    | 'capacitor_reserve'
    | 'weapon_efficiency'
    | 'weapon_damage'
    | 'fire_rate'
    | 'critical_targeting';

export interface PilotSkillNode {
    id: PilotSkillId;
    branch: PilotSkillBranch;
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    bonusPerPoint: number;
}

export interface PilotSkillSaveState {
    version: 2;
    xp: number;
    rank: number;
    skillPoints: number;
    totalXpForNextRank: number;
    nodes: Record<string, { level: number }>;
}

/**
 * The pilot develops through three readable specialties. Every rank awards a
 * single point, so choices remain meaningful instead of becoming a checklist.
 */
export class PilotSkillSystem {
    // Nine skills × twenty levels: rank 181 is the only point where every skill can be complete.
    public static readonly MAX_RANK = 181;
    public static readonly XP_FOR_RANK_ONE = 80;
    public static readonly XP_GROWTH = 1.055;
    public static readonly XP_REQUIREMENT_CAP = 750;
    public static readonly SKILL_MAX_LEVEL = 20;
    public static readonly COMPLETION_BONUS = 0.02;

    private xp = 0;
    private rank = 1;
    private skillPoints = 0;
    private totalXpForNextRank = PilotSkillSystem.XP_FOR_RANK_ONE;

    private nodes: Map<PilotSkillId, PilotSkillNode> = new Map([
        ['hull_integrity', {
            id: 'hull_integrity', branch: 'survival', name: 'Hull Integrity',
            description: '+1% maximum hull strength per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.01
        }],
        ['collision_resist', {
            id: 'collision_resist', branch: 'survival', name: 'Impact Dampeners',
            description: '-1% collision damage per rank. Full calibration grants -2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.01
        }],
        ['aegis_protocol', {
            id: 'aegis_protocol', branch: 'survival', name: 'Aegis Protocol',
            description: '+0.85% shield capacity and recharge per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.0085
        }],
        ['generator_output', {
            id: 'generator_output', branch: 'reactor', name: 'Reactor Flux',
            description: '+1% reactor output per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.01
        }],
        ['capacitor_reserve', {
            id: 'capacitor_reserve', branch: 'reactor', name: 'Capacitor Reserve',
            description: '+1.5% maximum reactor energy per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.015
        }],
        ['weapon_efficiency', {
            id: 'weapon_efficiency', branch: 'reactor', name: 'Thermal Cycling',
            description: '+1% weapon-energy efficiency per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.01
        }],
        ['weapon_damage', {
            id: 'weapon_damage', branch: 'combat', name: 'Weapons Calibration',
            description: '+0.75% weapon damage per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.0075
        }],
        ['fire_rate', {
            id: 'fire_rate', branch: 'combat', name: 'Fire Relays',
            description: '+0.5% firing rate per rank. Full calibration grants +2% more.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.005
        }],
        ['critical_targeting', {
            id: 'critical_targeting', branch: 'combat', name: 'Critical Targeting',
            description: '+0.75% critical-salvo chance per rank. Full calibration grants +1% critical chance; critical salvos deal 1.75× damage.', level: 0, maxLevel: PilotSkillSystem.SKILL_MAX_LEVEL, bonusPerPoint: 0.0075
        }]
    ]);

    public getXP(): number { return this.xp; }
    public getRank(): number { return this.rank; }
    public getSkillPoints(): number { return this.skillPoints; }
    public getNextRankXpRequirement(): number { return this.totalXpForNextRank; }
    public isMaxRank(): boolean { return this.rank >= PilotSkillSystem.MAX_RANK; }

    public addXP(amount: number): { rankedUp: boolean; ranksGained: number } {
        if (amount <= 0 || this.isMaxRank()) return { rankedUp: false, ranksGained: 0 };
        this.xp += Math.floor(amount);
        let ranksGained = 0;
        while (!this.isMaxRank() && this.xp >= this.totalXpForNextRank) {
            this.xp -= this.totalXpForNextRank;
            this.rank++;
            this.skillPoints++;
            ranksGained++;
            this.totalXpForNextRank = this.getRequirementForRank(this.rank);
        }
        if (this.isMaxRank()) this.xp = 0;
        return { rankedUp: ranksGained > 0, ranksGained };
    }

    public getNode(id: PilotSkillId): PilotSkillNode | undefined {
        return this.nodes.get(id);
    }

    public getAllNodes(): PilotSkillNode[] {
        return Array.from(this.nodes.values());
    }

    public getNodesByBranch(branch: PilotSkillBranch): PilotSkillNode[] {
        return this.getAllNodes().filter((node) => node.branch === branch);
    }

    public investPoint(id: PilotSkillId): boolean {
        const node = this.nodes.get(id);
        if (!node || this.skillPoints <= 0 || node.level >= node.maxLevel) return false;
        node.level++;
        this.skillPoints--;
        return true;
    }

    public resetSkills(): void {
        this.nodes.forEach((node) => {
            this.skillPoints += node.level;
            node.level = 0;
        });
    }

    public getBonusMultiplier(id: PilotSkillId): number {
        const node = this.nodes.get(id);
        return node ? 1 + node.level * node.bonusPerPoint + this.getCompletionBonus(node) : 1;
    }

    public getDamageReduction(id: 'collision_resist'): number {
        const node = this.nodes.get(id);
        return node ? node.level * node.bonusPerPoint + this.getCompletionBonus(node) : 0;
    }

    public getCriticalChance(): number {
        const node = this.nodes.get('critical_targeting');
        return node ? node.level * node.bonusPerPoint + (node.level >= node.maxLevel ? 0.01 : 0) : 0;
    }

    public getCriticalDamageMultiplier(): number {
        return 1.75;
    }

    public getSaveState(): PilotSkillSaveState {
        const nodes: Record<string, { level: number }> = {};
        this.nodes.forEach((node, id) => { nodes[id] = { level: node.level }; });
        return {
            version: 2,
            xp: this.xp,
            rank: this.rank,
            skillPoints: this.skillPoints,
            totalXpForNextRank: this.totalXpForNextRank,
            nodes
        };
    }

    public loadSaveState(state: any): void {
        if (!state || typeof state !== 'object') return;
        if (state.version === 2) {
            this.rank = this.clampRank(state.rank);
            this.xp = Math.max(0, Number(state.xp) || 0);
            this.skillPoints = Math.max(0, Math.floor(Number(state.skillPoints) || 0));
            this.totalXpForNextRank = this.isMaxRank() ? 0 : this.getRequirementForRank(this.rank);
            if (state.nodes && typeof state.nodes === 'object') {
                this.nodes.forEach((node, id) => {
                    const saved = state.nodes[id];
                    node.level = Math.max(0, Math.min(node.maxLevel, Math.floor(Number(saved?.level) || 0)));
                });
            }
            return;
        }

        // Legacy saves had twelve 10-rank nodes, three points per rank, and paid milestones.
        // Refund every legacy investment into the new tree so no existing pilot loses progress.
        const legacyNodes = state.nodes && typeof state.nodes === 'object' ? state.nodes : {};
        let refundedLegacyPoints = 0;
        Object.values(legacyNodes).forEach((saved: any) => {
            const level = Math.max(0, Math.floor(Number(saved?.level) || 0));
            refundedLegacyPoints += level;
            if (Array.isArray(saved?.milestonesUnlocked)) {
                if (saved.milestonesUnlocked.includes(5)) refundedLegacyPoints += 3;
                if (saved.milestonesUnlocked.includes(10)) refundedLegacyPoints += 6;
            }
        });
        this.rank = this.clampRank(state.rank);
        this.xp = 0;
        this.totalXpForNextRank = this.isMaxRank() ? 0 : this.getRequirementForRank(this.rank);
        this.skillPoints = Math.max(0, Math.floor(Number(state.skillPoints) || 0)) + refundedLegacyPoints;
        this.nodes.forEach((node) => { node.level = 0; });
    }

    private getCompletionBonus(node: PilotSkillNode): number {
        return node.level >= node.maxLevel ? PilotSkillSystem.COMPLETION_BONUS : 0;
    }

    private clampRank(value: unknown): number {
        return Math.max(1, Math.min(PilotSkillSystem.MAX_RANK, Math.floor(Number(value) || 1)));
    }

    private getRequirementForRank(rank: number): number {
        const progressionIndex = Math.max(0, rank - 1);
        return Math.min(
            PilotSkillSystem.XP_REQUIREMENT_CAP,
            Math.round(PilotSkillSystem.XP_FOR_RANK_ONE * Math.pow(PilotSkillSystem.XP_GROWTH, progressionIndex))
        );
    }
}
