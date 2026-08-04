import { GameConfig } from '../config/GameConfig.js';

// Preload Categorized 2D Weapon Textures for Top Right HUD Inventory
const hudWeaponTextures = {};

function loadHudTexture(id, src) {
    const img = new Image();
    img.src = src;
    hudWeaponTextures[id] = img;
}

loadHudTexture('swords', '/assets/images/powers/sword_icon.png');
loadHudTexture('fireball', '/assets/images/powers/fireball_icon.png');
loadHudTexture('lightning', '/assets/images/powers/thunder_icon.png');
loadHudTexture('flameAura', '/assets/images/powers/flame_ring_icon.png');
loadHudTexture('boomerang', '/assets/images/powers/boomerang_icon.png');
loadHudTexture('stat_magnet', '/assets/images/powers/gem_magnet_icon.png');
loadHudTexture('stat_speed', '/assets/images/powers/boots_speed_icon.png');
loadHudTexture('stat_health', '/assets/images/powers/vitality_elixir_icon.png');

function toRoman(n) {
    if (!n || n <= 0) return '';
    const vals = [10,9,5,4,1];
    const syms = ['X','IX','V','IV','I'];
    let result = '';
    vals.forEach((v,i) => { while(n >= v) { result += syms[i]; n -= v; } });
    return result;
}

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

                // Roman numeral level badge
                const wLevel = w.level || 1;
                ctx.fillStyle = '#facc15';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(toRoman(wLevel), slotX + 17, 118); // below the slot at y=118

                slotX += 40;
            });
        }
        // BUFFS Section below weapons
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px "Outfit", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('BUFFS:', cw - 220, 132);

        const buffs = [
            { id: 'stat_magnet', level: player.magnetLevel || 0 },
            { id: 'stat_speed', level: player.speedLevel || 0 },
            { id: 'stat_health', level: player.healthLevel || 0 }
        ];

        let buffSlotX = cw - 210;
        buffs.forEach(b => {
            if (b.level <= 0) return;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(buffSlotX, 140, 28, 28);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(buffSlotX, 140, 28, 28);
            const btex = hudWeaponTextures[b.id];
            if (btex && (btex.complete || btex.width)) {
                ctx.drawImage(btex, buffSlotX + 1, 141, 26, 26);
            }
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(toRoman(b.level), buffSlotX + 14, 178);
            buffSlotX += 34;
        });

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
