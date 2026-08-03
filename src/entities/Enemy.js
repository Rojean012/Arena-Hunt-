import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload All 10 Enemy Asset Images with Instant Zero-Stutter Offscreen Canvases
const enemySprites = {};

function loadEnemySprite(type, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const targetSize = ['stone_golem', 'frost_dragon', 'bear'].includes(type) ? 384 : 256;
            const canvas = document.createElement('canvas');
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetSize, targetSize);

            const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
            const data = imgData.data;

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

                if ((r > 240 && g > 240 && b > 240) || diff < 24) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            enemySprites[type] = canvas;
        } catch (e) {
            enemySprites[type] = img;
        }
    };
}

// Load all 10 Enemy Models from /assets/images/new_models/
loadEnemySprite('slime', '/assets/images/new_models/slime_enemy.png');
loadEnemySprite('miniSlime', '/assets/images/new_models/slime_enemy.png');
loadEnemySprite('goblin', '/assets/images/new_models/goblin_enemy.png');
loadEnemySprite('ghost', '/assets/images/new_models/ghost_enemy.png');
loadEnemySprite('snake', '/assets/images/new_models/Viper Serpent.png');
loadEnemySprite('bear', '/assets/images/new_models/Mutant Orc Berserker.png');
loadEnemySprite('fox_demon', '/assets/images/new_models/fox_demon.png');
loadEnemySprite('cultist_sorcerer', '/assets/images/new_models/cultist_sorcerer.png');
loadEnemySprite('stone_golem', '/assets/images/new_models/stone_golem.png');
loadEnemySprite('spider_fiend', '/assets/images/new_models/spider_fiend.png');
loadEnemySprite('frost_dragon', '/assets/images/new_models/frost_dragon.png');

export class Enemy extends Entity {
    constructor(x, y, type = 'slime') {
        let spec = GameConfig.enemies[type] || GameConfig.enemies.slime;

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
        
        // Smooth orientation tracking
        this.angle = 0;
        this.facingRight = true;
    }

    update(playerX, playerY, projectiles) {
        this.animTimer += 0.12;
        if (this.hitFlash > 0) this.hitFlash--;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        // Smooth angle tracking (Prevents snake spinning in circles!)
        if (dist > 25) {
            const targetAngle = Math.atan2(dy, dx);
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * 0.12;
            while (this.angle < -Math.PI) this.angle += Math.PI * 2;
            while (this.angle > Math.PI) this.angle -= Math.PI * 2;

            this.facingRight = (dx >= 0);
        }

        if (this.type === 'bear') {
            this.updateChargerAI(playerX, playerY);
        } else if (this.type === 'goblin') {
            this.updateArcherAI(playerX, playerY, projectiles);
        } else if (this.type === 'ghost') {
            this.updateFlankerAI(playerX, playerY);
        } else if (this.type === 'fox_demon') {
            this.updateFoxDemonAI(playerX, playerY, projectiles);
        } else if (this.type === 'cultist_sorcerer') {
            this.updateCultistAI(playerX, playerY, projectiles);
        } else if (this.type === 'stone_golem') {
            this.updateGolemAI(playerX, playerY, projectiles);
        } else if (this.type === 'spider_fiend') {
            this.updateSpiderAI(playerX, playerY, projectiles);
        } else if (this.type === 'frost_dragon') {
            this.updateFrostDragonAI(playerX, playerY, projectiles);
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
            if (projectiles && dist < 420) {
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

    updateFoxDemonAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 110) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 450) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
                [-0.25, 0, 0.25].forEach(spread => {
                    const angle = baseAngle + spread;
                    projectiles.push({
                        type: 'foxfire',
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 4.5,
                        vy: Math.sin(angle) * 4.5,
                        damage: this.damage,
                        radius: 6,
                        color: '#ef4444',
                        dead: false
                    });
                });
            }
        }
    }

    updateCultistAI(playerX, playerY, projectiles) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 250) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        this.shootTimer++;
        if (this.shootTimer >= 130) {
            this.shootTimer = 0;
            if (projectiles) {
                projectiles.push({
                    type: 'bloodPillar',
                    x: playerX,
                    y: playerY,
                    vx: 0,
                    vy: 0,
                    damage: this.damage * 1.5,
                    radius: 35,
                    timer: 50,
                    color: '#b91c1c',
                    dead: false
                });
            }
        }
    }

    updateGolemAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 140) {
            this.shootTimer = 0;
            if (projectiles) {
                projectiles.push({
                    type: 'golemSlam',
                    x: this.x,
                    y: this.y,
                    vx: 0,
                    vy: 0,
                    currentRadius: 10,
                    maxRadius: 160,
                    damage: this.damage,
                    color: '#64748b',
                    dead: false
                });
            }
        }
    }

    updateSpiderAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 90) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 380) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const angle = Math.atan2(playerY - this.y, playerX - this.x);
                projectiles.push({
                    type: 'spiderWeb',
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    damage: 4,
                    radius: 12,
                    color: '#10b981',
                    dead: false
                });
            }
        }
    }

    updateFrostDragonAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 150) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 500) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
                for (let a = -0.4; a <= 0.4; a += 0.15) {
                    const angle = baseAngle + a;
                    projectiles.push({
                        type: 'frostBreath',
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 5.5,
                        vy: Math.sin(angle) * 5.5,
                        damage: this.damage * 0.8,
                        radius: 8,
                        color: '#38bdf8',
                        dead: false
                    });
                }
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 6;

        if (soundManager && soundManager.playEnemyHit) {
            soundManager.playEnemyHit();
        }

        if (this.health <= 0) {
            this.health = 0;
            if (soundManager && soundManager.playEnemyDefeat) {
                soundManager.playEnemyDefeat();
            }
            return true;
        }
        return false;
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        const squishX = 1.0 + Math.sin(this.animTimer * 2) * 0.08;
        const squishY = 1.0 - Math.sin(this.animTimer * 2) * 0.08;
        const bobY = Math.abs(Math.sin(this.animTimer * 3)) * -3;

        ctx.save();
        ctx.translate(screenX, screenY + bobY);

        if (this.type === 'snake') {
            ctx.rotate(this.angle + Math.PI / 2);
        } else if (['goblin', 'bear', 'ghost', 'fox_demon', 'cultist_sorcerer', 'stone_golem', 'spider_fiend', 'frost_dragon'].includes(this.type)) {
            if (this.facingRight) {
                ctx.scale(-1, 1);
            }
        }

        ctx.scale(squishX, squishY);

        if (this.type === 'bear' && this.isCharging) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
            ctx.fill();
        }

        const sprite = enemySprites[this.type];

        if (sprite && (sprite.complete || sprite.width)) {
            ctx.drawImage(sprite, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
        } else {
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

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
