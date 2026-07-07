const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- GAME DATA ---
const player = {
    x: 0,
    y: 0,
    radius: 30,
    color: '#3498db',
    speed: 5,
    mouseAngle: 0,
    health: 100,
    maxHealth: 100,
    invincible: 0
};

const camera = { x: 0, y: 0 };

let enemies = [];
let bullets = []; 
let coins = [];
let coinTimer = 120 + Math.floor(Math.random() * 240);
let score = 0;
let gameOver = false;
let mouse = { x: 0, y: 0 };
let mouseDown = false;
let shootCooldown = 0;
const SHOOT_INTERVAL = 8;

const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

// --- INPUT TRACKING ---
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

function fireBullet() {
    const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
    bullets.push({
        x: player.x,
        y: player.y,
        radius: 5,
        color: '#f1c40f', 
        velocity: {
            x: Math.cos(angle) * 12, 
            y: Math.sin(angle) * 12
        },
        dead: false 
    });
}

window.addEventListener('mousedown', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouseDown = true;

    if (gameOver) {
        score = 0;
        enemies = [];
        bullets = [];
        coins = [];
        coinTimer = 120 + Math.floor(Math.random() * 240);
        player.x = 0;
        player.y = 0;
        player.health = player.maxHealth;
        player.invincible = 0;
        gameOver = false;
        gameLoop();
        return;
    }

    fireBullet();
    shootCooldown = SHOOT_INTERVAL;
});

window.addEventListener('mouseup', () => {
    mouseDown = false;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// --- AUDIO ---
function playEnemyDeathSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
    } catch (_) { /* audio not supported */ }
}

// --- SPAWN LOGIC ---
function viewportWorldX(x) { return x - canvas.width / 2 + camera.x; }
function viewportWorldY(y) { return y - canvas.height / 2 + camera.y; }

function spawnEnemy() {
    if (gameOver) return;

    const radius = 22;
    const margin = 60;
    let x, y;

    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? viewportWorldX(-margin) : viewportWorldX(canvas.width + margin);
        y = viewportWorldY(Math.random() * canvas.height);
    } else {
        x = viewportWorldX(Math.random() * canvas.width);
        y = Math.random() < 0.5 ? viewportWorldY(-margin) : viewportWorldY(canvas.height + margin);
    }

    enemies.push({ x: x, y: y, radius: radius, color: '#e74c3c', speed: 2, dead: false });
}
setInterval(spawnEnemy, 1000);

function spawnCoin() {
    if (gameOver) return;
    coins.push({
        x: viewportWorldX(40 + Math.random() * (canvas.width - 80)),
        y: viewportWorldY(40 + Math.random() * (canvas.height - 80)),
        radius: 10,
        bob: 0
    });
}

// --- MAIN GAME LOGIC ---
function update() {
    // 1. Player Movement
    if (keys.a || keys.ArrowLeft) player.x -= player.speed;
    if (keys.d || keys.ArrowRight) player.x += player.speed;
    if (keys.w || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;

    camera.x = player.x;
    camera.y = player.y;

    player.mouseAngle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);

    // 2. Bullet Movement
    bullets.forEach((bullet) => {
        bullet.x += bullet.velocity.x;
        bullet.y += bullet.velocity.y;
        const bx = bullet.x - camera.x + canvas.width / 2;
        const by = bullet.y - camera.y + canvas.height / 2;
        if (bx < -100 || bx > canvas.width + 100 || by < -100 || by > canvas.height + 100) {
            bullet.dead = true;
        }
    });

    // 3. Enemy Logic & Collisions
    enemies.forEach((enemy) => {
        // Move enemy toward player
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Enemy touches Player - deal damage
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer < enemy.radius + player.radius && player.invincible <= 0) {
            player.health -= 20;
            player.invincible = 30;
            // Push enemy back
            enemy.x -= Math.cos(angle) * 40;
            enemy.y -= Math.sin(angle) * 40;
            if (player.health <= 0) {
                gameOver = true;
            }
        }

        // Check if Bullet touches Enemy
        bullets.forEach((bullet) => {
            const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (distance < enemy.radius + bullet.radius) {
                enemy.dead = true;
                bullet.dead = true;
                score += 10;
                playEnemyDeathSound();
            }
        });
    });

    if (player.invincible > 0) player.invincible--;

    // 4. Coin spawn & collection
    coinTimer--;
    if (coinTimer <= 0) {
        spawnCoin();
        coinTimer = 120 + Math.floor(Math.random() * 240);
    }

    coins.forEach((coin) => {
        coin.bob += 0.05;
        if (Math.hypot(player.x - coin.x, player.y - coin.y) < player.radius + coin.radius) {
            coin.dead = true;
            score += 5;
        }
    });
    coins = coins.filter(c => !c.dead);

    // 5. Continuous shooting while holding mouse
    if (mouseDown && shootCooldown <= 0) {
        fireBullet();
        shootCooldown = SHOOT_INTERVAL;
    }
    if (shootCooldown > 0) shootCooldown--;

    // 5. Garbage Collection
    enemies = enemies.filter(enemy => !enemy.dead && Math.hypot(enemy.x - player.x, enemy.y - player.y) < canvas.width * 1.5);
    bullets = bullets.filter(bullet => !bullet.dead);
}

// --- HELPERS ---
function scrX(wx) { return wx - camera.x + canvas.width / 2; }
function scrY(wy) { return wy - camera.y + canvas.height / 2; }

// Seeded random based on tile coords for deterministic landmarks
function tileSeed(tx, ty) {
    let h = tx * 374761393 + ty * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0x7fffffff;
}
function tileRand(tx, ty) { return tileSeed(tx, ty) / 0x7fffffff; }

// --- RENDERING ---
function drawBackground() {
    const tileSize = 60;
    const left = Math.floor((camera.x - canvas.width / 2) / tileSize) - 1;
    const right = Math.ceil((camera.x + canvas.width / 2) / tileSize) + 1;
    const top = Math.floor((camera.y - canvas.height / 2) / tileSize) - 1;
    const bottom = Math.ceil((camera.y + canvas.height / 2) / tileSize) + 1;

    for (let ty = top; ty < bottom; ty++) {
        for (let tx = left; tx < right; tx++) {
            const x = scrX(tx * tileSize);
            const y = scrY(ty * tileSize);
            const r = tileRand(tx, ty);

            // Base tile
            const isDark = (tx + ty) % 2 === 0;
            let shade = isDark ? '#282828' : '#2d2d2d';

            // Variations
            if (r < 0.05) shade = '#2a2520';
            else if (r < 0.08) shade = '#20252a';
            else if (r < 0.12) shade = '#252a22';

            ctx.fillStyle = shade;
            ctx.fillRect(x, y, tileSize, tileSize);

            // Tile border
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, tileSize, tileSize);

            // --- Landmarks ---
            const lx = tx * tileSize;
            const ly = ty * tileSize;
            const r2 = tileRand(tx + 1000, ty + 2000);
            const r3 = tileRand(tx + 3000, ty + 4000);

            // Bloodstain
            if (r2 < 0.04) {
                ctx.fillStyle = 'rgba(80, 10, 10, 0.3)';
                ctx.beginPath();
                ctx.ellipse(x + tileSize * r3, y + tileSize * tileRand(tx + 5000, ty + 6000), 8 + r2 * 12, 4 + r2 * 6, r2 * 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Grass tuft
            if (r2 > 0.08 && r2 < 0.10) {
                for (let i = 0; i < 3; i++) {
                    const gx = x + 10 + tileRand(tx + i * 100, ty) * (tileSize - 20);
                    const gy = y + tileSize * 0.6 + tileRand(tx, ty + i * 100) * tileSize * 0.3;
                    ctx.strokeStyle = '#3a4a2a';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(gx, gy);
                    ctx.lineTo(gx - 2 + tileRand(tx + i, ty) * 4, gy - 6 - tileRand(tx, ty + i) * 4);
                    ctx.stroke();
                }
            }

            // Cracked tile
            if (r3 > 0.12 && r3 < 0.13) {
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 10);
                ctx.lineTo(x + 20, y + 30);
                ctx.lineTo(x + 15, y + 50);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + 45, y + 5);
                ctx.lineTo(x + 35, y + 25);
                ctx.stroke();
            }

            // Small rock
            if (r2 > 0.14 && r2 < 0.15) {
                ctx.fillStyle = '#3a3a3a';
                ctx.beginPath();
                ctx.ellipse(x + tileSize * r3, y + tileSize * tileRand(tx + 7000, ty + 8000), 3 + r2 * 2, 2 + r2 * 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Torch landmarks (sparser, placed based on world coords)
    for (let ty = top; ty < bottom; ty++) {
        for (let tx = left; tx < right; tx++) {
            const r = tileRand(tx * 7 + 13, ty * 13 + 7);
            if (r > 0.003) continue;

            const wx = tx * tileSize + tileSize * tileRand(tx + 111, ty + 222);
            const wy = ty * tileSize + tileSize * tileRand(tx + 333, ty + 444);
            const sx = scrX(wx);
            const sy = scrY(wy);

            // Post
            ctx.fillStyle = '#3a3028';
            ctx.fillRect(sx - 1.5, sy - 8, 3, 16);

            // Fire glow
            const grad = ctx.createRadialGradient(sx, sy - 12, 2, sx, sy - 12, 18);
            grad.addColorStop(0, 'rgba(255, 180, 50, 0.5)');
            grad.addColorStop(0.4, 'rgba(255, 100, 20, 0.2)');
            grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy - 12, 18, 0, Math.PI * 2);
            ctx.fill();

            // Fire core
            ctx.fillStyle = '#ffa030';
            ctx.beginPath();
            ctx.arc(sx, sy - 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Vignette
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.2, canvas.width / 2, canvas.height / 2, canvas.height * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    drawPlayerSprite(canvas.width / 2, canvas.height / 2, player.radius, player.mouseAngle);

    bullets.forEach((bullet) => {
        const bx = scrX(bullet.x);
        const by = scrY(bullet.y);
        ctx.beginPath();
        ctx.arc(bx, by, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
        ctx.closePath();
    });

    coins.forEach((coin) => {
        const cx = scrX(coin.x);
        const cy = scrY(coin.y);
        const scale = Math.abs(Math.sin(coin.bob));
        const sy = cy - Math.sin(coin.bob) * 2;

        ctx.save();
        ctx.translate(cx, sy);
        ctx.scale(1, 0.3 + scale * 0.7);

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', cx, sy + 4);
    });

    enemies.forEach((enemy) => {
        drawEnemySprite(scrX(enemy.x), scrY(enemy.y), enemy.radius);
    });

    // Health bar
    const barW = 200;
    const barH = 20;
    const barX = 20;
    const barY = 20;
    const healthPct = player.health / player.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * healthPct, barH - 4);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.health} / ${player.maxHealth}`, barX + barW / 2, barY + 15);

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 65);
}

// --- SPRITE DRAWING ---
function drawPlayerSprite(x, y, r, angle) {
    const bodyW = r * 1.2;
    const bodyH = r * 0.9;
    const headR = r * 0.4;
    const bodyColor = player.invincible > 0 && Math.floor(player.invincible / 3) % 2 ? '#ff6b6b' : '#4a6741';
    const gearColor = '#3d5a2e';

    // Shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 5, r * 1.1, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // --- LEGS ---
    ctx.fillStyle = '#2d3a2a';
    const legOff = r * 0.22;
    const legW = r * 0.22;
    const legH = r * 0.55;
    ctx.fillRect(x - legOff - legW / 2, y + bodyH * 0.2, legW, legH);
    ctx.fillRect(x + legOff - legW / 2, y + bodyH * 0.2, legW, legH);

    // Knee pads
    ctx.fillStyle = '#3a4a35';
    ctx.fillRect(x - legOff - legW / 2 - 1, y + bodyH * 0.2 + legH * 0.45, legW + 2, 5);
    ctx.fillRect(x + legOff - legW / 2 - 1, y + bodyH * 0.2 + legH * 0.45, legW + 2, 5);

    // Boots
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - legOff - 4, y + bodyH * 0.2 + legH - 2, 8, 5);
    ctx.fillRect(x + legOff - 4, y + bodyH * 0.2 + legH - 2, 8, 5);

    // --- BACKPACK ---
    ctx.beginPath();
    ctx.ellipse(x, y - 4, bodyW * 0.35, bodyH * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = gearColor;
    ctx.fill();
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(x - 5, y - 10, 10, 12);

    // --- TORSO (tactical vest) ---
    ctx.beginPath();
    ctx.ellipse(x, y + 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.strokeStyle = '#2d4a24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vest pouches
    ctx.fillStyle = gearColor;
    for (let i = -1; i <= 1; i += 0.5) {
        ctx.fillRect(x + i * bodyW * 0.22 - 3, y - bodyH * 0.1, 6, 8);
    }

    // Vest center zipper
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - bodyH * 0.3);
    ctx.lineTo(x, y + bodyH * 0.3);
    ctx.stroke();

    // Shoulder pads
    ctx.fillStyle = gearColor;
    ctx.beginPath();
    ctx.ellipse(x - bodyW * 0.35, y - bodyH * 0.05, r * 0.15, r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + bodyW * 0.35, y - bodyH * 0.05, r * 0.15, r * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // --- ARMS AND RIFLE ---
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const rifleStock = r * 0.2;
    const rifleReceiver = r * 0.5;
    const rifleBarrel = r * 1.35;
    const rifleEnd = r * 1.5;

    const rearHandX = rifleStock + r * 0.18;
    const frontHandX = rifleReceiver + (rifleBarrel - rifleReceiver) * 0.35;

    const shoulderSpread = r * 0.3;
    const armW = r * 0.18;

    // Right arm sleeve
    ctx.save();
    ctx.translate(0, -shoulderSpread);
    ctx.rotate(Math.atan2(shoulderSpread, rearHandX));
    ctx.fillStyle = gearColor;
    ctx.fillRect(0, -armW / 2, Math.hypot(rearHandX, shoulderSpread) * 0.7, armW);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(Math.hypot(rearHandX, shoulderSpread) * 0.7, -armW / 2, Math.hypot(rearHandX, shoulderSpread) * 0.3, armW);
    ctx.restore();

    // Left arm sleeve
    ctx.save();
    ctx.translate(0, shoulderSpread);
    ctx.rotate(Math.atan2(-shoulderSpread, frontHandX));
    ctx.fillStyle = gearColor;
    ctx.fillRect(0, -armW / 2, Math.hypot(frontHandX, shoulderSpread) * 0.7, armW);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(Math.hypot(frontHandX, shoulderSpread) * 0.7, -armW / 2, Math.hypot(frontHandX, shoulderSpread) * 0.3, armW);
    ctx.restore();

    // --- RIFLE ---
    // Stock
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(rifleStock, -3, r * 0.18, 6);

    // Receiver
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(rifleStock + r * 0.18, -4.5, rifleReceiver - rifleStock - r * 0.18, 9);

    // Picatinny rail on top
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(rifleStock + r * 0.18 + 2, -6, rifleReceiver - rifleStock - r * 0.18 - 4, 2);

    // Magazine
    ctx.fillStyle = '#111';
    ctx.fillRect(rifleReceiver - 5, 3, 8, 8);

    // Foregrip
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(frontHandX - 2, 3, 4, 6);

    // Barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(rifleReceiver, -2.5, rifleBarrel - rifleReceiver, 5);

    // Suppressor
    ctx.fillStyle = '#222';
    ctx.fillRect(rifleBarrel, -3.5, rifleEnd - rifleBarrel, 7);

    // Scope
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(rifleReceiver - 8, -10, 14, 6);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(rifleReceiver - 6, -9, 10, 4);

    // Scope lens
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(rifleReceiver + 4, -8, 3, 3);

    // Right glove (trigger hand)
    ctx.beginPath();
    ctx.arc(rearHandX, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#2a3a2a';
    ctx.fill();

    // Left glove (forend hand)
    ctx.beginPath();
    ctx.arc(frontHandX, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#2a3a2a';
    ctx.fill();

    ctx.restore();

    // --- HEAD ---
    const headY = y - r * 0.35;
    const isFlashing = player.invincible > 0 && Math.floor(player.invincible / 3) % 2;

    // Head base
    ctx.beginPath();
    ctx.arc(x, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = isFlashing ? '#ff6b6b' : '#d4a574';
    ctx.fill();

    // Helmet
    ctx.fillStyle = isFlashing ? '#ff6b6b' : gearColor;
    ctx.beginPath();
    ctx.ellipse(x, headY - 1, headR * 0.95, headR * 0.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Helmet visor
    ctx.fillStyle = isFlashing ? '#ff8888' : '#2a3a4a';
    ctx.beginPath();
    ctx.ellipse(x, headY + 1, headR * 0.5, headR * 0.2, 0, 0, Math.PI);
    ctx.fill();

    // Helmet rail
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - headR * 0.5, headY - headR * 0.55, headR, 2);

    // NVG mount on helmet
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - 3, headY - headR * 0.6, 6, 3);

    // Ears / Comms headset
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x - headR * 0.8, headY + 1, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + headR * 0.8, headY + 1, r * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeDist = headR * 0.35;
    const eyeR = 2;
    ctx.fillStyle = '#1a1a1a';
    for (let side = -1; side <= 1; side += 2) {
        const ex = x + Math.cos(angle + side * 0.25) * eyeDist;
        const ey = headY + 1 + Math.sin(angle + side * 0.25) * eyeDist;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemySprite(x, y, r) {
    const headR = r * 0.5;
    const bodyW = r * 1.2;
    const bodyH = r * 0.9;

    // Shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 4, bodyW / 2 + 2, bodyH / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(x, y, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8e1a1a';
    ctx.fill();
    ctx.strokeStyle = '#5c0e0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Body veins
    ctx.strokeStyle = '#6b1010';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(x + i * bodyW * 0.3, y - bodyH * 0.2);
        ctx.lineTo(x + i * bodyW * 0.45, y + bodyH * 0.3);
        ctx.stroke();
    }

    // Claws / spikes on sides
    ctx.fillStyle = '#5c0e0e';
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
            const sy = y - bodyH * 0.3 + i * bodyH * 0.3;
            ctx.beginPath();
            ctx.moveTo(x + side * bodyW / 2, sy);
            ctx.lineTo(x + side * (bodyW / 2 + r * 0.4), sy + 3);
            ctx.lineTo(x + side * bodyW / 2, sy + 6);
            ctx.fill();
        }
    }

    // Head
    const headY = y - r * 0.35;
    ctx.beginPath();
    ctx.arc(x, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#a83232';
    ctx.fill();
    ctx.strokeStyle = '#7a1f1f';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Angry eyes (glowing)
    const eyeDist = headR * 0.35;
    const eyeR = 3;
    for (let side = -1; side <= 1; side += 2) {
        const ex = x + side * eyeDist;
        const ey = headY - 1;
        // Glow
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.fill();
        // Eye
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        // Pupil
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
    }

    // Mouth / teeth
    ctx.fillStyle = '#3a0a0a';
    ctx.beginPath();
    ctx.arc(x, headY + headR * 0.4, headR * 0.35, 0, Math.PI);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#ecf0f1';
    for (let i = -1; i <= 1; i += 0.67) {
        const tx = x + i * headR * 0.2;
        ctx.fillRect(tx - 1.5, headY + headR * 0.3, 3, 4);
    }

    // Horns
    ctx.fillStyle = '#4a0e0e';
    for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(x + side * headR * 0.6, headY - headR * 0.3);
        ctx.lineTo(x + side * headR * 1.0, headY - headR * 0.9);
        ctx.lineTo(x + side * headR * 0.4, headY - headR * 0.5);
        ctx.fill();
    }
}

// --- THE LOOP ---
function gameLoop() {
    // NEW: If the game is over, draw the death screen and STOP the loop
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; // Dim the screen
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        ctx.font = '60px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('Click anywhere to restart', canvas.width / 2, canvas.height / 2 + 70);
        
        return; // The 'return' keyword instantly exits the function, breaking the loop!
    }

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();