import { GameConfig } from '../config/GameConfig.js';
import { soundManager } from '../audio/SoundManager.js';

export class LevelManager {
    constructor() {
        this.totalGems = 0;
        this.currentTierIndex = 0;
        this.targetGems = GameConfig.upgradeThresholds[0];
        this.isLevelingUp = false;
        this.cardOptions = [];
    }

    reset() {
        this.totalGems = 0;
        this.currentTierIndex = 0;
        this.targetGems = GameConfig.upgradeThresholds[0];
        this.isLevelingUp = false;
        this.cardOptions = [];
    }

    addXP(amount, weaponManager) {
        this.totalGems += amount;

        if (this.totalGems >= this.targetGems) {
            this.currentTierIndex++;
            this.targetGems = GameConfig.upgradeThresholds[this.currentTierIndex] || (this.targetGems + 40);
            
            soundManager.playCoinCollect();
            this.generateCardOptions(weaponManager);
            this.isLevelingUp = true;
            return true;
        }
        return false;
    }

    generateCardOptions(weaponManager) {
        const pool = [];

        // 1. Weapon Options
        Object.keys(GameConfig.weapons).forEach(id => {
            const wConfig = GameConfig.weapons[id];
            const currentLvl = weaponManager.getWeaponLevel(id);

            if (currentLvl === 0) {
                // New weapon unlock
                pool.push({
                    type: 'weapon_unlock',
                    id: id,
                    icon: wConfig.icon,
                    title: `UNLOCK: ${wConfig.name}`,
                    subtitle: 'NEW WEAPON',
                    desc: wConfig.description,
                    rarity: 'RARE'
                });
            } else if (currentLvl < 5) {
                // Upgrade weapon
                pool.push({
                    type: 'weapon_upgrade',
                    id: id,
                    icon: wConfig.icon,
                    title: `${wConfig.name} (Lvl ${currentLvl + 1})`,
                    subtitle: `UPGRADE WEAPON`,
                    desc: `Increase damage, projectile count & attack speed.`,
                    rarity: 'COMMON'
                });
            }
        });

        // 2. Stat Options
        pool.push({
            type: 'stat',
            id: 'stat_speed',
            icon: '👟',
            title: 'BOOTS OF SPEED',
            subtitle: 'HERO STAT',
            desc: '+15% Hero Movement Speed',
            rarity: 'COMMON'
        });

        pool.push({
            type: 'stat',
            id: 'stat_magnet',
            icon: '🧲',
            title: 'GEM MAGNET',
            subtitle: 'HERO STAT',
            desc: '+40% Gem Magnet Pickup Range',
            rarity: 'COMMON'
        });

        pool.push({
            type: 'stat',
            id: 'stat_health',
            icon: '💖',
            title: 'VITALITY ELIXIR',
            subtitle: 'HERO STAT',
            desc: 'Instantly heal 50 HP and increase Max HP',
            rarity: 'RARE'
        });

        // Pick 3 unique cards
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.cardOptions = shuffled.slice(0, 3);
    }

    selectCard(card, weaponManager, player) {
        if (card.type === 'weapon_unlock' || card.type === 'weapon_upgrade') {
            weaponManager.addWeapon(card.id);
        } else if (card.type === 'stat') {
            if (card.id === 'stat_speed') {
                player.speed += 0.5;
            } else if (card.id === 'stat_magnet') {
                player.magnetRadius += 50;
            } else if (card.id === 'stat_health') {
                player.maxHealth += 25;
                player.heal(50);
            }
        }

        this.isLevelingUp = false;
        soundManager.playButtonClick();
    }
}
