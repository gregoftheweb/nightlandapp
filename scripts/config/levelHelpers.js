"use strict";
// config/levelHelpers.ts
/**
 * Helper functions for level creation and validation.
 *
 * This module provides:
 * - Factory function for creating levels with smart defaults
 * - Spawn table loading utilities
 * - Runtime validation for level configurations
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLevel = createLevel;
exports.loadSpawnTable = loadSpawnTable;
exports.validateLevel = validateLevel;
exports.getLevel = getLevel;
var levelPresets_1 = require("./levelPresets");
/**
 * Create a level with smart defaults and optional biome preset.
 *
 * This factory function:
 * - Applies LEVEL_DEFAULTS for common properties
 * - Optionally applies biome preset settings
 * - Ensures required fields are present
 *
 * @param config Partial level configuration with required core fields
 * @returns Complete level configuration
 *
 * @example
 * ```typescript
 * const level = createLevel({
 *   id: "1",
 *   name: "Dark Wastes",
 *   boardSize: { width: 400, height: 400 },
 *   playerSpawn: { row: 200, col: 200 },
 *   biome: "dark_wastes",  // Auto-applies light, weather, music
 *   items: [...],
 *   monsters: loadSpawnTable("wasteland_common"),
 *   objects: [...],
 * });
 * ```
 */
function createLevel(config) {
    var _a, _b, _c;
    var biome = config.biome ? levelPresets_1.BIOME_PRESETS[config.biome] : undefined;
    return __assign(__assign(__assign(__assign({}, levelPresets_1.LEVEL_DEFAULTS), config), (biome && {
        ambientLight: (_a = config.ambientLight) !== null && _a !== void 0 ? _a : biome.ambientLight,
        weatherEffect: (_b = config.weatherEffect) !== null && _b !== void 0 ? _b : biome.weatherEffect,
        backgroundMusic: (_c = config.backgroundMusic) !== null && _c !== void 0 ? _c : biome.defaultMusic,
    })), { 
        // Ensure arrays exist (don't override if provided)
        items: config.items || [], monsters: config.monsters || [], objects: config.objects || [], nonCollisionObjects: config.nonCollisionObjects, greatPowers: config.greatPowers || [], completionConditions: config.completionConditions, spawnZones: config.spawnZones });
}
/**
 * Load monster instances from a predefined spawn table.
 *
 * This helper creates monster instances using the spawn configurations
 * defined in SPAWN_TABLES, promoting reuse and easier balancing.
 *
 * @param tableId Spawn table identifier
 * @param createMonsterFn Factory function for creating monster instances
 * @returns Array of configured monster instances
 *
 * @example
 * ```typescript
 * monsters: loadSpawnTable("wasteland_common", createMonsterInstance)
 * ```
 */
function loadSpawnTable(tableId, createMonsterFn) {
    var configs = levelPresets_1.SPAWN_TABLES[tableId];
    return configs.map(function (cfg) {
        return createMonsterFn(cfg.monsterShortName, cfg.spawnRate, cfg.maxInstances);
    });
}
/**
 * Validate level configuration at build/load time.
 *
 * Performs sanity checks on level data:
 * - Player spawn is within board bounds
 * - Objects are within board bounds
 * - (Future) Check for position overlaps
 * - (Future) Validate template IDs exist
 *
 * Throws error if validation fails.
 *
 * @param level Level configuration to validate
 * @throws Error if validation fails
 */
function validateLevel(level) {
    var boardSize = level.boardSize, playerSpawn = level.playerSpawn, id = level.id;
    // Validate player spawn position
    if (playerSpawn.row < 0 || playerSpawn.row >= boardSize.height) {
        throw new Error("Level ".concat(id, ": playerSpawn.row (").concat(playerSpawn.row, ") out of bounds [0, ").concat(boardSize.height, ")"));
    }
    if (playerSpawn.col < 0 || playerSpawn.col >= boardSize.width) {
        throw new Error("Level ".concat(id, ": playerSpawn.col (").concat(playerSpawn.col, ") out of bounds [0, ").concat(boardSize.width, ")"));
    }
    // Validate objects are within bounds
    for (var _i = 0, _a = level.objects; _i < _a.length; _i++) {
        var obj = _a[_i];
        if (!obj.position)
            continue; // Skip if position is undefined
        if (obj.position.row < 0 || obj.position.row >= boardSize.height) {
            throw new Error("Level ".concat(id, ": Object ").concat(obj.id, " row position out of bounds"));
        }
        if (obj.position.col < 0 || obj.position.col >= boardSize.width) {
            throw new Error("Level ".concat(id, ": Object ").concat(obj.id, " col position out of bounds"));
        }
    }
    // Future validations could include:
    // - Check for position overlaps between objects
    // - Validate that all template IDs reference existing templates
    // - Ensure completion conditions are achievable
    // - Verify spawn zones don't overlap with impassable objects
}
/**
 * Type-safe level retrieval.
 *
 * @param levels Level registry
 * @param id Level identifier
 * @returns Level configuration
 * @throws Error if level not found
 */
function getLevel(levels, id) {
    var level = levels[id];
    if (!level) {
        throw new Error("Level ".concat(id, " not found in registry"));
    }
    return level;
}
