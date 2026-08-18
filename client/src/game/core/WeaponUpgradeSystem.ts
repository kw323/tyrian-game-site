export enum WeaponType {
    STRAIGHT = 'straight',
    SPREAD = 'spread',
    HOMING = 'homing',
    HEAVY = 'heavy',
    LASER = 'laser',
    VOID_LANCE = 'void_lance'
}

export interface WeaponLevel {
    level: number;
    cost: number;
    damage: number;
    fireRate: number;
    description: string;
    requiredShip?: number; // Minimum ship tier required
}

export class WeaponUpgradeSystem {
    private weaponLevels: Map<WeaponType, WeaponLevel[]> = new Map();
    private currentWeapon: WeaponType = WeaponType.STRAIGHT;
    private currentLevel: Map<WeaponType, number> = new Map();
    private secretWeaponUnlocked = false;

    constructor() {
        this.initializeWeapons();
        // All weapons start at level 0 (free straight shot)
        this.currentLevel.set(WeaponType.STRAIGHT, 0);
        this.currentLevel.set(WeaponType.SPREAD, -1); // Not owned
        this.currentLevel.set(WeaponType.HOMING, -1);
        this.currentLevel.set(WeaponType.HEAVY, -1);
        this.currentLevel.set(WeaponType.LASER, -1);
        this.currentLevel.set(WeaponType.VOID_LANCE, -1);
    }

    private initializeWeapons(): void {
        // STRAIGHT SHOT - Base weapon, always available (25 levels)
        this.weaponLevels.set(WeaponType.STRAIGHT, [
            { level: 0, cost: 0, damage: 10, fireRate: 6, description: '1 parallel shot' },
            { level: 1, cost: 300, damage: 12, fireRate: 7, description: 'Faster shots' },
            { level: 2, cost: 600, damage: 14, fireRate: 8, description: '2 parallel shots' },
            { level: 3, cost: 1200, damage: 16, fireRate: 9, description: 'Faster, 2-shot volley' },
            { level: 4, cost: 2400, damage: 18, fireRate: 10, description: '3 parallel shots' },
            { level: 5, cost: 4800, damage: 20, fireRate: 11, description: 'Faster, 3-shot volley' },
            { level: 6, cost: 9600, damage: 22, fireRate: 12, description: '4 parallel shots' },
            { level: 7, cost: 19200, damage: 24, fireRate: 13, description: 'Faster, 4-shot volley', requiredShip: 1 },
            { level: 8, cost: 38400, damage: 26, fireRate: 14, description: '5 parallel shots', requiredShip: 1 },
            { level: 9, cost: 76800, damage: 28, fireRate: 15, description: 'Faster, 5-shot volley', requiredShip: 2 },
            { level: 10, cost: 153600, damage: 30, fireRate: 16, description: '6 parallel shots', requiredShip: 2 },
            { level: 11, cost: 307200, damage: 32, fireRate: 17, description: '7 parallel shots', requiredShip: 2 },
            { level: 12, cost: 614400, damage: 34, fireRate: 18, description: '8 parallel shots', requiredShip: 3 },
            { level: 13, cost: 1228800, damage: 36, fireRate: 19, description: '9 parallel shots', requiredShip: 3 },
            { level: 14, cost: 2457600, damage: 40, fireRate: 20, description: '10 parallel shots', requiredShip: 3 },
            { level: 15, cost: 5000000, damage: 44, fireRate: 21, description: '11 parallel heavy bolts', requiredShip: 3 },
            { level: 16, cost: 10000000, damage: 48, fireRate: 22, description: '12 parallel precision beams', requiredShip: 3 },
            { level: 17, cost: 20000000, damage: 52, fireRate: 23, description: '13 parallel plasma lances', requiredShip: 3 },
            { level: 18, cost: 40000000, damage: 57, fireRate: 24, description: '14 parallel annihilation bolts', requiredShip: 3 },
            { level: 19, cost: 80000000, damage: 62, fireRate: 25, description: '15 parallel sector sweepers', requiredShip: 3 },
            { level: 20, cost: 160000000, damage: 68, fireRate: 26, description: '16 parallel quantum tracers', requiredShip: 3 },
            { level: 21, cost: 320000000, damage: 74, fireRate: 27, description: '18 parallel photon streams', requiredShip: 3 },
            { level: 22, cost: 640000000, damage: 81, fireRate: 28, description: '20 parallel energy walls', requiredShip: 3 },
            { level: 23, cost: 1280000000, damage: 89, fireRate: 29, description: '22 parallel singularity traces', requiredShip: 3 },
            { level: 24, cost: 2560000000, damage: 98, fireRate: 30, description: '25 parallel ultimate straight beams', requiredShip: 3 }
        ]);

        // SPREAD SHOT (25 levels)
        this.weaponLevels.set(WeaponType.SPREAD, [
            { level: 0, cost: 500, damage: 8, fireRate: 5, description: '1 center bullet' },
            { level: 1, cost: 1000, damage: 8, fireRate: 5, description: '3 bullets, narrow spread' },
            { level: 2, cost: 2000, damage: 8, fireRate: 5, description: '3 bullets, wider angles' },
            { level: 3, cost: 4000, damage: 9, fireRate: 6, description: '5 bullets in spread' },
            { level: 4, cost: 8000, damage: 10, fireRate: 7, description: '5 bullets, wider arc' },
            { level: 5, cost: 16000, damage: 11, fireRate: 8, description: '6-angle spread' },
            { level: 6, cost: 32000, damage: 12, fireRate: 9, description: '6-angle, wider arc' },
            { level: 7, cost: 64000, damage: 13, fireRate: 10, description: '7-angle spread', requiredShip: 1 },
            { level: 8, cost: 128000, damage: 14, fireRate: 11, description: '7-angle, wider arc', requiredShip: 1 },
            { level: 9, cost: 256000, damage: 15, fireRate: 12, description: '8-angle storm', requiredShip: 2 },
            { level: 10, cost: 512000, damage: 16, fireRate: 13, description: '8-angle, wider arc', requiredShip: 2 },
            { level: 11, cost: 1024000, damage: 17, fireRate: 14, description: '9-angle maelstrom', requiredShip: 2 },
            { level: 12, cost: 2048000, damage: 18, fireRate: 15, description: '9-angle, wider arc', requiredShip: 3 },
            { level: 13, cost: 4096000, damage: 19, fireRate: 16, description: '10-angle tornado', requiredShip: 3 },
            { level: 14, cost: 8192000, damage: 20, fireRate: 17, description: '10-angle apocalypse', requiredShip: 3 },
            { level: 15, cost: 16384000, damage: 22, fireRate: 18, description: '11-angle sector wave', requiredShip: 3 },
            { level: 16, cost: 32768000, damage: 24, fireRate: 19, description: '12-angle plasma fan', requiredShip: 3 },
            { level: 17, cost: 65536000, damage: 26, fireRate: 20, description: '13-angle dispersion wall', requiredShip: 3 },
            { level: 18, cost: 131072000, damage: 28, fireRate: 21, description: '14-angle tachyon ring', requiredShip: 3 },
            { level: 19, cost: 262144000, damage: 31, fireRate: 22, description: '15-angle sphere sweep', requiredShip: 3 },
            { level: 20, cost: 524288000, damage: 34, fireRate: 23, description: '16-angle supernova fan', requiredShip: 3 },
            { level: 21, cost: 1048576000, damage: 37, fireRate: 24, description: '18-angle total coverage', requiredShip: 3 },
            { level: 22, cost: 2097152000, damage: 41, fireRate: 25, description: '20-angle storm wall', requiredShip: 3 },
            { level: 23, cost: 4194304000, damage: 45, fireRate: 26, description: '22-angle quantum spiral', requiredShip: 3 },
            { level: 24, cost: 8388608000, damage: 50, fireRate: 28, description: '25-angle absolute apocalypse', requiredShip: 3 }
        ]);

        // HOMING MISSILES (25 levels)
        this.weaponLevels.set(WeaponType.HOMING, [
            { level: 0, cost: 1000, damage: 15, fireRate: 2.5, description: 'Single homing missile' },
            { level: 1, cost: 2000, damage: 15, fireRate: 3, description: 'Faster missiles' },
            { level: 2, cost: 4000, damage: 16, fireRate: 3.25, description: 'Two missiles' },
            { level: 3, cost: 8000, damage: 17, fireRate: 3.75, description: 'Two missiles, improved tracking' },
            { level: 4, cost: 16000, damage: 18, fireRate: 4.25, description: 'Three missiles' },
            { level: 5, cost: 32000, damage: 19, fireRate: 4.75, description: 'Three missiles, faster reload' },
            { level: 6, cost: 64000, damage: 20, fireRate: 5.25, description: 'Three missiles, stronger warheads' },
            { level: 7, cost: 128000, damage: 21, fireRate: 5.75, description: 'Swarm tracking', requiredShip: 1 },
            { level: 8, cost: 256000, damage: 22, fireRate: 6.25, description: 'Missile barrage', requiredShip: 1 },
            { level: 9, cost: 512000, damage: 23, fireRate: 6.75, description: 'Guided arsenal', requiredShip: 2 },
            { level: 10, cost: 1024000, damage: 24, fireRate: 7.25, description: 'Targeting matrix', requiredShip: 2 },
            { level: 11, cost: 2048000, damage: 25, fireRate: 7.75, description: 'Missile network', requiredShip: 2 },
            { level: 12, cost: 4096000, damage: 26, fireRate: 8.25, description: 'Homing nexus', requiredShip: 3 },
            { level: 13, cost: 8192000, damage: 27, fireRate: 8.75, description: 'Seeking fury', requiredShip: 3 },
            { level: 14, cost: 16384000, damage: 30, fireRate: 9.5, description: 'Guided devastation', requiredShip: 3 },
            { level: 15, cost: 32768000, damage: 33, fireRate: 10.2, description: 'Quad-seeker swarm', requiredShip: 3 },
            { level: 16, cost: 65536000, damage: 36, fireRate: 11.0, description: 'Tactical missile matrix', requiredShip: 3 },
            { level: 17, cost: 131072000, damage: 40, fireRate: 11.8, description: 'Plasma-tipped homing grid', requiredShip: 3 },
            { level: 18, cost: 262144000, damage: 44, fireRate: 12.6, description: 'Hyper-velocity seeker fleet', requiredShip: 3 },
            { level: 19, cost: 524288000, damage: 48, fireRate: 13.5, description: 'Autonomous cluster storm', requiredShip: 3 },
            { level: 20, cost: 1048576000, damage: 53, fireRate: 14.4, description: 'Quantum missile nexus', requiredShip: 3 },
            { level: 21, cost: 2097152000, damage: 59, fireRate: 15.3, description: 'Annihilation warhead swarm', requiredShip: 3 },
            { level: 22, cost: 4194304000, damage: 65, fireRate: 16.2, description: 'Interstellar tracker array', requiredShip: 3 },
            { level: 23, cost: 8388608000, damage: 72, fireRate: 17.2, description: 'Singularity seeker cluster', requiredShip: 3 },
            { level: 24, cost: 16777216000, damage: 80, fireRate: 18.5, description: 'Absolute guided devastation', requiredShip: 3 }
        ]);

        // HEAVY CANNON (25 levels)
        this.weaponLevels.set(WeaponType.HEAVY, [
            { level: 0, cost: 750, damage: 38, fireRate: 2.4, description: 'Primary shell that splits into 4 diagonal shrapnel' },
            { level: 1, cost: 1500, damage: 42, fireRate: 2.8, description: 'Enhanced shell velocity & shrapnel force' },
            { level: 2, cost: 3000, damage: 48, fireRate: 2.9, description: 'Twin split bomb payload' },
            { level: 3, cost: 6000, damage: 54, fireRate: 3.2, description: 'Triple split bomb volley' },
            { level: 4, cost: 12000, damage: 61, fireRate: 3.5, description: 'Expanded fragmentation radius' },
            { level: 5, cost: 24000, damage: 68, fireRate: 3.8, description: 'High-yield fragmentation charge' },
            { level: 6, cost: 48000, damage: 76, fireRate: 4.1, description: 'Extended shrapnel range' },
            { level: 7, cost: 96000, damage: 84, fireRate: 4.4, description: 'Advanced split bomb payload', requiredShip: 1 },
            { level: 8, cost: 192000, damage: 93, fireRate: 4.7, description: 'Double cascade shrapnel burst', requiredShip: 1 },
            { level: 9, cost: 384000, damage: 102, fireRate: 4.9, description: 'Pulsar split-fragment array', requiredShip: 2 },
            { level: 10, cost: 768000, damage: 112, fireRate: 5.1, description: 'Plasma split-bomb cluster', requiredShip: 2 },
            { level: 11, cost: 1536000, damage: 123, fireRate: 5.3, description: 'Multi-stage fracture volley', requiredShip: 2 },
            { level: 12, cost: 3072000, damage: 135, fireRate: 5.5, description: 'Particle shrapnel barrage', requiredShip: 3 },
            { level: 13, cost: 6144000, damage: 148, fireRate: 5.7, description: 'Quantum fragmentation cascade', requiredShip: 3 },
            { level: 14, cost: 12288000, damage: 162, fireRate: 5.9, description: 'Dimensional split shell', requiredShip: 3 },
            { level: 15, cost: 24576000, damage: 178, fireRate: 6.2, description: 'Sub-space fragment cluster', requiredShip: 3 },
            { level: 16, cost: 49152000, damage: 195, fireRate: 6.5, description: 'Antimatter split core', requiredShip: 3 },
            { level: 17, cost: 98304000, damage: 214, fireRate: 6.8, description: 'Singularity fragment storm', requiredShip: 3 },
            { level: 18, cost: 196608000, damage: 235, fireRate: 7.1, description: 'Supernova shrapnel burst', requiredShip: 3 },
            { level: 19, cost: 393216000, damage: 258, fireRate: 7.4, description: 'Planetary split-bomb array', requiredShip: 3 },
            { level: 20, cost: 786432000, damage: 284, fireRate: 7.7, description: 'Void fragment storm', requiredShip: 3 },
            { level: 21, cost: 1572864000, damage: 312, fireRate: 8.0, description: 'Dark matter split barrage', requiredShip: 3 },
            { level: 22, cost: 3145728000, damage: 344, fireRate: 8.4, description: 'Omega fragment obliterator', requiredShip: 3 },
            { level: 23, cost: 6291456000, damage: 380, fireRate: 8.8, description: 'Titanium split cluster', requiredShip: 3 },
            { level: 24, cost: 12582912000, damage: 420, fireRate: 9.3, description: 'Ultimate split bomb matrix', requiredShip: 3 }
        ]);

        // PULSE LASER (25 levels)
        this.weaponLevels.set(WeaponType.LASER, [
            { level: 0, cost: 1500, damage: 12, fireRate: 4, description: 'Single pulse beam' },
            { level: 1, cost: 3000, damage: 14, fireRate: 4.5, description: 'Stabilized frequency' },
            { level: 2, cost: 6000, damage: 16, fireRate: 5, description: 'Focused beam' },
            { level: 3, cost: 12000, damage: 18, fireRate: 5.5, description: 'High-intensity pulse' },
            { level: 4, cost: 24000, damage: 20, fireRate: 6, description: 'Charged ray' },
            { level: 5, cost: 48000, damage: 23, fireRate: 6.5, description: 'Coherent beam' },
            { level: 6, cost: 96000, damage: 26, fireRate: 7, description: 'Photon lance' },
            { level: 7, cost: 192000, damage: 29, fireRate: 7.5, description: 'Ion projector', requiredShip: 1 },
            { level: 8, cost: 384000, damage: 32, fireRate: 8, description: 'Singularity beam', requiredShip: 1 },
            { level: 9, cost: 768000, damage: 35, fireRate: 8.5, description: 'Electron torrent', requiredShip: 2 },
            { level: 10, cost: 1536000, damage: 38, fireRate: 9, description: 'Solar flare', requiredShip: 2 },
            { level: 11, cost: 3072000, damage: 41, fireRate: 9.5, description: 'Starlight spear', requiredShip: 2 },
            { level: 12, cost: 6144000, damage: 44, fireRate: 10, description: 'Gamma flash', requiredShip: 3 },
            { level: 13, cost: 12288000, damage: 47, fireRate: 10.5, description: 'Prismatic ray', requiredShip: 3 },
            { level: 14, cost: 24576000, damage: 50, fireRate: 11, description: 'Controlled annihilation', requiredShip: 3 },
            { level: 15, cost: 49152000, damage: 54, fireRate: 11.6, description: 'Hyper-focus ion beam', requiredShip: 3 },
            { level: 16, cost: 98304000, damage: 58, fireRate: 12.2, description: 'Neutron flux projector', requiredShip: 3 },
            { level: 17, cost: 196608000, damage: 63, fireRate: 12.8, description: 'Polarized tachyon spear', requiredShip: 3 },
            { level: 18, cost: 393216000, damage: 68, fireRate: 13.4, description: 'Stellar core ray', requiredShip: 3 },
            { level: 19, cost: 786432000, damage: 74, fireRate: 14.0, description: 'Supernova flash beam', requiredShip: 3 },
            { level: 20, cost: 1572864000, damage: 81, fireRate: 14.7, description: 'Quantum convergence lance', requiredShip: 3 },
            { level: 21, cost: 3145728000, damage: 88, fireRate: 15.4, description: 'Annihilation prism ray', requiredShip: 3 },
            { level: 22, cost: 6291456000, damage: 96, fireRate: 16.1, description: 'Omega thermal beam', requiredShip: 3 },
            { level: 23, cost: 12582912000, damage: 105, fireRate: 16.8, description: 'Singularity event beam', requiredShip: 3 },
            { level: 24, cost: 25165824000, damage: 115, fireRate: 17.6, description: 'Absolute controlled annihilation', requiredShip: 3 }
        ]);

        // BLACK HOLE PROJECTILE (25 levels)
        this.weaponLevels.set(WeaponType.VOID_LANCE, [
            { level: 0, cost: 0, damage: 26, fireRate: 1.9, description: 'Black hole seed + short pull' },
            { level: 1, cost: 3500, damage: 29, fireRate: 2.05, description: 'Denser gravity well' },
            { level: 2, cost: 7000, damage: 32, fireRate: 2.2, description: 'Twin black-hole traces' },
            { level: 3, cost: 14000, damage: 35, fireRate: 2.35, description: 'Longer suction field' },
            { level: 4, cost: 28000, damage: 39, fireRate: 2.5, description: 'Stronger orbit drag' },
            { level: 5, cost: 56000, damage: 43, fireRate: 2.65, description: 'Expanded event horizon' },
            { level: 6, cost: 112000, damage: 47, fireRate: 2.8, description: 'Triple gravity traces' },
            { level: 7, cost: 224000, damage: 51, fireRate: 2.95, description: 'Deep-field collapse', requiredShip: 1 },
            { level: 8, cost: 448000, damage: 55, fireRate: 3.1, description: 'Heavy orbit drag', requiredShip: 1 },
            { level: 9, cost: 896000, damage: 60, fireRate: 3.25, description: 'Localized singularity', requiredShip: 2 },
            { level: 10, cost: 1792000, damage: 65, fireRate: 3.4, description: 'Twin horizon burst', requiredShip: 2 },
            { level: 11, cost: 3584000, damage: 70, fireRate: 3.55, description: 'Gravity cascade', requiredShip: 2 },
            { level: 12, cost: 7168000, damage: 75, fireRate: 3.7, description: 'Event-horizon lattice', requiredShip: 3 },
            { level: 13, cost: 14336000, damage: 80, fireRate: 3.85, description: 'Black signal well', requiredShip: 3 },
            { level: 14, cost: 28672000, damage: 86, fireRate: 4, description: 'Controlled micro-singularity', requiredShip: 3 },
            { level: 15, cost: 57344000, damage: 93, fireRate: 4.2, description: 'Dense accretion disk', requiredShip: 3 },
            { level: 16, cost: 114688000, damage: 100, fireRate: 4.4, description: 'Warped spacetime shell', requiredShip: 3 },
            { level: 17, cost: 229376000, damage: 108, fireRate: 4.6, description: 'Heavy gravitational anchor', requiredShip: 3 },
            { level: 18, cost: 458752000, damage: 117, fireRate: 4.8, description: 'Pulsar singularity core', requiredShip: 3 },
            { level: 19, cost: 917504000, damage: 127, fireRate: 5.0, description: 'Event-horizon storm well', requiredShip: 3 },
            { level: 20, cost: 1835008000, damage: 138, fireRate: 5.3, description: 'Dark matter collapse sphere', requiredShip: 3 },
            { level: 21, cost: 3670016000, damage: 150, fireRate: 5.6, description: 'Quantum singularity nexus', requiredShip: 3 },
            { level: 22, cost: 7340032000, damage: 163, fireRate: 5.9, description: 'Supermassive gravitational vortex', requiredShip: 3 },
            { level: 23, cost: 14680064000, damage: 178, fireRate: 6.2, description: 'Dimension-collapse seed', requiredShip: 3 },
            { level: 24, cost: 29360128000, damage: 195, fireRate: 6.5, description: 'Absolute event-horizon core', requiredShip: 3 }
        ]);
    }

    public getWeaponLevels(type: WeaponType): WeaponLevel[] {
        return this.weaponLevels.get(type) || [];
    }

    public getCurrentLevel(type: WeaponType): number {
        const level = this.currentLevel.get(type);
        return level !== undefined ? level : -1;
    }

    public setCurrentWeapon(type: WeaponType): boolean {
        if (type === WeaponType.VOID_LANCE && !this.secretWeaponUnlocked) return false;
        const level = this.currentLevel.get(type);
        if (level !== undefined && level >= 0) {
            this.currentWeapon = type;
            return true;
        }
        return false;
    }

    public getCurrentWeapon(): WeaponType {
        return this.currentWeapon;
    }

    public getCurrentWeaponStats(): WeaponLevel | null {
        const level = this.currentLevel.get(this.currentWeapon);
        if (level === undefined || level < 0) return null;
        const levels = this.weaponLevels.get(this.currentWeapon);
        if (!levels) return null;
        return levels[level] || null;
    }

    public upgradeWeapon(type: WeaponType, score: number, currentShip: number = 0): { cost: number; refund: number } | null {
        if (type === WeaponType.VOID_LANCE && !this.secretWeaponUnlocked) return null;
        const currentLevel = this.currentLevel.get(type);
        const actualLevel = currentLevel !== undefined ? currentLevel : -1;
        const levels = this.weaponLevels.get(type);

        if (!levels) return null;

        // If weapon not owned, buy level 0
        if (actualLevel === -1) {
            const nextLevel = levels[0];
            if (nextLevel && score >= nextLevel.cost) {
                // Check ship requirement
                if (nextLevel.requiredShip && currentShip < nextLevel.requiredShip) {
                    return null; // Need better ship
                }
                this.currentLevel.set(type, 0);
                return { cost: nextLevel.cost, refund: 0 };
            }
            return null;
        }

        // Upgrade to next level
        if (actualLevel + 1 < levels.length) {
            const nextLevel = levels[actualLevel + 1];
            const currentLevelData = levels[actualLevel];
            if (nextLevel && score >= nextLevel.cost) {
                // Check ship requirement
                if (nextLevel.requiredShip && currentShip < nextLevel.requiredShip) {
                    return null; // Need better ship
                }
                this.currentLevel.set(type, actualLevel + 1);
                const refund = Math.floor(currentLevelData.cost * 0.5);
                return { cost: nextLevel.cost, refund };
            }
        }
        return null;
    }

    public downgradeWeapon(type: WeaponType): { refund: number; newLevel: number } | null {
        const currentLevel = this.currentLevel.get(type);
        if (currentLevel === undefined || currentLevel <= 0) return null;

        const levels = this.weaponLevels.get(type);
        if (!levels) return null;

        const currentLevelData = levels[currentLevel];
        if (!currentLevelData) return null;

        this.currentLevel.set(type, currentLevel - 1);
        // Downgrading returns the full cost of the removed level. The weapon remains owned.
        return { refund: currentLevelData.cost, newLevel: currentLevel - 1 };
    }

    public getSaveState(): { weaponLevels: Record<string, number>; currentWeapon: string; secretWeaponUnlocked: boolean } {
        const weaponLevels: Record<string, number> = {};
        this.currentLevel.forEach((level, type) => {
            weaponLevels[type] = level;
        });
        return {
            weaponLevels,
            currentWeapon: this.currentWeapon,
            secretWeaponUnlocked: this.secretWeaponUnlocked
        };
    }

    public loadSaveState(state: { weaponLevels?: Record<string, number>; currentWeapon?: string; secretWeaponUnlocked?: boolean }): void {
        Object.values(WeaponType).forEach((type) => {
            const savedLevel = state.weaponLevels?.[type];
            if (typeof savedLevel === 'number') {
                const maxLevel = this.getWeaponLevels(type).length - 1;
                this.currentLevel.set(type, Math.max(-1, Math.min(maxLevel, Math.floor(savedLevel))));
            }
        });
        this.secretWeaponUnlocked = Boolean(state.secretWeaponUnlocked);
        if (this.secretWeaponUnlocked && this.getCurrentLevel(WeaponType.VOID_LANCE) < 0) {
            this.currentLevel.set(WeaponType.VOID_LANCE, 0);
        }
        const savedWeapon = state.currentWeapon as WeaponType | undefined;
        if (savedWeapon && this.getCurrentLevel(savedWeapon) >= 0 && (savedWeapon !== WeaponType.VOID_LANCE || this.secretWeaponUnlocked)) {
            this.currentWeapon = savedWeapon;
        }
    }

    public unlockSecretWeapon(): boolean {
        if (this.secretWeaponUnlocked) return false;
        this.secretWeaponUnlocked = true;
        this.currentLevel.set(WeaponType.VOID_LANCE, 0);
        return true;
    }

    public isSecretWeaponUnlocked(): boolean {
        return this.secretWeaponUnlocked;
    }

    public reset(): void {
        this.currentWeapon = WeaponType.STRAIGHT;
        this.currentLevel.set(WeaponType.STRAIGHT, 0);
        this.currentLevel.set(WeaponType.SPREAD, -1);
        this.currentLevel.set(WeaponType.HOMING, -1);
        this.currentLevel.set(WeaponType.HEAVY, -1);
        this.currentLevel.set(WeaponType.LASER, -1);
        this.currentLevel.set(WeaponType.VOID_LANCE, -1);
        this.secretWeaponUnlocked = false;
    }

    public getWeaponRequiredShip(type: WeaponType, level: number): number {
        const levels = this.weaponLevels.get(type);
        if (!levels || level < 0 || level >= levels.length) return 0;
        return levels[level].requiredShip || 0;
    }

    /** Total credits invested in one weapon up to its current level. */
    public getWeaponInvestment(type: WeaponType, level: number = this.getCurrentLevel(type)): number {
        if (level < 0) return 0;
        return this.getWeaponLevels(type)
            .slice(0, Math.min(level + 1, this.getWeaponLevels(type).length))
            .reduce((total, entry) => total + entry.cost, 0);
    }

    /** Total credits invested across every weapon currently owned. */
    public getTotalInvestment(): number {
        return (Object.values(WeaponType) as WeaponType[]).reduce(
            (total, type) => total + this.getWeaponInvestment(type),
            0
        );
    }
}
