import { Renderer } from '../rendering/Renderer.js';
import { input } from './Input.js';
import { SceneManager } from '../scenes/SceneManager.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { PauseScene } from '../scenes/PauseScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';
import { platformSDK } from '../sdk/PlatformSDK.js';

export class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.sceneManager = new SceneManager();
        
        input.init(canvas);

        // Pre-create scene instances
        this.menuScene = new MenuScene(this.sceneManager);
        this.gameScene = new GameScene(this.sceneManager);
        this.pauseScene = new PauseScene(this.sceneManager, this.gameScene);
        this.gameOverScene = new GameOverScene(this.sceneManager, this.gameScene);

        this.isRunning = false;
        
        platformSDK.registerLifecycleCallbacks({
            onPause: () => this.onAppPause(),
            onResume: () => this.onAppResume(),
            onMute: () => {},
            onUnmute: () => {}
        });
    }

    async init() {
        await platformSDK.init();
        this.openMenu();
        this.start();
    }

    openMenu() {
        this.sceneManager.switchScene(this.menuScene);
    }

    startGame() {
        this.sceneManager.switchScene(this.gameScene, { isResume: false });
    }

    pauseGame() {
        if (this.sceneManager.currentScene === this.gameScene) {
            this.sceneManager.switchScene(this.pauseScene);
        }
    }

    resumeGame() {
        if (this.sceneManager.currentScene === this.pauseScene) {
            this.sceneManager.switchScene(this.gameScene, { isResume: true });
        }
    }

    triggerGameOver(score, coins, isNewHighScore) {
        this.sceneManager.switchScene(this.gameOverScene, { score, coins, isNewHighScore });
    }

    onAppPause() {
        if (this.sceneManager.currentScene === this.gameScene) {
            this.pauseGame();
        }
    }

    onAppResume() {}

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    loop() {
        if (!this.isRunning) return;

        // Update active scene
        this.sceneManager.update(this);

        // Render active scene
        this.renderer.clear();
        this.sceneManager.render(this.renderer.ctx, this.renderer);

        requestAnimationFrame(this.loop);
    }
}
