/**
 * GameConfig - Renegade Immortal Xianxia Roguelike
 */
export const GameConfig = {
    canvas: {
        width: 1920,
        height: 1080
    },
    world: {
        width: 3000,
        height: 3000,
        tileSize: 60
    },
    player: {
        radius: 22,
        speed: 3.4,
        health: 100,
        magnetRadius: 80
    },
    xp: {
        baseXP: 20,
        multiplier: 1.25
    },
    gems: {
        emerald: { value: 2, color: '#2ecc71', radius: 8 },
        large_emerald: { value: 5, color: '#27ae60', radius: 10 },
        boss_emerald: { value: 12, color: '#1abc9c', radius: 12 }
    },
    upgradeThresholds: [20, 50, 90, 140, 200, 270, 350, 440, 540, 650, 780, 920, 1070, 1230, 1400],
    enemies: {
        slime: {
            radius: 18,
            speed: 1.0,
            health: 15,
            damage: 8,
            color: '#2ecc71',
            name: 'Slime',
            gemType: 'emerald'
        },
        goblin: {
            radius: 20,
            speed: 1.3,
            health: 25,
            damage: 12,
            color: '#e67e22',
            name: 'Goblin Archer',
            gemType: 'emerald'
        },
        snake: {
            radius: 15,
            speed: 1.8,
            health: 16,
            damage: 10,
            color: '#a855f7',
            name: 'Viper Serpent',
            gemType: 'emerald'
        },
        ghost: {
            radius: 20,
            speed: 1.5,
            health: 30,
            damage: 15,
            color: '#9b59b6',
            name: 'Ghost Demon',
            gemType: 'large_emerald'
        },
        bear: {
            radius: 26,
            speed: 0.9,
            health: 90,
            damage: 25,
            color: '#e74c3c',
            name: 'Mutant Orc Berserker',
            gemType: 'boss_emerald'
        },
        fox_demon: {
            radius: 22,
            speed: 2.1,
            health: 45,
            damage: 16,
            color: '#ef4444',
            name: 'Nine-Tailed Demon Fox',
            gemType: 'large_emerald'
        },
        cultist_sorcerer: {
            radius: 22,
            speed: 1.1,
            health: 55,
            damage: 20,
            color: '#b91c1c',
            name: 'Blood Cultist Sorcerer',
            gemType: 'large_emerald'
        },
        stone_golem: {
            radius: 32,
            speed: 0.7,
            health: 180,
            damage: 30,
            color: '#64748b',
            name: 'Ironclad Stone Golem',
            gemType: 'boss_emerald'
        },
        spider_fiend: {
            radius: 16,
            speed: 1.9,
            health: 22,
            damage: 11,
            color: '#10b981',
            name: 'Jade Spider Fiend',
            gemType: 'emerald'
        },
        frost_dragon: {
            radius: 40,
            speed: 0.85,
            health: 320,
            damage: 40,
            color: '#38bdf8',
            name: 'Celestial Frost Dragon',
            gemType: 'boss_emerald'
        }
    },
    weapons: {
        swords: {
            id: 'swords',
            name: 'Orbiting Jiuyou Swords',
            icon: '⚔️',
            description: 'Spins sharp Jiuyou energy blades around Wang Lin, slicing through nearby monsters.',
            baseDamage: 18,
            cooldown: 0,
            count: 2,
            radius: 80,
            spinSpeed: 0.04
        },
        fireball: {
            id: 'fireball',
            name: 'Arcane Fireball',
            icon: '🔥',
            description: 'Launches exploding magic fireballs at the nearest monsters.',
            baseDamage: 40,
            cooldown: 55,
            count: 1,
            speed: 8,
            splashRadius: 50
        },
        lightning: {
            id: 'lightning',
            name: 'Thunder Bolt',
            icon: '⚡',
            description: 'Strikes random monsters in range with instant lightning bolts.',
            baseDamage: 55,
            cooldown: 75,
            count: 1,
            range: 380
        },
        flameAura: {
            id: 'flameAura',
            name: 'Flame Ring',
            icon: '♨️',
            description: 'Emits a burning halo around your hero that damages surrounding monsters.',
            baseDamage: 10,
            cooldown: 15,
            radius: 110
        },
        boomerang: {
            id: 'boomerang',
            name: 'Flying Boomerang',
            icon: '🪃',
            description: 'Throws curved energy blades that slice through monsters and return to you.',
            baseDamage: 28,
            cooldown: 60,
            count: 1,
            speed: 8
        }
    }
};
