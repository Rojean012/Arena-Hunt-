/**
 * SceneManager - State Machine for handling transitions between Title, Gameplay, Upgrades, Pause, and GameOver.
 */
export class SceneManager {
    constructor() {
        this.currentScene = null;
        this.scenes = {};
    }

    registerScene(name, instance) {
        this.scenes[name] = instance;
    }

    switchScene(newScene, data = {}) {
        let target = newScene;

        if (typeof newScene === 'string') {
            target = this.scenes[newScene] || (window.gameEngine ? window.gameEngine[`${newScene}Scene`] : null);
        }

        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }

        this.currentScene = target;
        
        if (this.currentScene && this.currentScene.enter) {
            this.currentScene.enter(data);
        }
    }

    push(sceneName, data = {}) {
        this.switchScene(sceneName, data);
    }

    pop(data = {}) {
        this.switchScene('game', data);
    }

    change(sceneName, data = {}) {
        this.switchScene(sceneName, data);
    }

    update(engine) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(engine);
        }
    }

    render(ctx, renderer) {
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(ctx, renderer);
        }
    }
}
