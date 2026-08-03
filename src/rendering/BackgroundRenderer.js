import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = GameConfig.world.tileSize;
    }

    tileSeed(tx, ty) {
        let h = tx * 374761393 + ty * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return (h ^ (h >> 16)) & 0x7fffffff;
    }

    tileRand(tx, ty) {
        return this.tileSeed(tx, ty) / 0x7fffffff;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        const tileSize = this.tileSize;
        const left = Math.floor((camera.x - canvasWidth / 2) / tileSize) - 1;
        const right = Math.ceil((camera.x + canvasWidth / 2) / tileSize) + 1;
        const top = Math.floor((camera.y - canvasHeight / 2) / tileSize) - 1;
        const bottom = Math.ceil((camera.y + canvasHeight / 2) / tileSize) + 1;

        for (let ty = top; ty < bottom; ty++) {
            for (let tx = left; tx < right; tx++) {
                const x = camera.getScreenX(tx * tileSize, canvasWidth);
                const y = camera.getScreenY(ty * tileSize, canvasHeight);
                const r = this.tileRand(tx, ty);

                // Base tile
                const isDark = (tx + ty) % 2 === 0;
                let shade = isDark ? '#282828' : '#2d2d2d';

                if (r < 0.05) shade = '#2a2520';
                else if (r < 0.08) shade = '#20252a';
                else if (r < 0.12) shade = '#252a22';

                ctx.fillStyle = shade;
                ctx.fillRect(x, y, tileSize, tileSize);

                // Tile border
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, tileSize, tileSize);

                // Landmarks
                const r2 = this.tileRand(tx + 1000, ty + 2000);
                const r3 = this.tileRand(tx + 3000, ty + 4000);

                // Bloodstain
                if (r2 < 0.04) {
                    ctx.fillStyle = 'rgba(80, 10, 10, 0.3)';
                    ctx.beginPath();
                    ctx.ellipse(x + tileSize * r3, y + tileSize * this.tileRand(tx + 5000, ty + 6000), 8 + r2 * 12, 4 + r2 * 6, r2 * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Grass tuft
                if (r2 > 0.08 && r2 < 0.10) {
                    for (let i = 0; i < 3; i++) {
                        const gx = x + 10 + this.tileRand(tx + i * 100, ty) * (tileSize - 20);
                        const gy = y + tileSize * 0.6 + this.tileRand(tx, ty + i * 100) * tileSize * 0.3;
                        ctx.strokeStyle = '#3a4a2a';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(gx, gy);
                        ctx.lineTo(gx - 2 + this.tileRand(tx + i, ty) * 4, gy - 6 - this.tileRand(tx, ty + i) * 4);
                        ctx.stroke();
                    }
                }
            }
        }

        // Torches with fire glow
        for (let ty = top; ty < bottom; ty++) {
            for (let tx = left; tx < right; tx++) {
                const r = this.tileRand(tx * 7 + 13, ty * 13 + 7);
                if (r > 0.003) continue;

                const wx = tx * tileSize + tileSize * this.tileRand(tx + 111, ty + 222);
                const wy = ty * tileSize + tileSize * this.tileRand(tx + 333, ty + 444);
                const sx = camera.getScreenX(wx, canvasWidth);
                const sy = camera.getScreenY(wy, canvasHeight);

                // Post
                ctx.fillStyle = '#3a3028';
                ctx.fillRect(sx - 1.5, sy - 8, 3, 16);

                // Fire glow
                const grad = ctx.createRadialGradient(sx, sy - 12, 2, sx, sy - 12, 18);
                grad.addColorStop(0, 'rgba(255, 180, 50, 0.5)');
                grad.addColorStop(0.4, 'rgba(255, 100, 20, 0.2)');
                grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy - 12, 18, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = '#ffa030';
                ctx.beginPath();
                ctx.arc(sx, sy - 12, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Screen Vignette
        const grad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.2, canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}
