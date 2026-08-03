import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { storageSystem } from '../systems/StorageSystem.js';

export class Bullet extends Entity {
    constructor(x, y, angle) {
        super(x, y, GameConfig.player.bulletRadius, '#f1c40f');
        
        const speed = GameConfig.player.bulletSpeed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        const dmgBonus = (storageSystem.getUpgradeLevel('damageLevel') - 1) * 10;
        this.damage = GameConfig.player.bulletDamage + dmgBonus;
        this.lifeSpan = 180; // Destroy after 3 seconds max
    }

    update() {
        super.update();
        this.lifeSpan--;
        if (this.lifeSpan <= 0) {
            this.dead = true;
        }
    }

    render(ctx, screenX, screenY) {
        // Glow effect
        ctx.save();
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}
