import { Enemy } from '../entities/Enemy.js';
import { Gem } from '../entities/Gem.js';
import { Coin } from '../entities/Coin.js';
import { GameConfig } from '../config/GameConfig.js';

export class SpawnerSystem {
    constructor() {
        this.enemies = [];
        this.gems = [];
        this.coins = [];

        this.bounds = {
            width: GameConfig.world.width || 3000,
            height: GameConfig.world.height || 3000
        };

        this.currentWave = 1;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.waveDuration = 30 * 60; // 30 seconds per wave

        this.totalSpawnedInWave = 0;
        this.enemiesKilledInWave = 0;

        this.milestoneNoticeTimer = 0;
        this.milestoneTitle = '';

        // Structured 5-Wave Milestone Spawn Progression Tables
        this.waveSpecs = {
            1:  { types: ['slime'], maxEnemies: 6, totalWaveEnemies: 12, spawnInterval: 120 },
            2:  { types: ['slime', 'snake'], maxEnemies: 8, totalWaveEnemies: 16, spawnInterval: 100 },
            3:  { types: ['slime', 'snake'], maxEnemies: 10, totalWaveEnemies: 20, spawnInterval: 85 },
            4:  { types: ['goblin', 'ghost'], maxEnemies: 12, totalWaveEnemies: 24, spawnInterval: 75 },
            5:  { types: ['bear'], maxEnemies: 1, totalWaveEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 5: ORC BERSERKER BOSS' },

            6:  { types: ['goblin', 'ghost'], maxEnemies: 14, totalWaveEnemies: 28, spawnInterval: 70 },
            7:  { types: ['snake', 'fox_demon'], maxEnemies: 16, totalWaveEnemies: 32, spawnInterval: 65 },
            8:  { types: ['fox_demon', 'cultist_sorcerer'], maxEnemies: 18, totalWaveEnemies: 36, spawnInterval: 60 },
            9:  { types: ['cultist_sorcerer', 'goblin'], maxEnemies: 20, totalWaveEnemies: 40, spawnInterval: 55 },
            10: { types: ['stone_golem'], maxEnemies: 1, totalWaveEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 10: STONE GOLEM BOSS' },

            11: { types: ['fox_demon', 'cultist_sorcerer'], maxEnemies: 22, totalWaveEnemies: 44, spawnInterval: 50 },
            12: { types: ['spider_fiend', 'ghost'], maxEnemies: 24, totalWaveEnemies: 48, spawnInterval: 45 },
            13: { types: ['spider_fiend', 'cultist_sorcerer'], maxEnemies: 26, totalWaveEnemies: 52, spawnInterval: 40 },
            14: { types: ['stone_golem', 'bear'], maxEnemies: 28, totalWaveEnemies: 56, spawnInterval: 35 },
            15: { types: ['frost_dragon'], maxEnemies: 1, totalWaveEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 15: CELESTIAL FROST DRAGON BOSS' },

            16: { types: ['spider_fiend', 'frost_dragon'], maxEnemies: 30, totalWaveEnemies: 60, spawnInterval: 30 },
            17: { types: ['fox_demon', 'stone_golem'], maxEnemies: 32, totalWaveEnemies: 64, spawnInterval: 28 },
            18: { types: ['cultist_sorcerer', 'frost_dragon'], maxEnemies: 34, totalWaveEnemies: 68, spawnInterval: 26 },
            19: { types: ['spider_fiend', 'stone_golem', 'frost_dragon'], maxEnemies: 36, totalWaveEnemies: 72, spawnInterval: 24 },
            20: { types: ['frost_dragon', 'bear', 'stone_golem'], maxEnemies: 40, totalWaveEnemies: 80, spawnInterval: 20, isBoss: true, title: 'WAVE 20: ULTIMATE CELESTIAL SWARM' }
        };
    }

    reset() {
        this.enemies = [];
        this.gems = [];
        this.coins = [];
        this.currentWave = 1;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.totalSpawnedInWave = 0;
        this.enemiesKilledInWave = 0;
        this.milestoneNoticeTimer = 180;
        this.milestoneTitle = 'WAVE 1: GEL SWARM';
    }

    getWaveSpec(wave) {
        if (this.waveSpecs[wave]) return this.waveSpecs[wave];

        const types = ['slime', 'goblin', 'ghost', 'snake', 'bear', 'fox_demon', 'cultist_sorcerer', 'stone_golem', 'spider_fiend', 'frost_dragon'];
        return {
            types: types,
            maxEnemies: Math.min(45, 30 + Math.floor((wave - 20) * 2)),
            totalWaveEnemies: 80 + (wave - 20) * 10,
            spawnInterval: Math.max(15, 25 - Math.floor((wave - 20) / 2))
        };
    }

    advanceWave() {
        this.currentWave++;
        this.waveTimer = 0;
        this.totalSpawnedInWave = 0;
        this.enemiesKilledInWave = 0;

        const newSpec = this.getWaveSpec(this.currentWave);
        this.milestoneNoticeTimer = 180;
        this.milestoneTitle = newSpec.title || `MILESTONE: WAVE ${this.currentWave}`;
    }

    onEnemyDefeated() {
        this.enemiesKilledInWave++;
        const spec = this.getWaveSpec(this.currentWave);

        if (spec.isBoss && this.enemies.filter(e => !e.dead).length === 0) {
            this.advanceWave();
        } else if (this.enemiesKilledInWave >= spec.totalWaveEnemies) {
            this.advanceWave();
        }
    }

    update(playerX, playerY) {
        this.waveTimer++;
        if (this.milestoneNoticeTimer > 0) this.milestoneNoticeTimer--;

        const spec = this.getWaveSpec(this.currentWave);

        // Advance wave on timer expire or total kills reached
        if (this.waveTimer >= this.waveDuration && !spec.isBoss) {
            this.advanceWave();
        }

        // Immediately spawn boss on wave start (don't wait for spawnInterval)
        if (spec.isBoss && this.totalSpawnedInWave === 0 && this.enemies.filter(e => !e.dead).length === 0) {
            const type = spec.types[0];
            this.spawnEnemyNearPlayer(playerX, playerY, type);
            this.totalSpawnedInWave++;
        }

        // Spawn Enemies near player
        this.spawnTimer++;
        if (this.spawnTimer >= spec.spawnInterval) {
            this.spawnTimer = 0;

            if (this.enemies.length < spec.maxEnemies && (spec.isBoss || this.totalSpawnedInWave < spec.totalWaveEnemies)) {
                const type = spec.types[Math.floor(Math.random() * spec.types.length)];
                this.spawnEnemyNearPlayer(playerX, playerY, type);
                this.totalSpawnedInWave++;
            }
        }

        this.enemies = this.enemies.filter(e => !e.dead);
        this.gems = this.gems.filter(g => !g.dead);
        this.coins = this.coins.filter(c => !c.dead);
    }

    spawnEnemyNearPlayer(playerX, playerY, type) {
        // Spawn distance 280-400px: Active, intense combat right around player screen!
        const spawnDist = 280 + Math.random() * 120;
        const angle = Math.random() * Math.PI * 2;

        let sx = playerX + Math.cos(angle) * spawnDist;
        let sy = playerY + Math.sin(angle) * spawnDist;

        const halfW = (this.bounds.width || 3000) / 2;
        const halfH = (this.bounds.height || 3000) / 2;

        sx = Math.max(-halfW + 50, Math.min(halfW - 50, sx));
        sy = Math.max(-halfH + 50, Math.min(halfH - 50, sy));

        this.enemies.push(new Enemy(sx, sy, type));
    }

    spawnRewards(x, y, enemyType) {
        const isBoss = ['bear', 'stone_golem', 'frost_dragon'].includes(enemyType);
        const gemCount = isBoss ? 5 : 1;
        const coinCount = isBoss ? 3 : (Math.random() < 0.35 ? 1 : 0);

        for (let i = 0; i < gemCount; i++) {
            const gx = x + (Math.random() - 0.5) * 30;
            const gy = y + (Math.random() - 0.5) * 30;
            this.gems.push(new Gem(gx, gy, isBoss ? 25 : 5));
        }

        for (let i = 0; i < coinCount; i++) {
            const cx = x + (Math.random() - 0.5) * 30;
            const cy = y + (Math.random() - 0.5) * 30;
            this.coins.push(new Coin(cx, cy, 1));
        }
    }
}
