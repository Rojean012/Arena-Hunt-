import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Pre-render Clean Transparent Hero PNG Asset
const heroCanvas = document.createElement('canvas');
heroCanvas.width = 128;
heroCanvas.height = 128;
const heroCtx = heroCanvas.getContext('2d');
heroCtx.imageSmoothingEnabled = true;
heroCtx.imageSmoothingQuality = 'high';

const redHeroCanvas = document.createElement('canvas');
redHeroCanvas.width = 128;
redHeroCanvas.height = 128;
const redHeroCtx = redHeroCanvas.getContext('2d');

const heroImg = new Image();
heroImg.src = '/assets/images/heroes/wang_lin.png';

let heroLoaded = false;
heroImg.onload = () => {
    heroCtx.drawImage(heroImg, 0, 0, 128, 128);

    // Pre-render Red Composite Hit Flash Canvas
    redHeroCtx.drawImage(heroCanvas, 0, 0);
    redHeroCtx.globalCompositeOperation = 'source-in';
    redHeroCtx.fillStyle = 'rgba(239, 68, 68, 0.90)';
    redHeroCtx.fillRect(0, 0, 128, 128);

    heroLoaded = true;
};

export class Player extends Entity {
    constructor(x, y) {
        const spec = GameConfig.player || {
            speed: 5.0,
            maxHealth: 100,
            radius: 20,
            color: '#38bdf8'
        };

        super(x, y, spec.radius, spec.color);
        
        this.speed = spec.speed;
        this.maxHealth = spec.maxHealth;
        this.health = this.maxHealth;
        this.coins = 0;
        this.xp = 0;
        this.level = 1;
        this.gemsCollected = 0;
        this.magnetRadius = 0;
        this.magnetLevel = 0;
        this.speedLevel = 0;
        this.healthLevel = 0;

        this.animTimer = 0;
        this.hitFlash = 0;
        this.angle = 0;
        this.facingRight = true;

        this.vx = 0;
        this.vy = 0;
    }

    reset(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.speed = GameConfig.player ? GameConfig.player.speed : 5.0;
        this.maxHealth = GameConfig.player ? GameConfig.player.maxHealth : 100;
        this.health = this.maxHealth;
        this.coins = 0;
        this.xp = 0;
        this.level = 1;
        this.gemsCollected = 0;
        this.magnetRadius = 0;
        this.magnetLevel = 0;
        this.speedLevel = 0;
        this.healthLevel = 0;

        this.animTimer = 0;
        this.hitFlash = 0;
        this.angle = 0;
        this.facingRight = true;
        this.vx = 0;
        this.vy = 0;
    }

    update(movement, bounds) {
        this.vx = movement.x * this.speed;
        this.vy = movement.y * this.speed;

        this.x += this.vx;
        this.y += this.vy;

        if (movement.x !== 0 || movement.y !== 0) {
            this.animTimer += 0.15;
            this.angle = Math.atan2(movement.y, movement.x);
            if (movement.x !== 0) {
                this.facingRight = movement.x > 0;
            }
        }

        if (this.hitFlash > 0) {
            this.hitFlash--;
        }

        if (bounds) {
            const halfW = (bounds.width || 3000) / 2;
            const halfH = (bounds.height || 3000) / 2;
            this.x = Math.max(-halfW + this.radius, Math.min(halfW - this.radius, this.x));
            this.y = Math.max(-halfH + this.radius, Math.min(halfH - this.radius, this.y));
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 10;
        if (soundManager && soundManager.playHit) {
            soundManager.playHit();
        }

        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addCoins(amount) {
        this.coins += amount;
        if (soundManager && soundManager.playCoinClink) {
            soundManager.playCoinClink();
        }
    }

    addXP(amount) {
        this.xp += amount;
        this.gemsCollected++;
        return false;
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        const squishX = 1.0 + Math.sin(this.animTimer * 2) * 0.05;
        const squishY = 1.0 - Math.sin(this.animTimer * 2) * 0.05;
        const bobY = Math.abs(Math.sin(this.animTimer * 3)) * -2;

        ctx.save();
        ctx.translate(screenX, screenY + bobY);

        if (this.facingRight) {
            ctx.scale(-1, 1);
        } else {
            ctx.scale(1, 1);
        }

        ctx.scale(squishX, squishY);

        if (heroLoaded || (heroImg.complete && heroImg.width > 0)) {
            ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
            ctx.shadowBlur = 12;
            ctx.drawImage(heroCanvas, -r * 1.5, -r * 1.5, r * 3, r * 3);

            if (this.hitFlash > 0) {
                ctx.shadowColor = 'transparent';
                ctx.drawImage(redHeroCanvas, -r * 1.5, -r * 1.5, r * 3, r * 3);
            }
        } else {
            ctx.fillStyle = this.hitFlash > 0 ? '#ef4444' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
