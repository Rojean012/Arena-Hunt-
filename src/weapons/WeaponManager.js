import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

export class WeaponManager {
    constructor() {
        this.weapons = {};
        this.projectiles = [];
        this.effects = [];
        
        this.addWeapon('swords');
    }

    reset() {
        this.weapons = {};
        this.projectiles = [];
        this.effects = [];
        this.addWeapon('swords');
    }

    addWeapon(weaponId) {
        if (this.weapons[weaponId]) {
            this.upgradeWeapon(weaponId);
            return;
        }

        const config = GameConfig.weapons[weaponId];
        if (!config) return;

        this.weapons[weaponId] = {
            id: weaponId,
            level: 1,
            config: { ...config },
            cooldownTimer: 0,
            angleOffset: 0
        };
    }

    upgradeWeapon(weaponId) {
        const w = this.weapons[weaponId];
        if (!w) return;

        w.level++;
        if (weaponId === 'swords') {
            w.config.count++;
            w.config.baseDamage += 6;
        } else if (weaponId === 'fireball') {
            w.config.count++;
            w.config.baseDamage += 12;
            w.config.cooldown = Math.max(20, w.config.cooldown - 5);
        } else if (weaponId === 'lightning') {
            w.config.count++;
            w.config.baseDamage += 15;
        } else if (weaponId === 'flameAura') {
            w.config.radius += 15;
            w.config.baseDamage += 4;
        } else if (weaponId === 'boomerang') {
            w.config.count++;
            w.config.baseDamage += 10;
        }
    }

    getWeaponLevel(weaponId) {
        return this.weapons[weaponId] ? this.weapons[weaponId].level : 0;
    }

    update(player, enemies, particles, onEnemyDefeated) {
        // 1. Orbiting Swords
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            w.angleOffset += w.config.spinSpeed;

            const swordCount = w.config.count;
            const radius = w.config.radius;

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = player.x + Math.cos(angle) * radius;
                const sy = player.y + Math.sin(angle) * radius;

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - sx, enemy.y - sy) < enemy.radius + 18) {
                        const killed = enemy.takeDamage(w.config.baseDamage * 0.12);
                        particles.spawnBlood(enemy.x, enemy.y, 2);
                        if (killed && onEnemyDefeated) {
                            onEnemyDefeated(enemy);
                        }
                    }
                });
            }
        }

        // 2. Flame Aura
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < w.config.radius + enemy.radius) {
                        const killed = enemy.takeDamage(w.config.baseDamage);
                        particles.spawnBlood(enemy.x, enemy.y, 3);
                        if (killed && onEnemyDefeated) {
                            onEnemyDefeated(enemy);
                        }
                    }
                });
            }
        }

        // 3. Fireball
        if (this.weapons['fireball']) {
            const w = this.weapons['fireball'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const target = this.findClosestEnemy(player, enemies, 500);
                if (target) {
                    soundManager.playShoot();
                    const angle = Math.atan2(target.y - player.y, target.x - player.x);
                    this.projectiles.push({
                        type: 'fireball',
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * w.config.speed,
                        vy: Math.sin(angle) * w.config.speed,
                        damage: w.config.baseDamage,
                        radius: 10,
                        life: 120,
                        dead: false
                    });
                }
            }
        }

        // 4. Lightning
        if (this.weapons['lightning']) {
            const w = this.weapons['lightning'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const targets = this.findRandomEnemies(player, enemies, w.config.count, w.config.range);
                targets.forEach(target => {
                    const killed = target.takeDamage(w.config.baseDamage);
                    particles.spawnMuzzleFlash(target.x, target.y, 0);
                    if (killed && onEnemyDefeated) {
                        onEnemyDefeated(target);
                    }
                    this.effects.push({
                        type: 'lightning',
                        x: target.x,
                        y: target.y,
                        life: 12,
                        dead: false
                    });
                });
            }
        }

        // 5. Update Projectiles
        this.projectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) p.dead = true;

            enemies.forEach(enemy => {
                if (enemy.dead || p.dead) return;
                if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + p.radius) {
                    const killed = enemy.takeDamage(p.damage);
                    p.dead = true;
                    particles.spawnBlood(enemy.x, enemy.y, 8);
                    if (killed && onEnemyDefeated) {
                        onEnemyDefeated(enemy);
                    }
                }
            });
        });

        this.projectiles = this.projectiles.filter(p => !p.dead);
        
        this.effects.forEach(e => {
            e.life--;
            if (e.life <= 0) e.dead = true;
        });
        this.effects = this.effects.filter(e => !e.dead);
    }

    findClosestEnemy(player, enemies, maxRange) {
        let closest = null;
        let minDist = maxRange;
        enemies.forEach(enemy => {
            if (enemy.dead) return;
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        });
        return closest;
    }

    findRandomEnemies(player, enemies, count, maxRange) {
        const inRange = enemies.filter(e => !e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= maxRange);
        if (inRange.length === 0) return [];
        const shuffled = [...inRange].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    render(ctx, camera, player, canvasWidth, canvasHeight) {
        const px = camera.getScreenX(player.x, canvasWidth);
        const py = camera.getScreenY(player.y, canvasHeight);

        // Flame Aura
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            ctx.save();
            ctx.beginPath();
            ctx.arc(px, py, w.config.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Orbiting Swords
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            const swordCount = w.config.count;
            const radius = w.config.radius;

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = camera.getScreenX(player.x + Math.cos(angle) * radius, canvasWidth);
                const sy = camera.getScreenY(player.y + Math.sin(angle) * radius, canvasHeight);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(angle + Math.PI / 2);

                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(-3, -20, 6, 25);
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(-6, 5, 12, 4);

                ctx.restore();
            }
        }

        // Fireball Projectiles
        this.projectiles.forEach(p => {
            const sx = camera.getScreenX(p.x, canvasWidth);
            const sy = camera.getScreenY(p.y, canvasHeight);

            ctx.save();
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(243, 156, 18, 0.4)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#e67e22';
            ctx.fill();
            ctx.restore();
        });

        // Lightning Effects
        this.effects.forEach(e => {
            if (e.type === 'lightning') {
                const sx = camera.getScreenX(e.x, canvasWidth);
                const sy = camera.getScreenY(e.y, canvasHeight);

                ctx.save();
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(sx, sy - 150);
                ctx.lineTo(sx - 10, sy - 90);
                ctx.lineTo(sx + 10, sy - 40);
                ctx.lineTo(sx, sy);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
}
