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
        this.pendingEnemies = []; // Buffer to prevent array mutation during forEach iteration!
        this.gems = [];
        this.coins = [];
        this.enemyProjectiles = [];
        this.score = 0;
        this.sessionCoins = 0;
    }

    enter() {
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

        // Slime split mechanic: Push miniSlimes into pendingEnemies to PREVENT array iteration freezes!
        if (enemy.type === 'slime') {
            this.pendingEnemies.push(new Enemy(enemy.x - 12, enemy.y - 12, 'miniSlime'));
            this.pendingEnemies.push(new Enemy(enemy.x + 12, enemy.y + 12, 'miniSlime'));
        }

        // Standard Enemy = 1 Gem; Boss Enemy = 5 Gems!
        if (enemy.type === 'bear') {
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                this.gems.push(new Gem(enemy.x + offsetX, enemy.y + offsetY, 'emerald'));
            }
        } else {
            this.gems.push(new Gem(enemy.x, enemy.y, 'emerald'));
        }

        // 30% bonus coin drop
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

        // If Leveling up modal is active, update modal & pause game physics
        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.update(this.levelManager, this.weaponManager, this.player);
            return;
        }

        // 1. Mouse world calculation
        const mouseWorld = {
            x: this.camera.getWorldX(input.mouse.x, engine.renderer.width),
            y: this.camera.getWorldY(input.mouse.y, engine.renderer.height)
        };

        // 2. Player Update
        const movement = input.getMovementVector();
        this.player.update(movement, mouseWorld);

        // 3. Camera Follow
        this.camera.setTarget(this.player.x, this.player.y);
        this.camera.update();

        // 4. Update Auto-Attacking Weapons
        this.weaponManager.update(this.player, this.enemies, this.particles, (enemy) => this.handleEnemyDefeat(enemy));

        // 5. Update Entities & Enemy Projectiles
        this.enemies.forEach(e => e.update(this.player.x, this.player.y, this.enemyProjectiles));
        this.gems.forEach(g => g.update(this.player.x, this.player.y, this.player.magnetRadius));
        this.coins.forEach(c => c.update(this.player.x, this.player.y));
        this.particles.update();

        // Update enemy projectiles (Archer arrows)
        this.enemyProjectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (Math.hypot(p.x - this.player.x, p.y - this.player.y) > 800) {
                p.dead = true;
            }
        });

        // 6. Spawning
        this.spawner.update(this.player, this.enemies, this.camera, engine.renderer.width, engine.renderer.height);

        // 7. Collisions (Score & XP are ONLY awarded when gems/coins are picked up!)
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

        // 8. Safe Cleanup & Flush Pending Split Enemies (Zero Freezes!)
        this.enemies = this.enemies.filter(e => !e.dead);
        if (this.pendingEnemies.length > 0) {
            this.enemies.push(...this.pendingEnemies);
            this.pendingEnemies = [];
        }

        this.gems = this.gems.filter(g => !g.dead);
        this.coins = this.coins.filter(c => !c.dead);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.dead);

        // 9. Check Game Over
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

        // Draw World Background
        renderer.drawBackground(this.camera);

        // Draw Gems
        this.gems.forEach(gem => {
            const sx = this.camera.getScreenX(gem.x, w);
            const sy = this.camera.getScreenY(gem.y, h);
            gem.render(ctx, sx, sy);
        });

        // Draw Coins
        this.coins.forEach(coin => {
            const sx = this.camera.getScreenX(coin.x, w);
            const sy = this.camera.getScreenY(coin.y, h);
            coin.render(ctx, sx, sy);
        });

        // Draw Enemy Projectiles
        this.enemyProjectiles.forEach(p => {
            const sx = this.camera.getScreenX(p.x, w);
            const sy = this.camera.getScreenY(p.y, h);
            ctx.save();
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        });

        // Draw Enemies
        this.enemies.forEach(enemy => {
            const sx = this.camera.getScreenX(enemy.x, w);
            const sy = this.camera.getScreenY(enemy.y, h);
            enemy.render(ctx, sx, sy);
        });

        // Draw Player (Wang Lin Xianxia MC Hero)
        if (this.player && !this.player.dead) {
            const px = this.camera.getScreenX(this.player.x, w);
            const py = this.camera.getScreenY(this.player.y, h);
            this.player.render(ctx, px, py);
        }

        // Draw Weapon Visual Effects
        if (this.player) {
            this.weaponManager.render(ctx, this.camera, this.player, w, h);
        }

        // Draw Particles
        this.particles.render(ctx, this.camera, w, h);

        // Draw HUD Overlay
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

        // Draw 3-Card Upgrade Modal on Level Up
        if (this.levelManager.isLevelingUp) {
            this.upgradeModal.render(ctx, this.levelManager, w, h);
        }
    }

    exit() {}
}
