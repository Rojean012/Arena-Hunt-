/**
 * StorageSystem - Handles persistent progress (high scores, coins, shop upgrades)
 */
export class StorageSystem {
    constructor() {
        this.STORAGE_KEY = 'ArenaHunt_SaveData_v1';
        this.data = this.load();
    }

    static saveHighScore(score) {
        return storageSystem.setHighScore(score);
    }

    static addCoins(amount) {
        return storageSystem.addCoins(amount);
    }

    load() {
        const defaults = {
            highScore: 0,
            totalCoins: 0,
            upgrades: {
                damageLevel: 1,
                speedLevel: 1,
                healthLevel: 1,
                fireRateLevel: 1
            }
        };

        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                return { ...defaults, ...JSON.parse(raw) };
            }
        } catch (e) {
            console.warn('[Storage] LocalStorage unavailable, using memory fallback');
        }
        return defaults;
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('[Storage] Failed to save data');
        }
    }

    getHighScore() {
        return this.data.highScore;
    }

    setHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            this.save();
            return true;
        }
        return false;
    }

    saveHighScore(score) {
        return this.setHighScore(score);
    }

    getTotalCoins() {
        return this.data.totalCoins;
    }

    addCoins(amount) {
        this.data.totalCoins += amount;
        this.save();
    }

    getUpgradeLevel(key) {
        return this.data.upgrades[key] || 1;
    }

    upgrade(key, cost) {
        if (this.data.totalCoins >= cost) {
            this.data.totalCoins -= cost;
            this.data.upgrades[key] = (this.data.upgrades[key] || 1) + 1;
            this.save();
            return true;
        }
        return false;
    }
}

export const storageSystem = new StorageSystem();
