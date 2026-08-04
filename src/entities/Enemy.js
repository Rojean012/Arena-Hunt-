import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Load Clean Pre-Rendered Categorized 2D Enemy Assets
const enemySprites = {};

function loadEnemySprite(type, src) {
    const img = new Image();
    img.src = src;
    enemySprites[type] = img;
}

loadEnemySprite('slime', '/assets/images/enemies/slime.png');
loadEnemySprite('miniSlime', '/assets/images/enemies/slime.png');
loadEnemySprite('goblin', '/assets/images/enemies/goblin.png');
loadEnemySprite('ghost', '/assets/images/enemies/ghost.png');
loadEnemySprite('snake', '/assets/images/enemies/snake.png');
loadEnemySprite('bear', '/assets/images/enemies/bear.png');
loadEnemySprite('fox_demon', '/assets/images/enemies/fox_demon.png');
loadEnemySprite('cultist_sorcerer', '/assets/images/enemies/cultist.png');
loadEnemySprite('stone_golem', '/assets/images/enemies/stone_golem.png');
loadEnemySprite('spider_fiend', '/assets/images/enemies/spider_fiend.png');
loadEnemySprite('frost_dragon', '/assets/images/enemies/frost_dragon.png');

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
        
        this.angle = 0;
        this.facingRight = true;
        this.isAttacking = false;
    }

    update(playerX, playerY, projectiles) {
        if (this.dead) return;

        this.animTimer += 0.12;
        if (this.hitFlash > 0) this.hitFlash--;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        // Close-range Melee Attack Gate: Lock orientation to eliminate flickering!
        if (dist < this.radius + 35) {
            this.isAttacking = true;
        } else {
            this.isAttacking = false;
            if (dist > 35) {
                const targetAngle = Math.atan2(dy, dx);
                let diff = targetAngle - this.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.angle += diff * 0.12;

                if (Math.abs(dx) > 3.0) {
                    this.facingRight = (dx > 0);
                }
            }
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
        if (this.shootTimer >= 110) {
            this.shootTimer = 0;
            if (projectiles && dist < 420) {
                if (soundManager && soundManager.playShoot) {
                    soundManager.playShoot();
                }
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                    type: 'goblinArrow',
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 4.8,
                    vy: Math.sin(angle) * 4.8,
                    damage: this.damage * 0.7,
                    radius: 5,
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
            if (this.chargeTimer >= 140 && dist < 280) {
                this.isCharging = true;
                this.chargeTimer = 0;
                this.chargeDir = { x: dx / dist, y: dy / dist };
            }
        } else {
            this.x += this.chargeDir.x * (this.speed * 3.0);
            this.y += this.chargeDir.y * (this.speed * 3.0);

            this.chargeTimer++;
            if (this.chargeTimer >= 30) {
                this.isCharging = false;
                this.chargeTimer = 0;
            }
        }
    }

    updateFoxDemonAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 120) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 450) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
                [-0.2, 0, 0.2].forEach(spread => {
                    const angle = baseAngle + spread;
                    projectiles.push({
                        type: 'foxfire',
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 4.2,
                        vy: Math.sin(angle) * 4.2,
                        damage: this.damage * 0.65,
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
        if (this.shootTimer >= 220) {
            this.shootTimer = 0;
            if (projectiles) {
                projectiles.push({
                    type: 'bloodPillar',
                    x: playerX,
                    y: playerY,
                    vx: 0,
                    vy: 0,
                    damage: this.damage * 0.6,
                    radius: 30,
                    timer: 60,
                    color: '#b91c1c',
                    dead: false
                });
            }
        }
    }

    updateGolemAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 160) {
            this.shootTimer = 0;
            if (projectiles) {
                projectiles.push({
                    type: 'golemSlam',
                    x: this.x,
                    y: this.y,
                    vx: 0,
                    vy: 0,
                    currentRadius: 10,
                    maxRadius: 150,
                    damage: this.damage * 0.7,
                    color: '#64748b',
                    dead: false
                });
            }
        }
    }

    updateSpiderAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 110) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 380) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const angle = Math.atan2(playerY - this.y, playerX - this.x);
                projectiles.push({
                    type: 'spiderWeb',
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 3.8,
                    vy: Math.sin(angle) * 3.8,
                    damage: 3,
                    radius: 10,
                    color: '#10b981',
                    dead: false
                });
            }
        }
    }

    updateFrostDragonAI(playerX, playerY, projectiles) {
        this.updateDirectAI(playerX, playerY);
        this.shootTimer++;
        if (this.shootTimer >= 170) {
            this.shootTimer = 0;
            const dist = Math.hypot(playerX - this.x, playerY - this.y);
            if (projectiles && dist < 500) {
                if (soundManager && soundManager.playShoot) soundManager.playShoot();
                const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
                for (let a = -0.3; a <= 0.3; a += 0.15) {
                    const angle = baseAngle + a;
                    projectiles.push({
                        type: 'frostBreath',
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 5.0,
                        vy: Math.sin(angle) * 5.0,
                        damage: this.damage * 0.6,
                        radius: 8,
                        color: '#38bdf8',
                        dead: false
                    });
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.dead) return false;

        this.health -= amount;
        this.hitFlash = 6;

        if (soundManager && soundManager.playEnemyHit) {
            soundManager.playEnemyHit();
        }

        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            if (soundManager && soundManager.playEnemyDefeat) {
                soundManager.playEnemyDefeat();
            }
            return true;
        }
        return false;
    }

    render(ctx, screenX, screenY) {
        if (this.dead) return;

        const r = this.radius;

        const attackPulse = this.isAttacking ? Math.sin(this.animTimer * 6) * 5.0 : 0;
        const squishX = 1.0 + Math.sin(this.animTimer * 2) * 0.06;
        const squishY = 1.0 - Math.sin(this.animTimer * 2) * 0.06;
        const bobY = Math.abs(Math.sin(this.animTimer * 3)) * -3 + attackPulse;

        ctx.save();
        ctx.translate(screenX, screenY + bobY);

        // Note: Goblin orientation normalized directly in /assets/images/enemies/goblin.png!
        if (this.facingRight) {
            ctx.scale(-1, 1);
        } else {
            ctx.scale(1, 1);
        }

        ctx.scale(squishX, squishY);

        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
            ctx.fill();
        }

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
