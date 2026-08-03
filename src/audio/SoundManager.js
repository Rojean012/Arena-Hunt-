/**
 * SoundManager - Pure Web Audio API Synthesizer Engine
 * High-quality procedural sound synthesis for Xianxia Roguelike
 */
export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmOsc = null;
        this.bgmGain = null;
        this.bgmTimer = null;
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn('[SoundManager] Web Audio API not supported');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    playHit() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    playEnemyHit() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    }

    playEnemyDefeat() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    playCoinClink() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.frequency.setValueAtTime(1200, now);
            osc2.frequency.setValueAtTime(1800, now + 0.04);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now);
            osc2.start(now + 0.04);
            osc1.stop(now + 0.14);
            osc2.stop(now + 0.14);
        } catch (e) {}
    }

    playCoinCollect() {
        this.playCoinClink();
    }

    playLevelUp() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C Xianxia Arpeggio

            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0.18, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.25);
            });
        } catch (e) {}
    }

    playButtonClick() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(250, now + 0.05);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }

    playGameOver() {
        if (this.isMuted) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [300, 250, 200, 150];

            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.15);

                gain.gain.setValueAtTime(0.15, now + idx * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.15);
                osc.stop(now + idx * 0.15 + 0.25);
            });
        } catch (e) {}
    }

    playMusic() {}
    stopMusic() {}

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export const soundManager = new SoundManager();
