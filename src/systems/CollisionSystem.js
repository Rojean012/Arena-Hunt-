import { soundManager } from '../audio/SoundManager.js';

export class CollisionSystem {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
    }

    update(player, enemies, gems, coins, enemyProjectiles, particles, onXPCollected, onCoinCollected, onPlayerDeath) {
        if (!player) return;

        // 1. Enemies vs Player
        enemies.forEach((enemy) => {
            if (enemy.dead) return;

            if (player.isCollidingWith(enemy)) {
                const isDead = player.takeDamage(enemy.damage);
                if (particles) particles.spawnBlood(player.x, player.y, 6);
                
                // Knockback
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemy.x -= Math.cos(angle) * 20;
                enemy.y -= Math.sin(angle) * 20;

                if (isDead && onPlayerDeath) {
                    onPlayerDeath();
                }
            }
        });

        // 2. Ranged Enemy Projectiles & Special Attacks vs Player
        enemyProjectiles.forEach((p) => {
            if (p.dead) return;
            const dist = Math.hypot(player.x - p.x, player.y - p.y);

            if (p.type === 'bloodPillar') {
                if (p.timer === 20 && dist < player.radius + (p.radius || 35) * 1.2) {
                    const isDead = player.takeDamage(p.damage);
                    if (particles) particles.spawnBlood(player.x, player.y, 10);
                    if (isDead && onPlayerDeath) onPlayerDeath();
                }
            } else if (p.type === 'golemSlam') {
                if (Math.abs(dist - p.currentRadius) < player.radius + 12) {
                    const isDead = player.takeDamage(p.damage);
                    if (particles) particles.spawnBlood(player.x, player.y, 8);
                    
                    const angle = Math.atan2(player.y - p.y, player.x - p.x);
                    player.x += Math.cos(angle) * 35;
                    player.y += Math.sin(angle) * 35;

                    if (isDead && onPlayerDeath) onPlayerDeath();
                }
            } else {
                if (dist < player.radius + (p.radius || 6)) {
                    p.dead = true;
                    const isDead = player.takeDamage(p.damage || 8);
                    if (particles) particles.spawnBlood(player.x, player.y, 6);
                    if (isDead && onPlayerDeath) onPlayerDeath();
                }
            }
        });

        // 3. Gem Magnet Pull + Gem Collection
        const magnetR = player.magnetRadius || 140;
        gems.forEach((gem) => {
            if (gem.dead) return;

            const dx = player.x - gem.x;
            const dy = player.y - gem.y;
            const dist = Math.hypot(dx, dy);

            // Pull gems within magnetRadius toward player
            if (dist < magnetR && dist > 1) {
                const pullSpeed = Math.min(12, 6 + (1 - dist / magnetR) * 10);
                gem.x += (dx / dist) * pullSpeed;
                gem.y += (dy / dist) * pullSpeed;
            }

            if (player.isCollidingWith(gem)) {
                gem.dead = true;
                if (particles) particles.spawnCoinSparkle(gem.x, gem.y);
                if (onXPCollected) onXPCollected(gem.value || 2);
            }
        });

        // 4. Coins vs Player
        coins.forEach((coin) => {
            if (coin.dead) return;
            if (player.isCollidingWith(coin)) {
                coin.dead = true;
                if (onCoinCollected) onCoinCollected(coin.value || 1);
                if (particles) particles.spawnCoinSparkle(coin.x, coin.y);
                if (soundManager && soundManager.playCoinClink) soundManager.playCoinClink();
            }
        });
    }

    checkCollisions(player, enemies, gems, coins, enemyProjectiles, levelManager, weaponManager, onEnemyDefeat, onScoreAdd, onCoinAdd, camera) {
        this.update(
            player,
            enemies,
            gems,
            coins,
            enemyProjectiles,
            this.particleSystem,
            (xp) => { if (levelManager) levelManager.addXP(xp, weaponManager); if (onScoreAdd) onScoreAdd(xp * 1.5); },
            (coinVal) => { if (onCoinAdd) onCoinAdd(coinVal); },
            null
        );
    }
}
