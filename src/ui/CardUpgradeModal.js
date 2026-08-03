import { input } from '../core/Input.js';

export class CardUpgradeModal {
    constructor() {
        this.hoverIndex = -1;
    }

    update(levelManager, weaponManager, player) {
        if (!levelManager.isLevelingUp) return;

        const cards = levelManager.cardOptions;
        if (!cards || cards.length === 0) return;

        const mx = input.mouse.x;
        const my = input.mouse.y;

        const cardW = 280;
        const cardH = 360;
        const gap = 30;
        const totalW = cards.length * cardW + (cards.length - 1) * gap;
        const startX = (window.innerWidth - totalW) / 2;
        const startY = (window.innerHeight - cardH) / 2 + 30;

        this.hoverIndex = -1;

        cards.forEach((card, index) => {
            const cx = startX + index * (cardW + gap);
            const cy = startY;

            if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
                this.hoverIndex = index;

                if (input.mouse.isJustPressed) {
                    levelManager.selectCard(card, weaponManager, player);
                    input.clearJustPressed();
                }
            }
        });
    }

    render(ctx, levelManager, canvasWidth, canvasHeight) {
        if (!levelManager.isLevelingUp) return;

        const cards = levelManager.cardOptions;
        if (!cards || cards.length === 0) return;

        ctx.save();

        // Dark dim backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Header Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 54px Arial';
        ctx.fillText('LEVEL UP!', canvasWidth / 2, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = '22px Arial';
        ctx.fillText('CHOOSE YOUR WEAPON UPGRADE', canvasWidth / 2, 150);

        const cardW = 280;
        const cardH = 360;
        const gap = 30;
        const totalW = cards.length * cardW + (cards.length - 1) * gap;
        const startX = (canvasWidth - totalW) / 2;
        const startY = (canvasHeight - cardH) / 2 + 30;

        cards.forEach((card, index) => {
            const cx = startX + index * (cardW + gap);
            const cy = startY;
            const isHovered = index === this.hoverIndex;

            ctx.save();
            ctx.translate(cx, cy);

            // Card Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(5, 5, cardW, cardH);

            // Card Body Background
            ctx.fillStyle = isHovered ? '#2c3e50' : '#1a252f';
            ctx.fillRect(0, 0, cardW, cardH);

            // Border
            ctx.strokeStyle = card.rarity === 'RARE' ? '#f1c40f' : '#3498db';
            ctx.lineWidth = isHovered ? 4 : 2;
            ctx.strokeRect(0, 0, cardW, cardH);

            // Subtitle Badge
            ctx.fillStyle = card.rarity === 'RARE' ? '#f39c12' : '#2980b9';
            ctx.fillRect(15, 15, cardW - 30, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(card.subtitle, cardW / 2, 35);

            // Icon
            ctx.font = '72px Arial';
            ctx.fillText(card.icon, cardW / 2, 140);

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(card.title, cardW / 2, 200);

            // Description
            ctx.fillStyle = '#bdc3c7';
            ctx.font = '14px Arial';
            
            // Wrap text description
            this.wrapText(ctx, card.desc, cardW / 2, 240, cardW - 40, 20);

            // Choose Button
            ctx.fillStyle = isHovered ? '#2ecc71' : '#27ae60';
            ctx.fillRect(20, cardH - 55, cardW - 40, 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('SELECT CARD', cardW / 2, cardH - 30);

            ctx.restore();
        });

        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}
