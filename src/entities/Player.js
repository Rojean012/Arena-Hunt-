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
        const legOffset = Math.sin(this.walkTimer) * 4;
        const isFlashing = this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2;

        const drawX = screenX;
        const drawY = screenY + bobY;

        ctx.save();
        ctx.translate(drawX, drawY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // 1. Soft Shadow
        ctx.beginPath();
        ctx.ellipse(0, 13 - bobY, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // 2. Wang Lin Jiuyou / Ancient God Crimson Qi Aura Wisps
        const auraR = r + 6 + Math.sin(this.qiAnim * 4) * 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? 'rgba(231, 76, 60, 0.4)' : 'rgba(185, 28, 28, 0.22)';
        ctx.fill();
        ctx.strokeStyle = isFlashing ? '#e74c3c' : 'rgba(220, 38, 38, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Wang Lin Dark Navy Blue & Indigo Xianxia Robe + Silver Arm Guards
        // Boots
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6 + legOffset, 7, 5, 7);
        ctx.fillRect(2 - legOffset, 7, 5, 7);

        // Midnight Navy Robe Base
        ctx.beginPath();
        ctx.roundRect(-9, -5, 18, 15, 4);
        ctx.fillStyle = isFlashing ? '#e74c3c' : '#1e1b4b'; // Midnight Navy/Indigo
        ctx.fill();
        ctx.strokeStyle = '#312e81';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Silver Metal Chest Trim & Collar
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-4, -5, 8, 4);

        // Deep Crimson Sash Belt
        ctx.fillStyle = '#991b1b'; // Deep Crimson
        ctx.fillRect(-9, 2, 18, 2.5);
        ctx.fillStyle = '#d97706'; // Gold buckle
        ctx.fillRect(-2, 1.5, 4, 3.5);

        // Silver Arm Guards / Bracers
        ctx.fillStyle = '#94a3b8'; // Silver Bracers
        ctx.fillRect(-11, 0, 4, 6);
        ctx.fillRect(7, 0, 4, 6);

        // 4. Wang Lin Handsome Xianxia MC Head & Hair
        const headR = r * 0.82;
        const headY = -13;

        // Long Jet Black Hair Flowing Down Back
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.ellipse(0, headY + 4, headR * 0.95, headR * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Handsome Fair Skin Face
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? '#ff8888' : '#fdebd0';
        ctx.fill();

        // Sharp Hair Locks Framing Cheeks
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.moveTo(-headR * 0.8, headY - 2);
        ctx.lineTo(-headR * 0.3, headY + 4);
        ctx.lineTo(-headR * 0.1, headY - 4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(headR * 0.8, headY - 2);
        ctx.lineTo(headR * 0.3, headY + 4);
        ctx.lineTo(headR * 0.1, headY - 4);
        ctx.fill();

        // Silver Crown Guan / Topknot Hairpin
        ctx.fillStyle = '#e2e8f0'; // Silver Crown
        ctx.fillRect(-4, headY - headR - 5, 8, 5);
        ctx.fillStyle = '#dc2626'; // Crimson Ribbon
        ctx.fillRect(-6, headY - headR - 3, 12, 2);

        // Cold Handsome Crimson/Gold Eyes
        ctx.fillStyle = '#991b1b'; // Crimson Eye
        ctx.beginPath();
        ctx.ellipse(4, headY - 1, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.ellipse(-4, headY - 1, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye Gold Star Highlight
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(4.8, headY - 2.5, 1.1, 0, Math.PI * 2);
        ctx.arc(-3.2, headY - 2.5, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Sharp Eyebrows
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-7, headY - 6);
        ctx.lineTo(-2, headY - 4);
        ctx.moveTo(7, headY - 6);
        ctx.lineTo(2, headY - 4);
        ctx.stroke();

        // Firm Smile
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-2.5, headY + 3);
        ctx.lineTo(2.5, headY + 3);
        ctx.stroke();

        ctx.restore();
    }
}
