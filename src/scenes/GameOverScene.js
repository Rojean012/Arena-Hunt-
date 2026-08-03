import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';
import { storageSystem } from '../systems/StorageSystem.js';

export class GameOverScene {
    constructor(sceneManager, gameScene) {
        this.sceneManager = sceneManager;
        this.gameScene = gameScene;
        this.buttons = [];
        this.score = 0;
        this.coins = 0;
        this.isNewHighScore = false;
    }

    enter(data = {}) {
        this.score = data.score || 0;
        this.coins = data.coins || 0;
        this.isNewHighScore = data.isNewHighScore || false;

        if (soundManager && soundManager.playGameOver) {
            soundManager.playGameOver();
        }
    }

    update(engine) {
        if (input.mouse.isJustPressed || input.mouse.isDown) {
            const mx = input.mouse.x;
            const my = input.mouse.y;

            this.buttons.forEach(btn => {
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    if (soundManager && soundManager.playButtonClick) {
                        soundManager.playButtonClick();
                    }
                    input.clearJustPressed();
                    input.mouse.isDown = false;
                    btn.onClick(engine);
                }
            });
        }
    }

    render(ctx, renderer) {
        // Render game background underneath
        if (this.gameScene) {
            this.gameScene.render(ctx, renderer);
        }

        const w = renderer.width;
        const h = renderer.height;

        // Dark dim backdrop
        ctx.fillStyle = 'rgba(11, 15, 25, 0.90)';
        ctx.fillRect(0, 0, w, h);

        this.buttons = [];

        // Header Title (Cinzel Font)
        ctx.textAlign = 'center';
        ctx.font = '900 56px "Cinzel", "Outfit", serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('DEFEATED', w / 2, h / 2 - 120);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '700 20px "Outfit", sans-serif';
        ctx.fillText(`Final Score: ${this.score}`, w / 2, h / 2 - 60);
        ctx.fillText(`Coins Earned: +$${this.coins}`, w / 2, h / 2 - 30);

        if (this.isNewHighScore) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 22px "Outfit", sans-serif';
            ctx.fillText('🏆 NEW HIGH SCORE! 🏆', w / 2, h / 2 + 5);
        }

        // Retry Button
        const retryBtn = { x: w / 2 - 130, y: h / 2 + 45, w: 260, h: 56 };
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(retryBtn.x, retryBtn.y, retryBtn.w, retryBtn.h, 14);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.fillText('PLAY AGAIN', w / 2, retryBtn.y + 36);
        this.buttons.push({ ...retryBtn, onClick: (engine) => engine.startGame() });

        // Menu Button
        const menuBtn = { x: w / 2 - 130, y: h / 2 + 115, w: 260, h: 50 };
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(menuBtn.x, menuBtn.y, menuBtn.w, menuBtn.h, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillText('MAIN MENU', w / 2, menuBtn.y + 32);
        this.buttons.push({ ...menuBtn, onClick: (engine) => engine.openMenu() });
    }

    exit() {}
}
