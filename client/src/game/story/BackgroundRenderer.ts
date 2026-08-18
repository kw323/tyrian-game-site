export class BackgroundRenderer {
    public static renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number, level: number, timeElapsed: number, isBossStage: boolean): void {
        const chapter = Math.floor((level - 1) / 10) + 1;
        const scrollOffset = (timeElapsed * 18) % height;

        // Base space gradient
        let topColor = '#020614';
        let bottomColor = '#070f24';
        let accentColor = '#00ff8822';

        if (chapter === 2) {
            topColor = '#050214';
            bottomColor = '#18082e';
            accentColor = '#a78bfa33'; // Nebula ion storm
        } else if (chapter === 3) {
            topColor = '#0a0802';
            bottomColor = '#241c07';
            accentColor = '#f59e0b33'; // Asteroid belt dust
        } else if (chapter === 4) {
            topColor = '#020d14';
            bottomColor = '#06263b';
            accentColor = '#06b6d433'; // Smuggler outpost
        } else if (chapter === 5) {
            topColor = '#140202';
            bottomColor = '#3b0606';
            accentColor = '#ef444433'; // Sera Kane fleet
        } else if (chapter === 6) {
            topColor = '#050c14';
            bottomColor = '#0a1d33';
            accentColor = '#3b82f633'; // Citadel relay
        } else if (chapter === 7) {
            topColor = '#0f0f14';
            bottomColor = '#24243b';
            accentColor = '#6366f133'; // Dreadnought shipyard
        } else if (chapter === 8) {
            topColor = '#140f02';
            bottomColor = '#3b2f06';
            accentColor = '#eab30833'; // Command nexus
        } else if (chapter === 9) {
            topColor = '#140212';
            bottomColor = '#3b0632';
            accentColor = '#ec489933'; // Program Zero core
        } else if (chapter === 10) {
            topColor = '#000000';
            bottomColor = '#12021c';
            accentColor = '#8b5cf655'; // Singularity gate
        }

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, topColor);
        grad.addColorStop(1, bottomColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Render distinct celestial object or station based on chapter
        ctx.save();
        const celestialX = width * 0.75 + Math.sin(timeElapsed * 0.05) * 15;
        const celestialY = 120 + (timeElapsed * 2) % 30;

        if (chapter === 1) {
            // Ark-9 Planet with glowing atmosphere
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.arc(celestialX, celestialY, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#38bdf844';
            ctx.beginPath();
            ctx.arc(celestialX - 10, celestialY - 10, 85, 0, Math.PI * 2);
            ctx.fill();
        } else if (chapter === 2) {
            // Ion Nebula Cloud
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(width * 0.3, height * 0.4, 160, 0, Math.PI * 2);
            ctx.fill();
        } else if (chapter === 3) {
            // Asteroid mining cluster
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(width * 0.2, height * 0.25, 55, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(width * 0.82, height * 0.65, 75, 0, Math.PI * 2);
            ctx.fill();
        } else if (chapter === 5) {
            // Sera Kane Command Dreadnought silhouette in background
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(width * 0.5, 80);
            ctx.lineTo(width * 0.6, 130);
            ctx.lineTo(width * 0.4, 130);
            ctx.closePath();
            ctx.fill();
        } else if (chapter === 10) {
            // Singularity event horizon
            ctx.fillStyle = '#2e1065';
            ctx.beginPath();
            ctx.arc(width * 0.5, height * 0.35, 110, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        ctx.restore();

        // Parallax Starfield
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 60; i++) {
            const starX = (i * 137.5) % width;
            const starY = (i * 93.3 + scrollOffset * (i % 3 + 1)) % height;
            const starSize = (i % 3 === 0) ? 2 : 1;
            ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
            if (isBossStage) ctx.fillStyle = i % 2 === 0 ? '#ff9999' : '#ffffff';
            ctx.fillRect(starX, starY, starSize, starSize);
        }
        ctx.globalAlpha = 1;
    }
}
