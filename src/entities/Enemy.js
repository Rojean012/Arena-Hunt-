import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

export class Enemy extends Entity {
    constructor(x, y, type = 'slime') {
        const config = GameConfig.enemies[type] || GameConfig.enemies.slime;
        super(x, y, config.radius, config.color);

        this.type = type;
        this.config = config;
        this.speed = config.speed;
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.gemType = config.gemType || 'blue';
        this.angle = 0;

        this.facingRight = true;
        this.animTimer = Math.random() * 100;
        this.shootTimer = 0;
        this.chargeState = 'idle';
        this.chargeTimer = 0;
        this.chargeVector = { x: 0, y: 0 };
    }

    update(playerX, playerY, enemyProjectiles) {
        this.animTimer += 0.08;
        const distToPlayer = Math.hypot(playerX - this.x, playerY - this.y);

        this.angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.facingRight = (playerX >= this.x);

        if (this.type === 'slime' || this.type === 'miniSlime') {
            const hopCycle = Math.sin(this.animTimer * 2);
            if (hopCycle > 0) {
                this.vx = Math.cos(this.angle) * this.speed * 1.5;
                this.vy = Math.sin(this.angle) * this.speed * 1.5;
            } else {
                this.vx *= 0.8;
                this.vy *= 0.8;
            }

        } else if (this.type === 'goblin') {
            const preferredDist = 260;
            if (distToPlayer < preferredDist - 30) {
                this.vx = -Math.cos(this.angle) * this.speed;
                this.vy = -Math.sin(this.angle) * this.speed;
            } else if (distToPlayer > preferredDist + 30) {
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            } else {
                const tangent = this.angle + Math.PI / 2;
                this.vx = Math.cos(tangent) * this.speed;
                this.vy = Math.sin(tangent) * this.speed;
            }

            this.shootTimer++;
            if (this.shootTimer >= 110 && distToPlayer < 450) {
                this.shootTimer = 0;
                if (enemyProjectiles) {
                    enemyProjectiles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(this.angle) * 6,
                        vy: Math.sin(this.angle) * 6,
                        damage: this.damage,
                        radius: 5,
                        color: '#e74c3c',
                        dead: false
                    });
                }
            }

        } else if (this.type === 'ghost') {
            const flankAngle = this.angle + Math.sin(this.animTimer * 1.5) * 0.8;
            this.vx = Math.cos(flankAngle) * this.speed;
            this.vy = Math.sin(flankAngle) * this.speed;

        } else if (this.type === 'bear') {
            if (this.chargeState === 'idle') {
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
                this.chargeTimer++;
                if (this.chargeTimer >= 200 && distToPlayer < 350) {
                    this.chargeState = 'telegraph';
                    this.chargeTimer = 0;
                    this.chargeVector = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
                }
            } else if (this.chargeState === 'telegraph') {
                this.vx = 0;
                this.vy = 0;
                this.chargeTimer++;
                if (this.chargeTimer >= 35) {
                    this.chargeState = 'charging';
                    this.chargeTimer = 0;
                }
            } else if (this.chargeState === 'charging') {
                this.vx = this.chargeVector.x * this.speed * 3.2;
                this.vy = this.chargeVector.y * this.speed * 3.2;
                this.chargeTimer++;
                if (this.chargeTimer >= 30) {
                    this.chargeState = 'idle';
                    this.chargeTimer = 0;
                }
            }
        }

        super.update();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            soundManager.playEnemyDeath();
            return true;
        }
        return false;
    }

    render(ctx, screenX, screenY) {
        const r = this.radius;

        // Draw Charge Indicator Line
        if (this.chargeState === 'telegraph') {
            ctx.save();
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + this.chargeVector.x * 200, screenY + this.chargeVector.y * 200);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        const headR = r * 0.5;
        const bodyW = r * 1.2;
        const bodyH = r * 0.9;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, 4, bodyW / 2 + 2, bodyH / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();

        // Original Git Detailed Mutant Enemy Sprite Architecture
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#5c0e0e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Body veins
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(i * bodyW * 0.3, -bodyH * 0.2);
            ctx.lineTo(i * bodyW * 0.45, bodyH * 0.3);
            ctx.stroke();
        }

        // Side Claws / Spikes
        ctx.fillStyle = '#5c0e0e';
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const sy = -bodyH * 0.3 + i * bodyH * 0.3;
                ctx.beginPath();
                ctx.moveTo(side * bodyW / 2, sy);
                ctx.lineTo(side * (bodyW / 2 + r * 0.4), sy + 3);
                ctx.lineTo(side * bodyW / 2, sy + 6);
                ctx.fill();
            }
        }

        // Head
        const headY = -r * 0.35;
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fillStyle = '#a83232';
        ctx.fill();
        ctx.strokeStyle = '#7a1f1f';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Angry Glowing Eyes with Pupils & Glow Aura
        const eyeDist = headR * 0.35;
        const eyeR = 3;
        for (let side = -1; side <= 1; side += 2) {
            const ex = side * eyeDist;
            const ey = headY - 1;
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
            ctx.fillStyle = '#ffff00';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        }

        // Mouth & Teeth
        ctx.fillStyle = '#3a0a0a';
        ctx.beginPath();
        ctx.arc(0, headY + headR * 0.4, headR * 0.35, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ecf0f1';
        for (let i = -1; i <= 1; i += 0.67) {
            const tx = i * headR * 0.2;
            ctx.fillRect(tx - 1.5, headY + headR * 0.3, 3, 4);
        }

        // Horns
        ctx.fillStyle = '#4a0e0e';
        for (let side = -1; side <= 1; side += 2) {
            ctx.beginPath();
            ctx.moveTo(side * headR * 0.6, headY - headR * 0.3);
            ctx.lineTo(side * headR * 1.0, headY - headR * 0.9);
            ctx.lineTo(side * headR * 0.4, headY - headR * 0.5);
            ctx.fill();
        }

        // Health bar if damaged
        if (this.health < this.maxHealth) {
            const barW = r * 2;
            const barH = 4;
            const barX = -barW / 2;
            const barY = -r - 10;
            const pct = this.health / this.maxHealth;

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(barX, barY, barW * pct, barH);
        }

        ctx.restore();
    }
}
