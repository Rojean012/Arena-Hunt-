import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';

export class PauseScene {
    constructor(sceneManager, gameScene) {
        this.sceneManager = sceneManager;
        this.gameScene = gameScene;
        this.buttons = [];
    }

    enter() {}

    update(engine) {
        if (input.keys['p'] || input.keys['escape']) {
            input.keys['p'] = false;
            input.keys['escape'] = false;
            engine.resumeGame();
            return;
        }

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
        // Render current game state underneath
        if (this.gameScene) {
            this.gameScene.render(ctx, renderer);
        }

        const w = renderer.width;
        const h = renderer.height;

        // Dark dim backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, w, h);

        this.buttons = [];

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px Arial';
        ctx.fillText('GAME PAUSED', w / 2, h / 2 - 90);

        // Resume Button
        const resumeBtn = { x: w / 2 - 110, y: h / 2 - 20, w: 220, h: 50 };
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('RESUME', w / 2, resumeBtn.y + 33);
        this.buttons.push({ ...resumeBtn, onClick: (engine) => engine.resumeGame() });

        // Sound Toggle Button
        const soundBtn = { x: w / 2 - 110, y: h / 2 + 45, w: 220, h: 50 };
        ctx.fillStyle = '#3498db';
        ctx.fillRect(soundBtn.x, soundBtn.y, soundBtn.w, soundBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(soundManager.isMuted ? 'SOUND: OFF' : 'SOUND: ON', w / 2, soundBtn.y + 33);
        this.buttons.push({
            ...soundBtn,
            onClick: () => {
                soundManager.setMuted(!soundManager.isMuted);
            }
        });

        // Quit Button
        const quitBtn = { x: w / 2 - 110, y: h / 2 + 110, w: 220, h: 50 };
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('QUIT TO MENU', w / 2, quitBtn.y + 33);
        this.buttons.push({ ...quitBtn, onClick: (engine) => engine.openMenu() });
    }

    exit() {}
}
