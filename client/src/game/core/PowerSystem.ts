export class PowerSystem {
    public maxPower: number = 100; // Total power capacity
    public currentPower: number = 100; // Current power level
    public generatorLevel: number = 0; // Generator upgrade level (0-5)
    public generatorOutput: number = 15; // Power generated per second at level 0
    
    // Power consumption per second for each system
    public shieldRegenCost: number = 3; // Cost to regenerate shield
    public weaponCosts: Map<string, number[]> = new Map([
        ['straight', [0, 1, 2, 3, 4, 5]],      // Levels 0-4: increasing cost
        ['spread', [0, 2, 4, 6, 8, 10]],       // Levels 0-4: increasing cost
        ['homing', [0, 3, 6, 9, 12, 15]],      // Levels 0-4: increasing cost (most expensive)
        ['heavy', [0, 2.5, 5, 7.5, 10, 12.5]]  // Levels 0-4: increasing cost
    ]);

    constructor() {
        this.currentPower = this.maxPower;
    }

    public getGeneratorOutput(): number {
        // Generator output increases with level
        return this.generatorOutput + (this.generatorLevel * 5);
    }

    public getMaxPower(): number {
        // Max power increases with generator level
        return this.maxPower + (this.generatorLevel * 20);
    }

    public getWeaponCost(weaponType: string, level: number): number {
        const costs = this.weaponCosts.get(weaponType);
        if (!costs || level < 0 || level >= costs.length) return 0;
        return costs[level];
    }

    public getShieldRegenCost(): number {
        return this.shieldRegenCost;
    }

    public canShield(): boolean {
        return this.currentPower >= this.shieldRegenCost;
    }

    public canShoot(weaponType: string, level: number): boolean {
        const cost = this.getWeaponCost(weaponType, level);
        return this.currentPower >= cost;
    }

    public consumePower(amount: number): void {
        this.currentPower = Math.max(0, this.currentPower - amount);
    }

    public generatePower(deltaTime: number): void {
        const output = this.getGeneratorOutput() * deltaTime;
        const maxPower = this.getMaxPower();
        this.currentPower = Math.min(this.currentPower + output, maxPower);
    }

    public upgradGenerator(): number {
        // Returns cost in points for upgrading generator
        const costs = [0, 500, 1000, 1500, 2000, 2500];
        if (this.generatorLevel < costs.length - 1) {
            const cost = costs[this.generatorLevel + 1];
            this.generatorLevel++;
            return cost;
        }
        return 0; // Already at max level
    }

    public canUpgradeGenerator(): boolean {
        return this.generatorLevel < 5;
    }

    public getPowerPercentage(): number {
        return (this.currentPower / this.getMaxPower()) * 100;
    }

    public reset(): void {
        this.currentPower = this.getMaxPower();
        this.generatorLevel = 0;
    }
}
