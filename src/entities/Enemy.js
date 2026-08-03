import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload Mutant Monster 2D Sprite Image
const monsterImage = new Image();
monsterImage.src = '/assets/images/mutant_monster.jpg';

export class Enemy extends Entity {
    constructor(x, y, type = 'slime') {
        let spec = GameConfig.enemies[type];
        if (!spec) {
            spec = type === 'miniSlime' 
                ? { radius: 11, speed: 1.4, health: 6, damage: 4, color: '#2ecc71', name: 'Mini Slime' }
                : GameConfig.enemies.slime;
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
    }

    update(playerX, playerY, projectiles) {
        this.animTimer += 0.1;

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
                soundManager.playShoot();
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
        soundManager.playEnemyHit();
        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        return false;
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Charger Red Telegraph Arc
        if (this.type === 'bear' && this.isCharging) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render High-Definition 2D Mutant Monster Image Sprite Asset!
        if (monsterImage.complete && monsterImage.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.clip(); // Clip image inside sprite circle

            ctx.drawImage(monsterImage, -r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
            ctx.restore();

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Fallback rendering
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Monster Health Bar
        if (this.health < this.maxHealth) {
            const barW = r * 2;
            const barH = 4;
            const barY = -r - 10;
            const pct = Math.max(0, this.health / this.maxHealth);

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-r, barY, barW, barH);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-r, barY, barW * pct, barH);
        }

        ctx.restore();
    }
}
