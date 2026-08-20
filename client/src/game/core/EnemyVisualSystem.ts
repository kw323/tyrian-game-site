import type { CombatEnemyType, CombatFaction } from './EnemyCombatProfile';

export type EnemyShipSilhouette =
    | 'raider_dart'
    | 'raider_twin_boom'
    | 'raider_gunboat'
    | 'military_interceptor'
    | 'military_patrol'
    | 'military_assault'
    | 'military_sentinel'
    | 'alien_skimmer'
    | 'alien_manta'
    | 'alien_orbiter'
    | 'alien_sentinel'
    | 'hunter';

export interface EnemyVisualProfile {
    silhouette: EnemyShipSilhouette;
    hull: string;
    shadow: string;
    trim: string;
    cockpit: string;
    engine: string;
    stroke: string;
    glow: string;
}

const RAIDER_PALETTES: ReadonlyArray<Omit<EnemyVisualProfile, 'silhouette'>> = [
    { hull: '#9B3D2E', shadow: '#331A25', trim: '#FFB703', cockpit: '#DDF7FF', engine: '#FF7B37', stroke: '#F7D7AA', glow: '#FF7B37' },
    { hull: '#426E8B', shadow: '#172A3C', trim: '#F4A261', cockpit: '#DDF7FF', engine: '#FFB703', stroke: '#D6F0FF', glow: '#FFB703' },
    { hull: '#6D4C8E', shadow: '#251B3B', trim: '#E76F51', cockpit: '#F1E6FF', engine: '#FF875A', stroke: '#F4D7FF', glow: '#E76F51' },
    { hull: '#607D3B', shadow: '#1D2E25', trim: '#FFD166', cockpit: '#E1F6FF', engine: '#FF8C42', stroke: '#E4F6C8', glow: '#FFD166' },
    { hull: '#B05472', shadow: '#3A1B35', trim: '#7CE6D0', cockpit: '#E7FBFF', engine: '#FF8A5C', stroke: '#FFE2EE', glow: '#7CE6D0' },
    { hull: '#A96832', shadow: '#3A251D', trim: '#91D6FF', cockpit: '#EAFBFF', engine: '#FFB703', stroke: '#FFE3BD', glow: '#91D6FF' },
];

const MILITARY_BASE: Omit<EnemyVisualProfile, 'silhouette'> = {
    hull: '#2C4963',
    shadow: '#132235',
    trim: '#7EA4C2',
    cockpit: '#B8F1FF',
    engine: '#4CC9F0',
    stroke: '#D9ECF6',
    glow: '#4CC9F0',
};

const MILITARY_TRIMS: Record<CombatEnemyType, string> = {
    scout: '#7EC8FF',
    drone: '#72B8D9',
    tank: '#A9C4D6',
    orbiter: '#72B8D9',
    sentinel: '#5AAFE8',
    evasive_hunter: '#8EB8DD',
};

const ALIEN_PROFILES: Record<CombatEnemyType, Omit<EnemyVisualProfile, 'silhouette'>> = {
    scout: { hull: '#2F8C8A', shadow: '#12343B', trim: '#A6F4DB', cockpit: '#E8FFF5', engine: '#70F2C5', stroke: '#CBFFF1', glow: '#70F2C5' },
    drone: { hull: '#6651A6', shadow: '#251B4D', trim: '#E5B8FF', cockpit: '#F5E6FF', engine: '#B68BFF', stroke: '#F0D9FF', glow: '#B68BFF' },
    tank: { hull: '#487B79', shadow: '#173538', trim: '#C4FFB8', cockpit: '#F5FFF0', engine: '#9CFF93', stroke: '#E7FFE1', glow: '#9CFF93' },
    orbiter: { hull: '#925BBD', shadow: '#34204D', trim: '#FFB8EE', cockpit: '#FFF0FB', engine: '#E986FF', stroke: '#FFE0FA', glow: '#E986FF' },
    sentinel: { hull: '#465FAF', shadow: '#1B2551', trim: '#8FEAFF', cockpit: '#EBFFFF', engine: '#67C7FF', stroke: '#D7FAFF', glow: '#8FEAFF' },
    evasive_hunter: { hull: '#A74778', shadow: '#451A3C', trim: '#FFDA75', cockpit: '#FFF3DB', engine: '#FF816A', stroke: '#FFE1EF', glow: '#FFDA75' },
};

function silhouetteFor(faction: CombatFaction, type: CombatEnemyType): EnemyShipSilhouette {
    if (type === 'evasive_hunter') return 'hunter';
    if (faction === 'raiders') {
        if (type === 'drone') return 'raider_twin_boom';
        if (type === 'tank') return 'raider_gunboat';
        return 'raider_dart';
    }
    if (faction === 'military') {
        if (type === 'drone') return 'military_patrol';
        if (type === 'tank') return 'military_assault';
        if (type === 'sentinel') return 'military_sentinel';
        return 'military_interceptor';
    }
    if (type === 'drone') return 'alien_manta';
    if (type === 'orbiter') return 'alien_orbiter';
    if (type === 'sentinel') return 'alien_sentinel';
    return 'alien_skimmer';
}

export function createEnemyVisualProfile(
    faction: CombatFaction,
    type: CombatEnemyType,
    raiderVariant = Math.floor(Math.random() * RAIDER_PALETTES.length),
): EnemyVisualProfile {
    const silhouette = silhouetteFor(faction, type);
    if (faction === 'raiders') {
        const palette = RAIDER_PALETTES[Math.abs(raiderVariant) % RAIDER_PALETTES.length];
        return { silhouette, ...palette };
    }
    if (faction === 'military') {
        return { ...MILITARY_BASE, trim: MILITARY_TRIMS[type], silhouette };
    }
    return { ...ALIEN_PROFILES[type], silhouette };
}

function fillShipPath(ctx: CanvasRenderingContext2D, profile: EnemyVisualProfile): void {
    ctx.fillStyle = profile.hull;
    ctx.fill();
    ctx.strokeStyle = profile.stroke;
    ctx.lineWidth = 1.05;
    ctx.stroke();
}

function drawCockpit(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile, oval = false): void {
    ctx.fillStyle = profile.cockpit;
    ctx.strokeStyle = 'rgba(9, 21, 35, 0.72)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (oval) {
        ctx.ellipse(0, -height * 0.08, width * 0.15, height * 0.18, 0, 0, Math.PI * 2);
    } else {
        ctx.moveTo(0, -height * 0.30);
        ctx.lineTo(width * 0.15, height * 0.08);
        ctx.lineTo(0, height * 0.18);
        ctx.lineTo(-width * 0.15, height * 0.08);
        ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillRect(-width * 0.045, -height * 0.18, width * 0.09, height * 0.035);
}

function drawEnginePair(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile, spread = 0.22): void {
    ctx.save();
    ctx.shadowColor = profile.engine;
    ctx.shadowBlur = 7;
    ctx.fillStyle = profile.engine;
    for (const x of [-width * spread, width * spread]) {
        ctx.beginPath();
        ctx.moveTo(x - width * 0.075, height * 0.34);
        ctx.lineTo(x + width * 0.075, height * 0.34);
        ctx.lineTo(x, height * 0.56);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawRaiderDart(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.52);
    ctx.lineTo(width * 0.18, -height * 0.12);
    ctx.lineTo(width * 0.54, height * 0.28);
    ctx.lineTo(width * 0.18, height * 0.25);
    ctx.lineTo(width * 0.10, height * 0.50);
    ctx.lineTo(-width * 0.10, height * 0.50);
    ctx.lineTo(-width * 0.18, height * 0.25);
    ctx.lineTo(-width * 0.54, height * 0.28);
    ctx.lineTo(-width * 0.18, -height * 0.12);
    ctx.closePath();
    fillShipPath(ctx, profile);
    drawCockpit(ctx, width, height, profile);
    drawEnginePair(ctx, width, height, profile, 0.18);
}

function drawRaiderTwinBoom(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.50);
    ctx.lineTo(width * 0.18, -height * 0.12);
    ctx.lineTo(width * 0.48, height * 0.05);
    ctx.lineTo(width * 0.39, height * 0.48);
    ctx.lineTo(width * 0.17, height * 0.50);
    ctx.lineTo(0, height * 0.22);
    ctx.lineTo(-width * 0.17, height * 0.50);
    ctx.lineTo(-width * 0.39, height * 0.48);
    ctx.lineTo(-width * 0.48, height * 0.05);
    ctx.lineTo(-width * 0.18, -height * 0.12);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.shadow;
    ctx.fillRect(-width * 0.075, -height * 0.04, width * 0.15, height * 0.49);
    drawCockpit(ctx, width, height, profile);
    drawEnginePair(ctx, width, height, profile, 0.34);
}

function drawRaiderGunboat(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(-width * 0.18, -height * 0.50);
    ctx.lineTo(width * 0.18, -height * 0.50);
    ctx.lineTo(width * 0.31, -height * 0.27);
    ctx.lineTo(width * 0.56, height * 0.04);
    ctx.lineTo(width * 0.46, height * 0.43);
    ctx.lineTo(width * 0.17, height * 0.53);
    ctx.lineTo(-width * 0.17, height * 0.53);
    ctx.lineTo(-width * 0.46, height * 0.43);
    ctx.lineTo(-width * 0.56, height * 0.04);
    ctx.lineTo(-width * 0.31, -height * 0.27);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.35, -height * 0.08, width * 0.7, height * 0.08);
    ctx.fillStyle = profile.shadow;
    ctx.fillRect(-width * 0.05, -height * 0.46, width * 0.10, height * 0.27);
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.25);
}

function drawMilitaryInterceptor(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.54);
    ctx.lineTo(width * 0.16, -height * 0.14);
    ctx.lineTo(width * 0.50, height * 0.30);
    ctx.lineTo(width * 0.16, height * 0.24);
    ctx.lineTo(width * 0.07, height * 0.53);
    ctx.lineTo(-width * 0.07, height * 0.53);
    ctx.lineTo(-width * 0.16, height * 0.24);
    ctx.lineTo(-width * 0.50, height * 0.30);
    ctx.lineTo(-width * 0.16, -height * 0.14);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.strokeStyle = profile.trim;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-width * 0.38, height * 0.23);
    ctx.lineTo(0, height * 0.02);
    ctx.lineTo(width * 0.38, height * 0.23);
    ctx.stroke();
    drawCockpit(ctx, width, height, profile);
    drawEnginePair(ctx, width, height, profile, 0.14);
}

function drawMilitaryPatrol(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.52);
    ctx.lineTo(width * 0.22, -height * 0.11);
    ctx.lineTo(width * 0.48, height * 0.06);
    ctx.lineTo(width * 0.36, height * 0.46);
    ctx.lineTo(width * 0.12, height * 0.50);
    ctx.lineTo(0, height * 0.29);
    ctx.lineTo(-width * 0.12, height * 0.50);
    ctx.lineTo(-width * 0.36, height * 0.46);
    ctx.lineTo(-width * 0.48, height * 0.06);
    ctx.lineTo(-width * 0.22, -height * 0.11);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.44, height * 0.06, width * 0.88, height * 0.055);
    drawCockpit(ctx, width, height, profile);
    drawEnginePair(ctx, width, height, profile, 0.31);
}

function drawMilitaryAssault(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(-width * 0.23, -height * 0.52);
    ctx.lineTo(width * 0.23, -height * 0.52);
    ctx.lineTo(width * 0.36, -height * 0.23);
    ctx.lineTo(width * 0.51, height * 0.05);
    ctx.lineTo(width * 0.43, height * 0.49);
    ctx.lineTo(-width * 0.43, height * 0.49);
    ctx.lineTo(-width * 0.51, height * 0.05);
    ctx.lineTo(-width * 0.36, -height * 0.23);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.shadow;
    ctx.fillRect(-width * 0.31, -height * 0.12, width * 0.62, height * 0.25);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.43, height * 0.27, width * 0.86, height * 0.06);
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.24);
}

function drawMilitarySentinel(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.56);
    ctx.lineTo(width * 0.19, -height * 0.19);
    ctx.lineTo(width * 0.54, height * 0.02);
    ctx.lineTo(width * 0.43, height * 0.24);
    ctx.lineTo(width * 0.31, height * 0.53);
    ctx.lineTo(-width * 0.31, height * 0.53);
    ctx.lineTo(-width * 0.43, height * 0.24);
    ctx.lineTo(-width * 0.54, height * 0.02);
    ctx.lineTo(-width * 0.19, -height * 0.19);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.07, -height * 0.45, width * 0.14, height * 0.72);
    ctx.fillStyle = profile.shadow;
    ctx.fillRect(-width * 0.52, height * 0.10, width * 0.20, height * 0.08);
    ctx.fillRect(width * 0.32, height * 0.10, width * 0.20, height * 0.08);
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.22);
}

function drawAlienSkimmer(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.50);
    ctx.quadraticCurveTo(width * 0.20, -height * 0.22, width * 0.48, height * 0.02);
    ctx.quadraticCurveTo(width * 0.40, height * 0.33, width * 0.13, height * 0.48);
    ctx.lineTo(0, height * 0.30);
    ctx.lineTo(-width * 0.13, height * 0.48);
    ctx.quadraticCurveTo(-width * 0.40, height * 0.33, -width * 0.48, height * 0.02);
    ctx.quadraticCurveTo(-width * 0.20, -height * 0.22, 0, -height * 0.50);
    ctx.closePath();
    fillShipPath(ctx, profile);
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.17);
}

function drawAlienManta(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.47);
    ctx.bezierCurveTo(width * 0.12, -height * 0.18, width * 0.45, -height * 0.16, width * 0.58, height * 0.17);
    ctx.bezierCurveTo(width * 0.39, height * 0.27, width * 0.27, height * 0.39, width * 0.19, height * 0.53);
    ctx.lineTo(-width * 0.19, height * 0.53);
    ctx.bezierCurveTo(-width * 0.27, height * 0.39, -width * 0.39, height * 0.27, -width * 0.58, height * 0.17);
    ctx.bezierCurveTo(-width * 0.45, -height * 0.16, -width * 0.12, -height * 0.18, 0, -height * 0.47);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.strokeStyle = profile.trim;
    ctx.beginPath();
    ctx.moveTo(-width * 0.46, height * 0.13);
    ctx.quadraticCurveTo(0, height * 0.28, width * 0.46, height * 0.13);
    ctx.stroke();
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.24);
}

function drawAlienOrbiter(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile, time: number): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.50);
    ctx.quadraticCurveTo(width * 0.39, -height * 0.20, width * 0.50, height * 0.14);
    ctx.quadraticCurveTo(width * 0.26, height * 0.51, 0, height * 0.44);
    ctx.quadraticCurveTo(-width * 0.26, height * 0.51, -width * 0.50, height * 0.14);
    ctx.quadraticCurveTo(-width * 0.39, -height * 0.20, 0, -height * 0.50);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.save();
    ctx.strokeStyle = profile.glow;
    ctx.shadowColor = profile.glow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, height * 0.10, width * 0.42, height * 0.14, time * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.16);
}

function drawAlienSentinel(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.55);
    ctx.quadraticCurveTo(width * 0.16, -height * 0.18, width * 0.49, -height * 0.02);
    ctx.lineTo(width * 0.35, height * 0.21);
    ctx.lineTo(width * 0.20, height * 0.54);
    ctx.lineTo(-width * 0.20, height * 0.54);
    ctx.lineTo(-width * 0.35, height * 0.21);
    ctx.lineTo(-width * 0.49, -height * 0.02);
    ctx.quadraticCurveTo(-width * 0.16, -height * 0.18, 0, -height * 0.55);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.05, -height * 0.42, width * 0.10, height * 0.70);
    drawCockpit(ctx, width, height, profile, true);
    drawEnginePair(ctx, width, height, profile, 0.20);
}

function drawHunter(ctx: CanvasRenderingContext2D, width: number, height: number, profile: EnemyVisualProfile): void {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.57);
    ctx.lineTo(width * 0.16, -height * 0.16);
    ctx.lineTo(width * 0.56, height * 0.04);
    ctx.lineTo(width * 0.30, height * 0.20);
    ctx.lineTo(width * 0.18, height * 0.55);
    ctx.lineTo(-width * 0.18, height * 0.55);
    ctx.lineTo(-width * 0.30, height * 0.20);
    ctx.lineTo(-width * 0.56, height * 0.04);
    ctx.lineTo(-width * 0.16, -height * 0.16);
    ctx.closePath();
    fillShipPath(ctx, profile);
    ctx.fillStyle = profile.trim;
    ctx.fillRect(-width * 0.46, height * 0.01, width * 0.92, height * 0.07);
    drawCockpit(ctx, width, height, profile);
    drawEnginePair(ctx, width, height, profile, 0.27);
}

export function drawEnemyShip(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    profile: EnemyVisualProfile,
    timeAlive: number,
    isSpecial = false,
): void {
    ctx.save();
    ctx.shadowColor = profile.glow;
    ctx.shadowBlur = isSpecial ? 13 : 8;

    switch (profile.silhouette) {
        case 'raider_twin_boom': drawRaiderTwinBoom(ctx, width, height, profile); break;
        case 'raider_gunboat': drawRaiderGunboat(ctx, width, height, profile); break;
        case 'military_interceptor': drawMilitaryInterceptor(ctx, width, height, profile); break;
        case 'military_patrol': drawMilitaryPatrol(ctx, width, height, profile); break;
        case 'military_assault': drawMilitaryAssault(ctx, width, height, profile); break;
        case 'military_sentinel': drawMilitarySentinel(ctx, width, height, profile); break;
        case 'alien_skimmer': drawAlienSkimmer(ctx, width, height, profile); break;
        case 'alien_manta': drawAlienManta(ctx, width, height, profile); break;
        case 'alien_orbiter': drawAlienOrbiter(ctx, width, height, profile, timeAlive); break;
        case 'alien_sentinel': drawAlienSentinel(ctx, width, height, profile); break;
        case 'hunter': drawHunter(ctx, width, height, profile); break;
        case 'raider_dart':
        default: drawRaiderDart(ctx, width, height, profile); break;
    }

    ctx.restore();
}
