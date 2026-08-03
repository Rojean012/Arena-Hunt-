import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = 100;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        const cw = (canvasWidth && Number.isFinite(canvasWidth) && canvasWidth > 0) ? canvasWidth : (window.innerWidth || 1920);
        const ch = (canvasHeight && Number.isFinite(canvasHeight) && canvasHeight > 0) ? canvasHeight : (window.innerHeight || 1080);

        const startTileX = Math.floor((camera.x - cw / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + cw / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - ch / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + ch / 2) / this.tileSize);

        // 1. Crisp Clean Low-Poly Poppy Grass & Cobble Base
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, cw);
                const screenY = camera.getScreenY(worldY, ch);

                const seed = Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453;
                const normSeed = seed - Math.floor(seed);

                // Low-Poly Vibrant Pastel Palette (Emerald, Mint Green, Jade, Soft Cobble)
                if (normSeed < 0.40) {
                    ctx.fillStyle = '#059669';
                } else if (normSeed < 0.70) {
                    ctx.fillStyle = '#10b981';
                } else if (normSeed < 0.88) {
                    ctx.fillStyle = '#047857';
                } else {
                    ctx.fillStyle = '#475569';
                }

                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Low-Poly Diagonal Shading Line
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + this.tileSize, screenY);
                ctx.lineTo(screenX, screenY + this.tileSize);
                ctx.closePath();
                ctx.fill();

                // Clean Grid Lines
                ctx.strokeStyle = 'rgba(6, 78, 59, 0.25)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Cute Poppy Flower Accents
                if (normSeed < 0.30) {
                    ctx.save();
                    const fx = screenX + 35;
                    const fy = screenY + 35;
                    const flowerColors = ['#f472b6', '#facc15', '#c084fc', '#fb7185'];
                    ctx.fillStyle = flowerColors[Math.floor(normSeed * 4)];

                    ctx.beginPath();
                    ctx.arc(fx - 3, fy, 3, 0, Math.PI * 2);
                    ctx.arc(fx + 3, fy, 3, 0, Math.PI * 2);
                    ctx.arc(fx, fy - 3, 3, 0, Math.PI * 2);
                    ctx.arc(fx, fy + 3, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#fef08a';
                    ctx.beginPath();
                    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Cute Low-Poly Chibi Tree Canopy
                if ((tx * 19 + ty * 29) % 11 === 0) {
                    ctx.save();
                    const treeX = screenX + 50;
                    const treeY = screenY + 50;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                    ctx.beginPath();
                    ctx.ellipse(treeX, treeY + 20, 24, 8, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(treeX - 5, treeY, 10, 20);

                    ctx.fillStyle = '#059669';
                    ctx.beginPath();
                    ctx.arc(treeX, treeY - 14, 26, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#34d399';
                    ctx.beginPath();
                    ctx.arc(treeX - 6, treeY - 20, 16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // 2. Central Qi Emblem Ring (World Center 0, 0)
        const centerScreenX = camera.getScreenX(0, cw);
        const centerScreenY = camera.getScreenY(0, ch);

        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 320, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 280, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Bulletproof Vignette Gradient
        const r0 = Math.max(1, ch * 0.45);
        const r1 = Math.max(r0 + 10, ch * 0.95);

        const vignette = ctx.createRadialGradient(
            cw / 2, ch / 2, r0,
            cw / 2, ch / 2, r1
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(2, 6, 23, 0.4)');

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);

        ctx.restore();
    }
}
