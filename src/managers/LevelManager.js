import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

export class LevelManager {
    constructor() {
        this.totalGems = 0;
        this.currentTierIndex = 0;
        this.targetGems = GameConfig.upgradeThresholds ? GameConfig.upgradeThresholds[0] : 10;
        this.isLevelingUp = false;
        this.justOpened = false;
        this.cardOptions = [];
    }

    get currentOptions() {
        return this.cardOptions;
    }

    reset() {
        this.totalGems = 0;
        this.currentTierIndex = 0;
        this.targetGems = GameConfig.upgradeThresholds ? GameConfig.upgradeThresholds[0] : 10;
        this.isLevelingUp = false;
        this.justOpened = false;
        this.cardOptions = [];
    }

    triggerLevelUp(player, weaponManager) {
        this.generateCardOptions(weaponManager);
        this.isLevelingUp = true;
        this.justOpened = true;
        if (soundManager && soundManager.playLevelUp) {
            soundManager.playLevelUp();
        }
    }

    addXP(amount, weaponManager) {
        this.totalGems += amount;

        const thresholds = GameConfig.upgradeThresholds || [5, 12, 22, 35, 50, 70, 95, 125, 160, 200];
        if (this.totalGems >= this.targetGems) {
            this.currentTierIndex++;
            this.targetGems = thresholds[this.currentTierIndex] || (this.targetGems + 40);
            
            if (soundManager && soundManager.playCoinCollect) {
                soundManager.playCoinCollect();
            }
            this.triggerLevelUp(null, weaponManager);
            return true;
        }
        return false;
    }

    generateCardOptions(weaponManager) {
        const pool = [];

        // 1. Weapon Options (Cap up to LEVEL 10!)
        if (weaponManager && GameConfig.weapons) {
            Object.keys(GameConfig.weapons).forEach(id => {
                const wConfig = GameConfig.weapons[id];
                const currentLvl = weaponManager.getWeaponLevel(id);

                if (currentLvl === 0) {
                    pool.push({
                        type: 'NEW',
                        id: id,
                        icon: wConfig.icon,
                        name: `UNLOCK: ${wConfig.name}`,
                        description: wConfig.description || 'New magic weapon skill.',
                        level: 1,
                        rarity: 'RARE'
                    });
                } else if (currentLvl < 10) {
                    pool.push({
                        type: 'UPGRADE',
                        id: id,
                        icon: wConfig.icon,
                        name: `${wConfig.name}`,
                        description: `Increase damage, speed & count (LVL ${currentLvl + 1}).`,
                        level: currentLvl + 1,
                        rarity: 'COMMON'
                    });
                }
            });
        }

        // 2. Stat Options
        pool.push({
            type: 'STAT',
            id: 'stat_speed',
            icon: '👟',
            name: 'BOOTS OF SPEED',
            description: '+15% Hero Movement Speed in combat.',
            level: 1,
            rarity: 'COMMON'
        });

        pool.push({
            type: 'STAT',
            id: 'stat_magnet',
            icon: '🧲',
            name: 'GEM MAGNET',
            description: '+40% Gem Magnet Pickup Range.',
            level: 1,
            rarity: 'COMMON'
        });

        pool.push({
            type: 'STAT',
            id: 'stat_health',
            icon: '💖',
            name: 'VITALITY ELIXIR',
            description: 'Instantly heal 50 HP and increase Max HP.',
            level: 1,
            rarity: 'RARE'
        });

        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.cardOptions = shuffled.slice(0, 3);
    }

    selectUpgrade(index, weaponManager, player) {
        const card = this.cardOptions[index];
        if (card) {
            this.selectCard(card, weaponManager, player);
        } else {
            this.isLevelingUp = false;
        }
    }

    selectCard(card, weaponManager, player) {
        if (!card) {
            this.isLevelingUp = false;
            return;
        }

        if ((card.type === 'NEW' || card.type === 'UPGRADE') && weaponManager) {
            weaponManager.addWeapon(card.id);
        } else if (card.type === 'STAT' && player) {
            if (card.id === 'stat_speed') {
                player.speed += 0.5;
            } else if (card.id === 'stat_magnet') {
                player.magnetRadius += 50;
            } else if (card.id === 'stat_health') {
                player.maxHealth += 25;
                if (player.heal) player.heal(50);
                else player.health = Math.min(player.maxHealth, player.health + 50);
            }
        }

        this.isLevelingUp = false;
        this.justOpened = false;
        if (soundManager && soundManager.playButtonClick) {
            soundManager.playButtonClick();
        }
    }
}
