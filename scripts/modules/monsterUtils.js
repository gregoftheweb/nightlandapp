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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearestMonster = exports.createMonsterFromTemplate = exports.getSpawnPosition = exports.checkMonsterSpawn = exports.handleMoveMonsters = void 0;
var monsters_1 = require("../config/monsters");
var movement_1 = require("./movement");
// ==================== CONSTANTS ====================
var MIN_SPAWN_DISTANCE = 5;
var MAX_SPAWN_DISTANCE = 15;
var MAX_SPAWN_ATTEMPTS = 50;
// ==================== UTILITY FUNCTIONS ====================
var logIfDev = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (__DEV__) {
        console.log.apply(console, __spreadArray([message], args, false));
    }
};
// ==================== HANDLE MONSTER TURN ====================
var handleMoveMonsters = function (state, dispatch, showDialog) {
    logIfDev('handleMoveMonsters called with', state.activeMonsters.length, 'monsters');
    // Spawn new monsters first (only when not in combat)
    if (!state.inCombat) {
        (0, exports.checkMonsterSpawn)(state, dispatch, showDialog);
    }
    // Move all active monsters toward player (original full flow preserved)
    (0, movement_1.moveMonsters)(state, dispatch, showDialog);
    logIfDev('Monster turn complete');
};
exports.handleMoveMonsters = handleMoveMonsters;
// ==================== MONSTER SPAWNING ====================
var checkMonsterSpawn = function (state, dispatch, showDialog) {
    logIfDev('Checking monster spawning...');
    // Process each monster configuration from the level
    if (state.level.monsters && state.level.monsters.length > 0) {
        // Pre-compute counts by type for O(1) lookups (perf: avoids filter per config)
        var typeCounts_1 = new Map();
        state.activeMonsters.forEach(function (m) {
            var count = typeCounts_1.get(m.shortName) || 0;
            typeCounts_1.set(m.shortName, count + 1);
        });
        for (var _i = 0, _a = state.level.monsters; _i < _a.length; _i++) {
            var monsterConfig = _a[_i];
            // Skip if no spawn configuration
            if (!monsterConfig.spawnRate || !monsterConfig.maxInstances) {
                continue;
            }
            // O(1) count lookup
            var activeCount = typeCounts_1.get(monsterConfig.shortName) || 0;
            // Check against maxInstances for this monster type
            if (activeCount >= monsterConfig.maxInstances) {
                continue;
            }
            // Use the spawn logic: Math.random() < spawnRate (percentage chance per turn)
            if (Math.random() < monsterConfig.spawnRate) {
                var newMonster = (0, exports.createMonsterFromTemplate)(monsterConfig.shortName, (0, exports.getSpawnPosition)(state));
                if (!newMonster) {
                    continue;
                }
                logIfDev("Spawning ".concat(newMonster.name, " at ").concat(newMonster.position.row, ",").concat(newMonster.position.col));
                dispatch({ type: 'SPAWN_MONSTER', payload: { monster: newMonster } });
                showDialog === null || showDialog === void 0 ? void 0 : showDialog("".concat(newMonster.name, " has appeared!"), 2000);
            }
        }
    }
};
exports.checkMonsterSpawn = checkMonsterSpawn;
// ==================== SPAWN POSITION LOGIC ====================
var getSpawnPosition = function (state) {
    var gridHeight = state.gridHeight, gridWidth = state.gridWidth, player = state.player, activeMonsters = state.activeMonsters;
    var attempts = 0;
    var _loop_1 = function () {
        var angle = Math.random() * 2 * Math.PI;
        var radius = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
        var spawnRow = Math.round(state.player.position.row + Math.sin(angle) * radius);
        var spawnCol = Math.round(state.player.position.col + Math.cos(angle) * radius);
        spawnRow = Math.max(0, Math.min(gridHeight - 1, spawnRow));
        spawnCol = Math.max(0, Math.min(gridWidth - 1, spawnCol));
        var candidate = { row: spawnRow, col: spawnCol };
        var isOccupied = activeMonsters.some(function (m) { return m.position.row === spawnRow && m.position.col === spawnCol; });
        if (!isOccupied)
            return { value: candidate };
        attempts++;
    };
    while (attempts < MAX_SPAWN_ATTEMPTS) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
    logIfDev("Could not find valid spawn position after ".concat(MAX_SPAWN_ATTEMPTS, " attempts"));
    return { row: Math.floor(gridHeight / 2), col: Math.floor(gridWidth / 2) };
};
exports.getSpawnPosition = getSpawnPosition;
// ==================== MONSTER CREATION UTILITIES ====================
/**
 * Create a monster instance from a template for spawning
 */
var createMonsterFromTemplate = function (shortName, position) {
    var template = (0, monsters_1.getMonsterTemplate)(shortName);
    if (!template) {
        logIfDev("Monster template not found: ".concat(shortName));
        return null;
    }
    return __assign(__assign({}, template), { id: "".concat(shortName, "-").concat(Date.now(), "-").concat(Math.random().toString(36).slice(2)), // Unique ID for React keys
        position: position, active: true, hp: template.hp, maxHP: template.maxHP, attack: template.attack, ac: template.ac, moveRate: template.moveRate, soulKey: template.soulKey });
};
exports.createMonsterFromTemplate = createMonsterFromTemplate;
/**
 * Find the nearest living monster to a given position
 * @param position - The position to search from (typically player position)
 * @param monsters - Array of monsters to search
 * @returns The nearest monster, or null if no living monsters exist
 */
var findNearestMonster = function (position, monsters) {
    if (!monsters || monsters.length === 0)
        return null;
    // Filter for living monsters (hp > 0 and active)
    var livingMonsters = monsters.filter(function (m) { return m.hp > 0 && m.active !== false && m.position; });
    if (livingMonsters.length === 0)
        return null;
    // Find the monster with the smallest Euclidean distance
    var nearestMonster = null;
    var minDistance = Infinity;
    for (var _i = 0, livingMonsters_1 = livingMonsters; _i < livingMonsters_1.length; _i++) {
        var monster = livingMonsters_1[_i];
        var dx = monster.position.col - position.col;
        var dy = monster.position.row - position.row;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
            minDistance = distance;
            nearestMonster = monster;
        }
    }
    return nearestMonster;
};
exports.findNearestMonster = findNearestMonster;
