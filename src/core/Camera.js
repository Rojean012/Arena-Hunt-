export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(targetX, targetY) {
        // Direct lock: Camera is 100% permanently attached to player!
        this.x = targetX;
        this.y = targetY;
    }

    shake(intensity = 10, duration = 10) {
        // Subtle screen shake without detaching player
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        this.x += dx;
        this.y += dy;
    }

    getScreenX(worldX, canvasWidth) {
        return worldX - this.x + canvasWidth / 2;
    }

    getScreenY(worldY, canvasHeight) {
        return worldY - this.y + canvasHeight / 2;
    }
}
