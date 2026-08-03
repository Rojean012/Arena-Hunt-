import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

export class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 10, '#f1c40f');
        this.bob = Math.random() * Math.PI * 2;
        this.value = GameConfig.world.coinValue;
    }

    update(playerX, playerY) {
        this.bob += 0.05;

        // Magnetism towards player
        const dist = Math.hypot(playerX - this.x, playerY - this.y);
        if (dist < GameConfig.world.magnetRadius) {
            const angle = Math.atan2(playerY - this.y, playerX - this.x);
            const pullSpeed = (1 - dist / GameConfig.world.magnetRadius) * 8;
            this.x += Math.cos(angle) * pullSpeed;
            this.y += Math.sin(angle) * pullSpeed;
        }
    }

    collect() {
        this.dead = true;
        soundManager.playCoinCollect();
    }

    render(ctx, screenX, screenY) {
        const scale = Math.abs(Math.sin(this.bob));
        const sy = screenY - Math.sin(this.bob) * 3;

        ctx.save();
        ctx.translate(screenX, sy);
        ctx.scale(1, 0.3 + scale * 0.7);

        // Coin Outer Circle
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Dollar Symbol
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', screenX, sy + 4);
    }
}
