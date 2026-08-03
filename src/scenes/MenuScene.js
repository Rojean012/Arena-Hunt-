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
        const w = renderer.width;
        const h = renderer.height;

        this.buttons = [];

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Title (Cinzel Font)
        ctx.textAlign = 'center';
        ctx.font = '900 64px "Cinzel", "Outfit", serif';

        const titleGrad = ctx.createLinearGradient(0, h / 2 - 150, 0, h / 2 - 80);
        titleGrad.addColorStop(0, '#fef08a');
        titleGrad.addColorStop(0.5, '#eab308');
        titleGrad.addColorStop(1, '#ca8a04');

        ctx.fillStyle = titleGrad;
        ctx.fillText('ARENA HUNT', w / 2, h / 2 - 120);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 22px "Outfit", sans-serif';
        ctx.fillText('Renegade Immortal Survivor', w / 2, h / 2 - 70);

        // High Score
        const highScore = storageSystem.getHighScore();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 20px "Outfit", sans-serif';
        ctx.fillText(`Best Score: ${highScore}`, w / 2, h / 2 - 20);

        // Start Game Button
        const playBtn = { x: w / 2 - 140, y: h / 2 + 30, w: 280, h: 60 };
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px "Outfit", sans-serif';
        ctx.fillText('START GAME', w / 2, playBtn.y + 40);
        this.buttons.push({ ...playBtn, onClick: (engine) => engine.startGame() });

        // Game Instructions
        ctx.fillStyle = '#64748b';
        ctx.font = '500 15px "Outfit", sans-serif';
        ctx.fillText('Move with WASD / Arrow Keys | Collect Emerald Gems to unlock Xianxia Powers!', w / 2, h - 50);
    }

    exit() {}
}
