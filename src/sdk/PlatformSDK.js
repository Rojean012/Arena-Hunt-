/**
 * PlatformSDK - Universal Portal Integration Layer
 * Supports Poki, CrazyGames, Y8, and GameDistribution with graceful local fallback.
 */
export class PlatformSDK {
    constructor() {
        this.platform = 'local';
        this.isInitialized = false;
        this.isAdPlaying = false;
        this.callbacks = {
            onPause: null,
            onResume: null,
            onMute: null,
            onUnmute: null
        };
    }

    async init() {
        if (this.isInitialized) return;

        // Auto-detect web game portal environment
        if (window.PokiSDK) {
            this.platform = 'poki';
            try {
                await window.PokiSDK.init();
                console.log('[SDK] Poki SDK Initialized');
            } catch (e) {
                console.warn('[SDK] Poki SDK failed, continuing in adblock mode', e);
            }
        } else if (window.CrazyGames && window.CrazyGames.SDK) {
            this.platform = 'crazygames';
            console.log('[SDK] CrazyGames SDK Initialized');
        } else if (window.y8) {
            this.platform = 'y8';
            console.log('[SDK] Y8 SDK Initialized');
        } else if (window.gamedistribution) {
            this.platform = 'gamedistribution';
            console.log('[SDK] GameDistribution SDK Initialized');
        } else {
            this.platform = 'local';
            console.log('[SDK] Local Sandbox Mode');
        }

        this.isInitialized = true;
        this.setupFocusListeners();
    }

    setupFocusListeners() {
        window.addEventListener('blur', () => {
            if (this.callbacks.onPause) this.callbacks.onPause();
        });
        window.addEventListener('focus', () => {
            if (!this.isAdPlaying && this.callbacks.onResume) {
                this.callbacks.onResume();
            }
        });
    }

    registerLifecycleCallbacks({ onPause, onResume, onMute, onUnmute }) {
        this.callbacks.onPause = onPause;
        this.callbacks.onResume = onResume;
        this.callbacks.onMute = onMute;
        this.callbacks.onUnmute = onUnmute;
    }

    gameplayStart() {
        console.log('[SDK] Gameplay Started');
        if (this.platform === 'poki' && window.PokiSDK) {
            window.PokiSDK.gameplayStart();
        } else if (this.platform === 'crazygames' && window.CrazyGames?.SDK?.gameplayStart) {
            window.CrazyGames.SDK.gameplayStart();
        }
    }

    gameplayStop() {
        console.log('[SDK] Gameplay Stopped');
        if (this.platform === 'poki' && window.PokiSDK) {
            window.PokiSDK.gameplayStop();
        } else if (this.platform === 'crazygames' && window.CrazyGames?.SDK?.gameplayStop) {
            window.CrazyGames.SDK.gameplayStop();
        }
    }

    happyTime(intensity = 0.5) {
        if (this.platform === 'poki' && window.PokiSDK) {
            window.PokiSDK.happyTime(intensity);
        } else if (this.platform === 'crazygames' && window.CrazyGames?.SDK?.happytime) {
            window.CrazyGames.SDK.happytime();
        }
    }

    showCommercialBreak() {
        return new Promise((resolve) => {
            console.log('[SDK] Requesting Commercial Break');
            this.isAdPlaying = true;
            if (this.callbacks.onMute) this.callbacks.onMute();
            if (this.callbacks.onPause) this.callbacks.onPause();

            const finishAd = () => {
                this.isAdPlaying = false;
                if (this.callbacks.onUnmute) this.callbacks.onUnmute();
                if (this.callbacks.onResume) this.callbacks.onResume();
                resolve(true);
            };

            if (this.platform === 'poki' && window.PokiSDK) {
                window.PokiSDK.commercialBreak().then(finishAd).catch(finishAd);
            } else if (this.platform === 'crazygames' && window.CrazyGames?.SDK?.ad) {
                window.CrazyGames.SDK.ad.requestAd('midroll', {
                    adStarted: () => {},
                    adFinished: finishAd,
                    adError: finishAd
                });
            } else {
                // Local mock fallback: instant resolve
                setTimeout(finishAd, 300);
            }
        });
    }

    showRewardedBreak() {
        return new Promise((resolve) => {
            console.log('[SDK] Requesting Rewarded Ad');
            this.isAdPlaying = true;
            if (this.callbacks.onMute) this.callbacks.onMute();
            if (this.callbacks.onPause) this.callbacks.onPause();

            let rewardGranted = false;

            const finishAd = () => {
                this.isAdPlaying = false;
                if (this.callbacks.onUnmute) this.callbacks.onUnmute();
                if (this.callbacks.onResume) this.callbacks.onResume();
                resolve(rewardGranted);
            };

            if (this.platform === 'poki' && window.PokiSDK) {
                window.PokiSDK.rewardedBreak().then((success) => {
                    rewardGranted = success;
                    finishAd();
                }).catch(() => finishAd());
            } else if (this.platform === 'crazygames' && window.CrazyGames?.SDK?.ad) {
                window.CrazyGames.SDK.ad.requestAd('rewarded', {
                    adStarted: () => {},
                    adFinished: () => { rewardGranted = true; finishAd(); },
                    adError: finishAd
                });
            } else {
                // Local mock fallback: always reward in dev mode
                rewardGranted = true;
                setTimeout(finishAd, 500);
            }
        });
    }

    submitScore(score) {
        console.log(`[SDK] Submitting Score: ${score}`);
        if (this.platform === 'y8' && window.ID) {
            try {
                window.ID.GameAPI.Leaderboards.save({ table: 'Highscores', points: score });
            } catch (e) { console.warn(e); }
        }
    }
}

export const platformSDK = new PlatformSDK();
