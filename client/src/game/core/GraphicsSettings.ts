export type GraphicsQuality = 'performance' | 'standard' | 'high';

export interface GraphicsQualityProfile {
    id: GraphicsQuality;
    label: string;
    particleMultiplier: number;
    maxParticles: number;
    farStarCount: number;
    nebulaCount: number;
    midStarCount: number;
    dustCount: number;
}

const STORAGE_KEY = 'tyrian_graphics_quality';

export const GRAPHICS_QUALITY_PROFILES: Record<GraphicsQuality, GraphicsQualityProfile> = {
    performance: {
        id: 'performance',
        label: 'Performance',
        particleMultiplier: 0.45,
        maxParticles: 110,
        farStarCount: 46,
        nebulaCount: 0,
        midStarCount: 16,
        dustCount: 0,
    },
    standard: {
        id: 'standard',
        label: 'Standard',
        particleMultiplier: 1,
        maxParticles: 260,
        farStarCount: 94,
        nebulaCount: 3,
        midStarCount: 38,
        dustCount: 18,
    },
    high: {
        id: 'high',
        label: 'High',
        particleMultiplier: 1.45,
        maxParticles: 380,
        farStarCount: 138,
        nebulaCount: 5,
        midStarCount: 58,
        dustCount: 30,
    },
};

export function isGraphicsQuality(value: string | null): value is GraphicsQuality {
    return value === 'performance' || value === 'standard' || value === 'high';
}

export function loadGraphicsQuality(): GraphicsQuality {
    if (typeof window === 'undefined') return 'standard';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isGraphicsQuality(stored) ? stored : 'standard';
}

export function saveGraphicsQuality(quality: GraphicsQuality): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, quality);
}

export function getGraphicsQualityProfile(quality: GraphicsQuality): GraphicsQualityProfile {
    return GRAPHICS_QUALITY_PROFILES[quality];
}
