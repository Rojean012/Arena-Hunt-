import { Engine } from './core/Engine.js';

function boot() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const engine = new Engine(canvas);
        window.gameEngine = engine;
        engine.init();
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
