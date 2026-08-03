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

        const cardW = 230;
        const cardH = 330;
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
        ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Refined Professional Header Title (Cinzel Font)
        ctx.textAlign = 'center';
        ctx.font = '900 36px "Cinzel", "Outfit", serif';
        
        // Gold Gradient Text Effect
        const titleGrad = ctx.createLinearGradient(0, canvasHeight * 0.12, 0, canvasHeight * 0.18);
        titleGrad.addColorStop(0, '#fef08a');
        titleGrad.addColorStop(0.5, '#eab308');
        titleGrad.addColorStop(1, '#ca8a04');
        
        ctx.fillStyle = titleGrad;
        ctx.fillText('LEVEL UP! CHOOSE YOUR POWER', canvasWidth / 2, canvasHeight * 0.15);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 15px "Outfit", sans-serif';
        ctx.fillText('Select 1 celestial upgrade to enhance Wang Lin in battle', canvasWidth / 2, canvasHeight * 0.19);

        // 3. Render 3 World-Class Clean Cards
        const cardW = 230;
        const cardH = 330;
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
            ctx.shadowColor = isHovered ? 'rgba(0, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = isHovered ? 22 : 12;
            ctx.shadowOffsetY = 8;

            // Card Body Fill (Sleek Dark Slate Gradient)
            const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
            grad.addColorStop(0, isHovered ? '#1e293b' : '#0f172a');
            grad.addColorStop(1, isHovered ? '#0f172a' : '#020617');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 18);
            ctx.fill();

            // Reset Shadow
            ctx.shadowColor = 'transparent';

            // Glowing Outer Border
            ctx.strokeStyle = isHovered ? '#00ffff' : '#eab308';
            ctx.lineWidth = isHovered ? 3.5 : 2;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 18);
            ctx.stroke();

            // Header Banner Strip Inside Card
            const badgeType = opt.type || 'UPGRADE';
            const badgeColor = badgeType === 'NEW' ? '#10b981' : badgeType === 'STAT' ? '#8b5cf6' : '#f59e0b';

            ctx.fillStyle = badgeColor;
            ctx.beginPath();
            ctx.roundRect(cx + 25, cy + 16, cardW - 50, 26, 13);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 12px "Outfit", sans-serif';
            ctx.fillText(badgeType === 'NEW' ? '✦ NEW WEAPON ✦' : badgeType === 'STAT' ? '✦ STAT BOOST ✦' : `★ LEVEL ${opt.level || 2} ★`, cx + cardW / 2, cy + 33);

            // Render Custom 2D Illustration Emblem
            const iconY = cy + 95;
            this.renderCardIllustration(ctx, opt.id, cx + cardW / 2, iconY, isHovered);

            // Card Name (Outfit Font)
            ctx.fillStyle = isHovered ? '#00ffff' : '#ffffff';
            ctx.font = '700 18px "Outfit", sans-serif';
            const rawTitle = opt.name || opt.title || 'Upgrade';
            const cleanTitle = rawTitle.replace('UNLOCK: ', '');
            ctx.fillText(cleanTitle, cx + cardW / 2, cy + 172);

            // Divider Line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + 30, cy + 186);
            ctx.lineTo(cx + cardW - 30, cy + 186);
            ctx.stroke();

            // Clean Description Text
            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 13px "Outfit", sans-serif';
            const desc = opt.description || opt.desc || 'Boost skill power in battle.';
            this.drawWrappedText(ctx, desc, cx + 15, cy + 210, cardW - 30, 20);

            // Select Action Button
            const btnGrad = ctx.createLinearGradient(cx, cy + cardH - 45, cx, cy + cardH - 13);
            if (isHovered) {
                btnGrad.addColorStop(0, '#22d3ee');
                btnGrad.addColorStop(1, '#0891b2');
            } else {
                btnGrad.addColorStop(0, '#facc15');
                btnGrad.addColorStop(1, '#ca8a04');
            }

            ctx.fillStyle = btnGrad;
            ctx.beginPath();
            ctx.roundRect(cx + 25, cy + cardH - 46, cardW - 50, 32, 16);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 13px "Outfit", sans-serif';
            ctx.fillText(isHovered ? 'SELECT POWER' : 'CHOOSE', cx + cardW / 2, cy + cardH - 25);

            ctx.restore();
        });

        ctx.restore();
    }

    renderCardIllustration(ctx, id, x, y, isHovered) {
        ctx.save();
        ctx.translate(x, y);

        // Circular Backdrop
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? 'rgba(0, 255, 255, 0.15)' : 'rgba(234, 179, 8, 0.12)';
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#00ffff' : '#eab308';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Custom 2D Canvas Illustrations per weapon/stat ID
        if (id === 'swords') {
            // Crossed Flying Jiuyou Magic Swords
            ctx.rotate(0.4);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-3, -22, 6, 44);
            ctx.fillRect(-22, -3, 44, 6);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-6, -6, 12, 12);
        } else if (id === 'fireball') {
            // Blazing Fireball
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#f97316';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-4, -4, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#fef08a';
            ctx.fill();
        } else if (id === 'lightning') {
            // Thunder Bolt
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(4, -22);
            ctx.lineTo(-12, 0);
            ctx.lineTo(2, 0);
            ctx.lineTo(-4, 22);
            ctx.lineTo(12, -2);
            ctx.lineTo(-2, -2);
            ctx.closePath();
            ctx.fill();
        } else if (id === 'flameAura') {
            // Flame Ring Halo
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
        } else if (id === 'boomerang') {
            // Flying Boomerang Blade
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0.4, Math.PI * 1.4);
            ctx.stroke();
        } else if (id === 'stat_speed') {
            // Boots of Speed
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-14, 2, 28, 12);
            ctx.fillRect(-6, -16, 12, 18);
        } else if (id === 'stat_magnet') {
            // Gem Magnet
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 16, Math.PI, 0);
            ctx.stroke();
        } else if (id === 'stat_health') {
            // Vitality Elixir Potion Flask
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(0, 5, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-4, -16, 8, 10);
        } else {
            ctx.fillStyle = '#facc15';
            ctx.font = '32px Arial';
            ctx.fillText('⚡', 0, 10);
        }

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
