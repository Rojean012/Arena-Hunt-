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

        // 1. Cute Low-Poly Poppy Pastel Grass & Cobble Base
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, cw);
                const screenY = camera.getScreenY(worldY, ch);

                const seed = Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453;
                const normSeed = seed - Math.floor(seed);

                // Low-Poly Vibrant Pastel Palette (Mint, Emerald, Jade, Soft Cobble)
                if (normSeed < 0.40) {
                    ctx.fillStyle = '#059669'; // Emerald
                } else if (normSeed < 0.70) {
                    ctx.fillStyle = '#10b981'; // Mint Green
                } else if (normSeed < 0.88) {
                    ctx.fillStyle = '#047857'; // Deep Jade
                } else {
                    ctx.fillStyle = '#64748b'; // Cute Slate Paver
                }

                // Low-Poly Polygon Tile Base
                ctx.beginPath();
                ctx.rect(screenX, screenY, this.tileSize, this.tileSize);
                ctx.fill();

                // Low-Poly Angled Cell Shading Triangle
                ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + this.tileSize, screenY);
                ctx.lineTo(screenX, screenY + this.tileSize);
                ctx.closePath();
                ctx.fill();

                // Subtle Low-Poly Edge Grid
                ctx.strokeStyle = 'rgba(6, 78, 59, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // 2. Cute Poppy Flower Blossoms (Pink, Yellow, Lavender)
                if (normSeed < 0.35) {
                    ctx.save();
                    const fx = screenX + 30 + (normSeed * 40);
                    const fy = screenY + 30 + (normSeed * 30);

                    const flowerColors = ['#f472b6', '#facc15', '#c084fc', '#fb7185'];
                    const petalColor = flowerColors[Math.floor(normSeed * 4)];

                    ctx.fillStyle = petalColor;
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                        ctx.beginPath();
                        ctx.arc(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Yellow Center
                    ctx.fillStyle = '#fef08a';
                    ctx.beginPath();
                    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 3. Cute Low-Poly Rounded Pastel Bushes & Mushrooms
                if (normSeed > 0.70 && normSeed < 0.82) {
                    ctx.save();
                    const bx = screenX + 50;
                    const by = screenY + 50;

                    // Soft Drop Shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                    ctx.beginPath();
                    ctx.ellipse(bx, by + 6, 14, 6, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Cute Pastel Bush
                    ctx.fillStyle = '#34d399';
                    ctx.beginPath();
                    ctx.arc(bx - 5, by - 2, 9, 0, Math.PI * 2);
                    ctx.arc(bx + 5, by - 2, 9, 0, Math.PI * 2);
                    ctx.arc(bx, by - 8, 10, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#a7f3d0';
                    ctx.beginPath();
                    ctx.arc(bx - 2, by - 8, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 4. Cute Low-Poly Trees & Chibi Canopy
                if ((tx * 19 + ty * 29) % 11 === 0) {
                    ctx.save();
                    const treeX = screenX + 50;
                    const treeY = screenY + 50;

                    // Ground Shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.beginPath();
                    ctx.ellipse(treeX, treeY + 22, 26, 10, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Trunk
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(treeX - 6, treeY, 12, 22);

                    // Low-Poly Polygon Canopy
                    ctx.fillStyle = '#059669';
                    ctx.beginPath();
                    ctx.arc(treeX, treeY - 14, 28, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#34d399';
                    ctx.beginPath();
                    ctx.arc(treeX - 8, treeY - 20, 18, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#6ee7b7';
                    ctx.beginPath();
                    ctx.arc(treeX - 12, treeY - 24, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // 5. Central Cute Golden Qi Emblem Ring (World Origin 0,0)
        const centerScreenX = camera.getScreenX(0, cw);
        const centerScreenY = camera.getScreenY(0, ch);

        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 320, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 280, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 6. Soft Bright Focus Vignette
        const r0 = Math.max(1, ch * 0.45);
        const r1 = Math.max(r0 + 10, ch * 0.95);

        const vignette = ctx.createRadialGradient(
            cw / 2, ch / 2, r0,
            cw / 2, ch / 2, r1
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(2, 6, 23, 0.45)');

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);

        ctx.restore();
    }
}
