export class PowerSystem {
    public maxPower: number = 200; // Base capacitor capacity before generator storage upgrades
    public currentPower: number = 200;
    public generatorLevel: number = 0; // Generator upgrade level (0-14)
    public generatorOutput: number = 15; // Power generated per second at level 0
    private reactorRecovering: boolean = false;
    private readonly reactorRecoveryOutputMultiplier: number = 0.6;
    private capacitorMultiplier: number = 1;
    private weaponEfficiencyMultiplier: number = 1;
    
    // Energy cost per weapon trigger pull (extended to 25 ranks).
    public shieldRegenCost: number = 3; // Cost to regenerate shield
    public weaponCosts: Map<string, number[]> = new Map([
        ['straight', [0, 0.3, 0.7, 1, 1.3, 1.7, 2, 2.3, 2.7, 3, 3.3, 3.7, 4, 4.3, 4.7, 5, 5.3, 5.7, 6, 6.3, 6.7, 7, 7.3, 7.7, 8]],
        ['spread', [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.3, 5, 5.7, 6.4, 7.1, 7.8, 8.5, 9.2, 9.9, 10.6, 11.3, 12, 12.8, 13.5, 14.2, 14.9, 15.6, 16.3, 17]],
        ['homing', [0, 1.1, 2.2, 3.3, 4.3, 5.4, 6.5, 7.6, 8.7, 9.8, 10.8, 11.9, 13, 14.1, 15.2, 16.3, 17.3, 18.4, 19.5, 20.6, 21.7, 22.8, 23.8, 24.9, 26]],
        ['heavy', [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 31, 34, 37, 40, 43, 45, 47, 48.5, 49.5, 50.3, 51]],
        // The final laser ranks are deliberately power-hungry: a Rank-50 generator
        // sustains the mid ranks, while ranks 21–25 create a controlled 2.5s burst window.
        ['laser', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25, 27, 30, 32, 35, 38, 40]],
        ['arc', [4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 20.5, 21.5, 22.5, 23.5, 24.5, 25.5, 26.5, 27.5, 28.5]],
        ['void_lance', [8, 10.5, 13, 15.5, 18, 20.5, 23, 25.5, 28, 30.5, 33, 35.5, 38, 40.5, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73]]
    ]);

    constructor() {
        this.currentPower = this.maxPower;
    }

    public getGeneratorOutput(bonusMultiplier: number = 1.0): number {
        // Generator output increases smoothly up to level 49 (50 levels total) and applies pilot skill bonus
        return (this.generatorOutput + (this.generatorLevel * 8.5)) * bonusMultiplier;
    }

    public setPilotModifiers(capacitorMultiplier: number = 1, weaponEfficiencyMultiplier: number = 1): void {
        const safeCapacitorMultiplier = Math.max(1, capacitorMultiplier);
        this.capacitorMultiplier = safeCapacitorMultiplier;
        this.weaponEfficiencyMultiplier = Math.max(1, weaponEfficiencyMultiplier);
        this.currentPower = Math.min(this.currentPower, this.getMaxPower());
    }

    public getMaxPower(): number {
        // Higher generators also carry a larger power reserve. At rank 49 this yields
        // roughly 850 power: enough for an intentional high-rank burst, not endless laser fire.
        const generatorStorage = this.generatorLevel * 13.25;
        return Math.round((this.maxPower + generatorStorage) * this.capacitorMultiplier);
    }

    public getWeaponCost(weaponType: string, level: number): number {
        const costs = this.weaponCosts.get(weaponType);
        if (!costs || level < 0 || level >= costs.length) return 0;
        return costs[level] / this.weaponEfficiencyMultiplier;
    }

    public getShieldRegenCost(): number {
        return this.shieldRegenCost;
    }

    public canShield(): boolean {
        return this.currentPower >= this.shieldRegenCost;
    }

    public canShoot(weaponType: string, level: number): boolean {
        const cost = this.getWeaponCost(weaponType, level);
        return !this.reactorRecovering && this.currentPower >= cost;
    }

    public consumePower(amount: number): void {
        if (this.reactorRecovering || amount <= 0) return;
        this.currentPower = Math.max(0, this.currentPower - amount);
        if (this.currentPower <= 0) {
            this.reactorRecovering = true;
        }
    }

    /**
     * Weapon fire deliberately consumes the last usable reserve. Without this rule, a
     * weapon is blocked one fraction of a shot before zero and the intended full-reactor
     * recovery state never begins. The final legal shot therefore drains the capacitor
     * whenever it would leave less than one more full shot in reserve.
     */
    public consumeWeaponPower(amount: number): void {
        if (this.reactorRecovering || amount <= 0) return;
        const safeAmount = Math.max(0, amount);
        const remaining = this.currentPower - safeAmount;
        if (remaining <= safeAmount) {
            this.currentPower = 0;
            this.reactorRecovering = true;
            return;
        }
        this.currentPower = remaining;
    }

    public generatePower(deltaTime: number, bonusMultiplier: number = 1.0): void {
        const recoveryMultiplier = this.reactorRecovering ? this.reactorRecoveryOutputMultiplier : 1;
        const output = this.getGeneratorOutput(bonusMultiplier) * recoveryMultiplier * deltaTime;
        const maxPower = this.getMaxPower();
        this.currentPower = Math.min(this.currentPower + output, maxPower);
        if (this.reactorRecovering && this.currentPower >= maxPower) {
            this.currentPower = maxPower;
            this.reactorRecovering = false;
        }
    }

    public isReactorRecovering(): boolean {
        return this.reactorRecovering;
    }

    public getReactorRecoveryPercent(): number {
        return this.currentPower / this.getMaxPower();
    }

    /** Used by the unlimited-power tactical effect and controlled stage resets. */
    public forceReactorOnline(): void {
        this.currentPower = this.getMaxPower();
        this.reactorRecovering = false;
    }

    private getGeneratorCosts(): number[] {
        const costs: number[] = [0];
        let base = 500;
        for (let i = 1; i < 50; i++) {
            costs.push(base);
            base = Math.round(base * 1.18);
        }
        return costs;
    }

    public upgradeGenerator(): number {
        const costs = this.getGeneratorCosts();
        if (this.generatorLevel < costs.length - 1) {
            const cost = costs[this.generatorLevel + 1];
            this.generatorLevel++;
            return cost;
        }
        return 0;
    }

    public canUpgradeGenerator(): boolean {
        return this.generatorLevel < 49;
    }

    public getGeneratorInvestment(): number {
        const costs = this.getGeneratorCosts();
        return costs.slice(0, Math.min(this.generatorLevel + 1, costs.length)).reduce((total, cost) => total + cost, 0);
    }

    public getPowerPercentage(): number {
        return (this.currentPower / this.getMaxPower()) * 100;
    }

    /** Refill runtime power at a stage boundary without removing generator upgrades. */
    public refillForStage(): void {
        this.forceReactorOnline();
    }

    public loadSaveState(generatorLevel: number): void {
        this.generatorLevel = Math.max(0, Math.min(49, Math.floor(generatorLevel)));
        this.refillForStage();
    }

    /** Full reset used only for a new campaign/run. */
    public reset(): void {
        this.forceReactorOnline();
        this.generatorLevel = 0;
    }
}
