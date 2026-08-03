/**
 * InputManager - Cross-platform Mouse, Keyboard & Touch Input System with Bulletproof Click Queueing
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, isJustPressed: false, clickPending: false };
        this.touch = { active: false, x: 0, y: 0 };
        this.listenersAttached = false;
    }

    init(canvas) {
        if (this.listenersAttached) return;
        this.canvas = canvas;

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.updateMousePos(e);
        });

        window.addEventListener('mousedown', (e) => {
            this.updateMousePos(e);
            this.mouse.isDown = true;
            this.mouse.isJustPressed = true;
            this.mouse.clickPending = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });

        window.addEventListener('click', (e) => {
            this.updateMousePos(e);
            this.mouse.clickPending = true;
        });

        // Touch support
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.updateTouchPos(e.touches[0]);
                this.mouse.isDown = true;
                this.mouse.isJustPressed = true;
                this.mouse.clickPending = true;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.updateTouchPos(e.touches[0]);
            }
        });

        window.addEventListener('touchend', () => {
            this.mouse.isDown = false;
            this.touch.active = false;
        });

        this.listenersAttached = true;
    }

    updateMousePos(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        
        // Map mouse position directly to CSS logical pixels
        this.mouse.x = (e.clientX - rect.left) * (window.innerWidth / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (window.innerHeight / rect.height);
    }

    updateTouchPos(touch) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        this.mouse.x = (touch.clientX - rect.left) * (window.innerWidth / rect.width);
        this.mouse.y = (touch.clientY - rect.top) * (window.innerHeight / rect.height);
        this.touch.active = true;
        this.touch.x = this.mouse.x;
        this.touch.y = this.mouse.y;
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        return { x: dx, y: dy };
    }

    isShootPressed() {
        return this.mouse.isDown || this.keys['space'];
    }

    wasJustClicked() {
        return this.mouse.isJustPressed || this.mouse.clickPending;
    }

    consumeClick() {
        this.mouse.isJustPressed = false;
        this.mouse.clickPending = false;
        this.mouse.isDown = false;
    }

    clearJustPressed() {
        this.consumeClick();
    }
}

export const input = new InputManager();
