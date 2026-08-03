import { GameConfig } from '../config/GameConfig.js';

// Preload 2D Weapon Textures for Top Right HUD Inventory
const hudWeaponTextures = {};

function loadHudTexture(id, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, 64, 64);

            const imgData = ctx.getImageData(0, 0, 64, 64);
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

                if ((r > 235 && g > 235 && b > 235) || (r < 25 && g < 25 && b < 25) || diff < 20) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            hudWeaponTextures[id] = canvas;
        } catch (e) {
            hudWeaponTextures[id] = img;
        }
    };
}

loadHudTexture('swords', '/assets/images/sword_icon.jpg');
loadHudTexture('fireball', '/assets/images/fireball_icon.jpg');
loadHudTexture('lightning', '/assets/images/thunder_icon.jpg');
loadHudTexture('flameAura', '/assets/images/flame_ring_icon.jpg');
loadHudTexture('boomerang', '/assets/images/boomerang_icon.jpg');

export class UIRenderer {
    render(ctx, player, score, waveTier, waveTimer, noticeTimer, noticeTitle, canvasWidth, canvasHeight, levelManager, weaponManager, spawner) {
        this.renderHUD(
            ctx,
            player,
            score,
            player ? (player.coins || 0) : 0,
            0,
            waveTier || 1,
            levelManager || { targetGems: 10, totalGems: 0 },
            weaponManager || { weapons: {} },
            spawner || { waveNoticeTimer: noticeTimer, waveNoticeText: noticeTitle },
            canvasWidth,
            canvasHeight
        );
    }

    renderHUD(ctx, player, score, coins, highScore, waveTier, levelManager, weaponManager, spawner, canvasWidth, canvasHeight) {
        if (!player || !ctx) return;

        const cw = (canvasWidth && Number.isFinite(canvasWidth) && canvasWidth > 0) ? canvasWidth : (window.innerWidth || 1920);
        const ch = (canvasHeight && Number.isFinite(canvasHeight) && canvasHeight > 0) ? canvasHeight : (window.innerHeight || 1080);

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

        // 2. Score, Emerald Gems Counter, and Coins
        ctx.textAlign = 'left';
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${score || 0}`, 20, 68);

        const targetGems = levelManager ? (levelManager.targetGems || 10) : 10;
        const currentGems = levelManager ? (levelManager.totalGems || 0) : 0;

        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`💎 Emeralds: ${currentGems} / ${targetGems}`, 20, 94);

        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Coins: $${coins || 0}`, 20, 118);

        // 3. Wave Counter & Enemy Kill Counter (Top Right)
        ctx.textAlign = 'right';
        ctx.font = '700 16px "Outfit", sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`WAVE TIER ${waveTier || 1}`, cw - 20, 30);

        const killed = spawner ? (spawner.enemiesKilledInWave || 0) : 0;
        const spec = spawner && spawner.getWaveSpec ? spawner.getWaveSpec(waveTier || 1) : { totalWaveEnemies: 12 };
        const totalEnemies = spec ? spec.totalWaveEnemies || 12 : 12;

        ctx.font = '600 13px "Outfit", sans-serif';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Killed: ${killed} / ${totalEnemies}`, cw - 20, 50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px "Outfit", sans-serif';
        ctx.fillText('WEAPONS:', cw - 220, 72);

        let slotX = cw - 210;
        if (weaponManager && weaponManager.weapons) {
            Object.keys(weaponManager.weapons).forEach(id => {
                const w = weaponManager.weapons[id];
                if (!w || !w.config) return;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(slotX, 80, 34, 34);

                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(slotX, 80, 34, 34);

                const tex = hudWeaponTextures[id];
                if (tex && (tex.complete || tex.width)) {
                    ctx.drawImage(tex, slotX + 2, 82, 30, 30);
                } else {
                    ctx.font = '18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(w.config.icon || '⚔️', slotX + 17, 103);
                }

                slotX += 40;
            });
        }

        // 4. Milestone Wave Warning Banner
        const noticeTimer = spawner ? (spawner.milestoneNoticeTimer || spawner.waveNoticeTimer || 0) : 0;
        const noticeTitle = spawner ? (spawner.milestoneTitle || spawner.waveNoticeText || '') : '';

        if (noticeTimer > 0 && noticeTitle) {
            const bannerW = 640;
            const bannerH = 84;
            const bannerX = (cw - bannerW) / 2;
            const bannerY = ch * 0.18;

            const alpha = Math.min(1, noticeTimer / 30);

            ctx.save();
            ctx.globalAlpha = alpha;

            ctx.shadowColor = 'rgba(220, 38, 38, 0.6)';
            ctx.shadowBlur = 20;

            const y0 = Number.isFinite(bannerY) ? bannerY : 100;
            const y1 = Number.isFinite(bannerY + bannerH) ? bannerY + bannerH : 184;

            const plaqueGrad = ctx.createLinearGradient(bannerX, y0, bannerX, y1);
            plaqueGrad.addColorStop(0, '#1e1b4b');
            plaqueGrad.addColorStop(0.5, '#0f172a');
            plaqueGrad.addColorStop(1, '#020617');

            ctx.fillStyle = plaqueGrad;
            ctx.beginPath();
            ctx.roundRect(bannerX, y0, bannerW, bannerH, 14);
            ctx.fill();

            ctx.shadowColor = 'transparent';

            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(bannerX, y0, bannerW, bannerH, 14);
            ctx.stroke();

            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(bannerX + 6, y0 + 6, bannerW - 12, bannerH - 12, 10);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bannerX + 10, y0 + 10, 6, 6);
            ctx.fillRect(bannerX + bannerW - 16, y0 + 10, 6, 6);
            ctx.fillRect(bannerX + 10, y0 + bannerH - 16, 6, 6);
            ctx.fillRect(bannerX + bannerW - 16, y0 + bannerH - 16, 6, 6);

            ctx.textAlign = 'center';
            ctx.font = '900 24px "Cinzel", "Outfit", serif';

            const textY0 = y0 + 25;
            const textY1 = y0 + 55;

            const textGrad = ctx.createLinearGradient(0, textY0, 0, textY1);
            textGrad.addColorStop(0, '#ffffff');
            textGrad.addColorStop(0.5, '#fef08a');
            textGrad.addColorStop(1, '#facc15');

            ctx.fillStyle = textGrad;
            ctx.fillText(noticeTitle, cw / 2, y0 + 50);

            ctx.restore();
        }

        ctx.restore();
    }
}
