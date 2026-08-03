import { input } from '../core/Input.js';

// Preload 2D Upgrade Card Background Asset
const cardBgImage = new Image();
cardBgImage.src = '/assets/images/card_bg.jpg';

export class CardUpgradeModal {
    constructor() {
        this.hoveredIndex = -1;
    }

    update(levelManager, weaponManager, player) {
        if (!levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        if (!options || options.length === 0) return;

        // Check Card Selection Click
        const mouseX = input.mouse.x;
        const mouseY = input.mouse.y;

        const cardW = 210;
        const cardH = 300;
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
                    levelManager.selectUpgrade(i, weaponManager, player);
                    break;
                }
            }
        }
    }

    render(ctx, levelManager, canvasWidth, canvasHeight) {
        if (!levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions;
        if (!options || options.length === 0) return;

        ctx.save();

        // Dark Modal Backdrop Overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Header Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('⚡ LEVEL UP! CHOOSE YOUR UPGRADE ⚡', canvasWidth / 2, canvasHeight * 0.18);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px Arial';
        ctx.fillText('Pick 1 power to enhance Wang Lin during battle', canvasWidth / 2, canvasHeight * 0.22);

        // Render 3 Choice Upgrade Cards
        const cardW = 210;
        const cardH = 300;
        const totalW = options.length * cardW + (options.length - 1) * 30;
        const startX = (canvasWidth - totalW) / 2;
        const startY = (canvasHeight - cardH) / 2;

        options.forEach((opt, i) => {
            const cx = startX + i * (cardW + 30);
            const cy = startY;
            const isHovered = (this.hoveredIndex === i);

            ctx.save();
            if (isHovered) {
                ctx.translate(0, -8);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw 2D Card Asset Background
            if (cardBgImage.complete && cardBgImage.naturalWidth !== 0) {
                ctx.drawImage(cardBgImage, cx, cy, cardW, cardH);
            } else {
                ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
                ctx.fillRect(cx, cy, cardW, cardH);
            }

            // Card Border Highlight
            ctx.strokeStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.lineWidth = isHovered ? 3.5 : 2;
            ctx.strokeRect(cx, cy, cardW, cardH);

            // Card Icon
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(opt.icon, cx + cardW / 2, cy + 75);

            // Card Name
            ctx.fillStyle = isHovered ? '#00ffff' : '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(opt.name, cx + cardW / 2, cy + 130);

            // Action Badge (NEW / UPGRADE)
            ctx.fillStyle = opt.type === 'NEW' ? '#2ecc71' : '#e67e22';
            ctx.fillRect(cx + 30, cy + 145, cardW - 60, 24);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(opt.type === 'NEW' ? '✦ NEW WEAPON ✦' : `★ LEVEL ${opt.level} ★`, cx + cardW / 2, cy + 161);

            // Description Text Wrapping
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '13px Arial';
            this.drawWrappedText(ctx, opt.description, cx + 15, cy + 195, cardW - 30, 18);

            // Select Button Prompt
            ctx.fillStyle = isHovered ? '#00ffff' : '#f1c40f';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(isHovered ? '▶ CLICK TO CHOOSE ◀' : 'SELECT', cx + cardW / 2, cy + cardH - 20);

            ctx.restore();
        });

        ctx.restore();
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
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
