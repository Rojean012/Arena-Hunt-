import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = GameConfig.world.tileSize * 2; // 120px larger clean floor tiles
        this.qiParticles = [];
        for (let i = 0; i < 35; i++) {
            this.qiParticles.push({
                x: (Math.random() - 0.5) * 3000,
                y: (Math.random() - 0.5) * 3000,
                radius: 1 + Math.random() * 2,
                speedY: -0.2 - Math.random() * 0.4,
                alpha: 0.1 + Math.random() * 0.25
            });
        }
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        // 1. Dark Xianxia Arena Base Fill
        ctx.fillStyle = '#060911';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Clean, Low-Contrast Slate Floor Grid
        const startTileX = Math.floor((camera.x - canvasWidth / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + canvasWidth / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - canvasHeight / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + canvasHeight / 2) / this.tileSize);

        ctx.strokeStyle = 'rgba(30, 41, 59, 0.28)';
        ctx.lineWidth = 1;

        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, canvasWidth);
                const screenY = camera.getScreenY(worldY, canvasHeight);

                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Subtle Corner Accents on Large Tiles
                if ((tx * 11 + ty * 17) % 7 === 0) {
                    ctx.save();
                    ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // 3. Ambient Floating Qi Dust Particles
        this.qiParticles.forEach(p => {
            p.y += p.speedY;
            if (p.y < camera.y - canvasHeight / 2 - 100) {
                p.y = camera.y + canvasHeight / 2 + 100;
                p.x = camera.x + (Math.random() - 0.5) * canvasWidth * 1.5;
            }

            const sx = camera.getScreenX(p.x, canvasWidth);
            const sy = camera.getScreenY(p.y, canvasHeight);

            if (sx >= -20 && sx <= canvasWidth + 20 && sy >= -20 && sy <= canvasHeight + 20) {
                ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 4. Subtle Radial Vignette Focus Gradient
        const vignette = ctx.createRadialGradient(
            canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.35,
            canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.85
        );
        vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
        vignette.addColorStop(1, 'rgba(2, 6, 23, 0.65)');

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.restore();
    }
}
