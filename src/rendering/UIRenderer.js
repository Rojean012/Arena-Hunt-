import { GameConfig } from '../config/GameConfig.js';

// Preload Wave Warning Banner 2D Image Asset
const waveBannerImage = new Image();
waveBannerImage.src = '/assets/images/wave_banner.jpg';

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

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hpX, hpY, hpW, hpH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`HP: ${Math.ceil(player.health)} / ${player.maxHealth}`, hpX + hpW / 2, hpY + 16);

        // 2. Score, Emerald Gems Counter Below Score, and Coins
        ctx.textAlign = 'left';
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${score}`, 20, 68);

        // Emerald Gem Counter directly below Score!
        const targetGems = levelManager.targetGems;
        const currentGems = levelManager.totalGems;

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`💎 Emeralds: ${currentGems} / ${targetGems}`, 20, 94);

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Coins: $${coins}`, 20, 118);

        // 3. Active Weapon Icons Bar (Top Right)
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`WAVE TIER ${waveTier}`, canvasWidth - 20, 35);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('WEAPONS:', canvasWidth - 220, 60);

        let slotX = canvasWidth - 210;
        Object.keys(weaponManager.weapons).forEach(id => {
            const w = weaponManager.weapons[id];
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(slotX, 68, 32, 32);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1;
            ctx.strokeRect(slotX, 68, 32, 32);

            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(w.config.icon, slotX + 16, 90);

            slotX += 38;
        });

        // 4. BOLD WAVE SIGNALING IMAGE BANNER WITH TEXT OVERLAY
        if (spawner && spawner.waveNoticeTimer > 0) {
            const bannerW = 620;
            const bannerH = 90;
            const bannerX = (canvasWidth - bannerW) / 2;
            const bannerY = canvasHeight * 0.22;

            const alpha = Math.min(1, spawner.waveNoticeTimer / 30);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw High-Res 2D Wave Banner Asset Frame
            if (waveBannerImage.complete && waveBannerImage.naturalWidth !== 0) {
                ctx.drawImage(waveBannerImage, bannerX, bannerY, bannerW, bannerH);
            } else {
                ctx.fillStyle = 'rgba(192, 57, 43, 0.9)';
                ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
            }

            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

            // Banner Text Overlay
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(spawner.waveNoticeText, canvasWidth / 2, bannerY + 52);

            ctx.restore();
        }

        ctx.restore();
    }
}
