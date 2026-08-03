import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload Wang Lin Xianxia Hero Sprite & Apply White Background Removal Filter
const rawHeroImage = new Image();
rawHeroImage.src = '/assets/images/wang_lin_hero.jpg';

let processedHeroSprite = null;

rawHeroImage.onload = () => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = rawHeroImage.width;
        canvas.height = rawHeroImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(rawHeroImage, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Key out white / light-gray background pixels so ONLY Wang Lin hero renders!
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0; // Make background transparent
            }
        }

        ctx.putImageData(imgData, 0, 0);
        processedHeroSprite = canvas;
    } catch (e) {
        processedHeroSprite = rawHeroImage;
    }
};

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
            this.walkTimer += 0.22;
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

        // Dynamic Walking & Breathing Animation Transforms!
        const bobY = this.isMoving ? Math.abs(Math.sin(this.walkTimer)) * -4 : Math.sin(this.qiAnim * 2) * 2;
        const tiltAngle = this.isMoving ? Math.sin(this.walkTimer) * 0.08 : 0;
        const breathScaleY = 1.0 + Math.sin(this.qiAnim * 3) * 0.03;

        const isFlashing = this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2;

        const drawX = screenX;
        const drawY = screenY + bobY;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(tiltAngle);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // 1. Soft Shadow
        ctx.beginPath();
        ctx.ellipse(0, 14 - bobY, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // 2. Swirling Crimson Jiuyou Qi Aura
        const auraR = r + 6 + Math.sin(this.qiAnim * 4) * 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.fillStyle = isFlashing ? 'rgba(231, 76, 60, 0.4)' : 'rgba(185, 28, 28, 0.22)';
        ctx.fill();
        ctx.strokeStyle = isFlashing ? '#e74c3c' : 'rgba(220, 38, 38, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Render Transparent Wang Lin Hero Sprite (No white box, no white circle!)
        const sprite = processedHeroSprite || rawHeroImage;
        if (sprite && (sprite.complete || sprite.width)) {
            ctx.save();
            ctx.scale(1.0, breathScaleY);
            
            // Draw transparent Wang Lin sprite centered cleanly
            ctx.drawImage(sprite, -r * 1.5, -r * 1.8, r * 3.0, r * 3.4);
            ctx.restore();
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
