"use strict";
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
exports.reducer = exports.validateGameState = exports.deserializeGameState = exports.serializeGameState = exports.fromSnapshot = exports.toSnapshot = exports.createInitialGameState = exports.initialState = exports.getInitialState = void 0;
// modules/gameState.ts
/**
 * GameState Management Module
 *
 * This module provides the single source of truth for game state initialization,
 * serialization, and reset operations. It ensures type safety and consistency
 * across the application.
 *
 * Key Functions:
 * - getInitialState(): Creates a fresh initial state for a given level
 * - toSnapshot(): Converts GameState to a JSON-serializable format
 * - fromSnapshot(): Reconstructs GameState from a snapshot (for future save/load)
 * - validateGameState(): Development-only state validation
 */
var levels_1 = require("../config/levels");
var player_1 = require("../config/player");
var weapons_1 = require("../config/weapons");
var gameConfig_1 = require("../config/gameConfig");
var reducers_1 = require("./reducers");
Object.defineProperty(exports, "reducer", { enumerable: true, get: function () { return reducers_1.reducer; } });
var utils_1 = require("./utils");
/**
 * Creates a fresh initial game state for a given level.
 * This is the single source of truth for the default/initial state.
 *
 * @param levelId - The level ID to initialize (defaults to '1')
 * @returns A complete, fresh GameState object
 */
var getInitialState = function (levelId) {
    if (levelId === void 0) { levelId = '1'; }
    // Type-safe level lookup with validation
    var levelConfig = levels_1.levels[levelId];
    if (!levelConfig) {
        (0, utils_1.logIfDev)("\u26A0\uFE0F  Unknown levelId: ".concat(levelId, ", falling back to level 1"));
        // Direct fallback to avoid infinite recursion if level '1' is missing
        var fallbackConfig = levels_1.levels['1'];
        if (!fallbackConfig) {
            throw new Error('Critical error: Level 1 configuration is missing!');
        }
        // Use fallback config directly rather than recursive call
        return buildInitialState('1', fallbackConfig);
    }
    (0, utils_1.logIfDev)("\uD83C\uDFAE Creating initial state for level: ".concat(levelId));
    return buildInitialState(levelId, levelConfig);
};
exports.getInitialState = getInitialState;
/**
 * Internal helper to build the initial state from a level config.
 * Extracted to avoid recursion in getInitialState.
 *
 * This function constructs a complete GameState object from a level configuration,
 * applying all default values for combat, UI, and meta state.
 *
 * @param levelId - The level ID string
 * @param levelConfig - The level configuration object (from levels registry)
 * @returns A complete GameState object initialized for the given level
 */
function buildInitialState(levelId, levelConfig) {
    var _a;
    return {
        // ===== LEVEL DOMAIN =====
        level: levelConfig,
        currentLevelId: levelId,
        levels: (_a = {}, _a[levelId] = levelConfig, _a),
        items: levelConfig.items || [],
        objects: levelConfig.objects || [],
        greatPowers: levelConfig.greatPowers || [],
        nonCollisionObjects: levelConfig.nonCollisionObjects || [],
        monsters: levelConfig.monsters || [],
        gridWidth: gameConfig_1.gameConfig.grid.width,
        gridHeight: gameConfig_1.gameConfig.grid.height,
        // ===== PLAYER DOMAIN =====
        player: __assign(__assign({}, player_1.playerConfig), { position: player_1.playerConfig.position || { row: 0, col: 0 } }),
        moveCount: 0,
        distanceTraveled: 0,
        selfHealTurnCounter: 0,
        // ===== COMBAT DOMAIN =====
        inCombat: false,
        combatTurn: null,
        activeMonsters: [],
        attackSlots: [],
        waitingMonsters: [],
        turnOrder: [],
        combatLog: [],
        maxAttackers: gameConfig_1.gameConfig.combat.maxAttackers,
        monstersKilled: 0,
        // ===== RANGED COMBAT =====
        rangedAttackMode: false,
        targetedMonsterId: null,
        activeProjectiles: [],
        // ===== UI DOMAIN =====
        showInventory: false,
        showWeaponsInventory: false,
        dropSuccess: false,
        dialogData: undefined,
        audioStarted: false,
        // ===== DEATH/GAME OVER DOMAIN =====
        gameOver: false,
        gameOverMessage: undefined,
        killerName: undefined,
        suppressDeathDialog: false,
        // ===== META/PERSISTENCE DOMAIN =====
        weapons: weapons_1.weaponsCatalog,
        saveVersion: gameConfig_1.gameConfig.save.version,
        lastSaved: new Date(),
        playTime: 0,
        lastAction: '',
        subGamesCompleted: {}, // Decision: Reset on death for "fresh run" experience
        waypointSavesCreated: {}, // Track which waypoint saves have been created
    };
}
/**
 * The canonical initial state. All resets should derive from getInitialState(),
 * not from this constant, to ensure fresh state generation.
 */
exports.initialState = (0, exports.getInitialState)('1');
/**
 * Legacy alias for getInitialState. Deprecated - use getInitialState() directly.
 * @deprecated Use getInitialState() instead
 */
var createInitialGameState = function (levelId) {
    if (levelId === void 0) { levelId = '1'; }
    return (0, exports.getInitialState)(levelId);
};
exports.createInitialGameState = createInitialGameState;
/**
 * Converts GameState to a JSON-serializable snapshot.
 * This excludes non-serializable fields like Date objects and prepares
 * the state for persistence (e.g., AsyncStorage, file save).
 *
 * @param state - The current game state
 * @returns A JSON-serializable GameSnapshot
 */
var toSnapshot = function (state) {
    return __assign(__assign({}, state), { lastSaved: state.lastSaved.toISOString() });
};
exports.toSnapshot = toSnapshot;
/**
 * Reconstructs GameState from a serialized snapshot.
 * Merges saved state with default values to ensure all fields are present.
 * Clears transient UI state that shouldn't persist.
 *
 * @param snapshot - The serialized game snapshot
 * @returns A reconstructed GameState
 */
var fromSnapshot = function (snapshot) {
    var _a, _b;
    if (!snapshot) {
        (0, utils_1.logIfDev)('⚠️  No snapshot provided, returning fresh initial state');
        return (0, exports.getInitialState)('1');
    }
    (0, utils_1.logIfDev)('💾 Reconstructing GameState from snapshot');
    (0, utils_1.logIfDev)("\uD83D\uDCBE Snapshot has ".concat(Object.keys(snapshot).length, " keys"));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Snapshot currentLevelId: ".concat(snapshot.currentLevelId));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Snapshot player position: ".concat(JSON.stringify((_a = snapshot.player) === null || _a === void 0 ? void 0 : _a.position)));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Snapshot moveCount: ".concat(snapshot.moveCount));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Snapshot subGamesCompleted:", snapshot.subGamesCompleted);
    // Get fresh initial state as base
    var base = (0, exports.getInitialState)(snapshot.currentLevelId || '1');
    // Merge snapshot data with base, clearing transient UI state
    var result = __assign(__assign(__assign({}, base), snapshot), { 
        // Convert ISO string back to Date
        lastSaved: new Date(snapshot.lastSaved), 
        // Clear transient UI flags that should not persist
        showInventory: false, showWeaponsInventory: false, dropSuccess: false, dialogData: undefined, 
        // Clear combat UI state (combat mechanics will restore if needed)
        combatLog: [], activeProjectiles: [], 
        // Keep game state flags from snapshot
        gameOver: snapshot.gameOver || false, inCombat: snapshot.inCombat || false, 
        // Ensure waypoint tracking is preserved
        waypointSavesCreated: snapshot.waypointSavesCreated || {} });
    (0, utils_1.logIfDev)("\uD83D\uDCBE Result currentLevelId: ".concat(result.currentLevelId));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Result player position: ".concat(JSON.stringify((_b = result.player) === null || _b === void 0 ? void 0 : _b.position)));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Result moveCount: ".concat(result.moveCount));
    (0, utils_1.logIfDev)("\uD83D\uDCBE Result subGamesCompleted:", result.subGamesCompleted);
    return result;
};
exports.fromSnapshot = fromSnapshot;
/**
 * Legacy serialization function. Deprecated - use toSnapshot() instead.
 * @deprecated Use toSnapshot() instead
 */
var serializeGameState = function (state) {
    return JSON.stringify((0, exports.toSnapshot)(state));
};
exports.serializeGameState = serializeGameState;
/**
 * Legacy deserialization function. Deprecated - use fromSnapshot() instead.
 * @deprecated Use fromSnapshot() instead
 */
var deserializeGameState = function (serializedState) {
    try {
        var snapshot = JSON.parse(serializedState);
        return (0, exports.fromSnapshot)(snapshot);
    }
    catch (e) {
        console.error('Failed to deserialize game state:', e);
        return exports.initialState;
    }
};
exports.deserializeGameState = deserializeGameState;
/**
 * Validates GameState structure in development builds.
 * Checks for required fields and type consistency.
 *
 * @param state - The state to validate
 * @param actionType - The action that produced this state (for logging)
 */
var validateGameState = function (state, actionType) {
    if (!__DEV__)
        return; // Only run in development
    var errors = [];
    // Validate critical fields exist
    if (!state.player)
        errors.push('player is missing');
    if (!state.level)
        errors.push('level is missing');
    if (typeof state.inCombat !== 'boolean')
        errors.push('inCombat must be boolean');
    if (!Array.isArray(state.activeMonsters))
        errors.push('activeMonsters must be array');
    if (!Array.isArray(state.combatLog))
        errors.push('combatLog must be array');
    if (!Array.isArray(state.activeProjectiles))
        errors.push('activeProjectiles must be array');
    // Validate player structure
    if (state.player) {
        if (!state.player.position)
            errors.push('player.position is missing');
        if (typeof state.player.hp !== 'number')
            errors.push('player.hp must be number');
        if (typeof state.player.maxHP !== 'number')
            errors.push('player.maxHP must be number');
    }
    // Validate combat state consistency
    if (state.inCombat && state.activeMonsters.length === 0) {
        errors.push('inCombat is true but activeMonsters is empty');
    }
    if (errors.length > 0) {
        console.error("\u274C GameState validation failed".concat(actionType ? " after ".concat(actionType) : '', ":"));
        errors.forEach(function (err) { return console.error("  - ".concat(err)); });
    }
};
exports.validateGameState = validateGameState;
