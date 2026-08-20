export const ENGINE_UPGRADE_MAX_RANK = 8;

// Engine precision is valuable throughout the campaign, so the investment follows
// the mid-campaign economy instead of being fully purchased in the opening sectors.
const ENGINE_UPGRADE_COSTS = [2000, 3000, 4500, 6500, 9000, 12500, 17000, 23000] as const;
const BONUS_PERCENT_PER_RANK = 2;

/**
 * Permanent propulsion upgrades are intentionally conservative. They help the
 * pilot correct positioning, but the full rank cap remains readable in dense
 * bullet patterns and preserves the value of engine equipment.
 */
export class EngineUpgradeSystem {
    private rank = 0;

    public getRank(): number {
        return this.rank;
    }

    public getMaxRank(): number {
        return ENGINE_UPGRADE_MAX_RANK;
    }

    public getBonusPercent(): number {
        return this.rank * BONUS_PERCENT_PER_RANK;
    }

    public getSpeedMultiplier(): number {
        return 1 + this.getBonusPercent() / 100;
    }

    public getNextCost(): number {
        return ENGINE_UPGRADE_COSTS[this.rank] ?? 0;
    }

    public canUpgrade(): boolean {
        return this.rank < ENGINE_UPGRADE_MAX_RANK;
    }

    public upgrade(currentCredits: number): number | null {
        const cost = this.getNextCost();
        if (!this.canUpgrade() || currentCredits < cost) return null;
        this.rank++;
        return cost;
    }

    public getTotalInvestment(): number {
        return ENGINE_UPGRADE_COSTS.slice(0, this.rank).reduce((total, cost) => total + cost, 0);
    }

    public loadSaveState(rank: number | undefined): void {
        this.rank = Math.max(0, Math.min(ENGINE_UPGRADE_MAX_RANK, Math.floor(rank ?? 0)));
    }
}
