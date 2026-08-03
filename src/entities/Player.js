import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload Wang Lin High-Res 2D Hero Asset Image
let heroCanvas = null;

function loadHeroSprite(src) {
    const heroImg = new Image();
    heroImg.src = src;
    heroImg.onload = () => {
        try {
            const targetSize = 256;
            const canvas = document.createElement('canvas');
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(heroImg, 0, 0, targetSize, targetSize);

            const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
            const data = imgData.data;

            // Fast single-pass background keying
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const dr = Math.abs(r - bgR);
                const dg = Math.abs(g - bgG);
                const db = Math.abs(b - bgB);
                const diff = Math.max(dr, Math.max(dg, db));

                if ((r > 235 && g > 235 && b > 235) || (r < 25 && g < 25 && b < 25) || diff < 22) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            heroCanvas = canvas;
        } catch (e) {
            heroCanvas = heroImg;
        }
    };
}

// Try loading wang_lin_v3.jpg first, with fallback to wang_lin_hero.jpg
loadHeroSprite('/assets/images/wang_lin_v3.jpg');

export class Player extends Entity {
    constructor(x, y) {
        const pConfig = GameConfig.player || { radius: 22, speed: 3.4, health: 100 };
        super(x, y, pConfig.radius, '#3498db');
        
        this.maxHealth = pConfig.health || 100;
        this.health = this.maxHealth;
        this.baseSpeed = pConfig.speed || 3.4;
        this.speed = this.baseSpeed;

        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = (GameConfig.xp && GameConfig.xp.baseXP) ? GameConfig.xp.baseXP : 10;
        this.coins = 0;

        this.invulnerableTimer = 0;
        this.hitFlash = 0;
        this.facingRight = true;
        this.animTimer = 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.speed = this.baseSpeed;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = (GameConfig.xp && GameConfig.xp.baseXP) ? GameConfig.xp.baseXP : 10;
        this.coins = 0;
        this.invulnerableTimer = 0;
        this.hitFlash = 0;
    }

    update(movement, bounds) {
        this.animTimer += 0.15;

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        if (this.hitFlash > 0) this.hitFlash--;

        if (movement.x !== 0 || movement.y !== 0) {
            this.x += movement.x * this.speed;
            this.y += movement.y * this.speed;

            if (movement.x > 0) this.facingRight = true;
            if (movement.x < 0) this.facingRight = false;
        }

        if (bounds) {
            this.x = Math.max(this.radius, Math.min(bounds.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(bounds.height - this.radius, this.y));
        }
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return false;

        this.health -= amount;
        this.invulnerableTimer = 25; // 25 frames invulnerability
        this.hitFlash = 12; // 12 frames full-sprite red hit flash!

        if (soundManager && soundManager.playHit) {
            soundManager.playHit();
        }

        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        return false;
    }

    addXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            return true; // Level up triggered
        }
        return false;
    }

    levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        const multiplier = (GameConfig.xp && GameConfig.xp.multiplier) ? GameConfig.xp.multiplier : 1.25;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * multiplier);
        
        // Partial heal on level up
        this.health = Math.min(this.maxHealth, this.health + 25);

        if (soundManager && soundManager.playLevelUp) {
            soundManager.playLevelUp();
        }
    }

    addCoins(amount) {
        this.coins += amount;
        if (soundManager && soundManager.playCoinClink) {
            soundManager.playCoinClink();
        }
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        ctx.save();
        ctx.translate(screenX, screenY);

        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Floating Breathing Animation
        const bobY = Math.sin(this.animTimer) * 2;
        ctx.translate(0, bobY);

        // Render Wang Lin 2D Hero Sprite Canvas
        if (heroCanvas && (heroCanvas.complete || heroCanvas.width)) {
            ctx.drawImage(heroCanvas, -r * 1.5, -r * 1.5, r * 3.0, r * 3.0);

            // Full-Sprite Red Hit Flash Tint when taking damage!
            if (this.hitFlash > 0) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
                ctx.fillRect(-r * 1.5, -r * 1.5, r * 3.0, r * 3.0);
                ctx.restore();
            }
        } else {
            // Fallback
            ctx.fillStyle = this.hitFlash > 0 ? '#ef4444' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
