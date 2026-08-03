import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';

// Preload Emerald Gem 2D Asset Image
const gemImage = new Image();
gemImage.src = '/assets/images/emerald_gem.jpg';

export class Gem extends Entity {
    constructor(x, y, gemType = 'emerald') {
        const spec = GameConfig.gems[gemType] || GameConfig.gems.emerald;
        super(x, y, spec.radius, spec.color);

        this.value = spec.value;
        this.magnetSpeed = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.pulseTimer = 0;
    }

    update(playerX, playerY, magnetRadius) {
        this.floatOffset += 0.05;
        this.pulseTimer += 0.08;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        // Magnetic Pull when player is close
        if (dist < magnetRadius) {
            this.magnetSpeed = Math.min(10, this.magnetSpeed + 0.6);
            this.x += (dx / dist) * this.magnetSpeed;
            this.y += (dy / dist) * this.magnetSpeed;
        } else {
            this.magnetSpeed = Math.max(0, this.magnetSpeed - 0.2);
        }
    }

    render(ctx, screenX, screenY) {
        const floatY = Math.sin(this.floatOffset) * 3;
        const drawX = screenX;
        const drawY = screenY + floatY;
        const r = this.radius;

        ctx.save();
        ctx.translate(drawX, drawY);

        // Emerald Glow Aura
        const pulseR = r + 4 + Math.sin(this.pulseTimer) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.35)';
        ctx.fill();

        // Render High-Definition 2D Emerald Gem Image Asset!
        if (gemImage.complete && gemImage.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.clip(); // Clip image inside gem circle

            ctx.drawImage(gemImage, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
            ctx.restore();

            ctx.strokeStyle = '#a3e4d7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Fallback rendering
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
