"use strict";
// config/levelPresets.ts
/**
 * Reusable level configuration presets and defaults.
 *
 * This module provides:
 * - Common defaults for level properties
 * - Biome presets that bundle related settings
 * - Spawn tables for normalized monster configurations
 * - Lighting value mappings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPAWN_TABLES = exports.BIOME_PRESETS = exports.LEVEL_DEFAULTS = exports.LIGHTING_VALUES = void 0;
/**
 * Numeric values for lighting presets.
 * Maps semantic names to actual ambient light values (0.0 - 1.0).
 */
exports.LIGHTING_VALUES = {
    pitch_black: 0.05,
    very_dim: 0.1,
    dim: 0.15,
    moderate: 0.2,
    bright: 0.3,
};
/**
 * Default values for optional level properties.
 * Use these to avoid duplicating common settings across levels.
 */
exports.LEVEL_DEFAULTS = {
    turnsPerHitPoint: 5, // Heal 1 HP every 5 turns
    requiredLevel: 1, // Minimum player level to enter
    recommendedLevel: 1, // Suggested player level
    experienceReward: 100, // XP gained on completion
    ambientLight: 0.2, // Default lighting (moderate)
    weatherEffect: null,
    backgroundMusic: 'nightland_ambient',
};
/**
 * Predefined biome presets.
 * Use these to maintain consistent theming across levels.
 */
exports.BIOME_PRESETS = {
    dark_wastes: {
        ambientLight: 0.2,
        weatherEffect: null,
        defaultMusic: 'nightland_ambient',
        description: 'The desolate outer wastes, dimly lit and silent.',
    },
    watching_grounds: {
        ambientLight: 0.15,
        weatherEffect: 'mist',
        defaultMusic: 'watching_grounds',
        description: 'Misty grounds where ancient eyes observe.',
    },
    cursed_forest: {
        ambientLight: 0.1,
        weatherEffect: 'ash_fall',
        defaultMusic: 'nightland_ambient',
        description: 'A darkened forest with falling ash.',
    },
    ancient_ruins: {
        ambientLight: 0.25,
        weatherEffect: null,
        defaultMusic: 'nightland_ambient',
        description: 'Crumbling ruins with slightly better visibility.',
    },
};
/**
 * Reusable spawn tables for common monster encounter groups.
 * Use these to normalize spawn configurations and make balancing easier.
 *
 * Usage:
 *   monsters: loadSpawnTable("wasteland_common")
 */
exports.SPAWN_TABLES = {
    wasteland_common: [
        { monsterShortName: 'abhuman', spawnRate: 0.04, maxInstances: 3 },
        { monsterShortName: 'night_hound', spawnRate: 0.02, maxInstances: 2 },
    ],
    wasteland_rare: [
        { monsterShortName: 'abhuman', spawnRate: 0.015, maxInstances: 1 },
        { monsterShortName: 'night_hound', spawnRate: 0.1, maxInstances: 6 },
    ],
    wasteland_boss: [
    // Reserved for boss encounter levels
    ],
    grounds_common: [
        { monsterShortName: 'night_hound', spawnRate: 0.1, maxInstances: 6 },
        { monsterShortName: 'abhuman', spawnRate: 0.015, maxInstances: 1 },
    ],
    grounds_rare: [
    // Reserved for rare encounters in watching grounds
    ],
};
