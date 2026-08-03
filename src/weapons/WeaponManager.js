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
                    data[i + 3] = 0; // Transparent background
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
            if (w.level % 3 === 0) w.config.count++;
            w.config.baseDamage += 15;
            w.config.cooldown = Math.max(15, w.config.cooldown - 4);
        } else if (weaponId === 'lightning') {
            w.config.count++;
            w.config.baseDamage += 18;
            w.config.cooldown = Math.max(25, w.config.cooldown - 4);
        } else if (weaponId === 'flameAura') {
            w.config.radius += 14;
            w.config.baseDamage += 6;
        } else if (weaponId === 'boomerang') {
            if (w.level % 2 === 0) w.config.count++;
            w.config.baseDamage += 14;
            w.config.cooldown = Math.max(25, w.config.cooldown - 3);
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

                if (Math.random() < 0.35) {
                    particles.spawnSwordSparkle(sx, sy);
                }

                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - sx, enemy.y - sy) < enemy.radius + 22) {
                        const killed = enemy.takeDamage(w.config.baseDamage * 0.12);
                        particles.spawnBlood(enemy.x, enemy.y, 2);
                        if (killed && onEnemyDefeated) {
                            onEnemyDefeated(enemy);
                        }
                    }
                });
            }
        }

        // 2. Rotating Flame Ring (No red background! Swirling fire particles!)
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            w.cooldownTimer++;
            this.flameRotationAngle += 0.03; // Smooth rotation

            // Spawn ambient fire embers along the rotating ring perimeter
            for (let k = 0; k < 2; k++) {
                const fa = this.flameRotationAngle + (Math.random() * Math.PI * 2);
                const fx = player.x + Math.cos(fa) * w.config.radius;
                const fy = player.y + Math.sin(fa) * w.config.radius;
                particles.spawnFlameEmbers(fx, fy);
            }

            if (w.cooldownTimer >= 8) {
                w.cooldownTimer = 0;
                enemies.forEach(enemy => {
                    if (enemy.dead) return;
                    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < w.config.radius + enemy.radius) {
                        const killed = enemy.takeDamage(w.config.baseDamage * 0.5);
                        particles.spawnBlood(enemy.x, enemy.y, 2);
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
                        radius: 16,
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
                    radius: 18,
                    spinAngle: 0,
                    returning: false,
                    life: 120,
                    dead: false
                });
            }
        }

        // 5. Furious Thunder Dragon Strikes
        if (this.weapons['lightning']) {
            const w = this.weapons['lightning'];
            w.cooldownTimer++;
            if (w.cooldownTimer >= 35) {
                w.cooldownTimer = 0;
                const targets = this.findRandomEnemies(player, enemies, w.config.count, w.config.range);
                targets.forEach(target => {
                    const killed = target.takeDamage(w.config.baseDamage);
                    particles.spawnMuzzleFlash(target.x, target.y, 0);
                    if (soundManager && soundManager.playShoot) soundManager.playShoot();

                    if (killed && onEnemyDefeated) {
                        onEnemyDefeated(target);
                    }
                    this.effects.push({
                        type: 'lightning',
                        x: target.x,
                        y: target.y,
                        life: 16,
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

        // 1. Rotating Flame Ring (No red background! Swirling 2D Fire Ring Image Asset!)
        if (this.weapons['flameAura']) {
            const w = this.weapons['flameAura'];
            ctx.save();

            const auraImg = weaponImages['flameAura'];
            if (auraImg && (auraImg.complete || auraImg.width)) {
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(this.flameRotationAngle);
                ctx.shadowColor = '#f97316';
                ctx.shadowBlur = 18;
                const dSize = w.config.radius * 2.2;
                ctx.drawImage(auraImg, -dSize / 2, -dSize / 2, dSize, dSize);
                ctx.restore();
            }

            ctx.restore();
        }

        // 2. Orbiting Jiuyou Spirit Swords with 2D Image Icon Asset
        if (this.weapons['swords']) {
            const w = this.weapons['swords'];
            const swordCount = w.config.count;
            const radius = w.config.radius;
            const swordImg = weaponImages['swords'];

            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
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
                const thunderImg = weaponImages['lightning'];

                ctx.save();
                ctx.shadowColor = 'rgba(250, 204, 21, 0.95)';
                ctx.shadowBlur = 24;

                // Blinding Electric Strike Paths
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(sx, sy - 220);
                ctx.lineTo(sx - 20, sy - 140);
                ctx.lineTo(sx + 20, sy - 70);
                ctx.lineTo(sx - 8, sy - 25);
                ctx.lineTo(sx, sy);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // 2D Furious Thunder Image Icon Burst
                if (thunderImg && (thunderImg.complete || thunderImg.width)) {
                    ctx.drawImage(thunderImg, sx - 35, sy - 35, 70, 70);
                }

                ctx.restore();
            }
        });
    }
}
