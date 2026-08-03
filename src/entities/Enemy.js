import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

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
    }

    update(playerX, playerY, projectiles) {
        this.animTimer += 0.12;
        if (this.hitFlash > 0) this.hitFlash--;

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
        ctx.scale(squishX, squishY);

        // Charger Red Telegraph Arc
        if (this.type === 'bear' && this.isCharging) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render High-Quality 2D Procedural Artwork per Enemy Type
        if (this.type === 'slime' || this.type === 'miniSlime') {
            // 1. Cute Gel Slime
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : (this.type === 'miniSlime' ? '#2ecc71' : '#10b981');
            ctx.fill();

            // Inner Core
            ctx.beginPath();
            ctx.arc(-2, -2, r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();

            // Cute Eyes
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.1, r * 0.18, 0, Math.PI * 2);
            ctx.arc(r * 0.3, -r * 0.1, r * 0.18, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'goblin') {
            // 2. Goblin Archer Warrior
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#15803d';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Pointed Ears
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.moveTo(-r, -r * 0.3);
            ctx.lineTo(-r * 1.5, -r * 0.8);
            ctx.lineTo(-r * 0.7, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(r, -r * 0.3);
            ctx.lineTo(r * 1.5, -r * 0.8);
            ctx.lineTo(r * 0.7, 0);
            ctx.fill();

            // Glowing Red Eyes & Leather Hood
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
            ctx.arc(r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Wooden Bow
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(r * 0.6, 0, r * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();
        } else if (this.type === 'ghost') {
            // 3. Ethereal Phantom Specter
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : 'rgba(168, 85, 247, 0.85)';
            ctx.beginPath();
            ctx.arc(0, -2, r, 0, Math.PI * 2);
            ctx.fill();

            // Spectral Tail Wisps
            ctx.beginPath();
            ctx.moveTo(-r, 0);
            ctx.quadraticCurveTo(-r * 0.5, r * 1.4, 0, r * 0.8);
            ctx.quadraticCurveTo(r * 0.5, r * 1.4, r, 0);
            ctx.fill();

            // Glowing Yellow Spectral Eyes
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(-r * 0.35, -r * 0.3, 3.5, 0, Math.PI * 2);
            ctx.arc(r * 0.35, -r * 0.3, 3.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bear') {
            // 4. Orc Berserker Boss
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#991b1b';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Spiked Shoulders & Tusks
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(-r * 0.5, r * 0.2);
            ctx.lineTo(-r * 0.7, -r * 0.4);
            ctx.lineTo(-r * 0.2, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(r * 0.5, r * 0.2);
            ctx.lineTo(r * 0.7, -r * 0.4);
            ctx.lineTo(r * 0.2, 0);
            ctx.fill();

            // Glowing Red Berserk Eyes
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.2, 4, 0, Math.PI * 2);
            ctx.arc(r * 0.3, -r * 0.2, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'snake') {
            // 5. Coiled Viper Serpent
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#7e22ce';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Serpent Scales Pattern
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.5);
            ctx.stroke();

            // Glowing Eyes & Split Tongue
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
            ctx.arc(r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, r * 0.3);
            ctx.lineTo(-3, r * 0.8);
            ctx.moveTo(0, r * 0.3);
            ctx.lineTo(3, r * 0.8);
            ctx.stroke();
        }

        // Hit Flash Tint
        if (this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Monster Health Bar
        if (this.health < this.maxHealth) {
            const barW = r * 2;
            const barH = 4;
            const barY = -r - 12;
            const pct = Math.max(0, this.health / this.maxHealth);

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-r, barY, barW, barH);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-r, barY, barW * pct, barH);
        }

        ctx.restore();
    }
}
