import { Enemy } from '../entities/Enemy.js';
import { soundManager } from '../audio/SoundManager.js';

export class SpawnerSystem {
    constructor() {
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 55;
        this.waveTimer = 0;
        this.difficultyTier = 1; // 1 wave per 18 seconds
        
        // Wave Notice Signaling
        this.waveNoticeText = '';
        this.waveNoticeTimer = 0;
    }

    reset() {
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 55;
        this.waveTimer = 0;
        this.difficultyTier = 1;
        this.waveNoticeText = '⚠️ WAVE 1: GEL SLIME SWARM ⚠️';
        this.waveNoticeTimer = 180; // 3 seconds
    }

    update(player, enemies, camera, canvasWidth, canvasHeight) {
        this.waveTimer++;

        // Advance Wave Tier every 18 seconds (1080 frames)
        if (this.waveTimer % 1080 === 0) {
            this.difficultyTier++;
            this.enemySpawnInterval = Math.max(12, 55 - Math.floor(this.difficultyTier * 2));
            
            // Structured 5-Wave Milestone Announcements
            let milestoneNotice = '';
            if (this.difficultyTier === 6) milestoneNotice = ' — GOBLIN ARCHERS & GHOST DEMONS ARRIVE!';
            if (this.difficultyTier === 11) milestoneNotice = ' — DEMON FOXES & BLOOD CULTISTS ARRIVE!';
            if (this.difficultyTier === 16) milestoneNotice = ' — STONE GOLEMS & ORC BERSERKERS ARRIVE!';
            if (this.difficultyTier === 21) milestoneNotice = ' — CELESTIAL FROST DRAGONS AWAKEN!';

            this.waveNoticeText = `⚠️ WAVE ${this.difficultyTier}${milestoneNotice} ⚠️`;
            this.waveNoticeTimer = 200;
            if (soundManager && soundManager.playLevelUp) {
                soundManager.playLevelUp();
            }
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
        const wave = this.difficultyTier;

        // Structured 5-Wave Milestone Progression Table
        if (wave >= 21) {
            // Wave 21+: Celestial Cataclysm (All 10 mobs unlocked!)
            if (rand < 0.10) type = 'frost_dragon';
            else if (rand < 0.22) type = 'stone_golem';
            else if (rand < 0.38) type = 'cultist_sorcerer';
            else if (rand < 0.52) type = 'fox_demon';
            else if (rand < 0.68) type = 'bear';
            else if (rand < 0.82) type = 'ghost';
            else type = rand < 0.9 ? 'goblin' : 'snake';
        } else if (wave >= 16) {
            // Wave 16 – 20: Titan Citadel (Golems & Orc Berserkers join)
            if (rand < 0.18) type = 'stone_golem';
            else if (rand < 0.40) type = 'bear';
            else if (rand < 0.60) type = 'cultist_sorcerer';
            else if (rand < 0.78) type = 'fox_demon';
            else type = rand < 0.9 ? 'ghost' : 'goblin';
        } else if (wave >= 11) {
            // Wave 11 – 15: Demon Cult (Nine-Tailed Foxes & Cultists join)
            if (rand < 0.30) type = 'fox_demon';
            else if (rand < 0.55) type = 'cultist_sorcerer';
            else if (rand < 0.75) type = 'ghost';
            else if (rand < 0.90) type = 'goblin';
            else type = 'snake';
        } else if (wave >= 6) {
            // Wave 6 – 10: Goblin & Phantom Horde (Goblins & Ghosts join)
            if (rand < 0.35) type = 'goblin';
            else if (rand < 0.65) type = 'ghost';
            else if (rand < 0.85) type = 'spider_fiend';
            else type = 'snake';
        } else {
            // Wave 1 – 5: Gel Swarm (Slimes, Mini Slimes, Viper Serpents, Spider Fiends)
            if (rand < 0.40) type = 'slime';
            else if (rand < 0.75) type = 'snake';
            else type = 'spider_fiend';
        }

        enemies.push(new Enemy(x, y, type));
    }
}
