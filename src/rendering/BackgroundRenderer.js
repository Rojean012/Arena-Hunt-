import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = 120;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        const cw = (canvasWidth && Number.isFinite(canvasWidth) && canvasWidth > 0) ? canvasWidth : (window.innerWidth || 1920);
        const ch = (canvasHeight && Number.isFinite(canvasHeight) && canvasHeight > 0) ? canvasHeight : (window.innerHeight || 1080);

        // 1. Clean Dark Xianxia Base (#060911)
        ctx.fillStyle = '#060911';
        ctx.fillRect(0, 0, cw, ch);

        // 2. Subtle Low-Contrast Grid Lines
        const startTileX = Math.floor((camera.x - cw / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + cw / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - ch / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + ch / 2) / this.tileSize);

        ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';
        ctx.lineWidth = 1;

        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, cw);
                const screenY = camera.getScreenY(worldY, ch);

                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
            }
        }

        // 3. Subtle Radial Vignette Shadow Focus
        const r0 = Math.max(1, ch * 0.45);
        const r1 = Math.max(r0 + 10, ch * 0.95);

        const vignette = ctx.createRadialGradient(
            cw / 2, ch / 2, r0,
            cw / 2, ch / 2, r1
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);

        ctx.restore();
    }
}
