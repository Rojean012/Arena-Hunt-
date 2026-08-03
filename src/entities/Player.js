import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload Wang Lin V3 Hero Sprite & Apply Chroma-Key Background Removal Filter
const rawHeroImage = new Image();
rawHeroImage.src = '/assets/images/wang_lin_v3.jpg';

let processedHeroSprite = null;

rawHeroImage.onload = () => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = rawHeroImage.width;
        canvas.height = rawHeroImage.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(rawHeroImage, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Key out white / light background pixels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 190 && g > 190 && b > 190) {
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
        this.qiAnim += 0.05;

        if (this.isMoving) {
            this.x += movement.x * this.speed;
            this.y += movement.y * this.speed;
            this.walkTimer += 0.18;
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
        if (soundManager && soundManager.playPlayerHit) {
            soundManager.playPlayerHit();
        }
        
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

        // Subtle Graceful Animation (No extreme swinging!)
        const bobY = this.isMoving ? Math.abs(Math.sin(this.walkTimer)) * -2 : Math.sin(this.qiAnim * 2) * 1.5;
        const tiltAngle = this.isMoving ? Math.sin(this.walkTimer) * 0.03 : 0;
        const damageShakeX = this.invincibleFrames > 0 ? (Math.random() - 0.5) * 6 : 0;

        const isFlashing = this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2;

        const drawX = screenX + damageShakeX;
        const drawY = screenY + bobY;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(tiltAngle);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Soft Shadow
        ctx.beginPath();
        ctx.ellipse(0, 14 - bobY, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // 2. Render Transparent Wang Lin V3 Hero Sprite (NO red circle, NO white background box!)
        const sprite = processedHeroSprite || rawHeroImage;
        if (sprite && (sprite.complete || sprite.width)) {
            ctx.save();
            ctx.drawImage(sprite, -r * 1.4, -r * 1.6, r * 2.8, r * 3.2);
            ctx.restore();
        } else {
            ctx.fillStyle = isFlashing ? '#e74c3c' : '#1e1b4b';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Damage Flashing Tint
        if (isFlashing) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
