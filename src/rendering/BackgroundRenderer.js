import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = 120;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        const startTileX = Math.floor((camera.x - canvasWidth / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + canvasWidth / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - canvasHeight / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + canvasHeight / 2) / this.tileSize);

        // 1. Earthy Grass & Stone Ground Base
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, canvasWidth);
                const screenY = camera.getScreenY(worldY, canvasHeight);

                const seed = Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453;
                const normSeed = seed - Math.floor(seed);

                // Terrain Color Variance (Lush Grass, Moss, Earthy Soil, Stone Slabs)
                if (normSeed < 0.35) {
                    ctx.fillStyle = '#1e2e1e'; // Deep Lush Grass
                } else if (normSeed < 0.65) {
                    ctx.fillStyle = '#1b2a1c'; // Mossy Soil
                } else if (normSeed < 0.85) {
                    ctx.fillStyle = '#222920'; // Earthy Ground
                } else {
                    ctx.fillStyle = '#262f38'; // Ancient Paved Stone Slab
                }
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Subtle Paving & Dirt Border Lines
                ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Decorative Grass Blades & Flower Tufts
                if (normSeed < 0.4) {
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(screenX + 24, screenY + 30, 2, 8);
                    ctx.fillRect(screenX + 28, screenY + 26, 2, 12);
                    ctx.fillRect(screenX + 32, screenY + 32, 2, 6);
                }

                // Decorative Mossy Boulders & Small Rocks
                if (normSeed > 0.75 && normSeed < 0.88) {
                    ctx.save();
                    ctx.fillStyle = '#475569';
                    ctx.beginPath();
                    ctx.arc(screenX + 60, screenY + 60, 10, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.arc(screenX + 57, screenY + 57, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Decorative Trees & Canopy Foliage
                if ((tx * 17 + ty * 31) % 13 === 0) {
                    ctx.save();
                    const treeX = screenX + 40;
                    const treeY = screenY + 40;

                    // Ground Shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.beginPath();
                    ctx.ellipse(treeX, treeY + 18, 22, 10, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Trunk
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(treeX - 5, treeY, 10, 18);

                    // Tree Leaf Canopy Layers
                    ctx.fillStyle = '#15803d';
                    ctx.beginPath();
                    ctx.arc(treeX, treeY - 10, 24, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#166534';
                    ctx.beginPath();
                    ctx.arc(treeX - 6, treeY - 14, 16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // 2. Central Qi Emblem Ring (World Origin 0,0)
        const centerScreenX = camera.getScreenX(0, canvasWidth);
        const centerScreenY = camera.getScreenY(0, canvasHeight);

        ctx.save();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 320, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerScreenX, centerScreenY, 280, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Subtle Edge Vignette Shadow
        const vignette = ctx.createRadialGradient(
            canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.45,
            canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.95
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.restore();
    }
}
