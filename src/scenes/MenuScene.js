import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';
import { storageSystem } from '../systems/StorageSystem.js';

export class MenuScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.buttons = [];
    }

    enter() {
        soundManager.init();
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
        const w = renderer.width;
        const h = renderer.height;

        this.buttons = [];

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 64px Arial';
        ctx.fillText('ARENA HUNT', w / 2, h / 2 - 120);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('Action Roguelike Survivor', w / 2, h / 2 - 70);

        // High Score
        const highScore = storageSystem.getHighScore();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`Best Score: ${highScore}`, w / 2, h / 2 - 20);

        // Start Game Button
        const playBtn = { x: w / 2 - 140, y: h / 2 + 30, w: 280, h: 60 };
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('START GAME', w / 2, playBtn.y + 40);
        this.buttons.push({ ...playBtn, onClick: (engine) => engine.startGame() });

        // Game Instructions
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.fillText('Move with WASD / Arrow Keys | Defeat monsters & collect Gems to get In-Game Upgrades!', w / 2, h - 50);
    }

    exit() {}
}
