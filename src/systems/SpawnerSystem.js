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

        this.milestoneNoticeTimer = 0;
        this.milestoneTitle = '';

        // Structured 5-Wave Milestone Spawn Progression Tables
        this.waveSpecs = {
            1:  { types: ['slime'], maxEnemies: 4, spawnInterval: 180 },
            2:  { types: ['slime', 'snake'], maxEnemies: 6, spawnInterval: 150 },
            3:  { types: ['slime', 'snake'], maxEnemies: 8, spawnInterval: 130 },
            4:  { types: ['goblin', 'ghost'], maxEnemies: 10, spawnInterval: 110 },
            5:  { types: ['bear'], maxEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 5: ORC BERSERKER BOSS' },

            6:  { types: ['goblin', 'ghost'], maxEnemies: 12, spawnInterval: 100 },
            7:  { types: ['snake', 'fox_demon'], maxEnemies: 14, spawnInterval: 90 },
            8:  { types: ['fox_demon', 'cultist_sorcerer'], maxEnemies: 15, spawnInterval: 85 },
            9:  { types: ['cultist_sorcerer', 'goblin'], maxEnemies: 16, spawnInterval: 80 },
            10: { types: ['stone_golem'], maxEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 10: STONE GOLEM BOSS' },

            11: { types: ['fox_demon', 'cultist_sorcerer'], maxEnemies: 17, spawnInterval: 75 },
            12: { types: ['spider_fiend', 'ghost'], maxEnemies: 18, spawnInterval: 70 },
            13: { types: ['spider_fiend', 'cultist_sorcerer'], maxEnemies: 19, spawnInterval: 65 },
            14: { types: ['stone_golem', 'bear'], maxEnemies: 20, spawnInterval: 60 },
            15: { types: ['frost_dragon'], maxEnemies: 1, spawnInterval: 9999, isBoss: true, title: 'WAVE 15: CELESTIAL FROST DRAGON BOSS' },

            16: { types: ['spider_fiend', 'frost_dragon'], maxEnemies: 21, spawnInterval: 55 },
            17: { types: ['fox_demon', 'stone_golem'], maxEnemies: 22, spawnInterval: 50 },
            18: { types: ['cultist_sorcerer', 'frost_dragon'], maxEnemies: 23, spawnInterval: 45 },
            19: { types: ['spider_fiend', 'stone_golem', 'frost_dragon'], maxEnemies: 24, spawnInterval: 40 },
            20: { types: ['frost_dragon', 'bear', 'stone_golem'], maxEnemies: 25, spawnInterval: 35, isBoss: true, title: 'WAVE 20: ULTIMATE CELESTIAL SWARM' }
        };
    }

    reset() {
        this.enemies = [];
        this.gems = [];
        this.coins = [];
        this.currentWave = 1;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.milestoneNoticeTimer = 180;
        this.milestoneTitle = 'WAVE 1: GEL SWARM';
    }

    getWaveSpec(wave) {
        if (this.waveSpecs[wave]) return this.waveSpecs[wave];

        const types = ['slime', 'goblin', 'ghost', 'snake', 'bear', 'fox_demon', 'cultist_sorcerer', 'stone_golem', 'spider_fiend', 'frost_dragon'];
        return {
            types: types,
            maxEnemies: Math.min(30, 25 + Math.floor((wave - 20) / 2)),
            spawnInterval: Math.max(25, 35 - Math.floor((wave - 20) / 3))
        };
    }

    update(playerX, playerY) {
        this.waveTimer++;
        if (this.milestoneNoticeTimer > 0) this.milestoneNoticeTimer--;

        const spec = this.getWaveSpec(this.currentWave);

        if (this.waveTimer >= this.waveDuration && !spec.isBoss) {
            this.currentWave++;
            this.waveTimer = 0;
            const newSpec = this.getWaveSpec(this.currentWave);

            if (newSpec.title || this.currentWave % 5 === 0 || this.currentWave % 5 === 1) {
                this.milestoneNoticeTimer = 180;
                this.milestoneTitle = newSpec.title || `MILESTONE: WAVE ${this.currentWave}`;
            }
        }

        this.spawnTimer++;
        if (this.spawnTimer >= spec.spawnInterval) {
            this.spawnTimer = 0;

            if (this.enemies.length < spec.maxEnemies) {
                const type = spec.types[Math.floor(Math.random() * spec.types.length)];
                this.spawnEnemyNearPlayer(playerX, playerY, type);
            }
        }

        this.enemies = this.enemies.filter(e => !e.dead);
        this.gems = this.gems.filter(g => !g.dead);
        this.coins = this.coins.filter(c => !c.dead);
    }

    spawnEnemyNearPlayer(playerX, playerY, type) {
        const spawnDist = 450 + Math.random() * 200;
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
        const coinCount = isBoss ? 3 : (Math.random() < 0.3 ? 1 : 0);

        for (let i = 0; i < gemCount; i++) {
            const gx = x + (Math.random() - 0.5) * 30;
            const gy = y + (Math.random() - 0.5) * 30;
            this.gems.push(new Gem(gx, gy, isBoss ? 25 : 10));
        }

        for (let i = 0; i < coinCount; i++) {
            const cx = x + (Math.random() - 0.5) * 30;
            const cy = y + (Math.random() - 0.5) * 30;
            this.coins.push(new Coin(cx, cy, 1));
        }
    }
}
