import { input } from '../core/Input.js';

// Preload 2D Upgrade Card Background Asset
const cardBgImage = new Image();
cardBgImage.src = '/assets/images/card_bg.jpg';

export class CardUpgradeModal {
    constructor() {
        this.hoveredIndex = -1;
        this.cardAnim = 0;
    }

    update(levelManager, weaponManager, player) {
        if (!levelManager || !levelManager.isLevelingUp) return;
        this.cardAnim += 0.05;

        const options = levelManager.currentOptions || levelManager.cardOptions;
        if (!options || options.length === 0) return;

        // Check Card Selection Click
        const mouseX = input.mouse.x;
        const mouseY = input.mouse.y;

        const cardW = 220;
        const cardH = 310;
        const totalW = options.length * cardW + (options.length - 1) * 25;
        const startX = (window.innerWidth - totalW) / 2;
        const startY = (window.innerHeight - cardH) / 2;

        this.hoveredIndex = -1;

        for (let i = 0; i < options.length; i++) {
            const cx = startX + i * (cardW + 25);
            const cy = startY;

            if (mouseX >= cx && mouseX <= cx + cardW && mouseY >= cy && mouseY <= cy + cardH) {
                this.hoveredIndex = i;
                if (input.mouse.down) {
                    input.mouse.down = false;
                    if (levelManager.selectUpgrade) {
                        levelManager.selectUpgrade(i, weaponManager, player);
                    } else if (levelManager.selectCard) {
                        levelManager.selectCard(options[i], weaponManager, player);
                    }
                    break;
                }
            }
        }
    }

    render(ctx, levelManager, canvasWidth, canvasHeight) {
        if (!levelManager || !levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions || levelManager.cardOptions;
        if (!options || options.length === 0) return;

        ctx.save();

        // Dark Backdrop Overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Poppy Header Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('✨ LEVEL UP! CHOOSE POWER ✨', canvasWidth / 2, canvasHeight * 0.16);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Select 1 upgrade to boost Wang Lin during battle', canvasWidth / 2, canvasHeight * 0.20);

        // Render 3 Poppy Cute Upgrade Cards
        const cardW = 220;
        const cardH = 310;
        const totalW = options.length * cardW + (options.length - 1) * 25;
        const startX = (canvasWidth - totalW) / 2;
        const startY = (canvasHeight - cardH) / 2;

        options.forEach((opt, i) => {
            if (!opt) return;

            const cx = startX + i * (cardW + 25);
            const cy = startY;
            const isHovered = (this.hoveredIndex === i);

            ctx.save();
            if (isHovered) {
                ctx.translate(0, -10);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw Card Background
            if (cardBgImage.complete && cardBgImage.naturalWidth !== 0) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(cx, cy, cardW, cardH, 16);
                ctx.clip();
                ctx.drawImage(cardBgImage, cx, cy, cardW, cardH);
                ctx.restore();
            } else {
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.roundRect(cx, cy, cardW, cardH, 16);
                ctx.fill();
            }

            // Glowing Card Border
            ctx.strokeStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.lineWidth = isHovered ? 4 : 2;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 16);
            ctx.stroke();

            // Poppy Icon Circle Badge
            const iconY = cy + 65;
            ctx.beginPath();
            ctx.arc(cx + cardW / 2, iconY, 36, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? 'rgba(0, 255, 255, 0.25)' : 'rgba(241, 196, 15, 0.2)';
            ctx.fill();
            ctx.strokeStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon
            ctx.font = '38px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(opt.icon || '⚡', cx + cardW / 2, iconY + 13);

            // Card Name
            ctx.fillStyle = isHovered ? '#00ffff' : '#ffffff';
            ctx.font = 'bold 17px Arial';
            ctx.fillText(opt.name || opt.title || 'Upgrade', cx + cardW / 2, cy + 135);

            // Action Badge (NEW / UPGRADE / STAT)
            const badgeType = opt.type || 'UPGRADE';
            ctx.fillStyle = badgeType === 'NEW' ? '#2ecc71' : badgeType === 'STAT' ? '#9b59b6' : '#e67e22';
            ctx.beginPath();
            ctx.roundRect(cx + 35, cy + 150, cardW - 70, 24, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(badgeType === 'NEW' ? '✦ NEW ✦' : badgeType === 'STAT' ? '✦ STAT ✦' : `★ LVL ${opt.level || 2} ★`, cx + cardW / 2, cy + 166);

            // Short Clean Benefit Description
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 13px Arial';
            const shortDesc = opt.description || opt.desc || 'Boost skill power.';
            this.drawWrappedText(ctx, shortDesc, cx + 15, cy + 205, cardW - 30, 18);

            // Select Button Badge
            ctx.fillStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.beginPath();
            ctx.roundRect(cx + 25, cy + cardH - 45, cardW - 50, 30, 15);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(isHovered ? '▶ SELECT ◀' : 'CHOOSE', cx + cardW / 2, cy + cardH - 25);

            ctx.restore();
        });

        ctx.restore();
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const words = String(text).split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x + maxWidth / 2, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x + maxWidth / 2, currentY);
    }
}
