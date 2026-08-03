/**
 * SceneManager - State Machine for handling transitions between Title, Gameplay, Upgrades, Pause, and GameOver.
 */
export class SceneManager {
    constructor() {
        this.currentScene = null;
    }

    switchScene(newScene, data = {}) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }

        this.currentScene = newScene;
        
        if (this.currentScene && this.currentScene.enter) {
            this.currentScene.enter(data);
        }
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
