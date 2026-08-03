import { BackgroundRenderer } from './BackgroundRenderer.js';
import { UIRenderer } from './UIRenderer.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.backgroundRenderer = new BackgroundRenderer();
        this.uiRenderer = new UIRenderer();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    clear() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(this.dpr, this.dpr);
    }

    drawBackground(camera) {
        this.backgroundRenderer.render(this.ctx, camera, this.width, this.height);
    }

    drawHUD(player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner) {
        this.uiRenderer.renderHUD(this.ctx, player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner, this.width, this.height);
    }
}
