import { Engine } from '../core/Engine.js';
import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';
import { Player } from '../entities/Player.js';
import { Camera } from '../core/Camera.js';
import { Renderer } from '../rendering/Renderer.js';
import { UIRenderer } from '../rendering/UIRenderer.js';
import { SpawnerSystem } from '../systems/SpawnerSystem.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CardUpgradeModal } from '../ui/CardUpgradeModal.js';
import { StorageSystem } from '../systems/StorageSystem.js';
import { PlatformSDK } from '../sdk/PlatformSDK.js';

// Preload 2D Enemy Projectile Assets with Fast Offscreen Canvases
const enemyProjImages = {};

function loadEnemyProjImage(id, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, 64, 64);

            const imgData = ctx.getImageData(0, 0, 64, 64);
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
                if ((r > 235 && g > 235 && b > 235) || (r < 25 && g < 25 && b < 25) || (dr < 25 && dg < 25 && db < 25)) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            enemyProjImages[id] = canvas;
        } catch (e) {
            enemyProjImages[id] = img;
        }
    };
}

loadEnemyProjImage('spiderWeb', '/assets/images/spider_web_proj.jpg');
loadEnemyProjImage('goblinArrow', '/assets/images/goblin_arrow_proj.jpg');

export class GameScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        
        this.player = new Player(0, 0); // Player centered at world origin (0, 0)
        this.camera = new Camera();
        this.renderer = new Renderer();
        this.uiRenderer = new UIRenderer();
        this.spawner = new SpawnerSystem();
        this.weaponManager = new WeaponManager();
        this.levelManager = new LevelManager();
        this.particles = new ParticleSystem();
        this.collision = new CollisionSystem();
        this.upgradeModal = new CardUpgradeModal();

        this.score = 0;
        this.enemiesDefeated = 0;
        this.isGameOver = false;

        this.enemyProjectiles = [];
    }

    enter() {
        this.player.reset(0, 0); // Reset player to center (0, 0)
        this.camera.x = 0;
        this.camera.y = 0;
        this.spawner.reset();
        this.weaponManager.reset();
        this.levelManager.reset();
        this.particles.clear();
        this.enemyProjectiles = [];

        this.score = 0;
        this.enemiesDefeated = 0;
        this.isGameOver = false;

        if (soundManager && soundManager.playMusic) {
            soundManager.playMusic();
        }
    }

    update() {
        if (this.isGameOver) return;

        // Upgrade Modal Pause Gate
        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.update(
                this.levelManager,
                this.weaponManager,
                this.player,
                Engine.width,
                Engine.height
            );
            return;
        }

        // Pause Key Check
        if (input.keys['p'] || input.keys['escape']) {
            input.keys['p'] = false;
            input.keys['escape'] = false;
            this.sceneManager.push('pause');
            return;
        }

        // 1. Player Movement & Camera Tracking
        const movement = input.getMovementVector();
        this.player.update(movement, this.spawner.bounds);
        this.camera.update(this.player.x, this.player.y);

        // 2. Enemy Spawning & AI Updates
        this.spawner.update(this.player.x, this.player.y, this.enemyProjectiles);

        // 3. Enemy AI Motion
        this.spawner.enemies.forEach(enemy => {
            enemy.update(this.player.x, this.player.y, this.enemyProjectiles);
        });

        // 4. Weapons & Player Projectiles
        this.weaponManager.update(
            this.player,
            this.spawner.enemies,
            this.particles,
            (defeatedEnemy) => this.onEnemyDefeated(defeatedEnemy)
        );

        // 5. Update Enemy Projectiles & Attacks
        this.updateEnemyProjectiles();

        // 6. Particle System Update
        this.particles.update();

        // 7. Collisions & Pickups
        this.collision.update(
            this.player,
            this.spawner.enemies,
            this.spawner.gems,
            this.spawner.coins,
            this.enemyProjectiles,
            this.particles,
            (xpAmount) => {
                const leveledUp = this.player.addXP(xpAmount);
                if (leveledUp) {
                    this.levelManager.triggerLevelUp(this.player, this.weaponManager);
                }
            },
            (coinAmount) => {
                this.player.addCoins(coinAmount);
            },
            () => {
                this.onPlayerDeath();
            }
        );
    }

    updateEnemyProjectiles() {
        this.enemyProjectiles.forEach(p => {
            if (p.type === 'bloodPillar') {
                p.timer--;
                if (p.timer === 20) {
                    this.particles.spawnExplosion(p.x, p.y);
                    if (soundManager && soundManager.playEnemyDefeat) soundManager.playEnemyDefeat();
                }
                if (p.timer <= 0) p.dead = true;
            } else if (p.type === 'golemSlam') {
                p.currentRadius += 6;
                if (p.currentRadius >= p.maxRadius) p.dead = true;
            } else {
                p.x += p.vx;
                p.y += p.vy;

                if (p.type === 'spiderWeb') {
                    if (Math.random() < 0.4) this.particles.spawnSwordSparkle(p.x, p.y);
                } else if (p.type === 'foxfire') {
                    if (Math.random() < 0.5) this.particles.spawnFlameEmbers(p.x, p.y);
                } else if (p.type === 'frostBreath') {
                    if (Math.random() < 0.5) this.particles.spawnStardust(p.x, p.y);
                }

                if (Math.hypot(p.x - this.player.x, p.y - this.player.y) > 900) {
                    p.dead = true;
                }
            }
        });

        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.dead);
    }

    onEnemyDefeated(enemy) {
        this.score += enemy.scoreValue;
        this.enemiesDefeated++;
        this.spawner.spawnRewards(enemy.x, enemy.y, enemy.type);
    }

    onPlayerDeath() {
        this.isGameOver = true;
        StorageSystem.saveHighScore(this.score);
        PlatformSDK.submitScore(this.score);

        if (soundManager && soundManager.playGameOver) {
            soundManager.playGameOver();
        }

        this.sceneManager.change('gameOver', {
            score: this.score,
            enemiesDefeated: this.enemiesDefeated,
            coinsCollected: this.player.coins,
            wave: this.spawner.currentWave
        });
    }

    render(ctx) {
        // 1. World & Entities Rendering
        this.renderer.render(
            ctx,
            this.camera,
            this.player,
            this.spawner.enemies,
            this.spawner.gems,
            this.spawner.coins,
            this.weaponManager,
            this.particles,
            Engine.width,
            Engine.height
        );

        // 2. Custom Enemy Projectile & Attack Rendering
        this.renderEnemyProjectiles(ctx);

        // 3. UI Overlay (HUD, HP, XP, Level, Wave Banner)
        this.uiRenderer.render(
            ctx,
            this.player,
            this.score,
            this.spawner.currentWave,
            this.spawner.waveTimer,
            this.spawner.milestoneNoticeTimer,
            this.spawner.milestoneTitle,
            Engine.width,
            Engine.height,
            this.levelManager,
            this.weaponManager,
            this.spawner
        );

        // 4. Upgrade Modal Screen (if leveling up)
        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.render(
                ctx,
                this.levelManager,
                Engine.width,
                Engine.height
            );
        }
    }

    renderEnemyProjectiles(ctx) {
        this.enemyProjectiles.forEach(p => {
            const sx = this.camera.getScreenX(p.x, Engine.width);
            const sy = this.camera.getScreenY(p.y, Engine.height);

            ctx.save();
            ctx.translate(sx, sy);

            if (p.type === 'bloodPillar') {
                ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-p.radius, 0); ctx.lineTo(p.radius, 0);
                ctx.moveTo(0, -p.radius); ctx.lineTo(0, p.radius);
                ctx.stroke();

                if (p.timer > 20) {
                    const meteorY = -((p.timer - 20) * 12);
                    ctx.save();
                    ctx.translate(0, meteorY);
                    ctx.fillStyle = '#b91c1c';
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 16;
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            } else if (p.type === 'golemSlam') {
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, p.currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'spiderWeb') {
                const webImg = enemyProjImages['spiderWeb'];
                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 10;
                if (webImg && (webImg.complete || webImg.width)) {
                    ctx.drawImage(webImg, -16, -16, 32, 32);
                } else {
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
                }
            } else if (p.type === 'goblinArrow' || p.color === '#e67e22') {
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);
                const arrowImg = enemyProjImages['goblinArrow'];
                if (arrowImg && (arrowImg.complete || arrowImg.width)) {
                    ctx.drawImage(arrowImg, -14, -14, 28, 28);
                } else {
                    ctx.fillStyle = '#e67e22';
                    ctx.fillRect(-12, -2, 24, 4);
                }
            } else {
                ctx.fillStyle = p.color || '#ef4444';
                ctx.shadowColor = p.color || '#ef4444';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius || 6, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }
}
