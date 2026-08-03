import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';
import { storageSystem } from '../systems/StorageSystem.js';
import { platformSDK } from '../sdk/PlatformSDK.js';

export class GameOverScene {
    constructor(sceneManager, gameScene) {
        this.sceneManager = sceneManager;
        this.gameScene = gameScene;
        this.buttons = [];
        this.score = 0;
        this.coinsEarned = 0;
        this.isNewHighScore = false;
        this.hasDoubledCoins = false;
    }

    enter(data = {}) {
        this.score = data.score || 0;
        this.coinsEarned = data.coins || 0;
        this.isNewHighScore = data.isNewHighScore || false;
        this.hasDoubledCoins = false;

        // Submit score to portal leaderboards if applicable
        platformSDK.submitScore(this.score);

        // Show interstitial ad on game over (portal requirement)
        platformSDK.showCommercialBreak();
    }

    update(engine) {
        if (input.mouse.isJustPressed) {
            const mx = input.mouse.x;
            const my = input.mouse.y;

            this.buttons.forEach(btn => {
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    soundManager.playButtonClick();
                    btn.onClick(engine);
                }
            });

            input.clearJustPressed();
        }
    }

    render(ctx, renderer) {
        // Draw gameplay background underneath
        if (this.gameScene) {
            this.gameScene.render(ctx, renderer);
        }

        const w = renderer.width;
        const h = renderer.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        this.buttons = [];

        // Game Over Banner
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 60px Arial';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 130);

        if (this.isNewHighScore) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('★ NEW HIGH SCORE! ★', w / 2, h / 2 - 85);
        }

        // Stats summary
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${this.score}`, w / 2, h / 2 - 40);
        ctx.fillText(`Coins Collected: +$${this.coinsEarned}`, w / 2, h / 2 - 5);

        // Rewarded Ad: Double Coins Button
        if (!this.hasDoubledCoins && this.coinsEarned > 0) {
            const adBtn = { x: w / 2 - 140, y: h / 2 + 35, w: 280, h: 48 };
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(adBtn.x, adBtn.y, adBtn.w, adBtn.h);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('🎬 WATCH AD: 2X COINS', w / 2, adBtn.y + 30);

            this.buttons.push({
                ...adBtn,
                onClick: async () => {
                    const success = await platformSDK.showRewardedBreak();
                    if (success && !this.hasDoubledCoins) {
                        this.hasDoubledCoins = true;
                        storageSystem.addCoins(this.coinsEarned); // Add second portion
                        this.coinsEarned *= 2;
                        soundManager.playCoinCollect();
                    }
                }
            });
        }

        // Restart Button
        const playBtn = { x: w / 2 - 120, y: h / 2 + 100, w: 240, h: 54 };
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('PLAY AGAIN', w / 2, playBtn.y + 35);
        this.buttons.push({ ...playBtn, onClick: (engine) => engine.startGame() });

        // Menu Button
        const menuBtn = { x: w / 2 - 120, y: h / 2 + 170, w: 240, h: 44 };
        ctx.fillStyle = '#34495e';
        ctx.fillRect(menuBtn.x, menuBtn.y, menuBtn.w, menuBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('MAIN MENU', w / 2, menuBtn.y + 28);
        this.buttons.push({ ...menuBtn, onClick: (engine) => engine.openMenu() });
    }

    exit() {}
}
