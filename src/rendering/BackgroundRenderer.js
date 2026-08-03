import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = 100; // 100px solid stone floor pavers
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        const startTileX = Math.floor((camera.x - canvasWidth / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + canvasWidth / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - canvasHeight / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + canvasHeight / 2) / this.tileSize);

        // 1. Solid Earthy Martial Arena Ground Slabs
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, canvasWidth);
                const screenY = camera.getScreenY(worldY, canvasHeight);

                // Alternating Ancient Stone Slab Color Palette
                const isAlt = (Math.abs(tx) + Math.abs(ty)) % 2 === 0;
                ctx.fillStyle = isAlt ? '#1a2232' : '#141b27';
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Carved Stone Paving Grooves
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Inner Stone Slab Bevel Highlight
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);

                // Occasional Ancient Xianxia Rune Inlays on Stone Floor
                if ((tx * 13 + ty * 19) % 9 === 0) {
                    ctx.save();
                    ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, 16, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
                    ctx.fillRect(-4, -4, 8, 8);
                    ctx.restore();
                }
            }
        }

        // 2. Central Martial Arena Qi Ring (World Center 0, 0)
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
