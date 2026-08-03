import { Entity } from './Entity.js';

// Preload Gold Coin 2D Asset Image
const coinImage = new Image();
coinImage.src = '/assets/images/gold_coin.jpg';

export class Coin extends Entity {
    constructor(x, y, value = 1) {
        super(x, y, 9, '#f1c40f');
        this.value = value;
        this.spinTimer = Math.random() * Math.PI * 2;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(playerX, playerY) {
        this.spinTimer += 0.1;
        this.floatOffset += 0.05;

        // Magnet attraction when close to player (Prevent NaN!)
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.1 && dist < 100) {
            this.x += (dx / dist) * 7;
            this.y += (dy / dist) * 7;
        }
    }

    collect() {
        this.dead = true;
    }

    render(ctx, screenX, screenY) {
        if (isNaN(screenX) || isNaN(screenY)) return;

        const floatY = Math.sin(this.floatOffset) * 3;
        const drawX = screenX;
        const drawY = screenY + floatY;
        const r = this.radius;

        ctx.save();
        ctx.translate(drawX, drawY);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Render High-Definition 2D Gold Coin Image Asset!
        if (coinImage.complete && coinImage.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.clip();

            ctx.drawImage(coinImage, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
            ctx.restore();

            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Fallback rendering
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
