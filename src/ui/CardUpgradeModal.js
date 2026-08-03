import { input } from '../core/Input.js';

// Preload 2D Power & Stat Icon Asset Images
const powerIcons = {};

function createSVGIcon(type, svgContent) {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
    powerIcons[type] = img;
}

// 2D Cute High-Definition Power Icons
createSVGIcon('swords', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#38bdf8" stroke-width="4"/><path d="M25 75 L75 25 M30 70 L70 30 M70 25 L75 30 L65 40 L60 35 Z M25 75 L30 70 L40 80 L35 85 Z" fill="#e2e8f0" stroke="#0284c7" stroke-width="3"/><path d="M75 75 L25 25 M70 70 L30 30 M25 25 L30 20 L40 30 L35 35 Z M75 75 L70 70 L80 60 L85 65 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3"/></svg>`);
createSVGIcon('fireball', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#f97316" stroke-width="4"/><path d="M50 15 C65 30 80 45 80 65 C80 80 65 90 50 90 C35 90 20 80 20 65 C20 45 35 30 50 15 Z" fill="#ea580c"/><path d="M50 30 C60 40 70 55 70 65 C70 75 60 82 50 82 C40 82 30 75 30 65 C30 55 40 40 50 30 Z" fill="#facc15"/></svg>`);
createSVGIcon('lightning', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#eab308" stroke-width="4"/><polygon points="55,10 20,52 48,52 40,90 80,42 52,42" fill="#facc15" stroke="#ca8a04" stroke-width="2"/></svg>`);
createSVGIcon('flameAura', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#ef4444" stroke-width="4"/><circle cx="50" cy="50" r="30" fill="none" stroke="#f97316" stroke-width="8"/><circle cx="50" cy="50" r="30" fill="none" stroke="#facc15" stroke-width="4" stroke-dasharray="10 5"/></svg>`);
createSVGIcon('boomerang', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#38bdf8" stroke-width="4"/><path d="M20 70 Q50 15 80 70 Q50 45 20 70 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/></svg>`);
createSVGIcon('stat_speed', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#10b981" stroke-width="4"/><path d="M20 60 L60 60 L75 40 L45 40 Z M30 40 L45 20 L75 20 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3"/></svg>`);
createSVGIcon('stat_magnet', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#8b5cf6" stroke-width="4"/><path d="M30 25 L30 60 A20 20 0 0 0 70 60 L70 25 L55 25 L55 60 A5 5 0 0 1 45 60 L45 25 Z" fill="#ef4444"/><rect x="30" y="25" width="15" height="10" fill="#e2e8f0"/><rect x="55" y="25" width="15" height="10" fill="#e2e8f0"/></svg>`);
createSVGIcon('stat_health', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#ec4899" stroke-width="4"/><path d="M50 30 C50 30 35 15 22 28 C10 40 22 58 50 82 C78 58 90 40 78 28 C65 15 50 30 50 30 Z" fill="#ec4899" stroke="#be185d" stroke-width="3"/></svg>`);

export class CardUpgradeModal {
    constructor() {
        this.hoveredIndex = -1;
    }

    update(levelManager, weaponManager, player, canvasWidth, canvasHeight) {
        if (!levelManager || !levelManager.isLevelingUp) return;

        const options = levelManager.currentOptions || levelManager.cardOptions;
        if (!options || options.length === 0) return;

        const mouseX = input.mouse.x;
        const mouseY = input.mouse.y;

        const cardW = 230;
        const cardH = 330;
        const totalW = options.length * cardW + (options.length - 1) * 30;
        
        // Exact pixel alignment with render() canvasWidth and canvasHeight!
        const cw = canvasWidth || window.innerWidth;
        const ch = canvasHeight || window.innerHeight;
        const startX = (cw - totalW) / 2;
        const startY = (ch - cardH) / 2;

        this.hoveredIndex = -1;

        for (let i = 0; i < options.length; i++) {
            const cx = startX + i * (cardW + 30);
            const cy = startY;

            if (mouseX >= cx && mouseX <= cx + cardW && mouseY >= cy && mouseY <= cy + cardH) {
                this.hoveredIndex = i;
                
                // Check clickPending || isJustPressed || isDown
                if (input.mouse.clickPending || input.mouse.isJustPressed || input.mouse.isDown) {
                    input.clearJustPressed();
                    input.mouse.isDown = false;
                    input.mouse.clickPending = false;
                    
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
        
        const titleGrad = ctx.createLinearGradient(0, canvasHeight * 0.12, 0, canvasHeight * 0.18);
        titleGrad.addColorStop(0, '#fef08a');
        titleGrad.addColorStop(0.5, '#eab308');
        titleGrad.addColorStop(1, '#ca8a04');
        
        ctx.fillStyle = titleGrad;
        ctx.fillText('LEVEL UP! CHOOSE YOUR POWER', canvasWidth / 2, canvasHeight * 0.15);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 15px "Outfit", sans-serif';
        ctx.fillText('Click 1 power to enhance Wang Lin in battle', canvasWidth / 2, canvasHeight * 0.19);

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

            // Card Body Fill
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

            // Render Real 2D Image Icon Asset inside Card!
            const iconImg = powerIcons[opt.id] || powerIcons['swords'];
            const iconSize = 72;
            const iconX = cx + (cardW - iconSize) / 2;
            const iconY = cy + 56;

            if (iconImg && iconImg.complete) {
                ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
            } else {
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(opt.icon || '⚡', cx + cardW / 2, iconY + 50);
            }

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
