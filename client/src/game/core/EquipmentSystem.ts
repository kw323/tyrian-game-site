export type EquipmentPartType = 'engine' | 'shield' | 'generator' | 'weapon' | 'computer';

export interface InventoryPart {
    id: string;
    type: EquipmentPartType;
    tier: number; // 1 to 5
    level: number; // 1 to maxLevel for tier
    equippedSlot?: EquipmentPartType | null; // mounted on ship
}

export class EquipmentSystem {
    private inventory: InventoryPart[] = [];
    private equipped: Record<EquipmentPartType, InventoryPart | null> = {
        engine: null,
        shield: null,
        generator: null,
        weapon: null,
        computer: null
    };

    constructor(savedState?: any) {
        if (savedState) {
            if (savedState.inventory) this.inventory = savedState.inventory;
            if (savedState.equipped) this.equipped = savedState.equipped;
        }
    }

    public getState() {
        return {
            inventory: this.inventory,
            equipped: this.equipped
        };
    }

    public getInventory(): InventoryPart[] {
        return this.inventory;
    }

    public getEquipped(type: EquipmentPartType): InventoryPart | null {
        return this.equipped[type];
    }

    public addDropPart(type: EquipmentPartType, tier = 1): InventoryPart {
        const newPart: InventoryPart = {
            id: 'part_' + Math.random().toString(36).substring(2, 9),
            type,
            tier: Math.max(1, Math.min(5, tier)),
            level: 1,
            equippedSlot: null
        };
        this.inventory.push(newPart);
        return newPart;
    }

    public equipPart(partId: string): boolean {
        const part = this.inventory.find(p => p.id === partId);
        if (!part) return false;

        // Unequip current if any
        const currentEquipped = this.equipped[part.type];
        if (currentEquipped) {
            currentEquipped.equippedSlot = null;
        }

        part.equippedSlot = part.type;
        this.equipped[part.type] = part;
        return true;
    }

    public unequipPart(type: EquipmentPartType): boolean {
        const part = this.equipped[type];
        if (!part) return false;
        part.equippedSlot = null;
        this.equipped[type] = null;
        return true;
    }

    public getMaxLevelForTier(tier: number): number {
        return tier * 5;
    }

    public calibratePart(partId: string, currentCredits: number): { success: boolean; cost: number } {
        const part = this.inventory.find(p => p.id === partId);
        if (!part) return { success: false, cost: 0 };
        const maxLvl = this.getMaxLevelForTier(part.tier);
        if (part.level >= maxLvl) return { success: false, cost: 0 };

        const cost = this.getCalibrationCost(part);
        if (currentCredits < cost) return { success: false, cost: 0 };

        part.level += 1;
        return { success: true, cost };
    }

    public getCalibrationCost(part: InventoryPart): number {
        const maxLvl = this.getMaxLevelForTier(part.tier);
        if (part.level >= maxLvl) return 0;
        const base = 1000 * Math.pow(1.45, part.level - 1);
        const tierMul = Math.pow(1.8, part.tier - 1);
        return Math.round(base * tierMul);
    }

    public fuseParts(partIds: string[]): InventoryPart | null {
        if (partIds.length !== 3) return null;
        const partsToFuse = partIds.map(id => this.inventory.find(p => p.id === id)).filter(Boolean) as InventoryPart[];
        if (partsToFuse.length !== 3) return null;

        const firstType = partsToFuse[0].type;
        const firstTier = partsToFuse[0].tier;
        if (firstTier >= 5) return null;

        // Verify all 3 are same type and same tier
        if (!partsToFuse.every(p => p.type === firstType && p.tier === firstTier)) return null;

        // Remove fused parts from inventory and equipped if needed
        partsToFuse.forEach(p => {
            if (this.equipped[p.type]?.id === p.id) {
                this.equipped[p.type] = null;
            }
            this.inventory = this.inventory.filter(item => item.id !== p.id);
        });

        // Create new upgraded part
        const fusedPart: InventoryPart = {
            id: 'part_' + Math.random().toString(36).substring(2, 9),
            type: firstType,
            tier: firstTier + 1,
            level: 1,
            equippedSlot: null
        };
        this.inventory.push(fusedPart);
        return fusedPart;
    }

    public getActiveBonuses(): {
        moveSpeed: number;
        shieldCap: number;
        genOutput: number;
        weaponDmg: number;
        critChance: number;
        critDmg: number;
        abilityDuration: number;
    } {
        let moveSpeed = 0;
        let shieldCap = 0;
        let genOutput = 0;
        let weaponDmg = 0;
        let critChance = 0;
        let critDmg = 0;
        let abilityDuration = 0;

        Object.values(this.equipped).forEach(part => {
            if (!part) return;
            const lvl = part.level;
            const tier = part.tier;
            switch (part.type) {
                case 'engine':
                    moveSpeed += 2 + (tier - 1) * 1 + lvl * 0.4;
                    break;
                case 'shield':
                    shieldCap += 3 + (tier - 1) * 2 + lvl * 0.5;
                    break;
                case 'generator':
                    genOutput += 3 + (tier - 1) * 2 + lvl * 0.5;
                    break;
                case 'weapon':
                    weaponDmg += 2 + (tier - 1) * 1.5 + lvl * 0.4;
                    break;
                case 'computer':
                    critChance += 1.5 + (tier - 1) * 1 + lvl * 0.3;
                    critDmg += 5 + (tier - 1) * 3 + lvl * 1.0;
                    if (tier >= 5) abilityDuration += 1.0;
                    break;
            }
        });

        return { moveSpeed, shieldCap, genOutput, weaponDmg, critChance, critDmg, abilityDuration };
    }
}
