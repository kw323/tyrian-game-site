import { getGraphicsQualityProfile, type GraphicsQuality } from '../core/GraphicsSettings';

type SectorVisualProfile = {
    top: string;
    bottom: string;
    nebula: string;
    nebulaCore: string;
    dust: string;
    star: string;
    accent: string;
    landmark: 'planet' | 'storm' | 'asteroids' | 'outpost' | 'dreadnought' | 'relay' | 'shipyard' | 'nexus' | 'core' | 'singularity';
};

const SECTOR_PROFILES: readonly SectorVisualProfile[] = [
    { top: '#020614', bottom: '#07142B', nebula: '#0E4D7788', nebulaCore: '#3DC6FF44', dust: '#A1E7FF', star: '#EFFBFF', accent: '#5BD6FF', landmark: 'planet' },
    { top: '#09031A', bottom: '#251044', nebula: '#6B3BCB77', nebulaCore: '#D9ABFF55', dust: '#C8B5FF', star: '#FFF4FF', accent: '#C59BFF', landmark: 'storm' },
    { top: '#100A03', bottom: '#33240B', nebula: '#A65D1E55', nebulaCore: '#FFD38244', dust: '#F8C47A', star: '#FFF7E6', accent: '#FFB45C', landmark: 'asteroids' },
    { top: '#021018', bottom: '#093146', nebula: '#0D8CAD55', nebulaCore: '#8BEAFF44', dust: '#82E9F5', star: '#E9FFFF', accent: '#4ED3E8', landmark: 'outpost' },
    { top: '#190307', bottom: '#4A0912', nebula: '#BF263D55', nebulaCore: '#FF9C8B44', dust: '#FFAF9A', star: '#FFF0EC', accent: '#FF6D6D', landmark: 'dreadnought' },
    { top: '#041222', bottom: '#0B2A4B', nebula: '#1B64AA55', nebulaCore: '#75C9FF44', dust: '#9AD6FF', star: '#F0FAFF', accent: '#5DA7FF', landmark: 'relay' },
    { top: '#10121C', bottom: '#30334B', nebula: '#6C71A855', nebulaCore: '#B8C2FF44', dust: '#CED4FF', star: '#FBFCFF', accent: '#9BA8FF', landmark: 'shipyard' },
    { top: '#171102', bottom: '#46370A', nebula: '#D9A51D55', nebulaCore: '#FFE08744', dust: '#FFE09A', star: '#FFFBEF', accent: '#F6C857', landmark: 'nexus' },
    { top: '#180316', bottom: '#4A0A3D', nebula: '#C12FA355', nebulaCore: '#FFB1EE55', dust: '#FFA5DD', star: '#FFF2FC', accent: '#EF76C9', landmark: 'core' },
    { top: '#010107', bottom: '#190326', nebula: '#5F36A955', nebulaCore: '#C69BFF66', dust: '#C1A1FF', star: '#F7F1FF', accent: '#A87CFF', landmark: 'singularity' },
];

export class BackgroundRenderer {
    public static renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number, level: number, timeElapsed: number, isBossStage: boolean, graphicsQuality: GraphicsQuality = 'standard'): void {
        const quality = getGraphicsQualityProfile(graphicsQuality);
        const chapter = Math.max(1, Math.min(SECTOR_PROFILES.length, Math.floor((level - 1) / 10) + 1));
        const profile = SECTOR_PROFILES[chapter - 1];
        const base = ctx.createLinearGradient(0, 0, 0, height);
        base.addColorStop(0, profile.top);
        base.addColorStop(0.54, profile.bottom);
        base.addColorStop(1, '#01030A');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, width, height);

        this.renderFarStars(ctx, width, height, timeElapsed, profile, quality.farStarCount);
        if (quality.nebulaCount > 0) this.renderNebula(ctx, width, height, timeElapsed, profile, quality.nebulaCount);
        this.renderLandmark(ctx, width, height, timeElapsed, profile, isBossStage);
        this.renderMidStars(ctx, width, height, timeElapsed, profile, isBossStage, quality.midStarCount);
        if (quality.dustCount > 0) this.renderForegroundDust(ctx, width, height, timeElapsed, profile, quality.dustCount);
        this.renderVignette(ctx, width, height, profile, isBossStage);
    }

    private static renderFarStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, profile: SectorVisualProfile, count: number): void {
        const scroll = (time * 7) % height;
        ctx.save();
        for (let index = 0; index < count; index++) {
            const x = ((index * 137.17) % width + width) % width;
            const y = (index * 83.71 + scroll * (index % 3 === 0 ? 1.35 : 0.66)) % height;
            const size = index % 13 === 0 ? 1.8 : index % 4 === 0 ? 1.1 : 0.7;
            const pulse = 0.46 + Math.sin(time * 1.1 + index) * 0.18;
            ctx.globalAlpha = Math.max(0.18, pulse);
            ctx.fillStyle = profile.star;
            ctx.fillRect(x, y, size, size);
        }
        ctx.restore();
    }

    private static renderNebula(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, profile: SectorVisualProfile, count: number): void {
        const drift = Math.sin(time * 0.08) * 38;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let index = 0; index < count; index++) {
            const x = width * (0.18 + index * 0.36) + drift * (index % 2 === 0 ? 1 : -1);
            const y = height * (0.17 + ((index * 0.23 + time * 0.01) % 0.58));
            const radius = 160 + index * 55;
            const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
            cloud.addColorStop(0, profile.nebulaCore);
            cloud.addColorStop(0.45, profile.nebula);
            cloud.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cloud;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 1.45, radius * 0.72, index * 0.65 + time * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private static renderLandmark(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, profile: SectorVisualProfile, boss: boolean): void {
        const x = width * 0.77 + Math.sin(time * 0.08) * 18;
        const y = height * 0.18 + Math.cos(time * 0.11) * 9;
        ctx.save();
        ctx.globalAlpha = boss ? 0.92 : 0.72;
        ctx.shadowColor = profile.accent;
        ctx.shadowBlur = 18;

        if (profile.landmark === 'planet') {
            const planet = ctx.createRadialGradient(x - 32, y - 36, 5, x, y, 132);
            planet.addColorStop(0, '#B7EBFF');
            planet.addColorStop(0.2, '#3464A4');
            planet.addColorStop(0.68, '#172956');
            planet.addColorStop(1, '#050A1C');
            ctx.fillStyle = planet;
            ctx.beginPath();
            ctx.arc(x, y, 118, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = profile.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 123, -0.45, Math.PI * 1.15);
            ctx.stroke();
        } else if (profile.landmark === 'storm') {
            for (let ring = 0; ring < 4; ring++) {
                ctx.strokeStyle = ring % 2 === 0 ? profile.accent : '#EAC4FF';
                ctx.globalAlpha = 0.20 + ring * 0.10;
                ctx.lineWidth = 2 + ring;
                ctx.beginPath();
                ctx.ellipse(x, y, 84 + ring * 27, 34 + ring * 15, time * (ring % 2 ? -0.16 : 0.12), 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (profile.landmark === 'asteroids') {
            const rocks = [[-56, -26, 28], [22, 18, 42], [70, -48, 18], [-6, 70, 20]] as const;
            for (const [offsetX, offsetY, radius] of rocks) {
                const rock = ctx.createRadialGradient(x + offsetX - radius * 0.3, y + offsetY - radius * 0.3, 2, x + offsetX, y + offsetY, radius);
                rock.addColorStop(0, '#E5A66C');
                rock.addColorStop(0.48, '#815031');
                rock.addColorStop(1, '#2A1717');
                ctx.fillStyle = rock;
                ctx.beginPath();
                ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (profile.landmark === 'outpost' || profile.landmark === 'relay' || profile.landmark === 'shipyard' || profile.landmark === 'nexus') {
            this.drawStation(ctx, x, y, profile, time, profile.landmark);
        } else if (profile.landmark === 'dreadnought') {
            this.drawDreadnought(ctx, x, y, profile);
        } else if (profile.landmark === 'core') {
            this.drawCoreStructure(ctx, x, y, profile, time);
        } else {
            const voidCore = ctx.createRadialGradient(x, y, 5, x, y, 132);
            voidCore.addColorStop(0, '#000000');
            voidCore.addColorStop(0.38, '#16042C');
            voidCore.addColorStop(0.65, '#7D43C6');
            voidCore.addColorStop(1, 'rgba(182,115,255,0)');
            ctx.fillStyle = voidCore;
            ctx.beginPath();
            ctx.arc(x, y, 132, 0, Math.PI * 2);
            ctx.fill();
            for (let ring = 0; ring < 3; ring++) {
                ctx.globalAlpha = 0.36 + ring * 0.12;
                ctx.strokeStyle = ring === 1 ? '#F3D6FF' : profile.accent;
                ctx.lineWidth = 2 + ring;
                ctx.beginPath();
                ctx.ellipse(x, y, 108 + ring * 20, 30 + ring * 11, time * (0.22 + ring * 0.07), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    private static drawStation(ctx: CanvasRenderingContext2D, x: number, y: number, profile: SectorVisualProfile, time: number, kind: SectorVisualProfile['landmark']): void {
        const scale = kind === 'shipyard' ? 1.25 : 1;
        ctx.fillStyle = '#17243C';
        ctx.strokeStyle = profile.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 74 * scale);
        ctx.lineTo(x + 62 * scale, y - 12 * scale);
        ctx.lineTo(x + 38 * scale, y + 68 * scale);
        ctx.lineTo(x - 38 * scale, y + 68 * scale);
        ctx.lineTo(x - 62 * scale, y - 12 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#274A67';
        ctx.fillRect(x - 14 * scale, y - 62 * scale, 28 * scale, 130 * scale);
        ctx.fillStyle = profile.accent;
        for (const offset of [-1, 1]) {
            ctx.fillRect(x + offset * 42 * scale - 7 * scale, y - 9 * scale, 14 * scale, 18 * scale);
        }
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.strokeStyle = profile.accent;
        ctx.beginPath();
        ctx.ellipse(x, y, 98 * scale, 30 * scale, time * 0.14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    private static drawDreadnought(ctx: CanvasRenderingContext2D, x: number, y: number, profile: SectorVisualProfile): void {
        ctx.fillStyle = '#1A1736';
        ctx.strokeStyle = profile.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 54);
        ctx.lineTo(x + 126, y + 34);
        ctx.lineTo(x + 72, y + 60);
        ctx.lineTo(x - 72, y + 60);
        ctx.lineTo(x - 126, y + 34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#481526';
        ctx.fillRect(x - 38, y - 26, 76, 44);
        ctx.fillStyle = profile.accent;
        ctx.fillRect(x - 98, y + 26, 30, 5);
        ctx.fillRect(x + 68, y + 26, 30, 5);
    }

    private static drawCoreStructure(ctx: CanvasRenderingContext2D, x: number, y: number, profile: SectorVisualProfile, time: number): void {
        for (let spoke = 0; spoke < 6; spoke++) {
            const angle = time * 0.11 + spoke * Math.PI / 3;
            ctx.strokeStyle = profile.accent;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
            ctx.lineTo(x + Math.cos(angle) * 112, y + Math.sin(angle) * 112);
            ctx.stroke();
        }
        ctx.fillStyle = '#43113D';
        ctx.beginPath();
        ctx.arc(x, y, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = profile.accent;
        ctx.beginPath();
        ctx.arc(x, y, 16 + Math.sin(time * 2.2) * 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private static renderMidStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, profile: SectorVisualProfile, boss: boolean, count: number): void {
        const scroll = (time * (boss ? 54 : 38)) % height;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let index = 0; index < count; index++) {
            const x = (index * 211.31 + 47) % width;
            const y = (index * 127.13 + scroll * (0.75 + (index % 4) * 0.28)) % height;
            const streak = 4 + (index % 5) * 3 + (boss ? 4 : 0);
            ctx.globalAlpha = 0.32 + (index % 4) * 0.12;
            ctx.strokeStyle = index % 7 === 0 ? profile.accent : profile.star;
            ctx.lineWidth = index % 8 === 0 ? 1.4 : 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y - streak);
            ctx.lineTo(x, y + streak * 0.4);
            ctx.stroke();
        }
        ctx.restore();
    }

    private static renderForegroundDust(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, profile: SectorVisualProfile, count: number): void {
        const scroll = (time * 92) % (height + 80);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let index = 0; index < count; index++) {
            const x = (index * 307.17 + 71) % width;
            const y = (index * 197.93 + scroll) % (height + 80) - 40;
            const length = 13 + (index % 5) * 6;
            ctx.globalAlpha = 0.12 + (index % 3) * 0.05;
            ctx.strokeStyle = profile.dust;
            ctx.lineWidth = 1 + (index % 2) * 0.6;
            ctx.beginPath();
            ctx.moveTo(x, y - length);
            ctx.lineTo(x + (index % 2 === 0 ? 1 : -1) * 3, y + length * 0.25);
            ctx.stroke();
        }
        ctx.restore();
    }

    private static renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number, profile: SectorVisualProfile, boss: boolean): void {
        const vignette = ctx.createRadialGradient(width / 2, height * 0.46, Math.min(width, height) * 0.16, width / 2, height * 0.46, Math.max(width, height) * 0.72);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.74, boss ? 'rgba(16,0,22,0.12)' : 'rgba(0,0,0,0.08)');
        vignette.addColorStop(1, boss ? 'rgba(23,0,25,0.48)' : 'rgba(0,0,0,0.36)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.globalAlpha = boss ? 0.18 : 0.07;
        ctx.strokeStyle = profile.accent;
        ctx.lineWidth = boss ? 2 : 1;
        ctx.strokeRect(8, 8, width - 16, height - 16);
        ctx.restore();
    }
}
