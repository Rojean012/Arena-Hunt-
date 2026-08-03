export class CollisionSystem {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
    }

    checkCollisions(player, enemies, gems, coins, enemyProjectiles, levelManager, weaponManager, onEnemyDefeat, onScoreAdd, onCoinAdd, camera) {
        // 1. Enemies vs Player
        enemies.forEach((enemy) => {
            if (enemy.dead) return;

            if (player.isCollidingWith(enemy)) {
                const damaged = player.takeDamage(enemy.damage);
                if (damaged) {
                    camera.shake(10, 12);
                    this.particleSystem.spawnBlood(player.x, player.y, 8);
                    
                    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                    enemy.x -= Math.cos(angle) * 35;
                    enemy.y -= Math.sin(angle) * 35;
                }
            }

            if (enemy.health <= 0 && !enemy.dead) {
                if (onEnemyDefeat) onEnemyDefeat(enemy);
            }
        });

        // 2. Enemy Ranged Projectiles vs Player
        enemyProjectiles.forEach((p) => {
            if (p.dead) return;
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.radius) {
                p.dead = true;
                player.takeDamage(p.damage);
                camera.shake(8, 10);
                this.particleSystem.spawnBlood(player.x, player.y, 6);
            }
        });

        // 3. Gems vs Player (Score & XP are ONLY awarded HERE on pickup!)
        gems.forEach((gem) => {
            if (gem.dead) return;
            if (player.isCollidingWith(gem)) {
                gem.dead = true;
                this.particleSystem.spawnCoinSparkle(gem.x, gem.y);
                
                if (onScoreAdd) onScoreAdd(gem.value * 15);
                levelManager.addXP(gem.value, weaponManager);
            }
        });

        // 4. Coins vs Player
        coins.forEach((coin) => {
            if (coin.dead) return;
            if (player.isCollidingWith(coin)) {
                coin.collect();
                onCoinAdd(coin.value);
                this.particleSystem.spawnCoinSparkle(coin.x, coin.y);
            }
        });
    }
}
