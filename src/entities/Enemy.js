import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload New 2D Enemy Asset Images with Smooth Feathered Offscreen Background Removal
const enemySprites = {};

function loadEnemySprite(type, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Sample corner background color
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];

            // Smooth Feathered Chroma-Keying (Eliminates harsh cutoffs, especially on Ghosts!)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const dr = Math.abs(r - bgR);
                const dg = Math.abs(g - bgG);
                const db = Math.abs(b - bgB);
                const diff = Math.max(dr, Math.max(dg, db));

                // Pure White or Corner Background Match
                if (r > 235 && g > 235 && b > 235) {
                    data[i + 3] = 0;
                } else if (diff < 20) {
                    data[i + 3] = 0;
                } else if (diff < 50) {
                    // Feathered soft edge transition
                    const alpha = Math.floor(((diff - 20) / 30) * 255);
                    data[i + 3] = Math.min(data[i + 3], alpha);
                }
            }

            ctx.putImageData(imgData, 0, 0);
            enemySprites[type] = canvas;
        } catch (e) {
            enemySprites[type] = img;
        }
    };
}

// Load all 5 high-res 2D enemy models
loadEnemySprite('slime', '/assets/images/new_models/slime_enemy.png');
loadEnemySprite('miniSlime', '/assets/images/new_models/slime_enemy.png');
loadEnemySprite('goblin', '/assets/images/new_models/goblin_enemy.png');
loadEnemySprite('ghost', '/assets/images/new_models/ghost_enemy.png');
loadEnemySprite('snake', '/assets/images/new_models/Viper Serpent.png');
loadEnemySprite('bear', '/assets/images/new_models/Mutant Orc Berserker.png');

export class Enemy extends Entity {
    constructor(x, y, type = 'slime') {
        let spec = GameConfig.enemies[type];
        if (!spec) {
            spec = type === 'miniSlime' 
                ? { radius: 11, speed: 1.4, health: 6, damage: 4, color: '#2ecc71', name: 'Mini Slime' }
                : (type === 'snake' ? { radius: 13, speed: 1.8, health: 12, damage: 8, color: '#a855f7', name: 'Viper Serpent' } : GameConfig.enemies.slime);
        }

        super(x, y, spec.radius, spec.color);
        
        this.type = type;
        this.speed = spec.speed;
        this.maxHealth = spec.health;
        this.health = this.maxHealth;
        this.damage = spec.damage;
        this.scoreValue = spec.scoreValue || (spec.health * 2);

        this.animTimer = Math.random() * 10;
        this.chargeTimer = 0;
        this.isCharging = false;
        this.chargeDir = { x: 0, y: 0 };

        this.shootTimer = Math.random() * 60;
        this.flankAngle = Math.random() * Math.PI * 2;
        this.hitFlash = 0;
        
        // Instant orientation tracking
        this.angle = 0;
        this.facingRight = true;
    }

    update(playerX, playerY, projectiles) {
        this.animTimer += 0.12;
        if (this.hitFlash > 0) this.hitFlash--;

        // Calculate INSTANT orientation toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        this.angle = Math.atan2(dy, dx);
        this.facingRight = (dx >= 0);

        if (this.type === 'bear') {
            this.updateChargerAI(playerX, playerY);
        } else if (this.type === 'goblin') {
            this.updateArcherAI(playerX, playerY, projectiles);
        } else if (this.type === 'ghost') {
            this.updateFlankerAI(playerX, playerY);
        } else {
            this.updateDirectAI(playerX, playerY);
        }
    }

    updateDirectAI(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    updateFlankerAI(playerX, playerY) {
        this.flankAngle += 0.02;
        const flankDist = 120;
        const targetX = playerX + Math.cos(this.flankAngle) * flankDist;
        const targetY = playerY + Math.sin(this.flankAngle) * flankDist;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            this.x += (dx / dist) * (this.speed * 1.2);
            this.y += (dy / dist) * (this.speed * 1.2);
        } else {
            const pdx = playerX - this.x;
            const pdy = playerY - this.y;
            const pdist = Math.hypot(pdx, pdy);
            if (pdist > 0) {
                this.x += (pdx / pdist) * (this.speed * 1.5);
                this.y += (pdy / pdist) * (this.speed * 1.5);
            }
        }
    }

    updateArcherAI(playerX, playerY, projectiles) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        const preferredDist = 200;
        if (dist < preferredDist - 30) {
            this.x -= (dx / dist) * (this.speed * 0.8);
            this.y -= (dy / dist) * (this.speed * 0.8);
        } else if (dist > preferredDist + 30) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        this.shootTimer++;
        if (this.shootTimer >= 100) {
            this.shootTimer = 0;
            if (projectiles && dist < 400) {
                if (soundManager && soundManager.playShoot) {
                    soundManager.playShoot();
                }
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    damage: this.damage,
                    radius: 4,
                    color: '#e67e22',
                    dead: false
                });
            }
        }
    }

    updateChargerAI(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (!this.isCharging) {
            if (dist > 0) {
                this.x += (dx / dist) * (this.speed * 0.7);
                this.y += (dy / dist) * (this.speed * 0.7);
            }

            this.chargeTimer++;
            if (this.chargeTimer >= 120 && dist < 300) {
                this.isCharging = true;
                this.chargeTimer = 0;
                this.chargeDir = { x: dx / dist, y: dy / dist };
            }
        } else {
            this.x += this.chargeDir.x * (this.speed * 3.2);
            this.y += this.chargeDir.y * (this.speed * 3.2);

            this.chargeTimer++;
            if (this.chargeTimer >= 35) {
                this.isCharging = false;
                this.chargeTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 6;

        if (soundManager && soundManager.playEnemyHit) {
            soundManager.playEnemyHit();
        } else if (soundManager && soundManager.playHit) {
            soundManager.playHit();
        }

        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        return false;
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        // Monster Action Animations
        const squishX = 1.0 + Math.sin(this.animTimer * 2) * 0.08;
        const squishY = 1.0 - Math.sin(this.animTimer * 2) * 0.08;
        const bobY = Math.abs(Math.sin(this.animTimer * 3)) * -3;

        ctx.save();
        ctx.translate(screenX, screenY + bobY);

        // Instant Dynamic Sprite Orientation per Monster Type
        if (this.type === 'snake') {
            ctx.rotate(this.angle + Math.PI / 2);
        } else if (this.type === 'goblin' || this.type === 'bear') {
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }
        } else if (this.type === 'ghost') {
            ctx.rotate(Math.sin(this.animTimer * 1.5) * 0.12);
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }
        }

        ctx.scale(squishX, squishY);

        // Charger Red Telegraph Arc
        if (this.type === 'bear' && this.isCharging) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render 2D Enemy Sprite Image Asset
        const sprite = enemySprites[this.type];

        if (sprite && (sprite.complete || sprite.width)) {
            ctx.drawImage(sprite, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hit Flash Tint
        if (this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Monster Health Bar
        if (this.health < this.maxHealth) {
            ctx.save();
            ctx.translate(screenX, screenY + bobY);
            const barW = r * 2;
            const barH = 4;
            const barY = -r - 12;
            const pct = Math.max(0, this.health / this.maxHealth);

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-r, barY, barW, barH);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-r, barY, barW * pct, barH);
            ctx.restore();
        }
    }
}
