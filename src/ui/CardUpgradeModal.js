import { input } from '../core/Input.js';

// Preload 2D Power Icon Image Assets for All Upgrade Cards
const powerIcons = {};
function loadPowerIcon(id, src) {
    const img = new Image();
    img.src = src;
    powerIcons[id] = img;
}

loadPowerIcon('swords', '/assets/images/sword_icon.jpg');
loadPowerIcon('fireball', '/assets/images/fireball_icon.jpg');
loadPowerIcon('lightning', '/assets/images/thunder_icon.jpg');
loadPowerIcon('flameAura', '/assets/images/flame_ring_icon.jpg');
loadPowerIcon('boomerang', '/assets/images/boomerang_icon.jpg');

loadPowerIcon('stat_speed', '/assets/images/boots_speed_icon.jpg');
loadPowerIcon('stat_magnet', '/assets/images/gem_magnet_icon.jpg');
loadPowerIcon('stat_health', '/assets/images/vitality_elixir_icon.jpg');

export class CardUpgradeModal {
    constructor() {
        this.hoveredIndex = -1;
        this.openCooldown = 0;
    }

    clearInput() {
        if (input.consumeClick) {
            input.consumeClick();
        } else if (input.clearJustPressed) {
            input.clearJustPressed();
        } else {
            input.mouse.isJustPressed = false;
            input.mouse.clickPending = false;
            input.mouse.isDown = false;
        }
    }

    update(levelManager, weaponManager, player, screenWidth, screenHeight) {
        if (!levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        const totalCards = options.length;
        const cardWidth = 260;
        const cardHeight = 360;
        const gap = 30;

        const startX = (screenWidth - (totalCards * cardWidth + (totalCards - 1) * gap)) / 2;
        const startY = (screenHeight - cardHeight) / 2;

        const mx = input.mouse.x;
        const my = input.mouse.y;

        this.hoveredIndex = -1;
        for (let i = 0; i < totalCards; i++) {
            const cx = startX + i * (cardWidth + gap);
            const cy = startY;

            if (mx >= cx && mx <= cx + cardWidth && my >= cy && my <= cy + cardHeight) {
                this.hoveredIndex = i;
                break;
            }
        }

        // Gate click inputs on the very first frame the modal opens
        if (levelManager.justOpened) {
            levelManager.justOpened = false;
            this.openCooldown = 8;
            this.clearInput();
            return;
        }

        if (this.openCooldown > 0) {
            this.openCooldown--;
            this.clearInput();
            return;
        }

        // 100% Reliable Card Click Response
        const isClicked = input.wasJustClicked ? input.wasJustClicked() : (input.mouse.isJustPressed || input.mouse.clickPending || input.mouse.isDown);
        if (isClicked) {
            if (this.hoveredIndex !== -1) {
                this.clearInput();
                levelManager.selectUpgrade(this.hoveredIndex, weaponManager, player);
            }
        }
    }

    render(ctx, levelManager, screenWidth, screenHeight) {
        if (!levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        const totalCards = options.length;
        const cardWidth = 260;
        const cardHeight = 360;
        const gap = 30;

        const startX = (screenWidth - (totalCards * cardWidth + (totalCards - 1) * gap)) / 2;
        const startY = (screenHeight - cardHeight) / 2;

        ctx.save();

        // Dark Glassmorphism Backdrop Overlay
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);

        // Header Title
        ctx.textAlign = 'center';
        ctx.font = '900 32px "Cinzel", serif';
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText('SELECT TREASURE SKILL', screenWidth / 2, startY - 40);
        ctx.shadowBlur = 0;

        // Render Upgrade Cards
        options.forEach((opt, i) => {
            const cx = startX + i * (cardWidth + gap);
            const cy = startY;
            const isHovered = (i === this.hoveredIndex);

            ctx.save();
            ctx.translate(cx, cy);

            if (isHovered) {
                ctx.translate(0, -8);
            }

            // Card Dark Slate Gradient Background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            if (isHovered) {
                bgGrad.addColorStop(0, '#1e293b');
                bgGrad.addColorStop(1, '#0f172a');
            } else {
                bgGrad.addColorStop(0, '#0f172a');
                bgGrad.addColorStop(1, '#020617');
            }

            ctx.fillStyle = bgGrad;
            ctx.beginPath();
            ctx.roundRect(0, 0, cardWidth, cardHeight, 16);
            ctx.fill();

            // Gold Filigree Border
            ctx.strokeStyle = isHovered ? '#00ffff' : '#eab308';
            ctx.lineWidth = isHovered ? 3.5 : 2;
            ctx.stroke();

            // Rarity Tag Badge
            ctx.fillStyle = opt.rarity === 'RARE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)';
            ctx.beginPath();
            ctx.roundRect(cardWidth / 2 - 50, 16, 100, 22, 11);
            ctx.fill();
            ctx.font = '700 11px "Outfit", sans-serif';
            ctx.fillStyle = opt.rarity === 'RARE' ? '#f87171' : '#38bdf8';
            ctx.fillText(opt.rarity || 'COMMON', cardWidth / 2, 31);

            // 2D Power Image Icon Frame (For ALL 8 Weapons & Stats!)
            const iconImg = powerIcons[opt.id];
            const iconSize = 90;
            const iconX = (cardWidth - iconSize) / 2;
            const iconY = 50;

            if (iconImg && iconImg.complete && iconImg.width) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(iconX, iconY, iconSize, iconSize, 12);
                ctx.clip();
                ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
                ctx.restore();

                ctx.strokeStyle = isHovered ? '#00ffff' : '#ca8a04';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(iconX, iconY, iconSize, iconSize, 12);
                ctx.stroke();
            } else {
                ctx.font = '48px "Outfit", sans-serif';
                ctx.fillText(opt.icon || '⚔️', cardWidth / 2, iconY + 60);
            }

            // Card Title Name
            ctx.font = '700 16px "Cinzel", serif';
            ctx.fillStyle = '#f1f5f9';
            ctx.fillText(opt.name || 'UPGRADE', cardWidth / 2, 175);

            // Level Tag
            ctx.font = '700 13px "Outfit", sans-serif';
            ctx.fillStyle = '#facc15';
            ctx.fillText(`LEVEL ${opt.level || 1}`, cardWidth / 2, 198);

            // Description Text
            ctx.font = '500 13px "Outfit", sans-serif';
            ctx.fillStyle = '#94a3b8';
            this.wrapText(ctx, opt.description || '', cardWidth / 2, 230, cardWidth - 36, 18);

            // Select Button Badge
            const btnW = 160;
            const btnH = 34;
            const btnX = (cardWidth - btnW) / 2;
            const btnY = cardHeight - 48;

            ctx.fillStyle = isHovered ? '#0284c7' : '#1e293b';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#38bdf8' : '#475569';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = '700 12px "Outfit", sans-serif';
            ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
            ctx.fillText(isHovered ? 'SELECT SKILL' : 'CHOOSE', cardWidth / 2, btnY + 22);

            ctx.restore();
        });

        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}
