import { GameConfig } from '../config/GameConfig.js';

export class BackgroundRenderer {
    constructor() {
        this.tileSize = GameConfig.world.tileSize;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        ctx.save();

        const startTileX = Math.floor((camera.x - canvasWidth / 2) / this.tileSize);
        const endTileX = Math.ceil((camera.x + canvasWidth / 2) / this.tileSize);
        const startTileY = Math.floor((camera.y - canvasHeight / 2) / this.tileSize);
        const endTileY = Math.ceil((camera.y + canvasHeight / 2) / this.tileSize);

        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const worldX = tx * this.tileSize;
                const worldY = ty * this.tileSize;

                const screenX = camera.getScreenX(worldX, canvasWidth);
                const screenY = camera.getScreenY(worldY, canvasHeight);

                // Xianxia Cultivation Arena Dark Slate Stone Tiles
                const isAlternate = (tx + ty) % 2 === 0;
                ctx.fillStyle = isAlternate ? '#0f172a' : '#1e293b';
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Tile Border Lines
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Occasional Ancient Qi Rune Accents on Floor
                if ((tx * 7 + ty * 13) % 11 === 0) {
                    ctx.save();
                    ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'; // Glowing Cyan Qi Line
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; // Purple Rune Core
                    ctx.fillRect(-3, -3, 6, 6);
                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }
}
