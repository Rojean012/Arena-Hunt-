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
        // 1. Orbiting Jiuyou Swords
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            w.angleOffset += w.config.spinSpeed;

            const swordCount = w.config.count;
            const radius = w.config.radius;

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = player.x + Math.cos(angle) * radius;
                const sy = player.y + Math.sin(angle) * radius;

                // Spawn Xianxia Qi sparkles along sword trail
                if (Math.random() < 0.3) {
                    particles.spawnSwordSparkle(sx, sy);
                }

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - sx, enemy.y - sy) < enemy.radius + 20) {
                        const killed = enemy.takeDamage(w.config.baseDamage * 0.12);
                        particles.spawnBlood(enemy.x, enemy.y, 2);
                        if (killed && onEnemyDefeated) {
                            onEnemyDefeated(enemy);
                        }
                    }
                });
            }
        }

        // 2. Flame Aura Ring
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            w.cooldownTimer++;

            // Spawn ambient rising flame embers around player
            if (Math.random() < 0.4) {
                const fa = Math.random() * Math.PI * 2;
                const fx = player.x + Math.cos(fa) * (w.config.radius * Math.random());
                const fy = player.y + Math.sin(fa) * (w.config.radius * Math.random());
                particles.spawnFlameEmbers(fx, fy);
            }

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

        // 3. Arcane Fireball
        if (this.weapons['fireball']) {
            const w = this.weapons['fireball'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const target = this.findClosestEnemy(player, enemies, 500);
                if (target) {
                    if (soundManager && soundManager.playShoot) {
                        soundManager.playShoot();
                    }
                    const angle = Math.atan2(target.y - player.y, target.x - player.x);
                    this.projectiles.push({
                        type: 'fireball',
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * w.config.speed,
                        vy: Math.sin(angle) * w.config.speed,
                        damage: w.config.baseDamage,
                        radius: 14,
                        life: 120,
                        dead: false
                    });
                }
            }
        }

        // 4. Flying Boomerang
        if (this.weapons['boomerang']) {
            const w = this.weapons['boomerang'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const target = this.findClosestEnemy(player, enemies, 450);
                const angle = target ? Math.atan2(target.y - player.y, target.x - player.x) : Math.random() * Math.PI * 2;
                
                this.projectiles.push({
                    type: 'boomerang',
                    x: player.x,
                    y: player.y,
                    startX: player.x,
                    startY: player.y,
                    vx: Math.cos(angle) * w.config.speed,
                    vy: Math.sin(angle) * w.config.speed,
                    damage: w.config.baseDamage,
                    radius: 16,
                    spinAngle: 0,
                    returning: false,
                    life: 120,
                    dead: false
                });
            }
        }

        // 5. Thunder Bolt
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
                        life: 14,
                        dead: false
                    });
                });
            }
        }

        // Update Projectiles (Fireballs & Boomerangs)
        this.projectiles.forEach(p => {
            if (p.type === 'boomerang') {
                p.spinAngle += 0.28;
                particles.spawnStardust(p.x, p.y);

                if (!p.returning) {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (Math.hypot(p.x - p.startX, p.y - p.startY) > 290) {
                        p.returning = true;
                    }
                } else {
                    const angle = Math.atan2(player.y - p.y, player.x - p.x);
                    const returnSpeed = (this.weapons['boomerang'] && this.weapons['boomerang'].config) 
                        ? this.weapons['boomerang'].config.speed * 1.25 
                        : 9.5;
                    p.x += Math.cos(angle) * returnSpeed;
                    p.y += Math.sin(angle) * returnSpeed;
                    if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 12) {
                        p.dead = true;
                    }
                }
            } else if (p.type === 'fireball') {
                p.x += p.vx;
                p.y += p.vy;
                if (Math.random() < 0.5) {
                    particles.spawnFlameEmbers(p.x, p.y);
                }
            }

            p.life--;
            if (p.life <= 0) p.dead = true;

            enemies.forEach(enemy => {
                if (enemy.dead || p.dead) return;
                if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + p.radius) {
                    const killed = enemy.takeDamage(p.damage);
                    if (p.type === 'fireball') {
                        p.dead = true;
                        particles.spawnExplosion(p.x, p.y);
                    }
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

        // 1. High-Definition Flame Aura Ring
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            ctx.save();

            // Outer Pulsating Fire Halo Gradient
            const auraGrad = ctx.createRadialGradient(px, py, w.config.radius * 0.4, px, py, w.config.radius);
            auraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
            auraGrad.addColorStop(0.7, 'rgba(249, 115, 22, 0.25)');
            auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0.40)');

            ctx.beginPath();
            ctx.arc(px, py, w.config.radius, 0, Math.PI * 2);
            ctx.fillStyle = auraGrad;
            ctx.fill();

            // Glowing Outer Ring Stroke
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, w.config.radius - 4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // 2. High-Definition Orbiting Jiuyou Spirit Swords
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            const swordCount = w.config.count;
            const radius = w.config.radius;

            // Draw Orbit Qi Arc Ring
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = camera.getScreenX(player.x + Math.cos(angle) * radius, canvasWidth);
                const sy = camera.getScreenY(player.y + Math.sin(angle) * radius, canvasHeight);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(angle + Math.PI / 2);

                // Blade Outer Glow
                ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
                ctx.fillRect(-6, -26, 12, 34);

                // Dual-Tone Energy Blade
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(-4, -24, 8, 30);

                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(-2, -24, 4, 30);

                // Pure White Core Line
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-1, -22, 2, 28);

                // Gold Xianxia Crossguard & Hilt
                ctx.fillStyle = '#facc15';
                ctx.fillRect(-9, 4, 18, 5);
                ctx.fillStyle = '#eab308';
                ctx.fillRect(-3, 9, 6, 8);

                ctx.restore();
            }
        }

        // 3. High-Definition Projectiles (Arcane Fireballs & Flying Boomerangs)
        this.projectiles.forEach(p => {
            const sx = camera.getScreenX(p.x, canvasWidth);
            const sy = camera.getScreenY(p.y, canvasHeight);

            ctx.save();
            ctx.translate(sx, sy);

            if (p.type === 'boomerang') {
                ctx.rotate(p.spinAngle);

                // Dual Crescent Energy Blades
                ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
                ctx.shadowBlur = 12;

                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0.2, Math.PI * 1.5);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0.2, Math.PI * 1.5);
                ctx.stroke();
            } else if (p.type === 'fireball') {
                // Outer Solar Glow
                ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
                ctx.shadowBlur = 16;

                ctx.beginPath();
                ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
                ctx.fill();

                // Fireball Core Gradient
                const fbGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, p.radius);
                fbGrad.addColorStop(0, '#fef08a');
                fbGrad.addColorStop(0.5, '#f97316');
                fbGrad.addColorStop(1, '#dc2626');

                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = fbGrad;
                ctx.fill();
            }

            ctx.restore();
        });

        // 4. High-Definition Lightning Bolts
        this.effects.forEach(e => {
            if (e.type === 'lightning') {
                const sx = camera.getScreenX(e.x, canvasWidth);
                const sy = camera.getScreenY(e.y, canvasHeight);

                ctx.save();

                ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
                ctx.shadowBlur = 18;

                // Multi-Branch Electric Bolt Strike
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(sx, sy - 180);
                ctx.lineTo(sx - 15, sy - 120);
                ctx.lineTo(sx + 15, sy - 60);
                ctx.lineTo(sx - 5, sy - 20);
                ctx.lineTo(sx, sy);
                ctx.stroke();

                // Inner White High-Voltage Core
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx, sy - 180);
                ctx.lineTo(sx - 15, sy - 120);
                ctx.lineTo(sx + 15, sy - 60);
                ctx.lineTo(sx - 5, sy - 20);
                ctx.lineTo(sx, sy);
                ctx.stroke();

                // Ground Impact Energy Ring
                ctx.beginPath();
                ctx.arc(sx, sy, 22, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
                ctx.fill();

                ctx.restore();
            }
        });
    }
}
