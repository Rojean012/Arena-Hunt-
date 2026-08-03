import { Player } from '../entities/Player.js';
import { Gem } from '../entities/Gem.js';
import { Coin } from '../entities/Coin.js';
import { Enemy } from '../entities/Enemy.js';
import { Camera } from '../core/Camera.js';
import { input } from '../core/Input.js';
import { SpawnerSystem } from '../systems/SpawnerSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { storageSystem } from '../systems/StorageSystem.js';
import { platformSDK } from '../sdk/PlatformSDK.js';

import { WeaponManager } from '../weapons/WeaponManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { CardUpgradeModal } from '../ui/CardUpgradeModal.js';

export class GameScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = new Camera();
        this.spawner = new SpawnerSystem();
        this.particles = new ParticleSystem();
        this.collisions = new CollisionSystem(this.particles);

        this.weaponManager = new WeaponManager();
        this.levelManager = new LevelManager();
        this.upgradeModal = new CardUpgradeModal();

        this.player = null;
        this.enemies = [];
        this.pendingEnemies = [];
        this.gems = [];
        this.coins = [];
        this.enemyProjectiles = [];
        this.score = 0;
        this.sessionCoins = 0;
    }

    enter(data = {}) {
        if (data && data.isResume) {
            return;
        }

        this.player = new Player(0, 0);
        this.enemies = [];
        this.pendingEnemies = [];
        this.gems = [];
        this.coins = [];
        this.enemyProjectiles = [];
        this.particles.clear();
        this.spawner.reset();
        this.weaponManager.reset();
        this.levelManager.reset();
        this.score = 0;
        this.sessionCoins = 0;

        platformSDK.gameplayStart();
    }

    handleEnemyDefeat(enemy) {
        if (enemy.hasDroppedGems) return;
        enemy.hasDroppedGems = true;
        enemy.dead = true;

        this.particles.spawnBlood(enemy.x, enemy.y, 14);

        if (enemy.type === 'slime') {
            this.pendingEnemies.push(new Enemy(enemy.x - 12, enemy.y - 12, 'miniSlime'));
            this.pendingEnemies.push(new Enemy(enemy.x + 12, enemy.y + 12, 'miniSlime'));
        }

        if (enemy.type === 'bear' || enemy.type === 'frost_dragon' || enemy.type === 'stone_golem') {
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                this.gems.push(new Gem(enemy.x + offsetX, enemy.y + offsetY, 'emerald'));
            }
        } else {
            this.gems.push(new Gem(enemy.x, enemy.y, 'emerald'));
        }

        if (Math.random() < 0.3) {
            this.coins.push(new Coin(enemy.x + 15, enemy.y + 15));
        }
    }

    update(engine) {
        if (!this.player) return;

        // Check Pause key
        if (input.keys['p'] || input.keys['escape']) {
            input.keys['p'] = false;
            input.keys['escape'] = false;
            engine.pauseGame();
            return;
        }

        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.update(this.levelManager, this.weaponManager, this.player, engine.renderer.width, engine.renderer.height);
            return;
        }

        const mouseWorld = {
            x: this.camera.getWorldX(input.mouse.x, engine.renderer.width),
            y: this.camera.getWorldY(input.mouse.y, engine.renderer.height)
        };

        const movement = input.getMovementVector();
        this.player.update(movement, mouseWorld);

        this.camera.setTarget(this.player.x, this.player.y);
        this.camera.update();

        this.weaponManager.update(this.player, this.enemies, this.particles, (enemy) => this.handleEnemyDefeat(enemy));

        this.enemies.forEach(e => e.update(this.player.x, this.player.y, this.enemyProjectiles));
        this.gems.forEach(g => g.update(this.player.x, this.player.y, this.player.magnetRadius));
        this.coins.forEach(c => c.update(this.player.x, this.player.y));
        this.particles.update();

        // Update Advanced Enemy Special Attacks
        this.enemyProjectiles.forEach(p => {
            if (p.type === 'foxfire') {
                // Homing curve towards player
                const angle = Math.atan2(this.player.y - p.y, this.player.x - p.x);
                p.vx += Math.cos(angle) * 0.25;
                p.vy += Math.sin(angle) * 0.25;
                const speed = Math.hypot(p.vx, p.vy);
                if (speed > 5) {
                    p.vx = (p.vx / speed) * 5;
                    p.vy = (p.vy / speed) * 5;
                }
                p.x += p.vx;
                p.y += p.vy;
                if (Math.random() < 0.4) {
                    this.particles.spawnFlameEmbers(p.x, p.y);
                }
            } else if (p.type === 'bloodPillar') {
                p.timer--;
                if (p.timer <= 0 && !p.erupted) {
                    p.erupted = true;
                    p.eruptLife = 20; // 20 frame active blood blast
                    this.particles.spawnBlood(p.x, p.y, 25);
                }
                if (p.erupted) {
                    p.eruptLife--;
                    if (p.eruptLife <= 0) p.dead = true;
                }
            } else if (p.type === 'golemSlam') {
                p.currentRadius += 4;
                if (p.currentRadius >= p.maxRadius) {
                    p.dead = true;
                }
            } else {
                p.x += p.vx;
                p.y += p.vy;
            }

            if (Math.hypot(p.x - this.player.x, p.y - this.player.y) > 900) {
                p.dead = true;
            }
        });

        this.spawner.update(this.player, this.enemies, this.camera, engine.renderer.width, engine.renderer.height);

        this.collisions.checkCollisions(
            this.player,
            this.enemies,
            this.gems,
            this.coins,
            this.enemyProjectiles,
            this.levelManager,
            this.weaponManager,
            (enemy) => this.handleEnemyDefeat(enemy),
            (pts) => { this.score += pts; },
            (cn) => { this.sessionCoins += cn; },
            this.camera
        );

        this.enemies = this.enemies.filter(e => !e.dead);
        if (this.pendingEnemies.length > 0) {
            this.enemies.push(...this.pendingEnemies);
            this.pendingEnemies = [];
        }

        this.gems = this.gems.filter(g => !g.dead);
        this.coins = this.coins.filter(c => !c.dead);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.dead);

        if (this.player.dead) {
            storageSystem.addCoins(this.sessionCoins);
            const isNewHigh = storageSystem.setHighScore(this.score);
            platformSDK.gameplayStop();
            engine.triggerGameOver(this.score, this.sessionCoins, isNewHigh);
        }
    }

    render(ctx, renderer) {
        const w = renderer.width;
        const h = renderer.height;

        renderer.drawBackground(this.camera);

        this.gems.forEach(gem => {
            const sx = this.camera.getScreenX(gem.x, w);
            const sy = this.camera.getScreenY(gem.y, h);
            gem.render(ctx, sx, sy);
        });

        this.coins.forEach(coin => {
            const sx = this.camera.getScreenX(coin.x, w);
            const sy = this.camera.getScreenY(coin.y, h);
            coin.render(ctx, sx, sy);
        });

        // Draw Advanced Enemy Special Attack Visuals
        this.enemyProjectiles.forEach(p => {
            const sx = this.camera.getScreenX(p.x, w);
            const sy = this.camera.getScreenY(p.y, h);
            ctx.save();

            if (p.type === 'bloodPillar') {
                if (!p.erupted) {
                    // Pulsing Telegraph Circle
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath();
                    ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.fill();
                } else {
                    // Towering Blood Eruption Pillar
                    ctx.fillStyle = '#b91c1c';
                    ctx.beginPath();
                    ctx.arc(sx, sy, p.radius * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#f87171';
                    ctx.beginPath();
                    ctx.arc(sx, sy, p.radius * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (p.type === 'golemSlam') {
                // Expanding Ground Shockwave Ring
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(sx, sy, p.currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'spiderWeb') {
                // Sticky Jade Web Mesh
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.moveTo(sx - p.radius, sy); ctx.lineTo(sx + p.radius, sy);
                ctx.moveTo(sx, sy - p.radius); ctx.lineTo(sx, sy + p.radius);
                ctx.stroke();
            } else if (p.type === 'frostBreath') {
                // Glacial Ice Crystal
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx - 2, sy - 2, p.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'foxfire') {
                // Glowing Crimson Foxfire Orb
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(sx - 2, sy - 2, p.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color || '#e67e22';
                ctx.fill();
            }

            ctx.restore();
        });

        this.enemies.forEach(enemy => {
            const sx = this.camera.getScreenX(enemy.x, w);
            const sy = this.camera.getScreenY(enemy.y, h);
            enemy.render(ctx, sx, sy);
        });

        if (this.player && !this.player.dead) {
            const px = this.camera.getScreenX(this.player.x, w);
            const py = this.camera.getScreenY(this.player.y, h);
            this.player.render(ctx, px, py);
        }

        if (this.player) {
            this.weaponManager.render(ctx, this.camera, this.player, w, h);
        }

        this.particles.render(ctx, this.camera, w, h);

        if (this.player) {
            renderer.drawHUD(
                this.player,
                this.score,
                this.sessionCoins,
                storageSystem.getHighScore(),
                this.spawner.difficultyTier,
                this.levelManager,
                this.weaponManager,
                this.spawner
            );
        }

        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.render(ctx, this.levelManager, w, h);
        }
    }

    exit() {}
}
