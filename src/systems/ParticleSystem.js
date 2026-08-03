/**
 * ParticleSystem - Visual juice effects (sparks, blood splatters, sparkles, elemental trail effects)
 */
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    render(ctx, screenX, screenY) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.5, this.size * (this.life / this.maxLife)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawnBlood(x, y, amount = 8) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 4;
            const life = 20 + Math.floor(Math.random() * 20);
            this.particles.push(new Particle(x, y, vx, vy, '#c0392b', size, life));
        }
    }

    spawnMuzzleFlash(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.4;
            const speed = 3 + Math.random() * 5;
            const vx = Math.cos(spreadAngle) * speed;
            const vy = Math.sin(spreadAngle) * speed;
            const size = 2 + Math.random() * 3;
            const life = 6 + Math.floor(Math.random() * 6);
            this.particles.push(new Particle(x, y, vx, vy, '#f39c12', size, life));
        }
    }

    spawnCoinSparkle(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 2;
            const life = 15 + Math.floor(Math.random() * 10);
            this.particles.push(new Particle(x, y, vx, vy, '#f1c40f', size, life));
        }
    }

    spawnSwordSparkle(x, y) {
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 2.5;
            const color = Math.random() < 0.5 ? '#38bdf8' : '#fef08a';
            this.particles.push(new Particle(x, y, vx, vy, color, size, 12));
        }
    }

    spawnExplosion(x, y) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 4 + Math.random() * 5;
            const color = Math.random() < 0.6 ? '#f97316' : '#facc15';
            this.particles.push(new Particle(x, y, vx, vy, color, size, 22));
        }
    }

    spawnFlameEmbers(x, y) {
        for (let i = 0; i < 2; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 3;
            const color = Math.random() < 0.7 ? '#ef4444' : '#f97316';
            this.particles.push(new Particle(x, y, vx, vy, color, size, 16));
        }
    }

    spawnStardust(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.particles.push(new Particle(x, y, vx, vy, '#00ffff', 2.5, 14));
    }

    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.dead);
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        this.particles.forEach(p => {
            const sx = camera.getScreenX(p.x, canvasWidth);
            const sy = camera.getScreenY(p.y, canvasHeight);
            p.render(ctx, sx, sy);
        });
    }

    clear() {
        this.particles = [];
    }
}
