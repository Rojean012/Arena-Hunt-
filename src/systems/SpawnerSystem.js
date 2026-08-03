import { Enemy } from '../entities/Enemy.js';
import { soundManager } from '../audio/SoundManager.js';

export class SpawnerSystem {
    constructor() {
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 50;
        this.waveTimer = 0;
        this.difficultyTier = 1;
        
        // Wave Notice Signaling
        this.waveNoticeText = '';
        this.waveNoticeTimer = 0;
    }

    reset() {
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 50;
        this.waveTimer = 0;
        this.difficultyTier = 1;
        this.waveNoticeText = '⚠️ WAVE 1: MONSTER INVASION ⚠️';
        this.waveNoticeTimer = 180; // 3 seconds
    }

    update(player, enemies, camera, canvasWidth, canvasHeight) {
        this.waveTimer++;

        // Increase difficulty & trigger prominent wave signaling every 18 seconds (1080 frames)
        if (this.waveTimer % 1080 === 0) {
            this.difficultyTier++;
            this.enemySpawnInterval = Math.max(10, 50 - this.difficultyTier * 5);
            
            // Trigger prominent wave notice
            this.waveNoticeText = `⚠️ WAVE ${this.difficultyTier}: MONSTER SWARM APPROACHING! ⚠️`;
            this.waveNoticeTimer = 180;
            soundManager.playCoinCollect();
        }

        if (this.waveNoticeTimer > 0) {
            this.waveNoticeTimer--;
        }

        // Spawn Enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            this.spawnEnemy(player, enemies, camera, canvasWidth, canvasHeight);
        }
    }

    spawnEnemy(player, enemies, camera, canvasWidth, canvasHeight) {
        const margin = 100;
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? camera.x - canvasWidth / 2 - margin : camera.x + canvasWidth / 2 + margin;
            y = camera.y - canvasHeight / 2 + Math.random() * canvasHeight;
        } else {
            x = camera.x - canvasWidth / 2 + Math.random() * canvasWidth;
            y = Math.random() < 0.5 ? camera.y - canvasHeight / 2 - margin : camera.y + canvasHeight / 2 + margin;
        }

        let type = 'slime';
        const rand = Math.random();
        
        if (this.difficultyTier >= 4 && rand < 0.15) {
            type = 'bear';
        } else if (this.difficultyTier >= 3 && rand < 0.35) {
            type = 'ghost';
        } else if (this.difficultyTier >= 2 && rand < 0.65) {
            type = rand < 0.35 ? 'snake' : 'goblin';
        } else if (rand < 0.30) {
            type = 'snake'; // Viper Serpents can spawn from Wave 1!
        }

        enemies.push(new Enemy(x, y, type));
    }
}
