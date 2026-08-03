import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

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
        this.qiAnim += 0.05;

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
        const bobY = this.isMoving ? Math.abs(Math.sin(this.walkTimer)) * -3 : Math.sin(this.qiAnim * 2) * 2;
        const legOffset = Math.sin(this.walkTimer) * 4;
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
        ctx.ellipse(0, 12 - bobY, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // 2. Wang Lin Ancient God / Jiuyou Crimson Qi Aura Glow
        const auraR = r + 5 + Math.sin(this.qiAnim * 4) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? 'rgba(231, 76, 60, 0.4)' : 'rgba(192, 57, 43, 0.2)';
        ctx.fill();

        // 3. Wang Lin Dark Slate Blue / Purple Xianxia Robe & Silver Shoulder Armor
        // Boots
        ctx.fillStyle = '#111827';
        ctx.fillRect(-6 + legOffset, 7, 5, 7);
        ctx.fillRect(2 - legOffset, 7, 5, 7);

        // High Collared Dark Slate Robe
        ctx.beginPath();
        ctx.roundRect(-9, -5, 18, 15, 4);
        ctx.fillStyle = isFlashing ? '#e74c3c' : '#1e293b'; // Dark Slate
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner Red/Gold Trim
        ctx.fillStyle = '#991b1b'; // Deep Crimson inner trim
        ctx.fillRect(-4, -5, 8, 10);
        ctx.fillStyle = '#d97706'; // Gold belt
        ctx.fillRect(-9, 2, 18, 2.5);

        // Silver Shoulder Pauldrons (Armored Shoulders)
        ctx.fillStyle = '#cbd5e1'; // Silver Armor
        ctx.beginPath();
        ctx.ellipse(-10, -3, 4, 6, 0.2, 0, Math.PI * 2);
        ctx.ellipse(10, -3, 4, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Wang Lin Head & Long Flowing Hair with Silver Hairpin
        const headR = r * 0.8;
        const headY = -12;

        // Long Dark Flowing Hair (Back)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, headY + 3, headR * 0.95, headR * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Handsome Fair Skin Face
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? '#ff8888' : '#fdebd0';
        ctx.fill();

        // Sharp Handsome Hair Bangs
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-headR * 0.4, headY - headR * 0.4, 5, 0, Math.PI * 2);
        ctx.arc(0, headY - headR * 0.5, 5, 0, Math.PI * 2);
        ctx.arc(headR * 0.4, headY - headR * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Silver Hair Crown Guan / Hairpin
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-4, headY - headR - 5, 8, 5);
        ctx.fillStyle = '#dc2626'; // Crimson Gem in Hairpin
        ctx.fillRect(-2, headY - headR - 3, 4, 3);

        // Resolute Crimson/Gold Eyes (Ancient God Star)
        ctx.fillStyle = '#991b1b'; // Deep Crimson Eyes
        ctx.beginPath();
        ctx.ellipse(4, headY - 1, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(-4, headY - 1, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye Gold Star Sparkle Highlight
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(5, headY - 3, 1.2, 0, Math.PI * 2);
        ctx.arc(-3, headY - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Resolute Firm Mouth
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3, headY + 3);
        ctx.lineTo(3, headY + 3);
        ctx.stroke();

        ctx.restore();
    }
}
