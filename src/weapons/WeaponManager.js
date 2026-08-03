import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload 2D In-Game Weapon Image Assets with Offscreen Background Removal
const weaponImages = {};

function loadWeaponImage(id, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, 256, 256);

            const imgData = ctx.getImageData(0, 0, 256, 256);
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

                if ((r > 235 && g > 235 && b > 235) || (r < 25 && g < 25 && b < 25) || diff < 28) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            weaponImages[id] = canvas;
        } catch (e) {
            weaponImages[id] = img;
        }
    };
}

loadWeaponImage('swords', '/assets/images/sword_icon.jpg');
loadWeaponImage('fireball', '/assets/images/fireball_icon.jpg');
loadWeaponImage('lightning', '/assets/images/thunder_icon.jpg');
loadWeaponImage('flameAura', '/assets/images/flame_ring_icon.jpg');
loadWeaponImage('boomerang', '/assets/images/boomerang_icon.jpg');

export class WeaponManager {
    constructor() {
        this.weapons = {};
        this.projectiles = [];
        this.effects = [];
        this.flameRotationAngle = 0;
        
        this.addWeapon('swords');
    }

    reset() {
        this.weapons = {};
        this.projectiles = [];
        this.effects = [];
        this.flameRotationAngle = 0;
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
        if (!w || w.level >= 10) return;

        w.level++;
        if (weaponId === 'swords') {
            if (w.level % 2 === 0) w.config.count++;
            w.config.baseDamage += 8;
            w.config.spinSpeed += 0.005;
        } else if (weaponId === 'fireball') {
            w.config.baseDamage += 15;
            w.config.cooldown = Math.max(25, w.config.cooldown - 5);
        } else if (weaponId === 'lightning') {
            w.config.baseDamage += 20;
            w.config.count = Math.min(6, Math.floor(1 + w.level / 2));
        } else if (weaponId === 'flameAura') {
            w.config.baseDamage += 6;
            w.config.radius += 12;
        } else if (weaponId === 'boomerang') {
            w.config.baseDamage += 10;
            w.config.count = Math.min(4, Math.floor(1 + w.level / 3));
        }
    }

    getWeaponLevel(weaponId) {
        return this.weapons[weaponId] ? this.weapons[weaponId].level : 0;
    }

    update(player, enemies, particles, onEnemyDefeated) {
        if (!player) return;

        // 1. Orbiting Spirit Swords
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            w.angleOffset += w.config.spinSpeed;

            const swordCount = w.config.count;
            const radius = w.config.radius;

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = player.x + Math.cos(angle) * radius;
                const sy = player.y + Math.sin(angle) * radius;

                if (Math.random() < 0.3 && particles) {
                    particles.spawnSwordSparkle(sx, sy);
                }

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - sx, enemy.y - sy) < enemy.radius + 22) {
                        const killed = enemy.takeDamage(w.config.baseDamage * 0.12);
                        if (killed && onEnemyDefeated) {
                            onEnemyDefeated(enemy);
                        }
                    }
                });
            }
        }

        // 2. Arcane Fireballs
        if (this.weapons['fireball']) {
            const w = this.weapons['fireball'];
            w.cooldownTimer++;

            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                let nearest = null;
                let minDist = 450;

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                    if (d < minDist) {
                        minDist = d;
                        nearest = enemy;
                    }
                });

                if (nearest) {
                    const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                    this.projectiles.push({
                        type: 'fireball',
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * w.config.speed,
                        vy: Math.sin(angle) * w.config.speed,
                        damage: w.config.baseDamage,
                        splashRadius: w.config.splashRadius,
                        radius: 14,
                        life: 120
                    });

                    if (soundManager && soundManager.playShoot) soundManager.playShoot();
                }
            }
        }

        // 3. Thunder Bolt Strikes
        if (this.weapons['lightning']) {
            const w = this.weapons['lightning'];
            w.cooldownTimer++;

            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const inRange = enemies.filter(e => !e.dead && Math.hypot(e.x - player.x, e.y - player.y) < w.config.range);

                if (inRange.length > 0) {
                    const targets = inRange.sort(() => Math.random() - 0.5).slice(0, w.config.count);
                    targets.forEach(t => {
                        this.effects.push({
                            type: 'lightning',
                            x: t.x,
                            y: t.y,
                            timer: 16
                        });

                        if (particles) particles.spawnThunderSparks(t.x, t.y);

                        const killed = t.takeDamage(w.config.baseDamage);
                        if (killed && onEnemyDefeated) onEnemyDefeated(t);
                    });

                    if (soundManager && soundManager.playShoot) soundManager.playShoot();
                }
            }
        }

        // 4. Rotating Flame Ring
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            this.flameRotationAngle += 0.05;

            w.cooldownTimer++;
            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const radius = w.config.radius;

                if (particles) {
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        particles.spawnFlameEmbers(player.x + Math.cos(a) * radius, player.y + Math.sin(a) * radius);
                    }
                }

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < radius + enemy.radius) {
                        const killed = enemy.takeDamage(w.config.baseDamage);
                        if (killed && onEnemyDefeated) onEnemyDefeated(enemy);
                    }
                });
            }
        }

        // 5. Flying Boomerang
        if (this.weapons['boomerang']) {
            const w = this.weapons['boomerang'];
            w.cooldownTimer++;

            if (w.cooldownTimer >= w.config.cooldown) {
                w.cooldownTimer = 0;
                const angle = Math.random() * Math.PI * 2;
                this.projectiles.push({
                    type: 'boomerang',
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * w.config.speed,
                    vy: Math.sin(angle) * w.config.speed,
                    startX: player.x,
                    startY: player.y,
                    damage: w.config.baseDamage,
                    radius: 12,
                    returning: false,
                    spinAngle: 0,
                    life: 180
                });

                if (soundManager && soundManager.playShoot) soundManager.playShoot();
            }
        }

        // 6. Update Flying Projectiles
        this.updateProjectiles(player, enemies, particles, onEnemyDefeated);
    }

    updateProjectiles(player, enemies, particles, onEnemyDefeated) {
        this.projectiles.forEach(p => {
            p.life--;
            if (p.type === 'boomerang') {
                p.spinAngle += 0.25;

                if (!p.returning) {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (Math.hypot(p.x - p.startX, p.y - p.startY) > 320 || p.life < 100) {
                        p.returning = true;
                    }
                } else {
                    const dx = player.x - p.x;
                    const dy = player.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 20) {
                        p.dead = true;
                    } else {
                        p.x += (dx / dist) * 9;
                        p.y += (dy / dist) * 9;
                    }
                }

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + p.radius) {
                        const killed = enemy.takeDamage(p.damage);
                        if (killed && onEnemyDefeated) onEnemyDefeated(enemy);
                        if (particles) particles.spawnSwordSparkle(p.x, p.y);
                    }
                });
            } else if (p.type === 'fireball') {
                p.x += p.vx;
                p.y += p.vy;

                let hit = false;
                enemies.forEach(enemy => {
                    if (enemy.dead || hit) return;
                    if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + p.radius) {
                        hit = true;
                    }
                });

                if (hit || p.life <= 0) {
                    p.dead = true;
                    if (particles) particles.spawnExplosion(p.x, p.y);

                    enemies.forEach(enemy => {
                        if (enemy.dead) return;
                        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < p.splashRadius + enemy.radius) {
                            const killed = enemy.takeDamage(p.damage);
                            if (killed && onEnemyDefeated) onEnemyDefeated(enemy);
                        }
                    });
                }
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.dead && p.life > 0);

        this.effects.forEach(e => {
            e.timer--;
        });
        this.effects = this.effects.filter(e => e.timer > 0);
    }

    render(ctx, camera, player, canvasWidth, canvasHeight) {
        if (!player) return;

        const px = camera.getScreenX(player.x, canvasWidth);
        const py = camera.getScreenY(player.y, canvasHeight);

        // 1. Rotating Flame Ring
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            const auraImg = weaponImages['flameAura'];
            const radius = w.config.radius;
            const dSize = radius * 2.4;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(this.flameRotationAngle);

            if (auraImg && (auraImg.complete || auraImg.width)) {
                ctx.drawImage(auraImg, -dSize / 2, -dSize / 2, dSize, dSize);
            } else {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 2. Orbiting Jiuyou Spirit Swords (WITHOUT RING LINE!)
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            const swordCount = w.config.count;
            const radius = w.config.radius;
            const swordImg = weaponImages['swords'];

            for (let i = 0; i < swordCount; i++) {
                const angle = w.angleOffset + (i * Math.PI * 2) / swordCount;
                const sx = camera.getScreenX(player.x + Math.cos(angle) * radius, canvasWidth);
                const sy = camera.getScreenY(player.y + Math.sin(angle) * radius, canvasHeight);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(angle + Math.PI / 2);

                if (swordImg && (swordImg.complete || swordImg.width)) {
                    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
                    ctx.shadowBlur = 12;
                    ctx.drawImage(swordImg, -22, -30, 44, 60);
                } else {
                    ctx.fillStyle = '#0284c7';
                    ctx.fillRect(-4, -24, 8, 30);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(-2, -24, 4, 30);
                }

                ctx.restore();
            }
        }

        // 3. Projectiles (Fireballs & Boomerangs)
        this.projectiles.forEach(p => {
            const sx = camera.getScreenX(p.x, canvasWidth);
            const sy = camera.getScreenY(p.y, canvasHeight);

            ctx.save();
            ctx.translate(sx, sy);

            const pImg = weaponImages[p.type];

            if (p.type === 'boomerang') {
                ctx.rotate(p.spinAngle);
                ctx.shadowColor = 'rgba(0, 255, 255, 0.9)';
                ctx.shadowBlur = 16;

                if (pImg && (pImg.complete || pImg.width)) {
                    ctx.drawImage(pImg, -p.radius * 1.3, -p.radius * 1.3, p.radius * 2.6, p.radius * 2.6);
                } else {
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius, 0.2, Math.PI * 1.5);
                    ctx.stroke();
                }
            } else if (p.type === 'fireball') {
                ctx.shadowColor = 'rgba(249, 115, 22, 0.95)';
                ctx.shadowBlur = 18;

                if (pImg && (pImg.complete || pImg.width)) {
                    ctx.drawImage(pImg, -p.radius * 1.4, -p.radius * 1.4, p.radius * 2.8, p.radius * 2.8);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#f97316';
                    ctx.fill();
                }
            }

            ctx.restore();
        });

        // 4. Furious Thunder Dragon Strikes
        this.effects.forEach(e => {
            if (e.type === 'lightning') {
                const sx = camera.getScreenX(e.x, canvasWidth);
                const sy = camera.getScreenY(e.y, canvasHeight);

                ctx.save();
                ctx.strokeStyle = '#fef08a';
                ctx.shadowColor = '#eab308';
                ctx.shadowBlur = 24;
                ctx.lineWidth = 4;

                ctx.beginPath();
                ctx.moveTo(sx + (Math.random() - 0.5) * 30, sy - 300);
                ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy - 150);
                ctx.lineTo(sx, sy);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx, sy, 20 * (e.timer / 16), 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        });
    }
}
