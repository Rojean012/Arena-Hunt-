import { BackgroundRenderer } from './BackgroundRenderer.js';
import { UIRenderer } from './UIRenderer.js';

export class Renderer {
    constructor(canvas = null) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.backgroundRenderer = new BackgroundRenderer();
        this.uiRenderer = new UIRenderer();
        
        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(this.dpr, this.dpr);
    }

    render(ctx, camera, player, enemies, gems, coins, weaponManager, particles, width, height) {
        this.backgroundRenderer.render(ctx, camera, width, height);

        gems.forEach(g => {
            const sx = camera.getScreenX(g.x, width);
            const sy = camera.getScreenY(g.y, height);
            g.render(ctx, sx, sy);
        });

        coins.forEach(c => {
            const sx = camera.getScreenX(c.x, width);
            const sy = camera.getScreenY(c.y, height);
            c.render(ctx, sx, sy);
        });

        player.render(ctx, camera.getScreenX(player.x, width), camera.getScreenY(player.y, height));

        enemies.forEach(e => {
            const sx = camera.getScreenX(e.x, width);
            const sy = camera.getScreenY(e.y, height);
            e.render(ctx, sx, sy);
        });

        weaponManager.render(ctx, camera, player, width, height);
        particles.render(ctx, camera, width, height);
    }

    drawBackground(camera) {
        if (this.ctx) {
            this.backgroundRenderer.render(this.ctx, camera, this.width, this.height);
        }
    }

    drawHUD(player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner) {
        if (this.ctx) {
            this.uiRenderer.renderHUD(this.ctx, player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner, this.width, this.height);
        }
    }
}
