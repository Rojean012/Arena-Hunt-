import { input } from '../core/Input.js';

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

        const mouseX = input.mouse.x;
        const mouseY = input.mouse.y;

        const cardW = 220;
        const cardH = 320;
        const totalW = options.length * cardW + (options.length - 1) * 30;
        const startX = (window.innerWidth - totalW) / 2;
        const startY = (window.innerHeight - cardH) / 2;

        this.hoveredIndex = -1;

        for (let i = 0; i < options.length; i++) {
            const cx = startX + i * (cardW + 30);
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

        // 1. Dark Glassmorphism Backdrop
        ctx.fillStyle = 'rgba(11, 15, 25, 0.90)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Header Title & Subtitle
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('✨ LEVEL UP! CHOOSE YOUR POWER ✨', canvasWidth / 2, canvasHeight * 0.16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Select 1 celestial upgrade to enhance Wang Lin in battle', canvasWidth / 2, canvasHeight * 0.20);

        // 3. Render 3 World-Class Clean Cards
        const cardW = 220;
        const cardH = 320;
        const totalW = options.length * cardW + (options.length - 1) * 30;
        const startX = (canvasWidth - totalW) / 2;
        const startY = (canvasHeight - cardH) / 2;

        options.forEach((opt, i) => {
            if (!opt) return;

            const cx = startX + i * (cardW + 30);
            const cy = startY;
            const isHovered = (this.hoveredIndex === i);

            ctx.save();
            if (isHovered) {
                ctx.translate(0, -10);
            }

            // Card Shadow
            ctx.shadowColor = isHovered ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = isHovered ? 20 : 10;
            ctx.shadowOffsetY = 6;

            // Card Body Fill (Sleek Dark Slate Gradient)
            const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
            grad.addColorStop(0, isHovered ? '#1e293b' : '#0f172a');
            grad.addColorStop(1, isHovered ? '#0f172a' : '#020617');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 18);
            ctx.fill();

            // Reset Shadow for Inner Elements
            ctx.shadowColor = 'transparent';

            // Glowing Outer Border
            ctx.strokeStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.lineWidth = isHovered ? 3.5 : 2;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 18);
            ctx.stroke();

            // Header Banner Strip Inside Card
            const badgeType = opt.type || 'UPGRADE';
            const badgeColor = badgeType === 'NEW' ? '#10b981' : badgeType === 'STAT' ? '#8b5cf6' : '#f59e0b';

            ctx.fillStyle = badgeColor;
            ctx.beginPath();
            ctx.roundRect(cx + 20, cy + 18, cardW - 40, 26, 13);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(badgeType === 'NEW' ? '✦ NEW WEAPON ✦' : badgeType === 'STAT' ? '✦ STAT BOOST ✦' : `★ LEVEL ${opt.level || 2} ★`, cx + cardW / 2, cy + 35);

            // Icon Circular Emblem
            const iconY = cy + 95;
            ctx.beginPath();
            ctx.arc(cx + cardW / 2, iconY, 36, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? 'rgba(0, 255, 255, 0.15)' : 'rgba(241, 196, 15, 0.12)';
            ctx.fill();
            ctx.strokeStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon Character
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(opt.icon || '⚡', cx + cardW / 2, iconY + 14);

            // Card Name
            ctx.fillStyle = isHovered ? '#00ffff' : '#ffffff';
            ctx.font = 'bold 17px Arial';
            const rawTitle = opt.name || opt.title || 'Upgrade';
            const cleanTitle = rawTitle.replace('UNLOCK: ', '');
            ctx.fillText(cleanTitle, cx + cardW / 2, cy + 165);

            // Divider Line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + 30, cy + 180);
            ctx.lineTo(cx + cardW - 30, cy + 180);
            ctx.stroke();

            // Clean Description Text
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '13px Arial';
            const desc = opt.description || opt.desc || 'Boost skill power in battle.';
            this.drawWrappedText(ctx, desc, cx + 15, cy + 205, cardW - 30, 20);

            // Select Action Button
            ctx.fillStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.beginPath();
            ctx.roundRect(cx + 25, cy + cardH - 45, cardW - 50, 32, 16);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(isHovered ? '▶ SELECT ◀' : 'CHOOSE', cx + cardW / 2, cy + cardH - 24);

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
