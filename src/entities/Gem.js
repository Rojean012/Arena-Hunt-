import { Entity } from './Entity.js';

export class Gem extends Entity {
    constructor(x, y, type = 'emerald') {
        let value = 1;
        let color = '#2ecc71'; // Emerald Green
        let radius = 9;

        if (type === 'large_emerald') {
            value = 3;
            color = '#27ae60';
            radius = 12;
        } else if (type === 'boss_emerald') {
            value = 5;
            color = '#1abc9c';
            radius = 15;
        }

        super(x, y, radius, color);
        this.type = type;
        this.value = value;
        this.bob = Math.random() * Math.PI * 2;
        this.isMagnetized = false;
    }

    update(playerX, playerY, magnetRadius) {
        this.bob += 0.08;

        const dist = Math.hypot(playerX - this.x, playerY - this.y);
        
        if (dist < magnetRadius) {
            this.isMagnetized = true;
        }

        if (this.isMagnetized) {
            const angle = Math.atan2(playerY - this.y, playerX - this.x);
            const speed = Math.max(9, (1 - dist / magnetRadius) * 18);
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
        }
    }

    render(ctx, screenX, screenY) {
        const sy = screenY - Math.sin(this.bob) * 4;
        const r = this.radius;

        ctx.save();
        
        // Emerald Glow Aura
        ctx.beginPath();
        ctx.arc(screenX, sy, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
        ctx.fill();

        // Faceted Emerald Diamond Shape
        ctx.beginPath();
        ctx.moveTo(screenX, sy - r * 1.2);
        ctx.lineTo(screenX + r * 0.9, sy - r * 0.4);
        ctx.lineTo(screenX + r * 0.9, sy + r * 0.4);
        ctx.lineTo(screenX, sy + r * 1.2);
        ctx.lineTo(screenX - r * 0.9, sy + r * 0.4);
        ctx.lineTo(screenX - r * 0.9, sy - r * 0.4);
        ctx.closePath();

        ctx.fillStyle = '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#a3e4d7';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Inner Facet Sparkle Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX - r * 0.5, sy - r * 0.2);
        ctx.lineTo(screenX + r * 0.3, sy - r * 0.5);
        ctx.stroke();

        ctx.restore();
    }
}
