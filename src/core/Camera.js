/**
 * Camera - Decoupled 2D Follow Camera with Screen Shake & Smooth Lerp
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.lerpSpeed = 0.15;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    shake(intensity = 8, duration = 15) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    update() {
        // Smooth lerp towards target
        this.x += (this.targetX - this.x) * this.lerpSpeed;
        this.y += (this.targetY - this.y) * this.lerpSpeed;

        // Apply screen shake
        if (this.shakeDuration > 0) {
            this.offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeDuration--;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    getWorldX(screenX, canvasWidth) {
        return screenX - canvasWidth / 2 + this.x + this.offsetX;
    }

    getWorldY(screenY, canvasHeight) {
        return screenY - canvasHeight / 2 + this.y + this.offsetY;
    }

    getScreenX(worldX, canvasWidth) {
        return worldX - this.x - this.offsetX + canvasWidth / 2;
    }

    getScreenY(worldY, canvasHeight) {
        return worldY - this.y - this.offsetY + canvasHeight / 2;
    }
}
