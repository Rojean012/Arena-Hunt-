import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload Wang Lin Xianxia Hero Sprite Image
const heroImage = new Image();
heroImage.src = '/assets/images/wang_lin_hero.jpg';

export class Player extends Entity {
    constructor(x = 0, y = 0) {
        super(x, y, GameConfig.player.radius, '#3498db');
        
        this.speed = GameConfig.player.speed;
        this.maxHealth = GameConfig.player.maxHealth;
        this.health = this.maxHealth;
        this.magnetRadius = GameConfig.player.magnetRadius;
        
        this.invincibleFrames = 0;
        this.facingRight = true;
        this.walkTimer = 0;
        this.isMoving = false;
        this.qiAnim = 0;
    }

    update(movement, mouseWorldPos) {
        this.isMoving = (movement.x !== 0 || movement.y !== 0);
        this.qiAnim += 0.06;

        if (this.isMoving) {
            this.x += movement.x * this.speed;
            this.y += movement.y * this.speed;
            this.walkTimer += 0.2;
            if (movement.x < 0) this.facingRight = false;
            if (movement.x > 0) this.facingRight = true;
        } else {
            this.walkTimer = 0;
        }

        if (this.invincibleFrames > 0) this.invincibleFrames--;
    }

    takeDamage(amount) {
        if (this.invincibleFrames > 0) return false;
        
        this.health -= amount;
        this.invincibleFrames = 30;
        soundManager.playPlayerHit();
        
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;
        const bobY = this.isMoving ? Math.abs(Math.sin(this.walkTimer)) * -3 : Math.sin(this.qiAnim * 2) * 2.5;
        const isFlashing = this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2;

        const drawX = screenX;
        const drawY = screenY + bobY;

        ctx.save();
        ctx.translate(drawX, drawY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // 1. Shadow
        ctx.beginPath();
        ctx.ellipse(0, 13 - bobY, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // 2. Swirling Crimson Jiuyou Aura Glow
        const auraR = r + 6 + Math.sin(this.qiAnim * 4) * 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? 'rgba(231, 76, 60, 0.4)' : 'rgba(185, 28, 28, 0.22)';
        ctx.fill();
        ctx.strokeStyle = isFlashing ? '#e74c3c' : 'rgba(220, 38, 38, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Render High-Definition 2D Wang Lin Hero Sprite Image!
        if (heroImage.complete && heroImage.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, -3, r * 1.3, 0, Math.PI * 2);
            ctx.clip(); // Clip image inside smooth sprite circle

            ctx.drawImage(heroImage, -r * 1.5, -r * 1.8, r * 3.0, r * 3.4);
            ctx.restore();

            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -3, r * 1.3, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Fallback rendering while image is loading
            ctx.fillStyle = isFlashing ? '#e74c3c' : '#1e1b4b';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
