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
        // Render current active game scene state underneath
        if (this.gameScene) {
            this.gameScene.render(ctx, renderer);
        }

        const w = renderer.width;
        const h = renderer.height;

        // Dark dim glassmorphism backdrop
        ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
        ctx.fillRect(0, 0, w, h);

        this.buttons = [];

        // Title (Cinzel Font)
        ctx.textAlign = 'center';
        ctx.font = '900 48px "Cinzel", "Outfit", serif';

        const titleGrad = ctx.createLinearGradient(0, h / 2 - 110, 0, h / 2 - 60);
        titleGrad.addColorStop(0, '#fef08a');
        titleGrad.addColorStop(1, '#eab308');

        ctx.fillStyle = titleGrad;
        ctx.fillText('GAME PAUSED', w / 2, h / 2 - 80);

        // Resume Button
        const resumeBtn = { x: w / 2 - 130, y: h / 2 - 10, w: 260, h: 52 };
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px "Outfit", sans-serif';
        ctx.fillText('RESUME GAME', w / 2, resumeBtn.y + 33);
        this.buttons.push({ ...resumeBtn, onClick: (engine) => engine.resumeGame() });

        // Sound Toggle Button
        const soundBtn = { x: w / 2 - 130, y: h / 2 + 58, w: 260, h: 52 };
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(soundBtn.x, soundBtn.y, soundBtn.w, soundBtn.h, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillText(soundManager.isMuted ? 'SOUND: OFF' : 'SOUND: ON', w / 2, soundBtn.y + 33);
        this.buttons.push({
            ...soundBtn,
            onClick: () => {
                soundManager.setMuted(!soundManager.isMuted);
            }
        });

        // Quit Button
        const quitBtn = { x: w / 2 - 130, y: h / 2 + 126, w: 260, h: 52 };
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillText('QUIT TO MENU', w / 2, quitBtn.y + 33);
        this.buttons.push({ ...quitBtn, onClick: (engine) => engine.openMenu() });
    }

    exit() {}
}
