import { GameConfig } from '../config/GameConfig.js';

export class UIRenderer {
    renderHUD(ctx, player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner, canvasWidth, canvasHeight) {
        ctx.save();

        // 1. Health Bar (Top Left)
        const hpW = 220;
        const hpH = 22;
        const hpX = 20;
        const hpY = 20;
        const hpPct = Math.max(0, player.health / player.maxHealth);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(hpX, hpY, hpW, hpH);

        ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(hpX + 2, hpY + 2, (hpW - 4) * hpPct, hpH - 4);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hpX, hpY, hpW, hpH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HP: ${Math.ceil(player.health)} / ${player.maxHealth}`, hpX + hpW / 2, hpY + 16);

        // 2. Score, Emerald Gems Counter Below Score, and Coins
        ctx.textAlign = 'left';
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${score}`, 20, 68);

        // Emerald Gem Counter directly below Score
        const targetGems = levelManager.targetGems;
        const currentGems = levelManager.totalGems;

        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`💎 Emeralds: ${currentGems} / ${targetGems}`, 20, 94);

        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Coins: $${coins}`, 20, 118);

        // 3. Active Weapon Icons Bar (Top Right)
        ctx.textAlign = 'right';
        ctx.font = '700 16px "Outfit", sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`WAVE TIER ${waveTier}`, canvasWidth - 20, 35);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 14px "Outfit", sans-serif';
        ctx.fillText('WEAPONS:', canvasWidth - 220, 60);

        let slotX = canvasWidth - 210;
        Object.keys(weaponManager.weapons).forEach(id => {
            const w = weaponManager.weapons[id];
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect(slotX, 68, 32, 32);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1;
            ctx.strokeRect(slotX, 68, 32, 32);

            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(w.config.icon, slotX + 16, 90);

            slotX += 38;
        });

        // 4. PRISTINE CUSTOM XIANXIA WAVE WARNING BANNER (Zero AI slop!)
        if (spawner && spawner.waveNoticeTimer > 0) {
            const bannerW = 640;
            const bannerH = 84;
            const bannerX = (canvasWidth - bannerW) / 2;
            const bannerY = canvasHeight * 0.18;

            const alpha = Math.min(1, spawner.waveNoticeTimer / 30);

            ctx.save();
            ctx.globalAlpha = alpha;

            // Outer Shadow
            ctx.shadowColor = 'rgba(220, 38, 38, 0.6)';
            ctx.shadowBlur = 20;

            // Plaque Body (Dark Slate Gradient)
            const plaqueGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerH);
            plaqueGrad.addColorStop(0, '#1e1b4b');
            plaqueGrad.addColorStop(0.5, '#0f172a');
            plaqueGrad.addColorStop(1, '#020617');

            ctx.fillStyle = plaqueGrad;
            ctx.beginPath();
            ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 14);
            ctx.fill();

            // Reset Shadow
            ctx.shadowColor = 'transparent';

            // Gold Filigree Border
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 14);
            ctx.stroke();

            // Inner Crimson Glowing Accent Line
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(bannerX + 6, bannerY + 6, bannerW - 12, bannerH - 12, 10);
            ctx.stroke();

            // Corner Gem Accents
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bannerX + 10, bannerY + 10, 6, 6);
            ctx.fillRect(bannerX + bannerW - 16, bannerY + 10, 6, 6);
            ctx.fillRect(bannerX + 10, bannerY + bannerH - 16, 6, 6);
            ctx.fillRect(bannerX + bannerW - 16, bannerY + bannerH - 16, 6, 6);

            // Banner Text Overlay (Cinzel Font)
            ctx.textAlign = 'center';
            ctx.font = '900 24px "Cinzel", "Outfit", serif';

            const textGrad = ctx.createLinearGradient(0, bannerY + 25, 0, bannerY + 55);
            textGrad.addColorStop(0, '#ffffff');
            textGrad.addColorStop(0.5, '#fef08a');
            textGrad.addColorStop(1, '#facc15');

            ctx.fillStyle = textGrad;
            ctx.fillText(spawner.waveNoticeText, canvasWidth / 2, bannerY + 50);

            ctx.restore();
        }

        ctx.restore();
    }
}
