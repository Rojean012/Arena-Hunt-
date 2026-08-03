/**
 * Base Entity Class
 */
export class Entity {
    constructor(x = 0, y = 0, radius = 20, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dead = false;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        // Override in subclass
    }

    getDistanceTo(other) {
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    isCollidingWith(other) {
        return this.getDistanceTo(other) < (this.radius + other.radius);
    }
}
