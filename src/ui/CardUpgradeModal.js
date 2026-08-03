import { input } from '../core/Input.js';
import { soundManager } from '../audio/SoundManager.js';

// Preload 2D Power Card Icon Assets with Fast Offscreen Canvases
const powerCardImages = {};

function loadPowerCardImage(id, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, 120, 120);

            const imgData = ctx.getImageData(0, 0, 120, 120);
            const data = imgData.data;

            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const dr = Math.abs(r - bgR);
                const dg = Math.abs(g - bgG);
                const db = Math.abs(b - bgB);
                const diff = Math.max(dr, Math.max(dg, db));

                if ((r > 240 && g > 240 && b > 240) || (r < 25 && g < 25 && b < 25) || diff < 20) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            powerCardImages[id] = canvas;
        } catch (e) {
            powerCardImages[id] = img;
        }
    };
}

// Load all 2D Power Icons from /assets/images/
loadPowerCardImage('swords', '/assets/images/sword_power_icon.jpg');
loadPowerCardImage('fireball', '/assets/images/fireball_power_icon.jpg');
loadPowerCardImage('lightning', '/assets/images/thunder_icon_v2.jpg');
loadPowerCardImage('flameAura', '/assets/images/flame_ring_icon_v2.jpg');
loadPowerCardImage('boomerang', '/assets/images/boomerang_power_icon.jpg');
loadPowerCardImage('stat_speed', '/assets/images/boots_speed_icon.jpg');
loadPowerCardImage('stat_magnet', '/assets/images/gem_magnet_icon_v2.jpg');
loadPowerCardImage('stat_health', '/assets/images/vitality_elixir_icon.jpg');

export class CardUpgradeModal {
    constructor() {
        this.hoveredIndex = -1;
    }

    update(levelManager, weaponManager, player, screenWidth, screenHeight) {
        if (!levelManager || !levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        if (!options || options.length === 0) return;

        const sw = (screenWidth && Number.isFinite(screenWidth) && screenWidth > 0) ? screenWidth : (window.innerWidth || 1920);
        const sh = (screenHeight && Number.isFinite(screenHeight) && screenHeight > 0) ? screenHeight : (window.innerHeight || 1080);

        const cardWidth = 260;
        const cardHeight = 360;
        const gap = 30;
        const totalCards = options.length;
        const totalW = totalCards * cardWidth + (totalCards - 1) * gap;
        const startX = (sw - totalW) / 2;
        const cardY = (sh - cardHeight) / 2 + 30;

        const mx = input.mouse.x;
        const my = input.mouse.y;

        this.hoveredIndex = -1;

        for (let i = 0; i < totalCards; i++) {
            const cx = startX + i * (cardWidth + gap);
            if (mx >= cx && mx <= cx + cardWidth && my >= cardY && my <= cardY + cardHeight) {
                this.hoveredIndex = i;

                if (input.mouse.clicked || input.mouse.justClicked) {
                    input.mouse.clicked = false;
                    input.mouse.justClicked = false;
                    levelManager.selectUpgrade(i, weaponManager, player);

                    if (soundManager && soundManager.playButtonClick) {
                        soundManager.playButtonClick();
                    }
                    break;
                }
            }
        }
    }

    render(ctx, levelManager, screenWidth, screenHeight) {
        if (!levelManager || !levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        if (!options || options.length === 0) return;

        const sw = (screenWidth && Number.isFinite(screenWidth) && screenWidth > 0) ? screenWidth : (window.innerWidth || 1920);
        const sh = (screenHeight && Number.isFinite(screenHeight) && screenHeight > 0) ? screenHeight : (window.innerHeight || 1080);

        ctx.save();

        // 1. Full Screen Overlay Backdrop
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(0, 0, sw, sh);

        // 2. Banner Header
        ctx.fillStyle = '#facc15';
        ctx.font = '900 36px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 16;
        ctx.fillText('LEVEL UP! CHOOSE A POWER', sw / 2, (sh / 2) - 220);
        ctx.shadowBlur = 0;

        const cardWidth = 260;
        const cardHeight = 360;
        const gap = 30;
        const totalCards = options.length;
        const totalW = totalCards * cardWidth + (totalCards - 1) * gap;
        const startX = (sw - totalW) / 2;
        const cardY = (sh - cardHeight) / 2 + 30;

        // 3. Render 3 Centered Upgrade Cards
        options.forEach((card, idx) => {
            const cx = startX + idx * (cardWidth + gap);
            const isHovered = (idx === this.hoveredIndex);

            ctx.save();
            ctx.translate(cx, cardY);

            if (isHovered) {
                ctx.translate(0, -10);
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 25;
            } else {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 12;
            }

            // Card Body
            const cardBg = isHovered ? '#1e293b' : '#0f172a';
            const borderCol = isHovered ? '#facc15' : '#334155';

            ctx.fillStyle = cardBg;
            ctx.beginPath();
            ctx.roundRect(0, 0, cardWidth, cardHeight, 16);
            ctx.fill();

            ctx.strokeStyle = borderCol;
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.stroke();

            // Card Title
            ctx.fillStyle = isHovered ? '#facc15' : '#f8fafc';
            ctx.font = '700 18px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(card.name, cardWidth / 2, 45);

            // Rarity Tag
            ctx.fillStyle = card.rarity === 'RARE' ? '#c084fc' : '#38bdf8';
            ctx.font = '600 13px "Segoe UI", sans-serif';
            ctx.fillText(card.rarity || 'COMMON', cardWidth / 2, 70);

            // Render 2D Power Icon Asset
            const iconImg = powerCardImages[card.id];
            const iconX = (cardWidth - 90) / 2;
            const iconY = 90;

            if (iconImg && (iconImg.complete || iconImg.width)) {
                ctx.drawImage(iconImg, iconX, iconY, 90, 90);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(iconX, iconY, 90, 90);
                ctx.fillStyle = '#ffffff';
                ctx.font = '40px sans-serif';
                ctx.fillText(card.icon || '⚔️', cardWidth / 2, iconY + 58);
            }

            // Description Box
            ctx.fillStyle = '#94a3b8';
            ctx.font = '400 14px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            
            const words = (card.description || '').split(' ');
            let line = '';
            let lineY = 220;

            words.forEach(w => {
                const test = line + w + ' ';
                if (ctx.measureText(test).width > cardWidth - 30) {
                    ctx.fillText(line, cardWidth / 2, lineY);
                    line = w + ' ';
                    lineY += 20;
                } else {
                    line = test;
                }
            });
            if (line) ctx.fillText(line, cardWidth / 2, lineY);

            // Select Button
            ctx.fillStyle = isHovered ? '#facc15' : '#334155';
            ctx.beginPath();
            ctx.roundRect(25, cardHeight - 55, cardWidth - 50, 40, 8);
            ctx.fill();

            ctx.fillStyle = isHovered ? '#0f172a' : '#f8fafc';
            ctx.font = '700 15px "Segoe UI", sans-serif';
            ctx.fillText(isHovered ? 'SELECT POWER' : 'CHOOSE', cardWidth / 2, cardHeight - 30);

            ctx.restore();
        });

        ctx.restore();
    }
}
