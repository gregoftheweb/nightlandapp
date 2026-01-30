"use strict";
// modules/saveGame.ts
/**
 * Save Game Module
 *
 * Handles all save/load operations for the game:
 * - Autosave (current game)
 * - Waypoint saves (hard saves at specific locations)
 *
 * Storage Strategy:
 * - Current save: Single slot that gets overwritten on each autosave
 * - Waypoint saves: Multiple indexed saves with metadata
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCurrentGame = saveCurrentGame;
exports.loadCurrentGame = loadCurrentGame;
exports.deleteCurrentGame = deleteCurrentGame;
exports.hasCurrentGame = hasCurrentGame;
exports.saveWaypoint = saveWaypoint;
exports.loadWaypoint = loadWaypoint;
exports.listWaypointSaves = listWaypointSaves;
exports.deleteWaypoint = deleteWaypoint;
exports.deleteAllWaypointSaves = deleteAllWaypointSaves;
exports.debugInspectCurrentSave = debugInspectCurrentSave;
var async_storage_1 = require("@react-native-async-storage/async-storage");
var gameState_1 = require("./gameState");
// ===== STORAGE KEYS =====
var CURRENT_GAME_KEY = 'nightland:save:current:v1';
var WAYPOINT_INDEX_KEY = 'nightland:save:waypoints:index:v1';
var WAYPOINT_ITEM_PREFIX = 'nightland:save:waypoint:v1:';
// ===== CURRENT GAME (AUTOSAVE) =====
/**
 * Save the current game state (autosave).
 * Overwrites any existing current save.
 */
function saveCurrentGame(state) {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot, savedGame, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    snapshot = (0, gameState_1.toSnapshot)(state);
                    savedGame = {
                        version: 'v1',
                        snapshot: snapshot,
                        savedAt: new Date().toISOString(),
                    };
                    if (__DEV__) {
                        console.log('[SaveGame] === SAVING CURRENT GAME ===');
                        console.log('[SaveGame] State currentLevelId:', state.currentLevelId);
                        console.log('[SaveGame] State player position:', (_a = state.player) === null || _a === void 0 ? void 0 : _a.position);
                        console.log('[SaveGame] State player HP:', (_b = state.player) === null || _b === void 0 ? void 0 : _b.hp);
                        console.log('[SaveGame] State moveCount:', state.moveCount);
                        console.log('[SaveGame] State subGamesCompleted:', Object.keys(state.subGamesCompleted || {}).length);
                        console.log('[SaveGame] Included subGames keys:', Object.keys(state.subGamesCompleted || {}));
                        console.log('[SaveGame] SubGames detail:', state.subGamesCompleted);
                    }
                    return [4 /*yield*/, async_storage_1.default.setItem(CURRENT_GAME_KEY, JSON.stringify(savedGame))];
                case 1:
                    _c.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Current game saved successfully');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    console.error('[SaveGame] Failed to save current game:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load the current game state (autosave).
 * Returns null if no save exists or if corrupted.
 */
function loadCurrentGame() {
    return __awaiter(this, void 0, void 0, function () {
        var data, savedGame, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, async_storage_1.default.getItem(CURRENT_GAME_KEY)];
                case 1:
                    data = _c.sent();
                    if (!data) {
                        if (__DEV__) {
                            console.log('[SaveGame] No current game save found');
                        }
                        return [2 /*return*/, null];
                    }
                    savedGame = JSON.parse(data);
                    // Validate version
                    if (savedGame.version !== 'v1') {
                        console.warn('[SaveGame] Unsupported save version:', savedGame.version);
                        return [2 /*return*/, null];
                    }
                    if (__DEV__) {
                        console.log('[SaveGame] === LOADING CURRENT GAME ===');
                        console.log('[SaveGame] Save version:', savedGame.version);
                        console.log('[SaveGame] Saved at:', savedGame.savedAt);
                        console.log('[SaveGame] Snapshot currentLevelId:', savedGame.snapshot.currentLevelId);
                        console.log('[SaveGame] Snapshot player position:', (_a = savedGame.snapshot.player) === null || _a === void 0 ? void 0 : _a.position);
                        console.log('[SaveGame] Snapshot player HP:', (_b = savedGame.snapshot.player) === null || _b === void 0 ? void 0 : _b.hp);
                        console.log('[SaveGame] Snapshot moveCount:', savedGame.snapshot.moveCount);
                        console.log('[SaveGame] Snapshot subGamesCompleted:', Object.keys(savedGame.snapshot.subGamesCompleted || {}).length);
                        console.log('[SaveGame] Restored subGames keys:', Object.keys(savedGame.snapshot.subGamesCompleted || {}));
                        console.log('[SaveGame] SubGames detail:', savedGame.snapshot.subGamesCompleted);
                    }
                    return [2 /*return*/, savedGame.snapshot];
                case 2:
                    error_2 = _c.sent();
                    console.error('[SaveGame] Failed to load current game:', error_2);
                    // If corrupted, delete it
                    return [4 /*yield*/, deleteCurrentGame()];
                case 3:
                    // If corrupted, delete it
                    _c.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Delete the current game save.
 * Called on death or when starting a new game.
 */
function deleteCurrentGame() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.removeItem(CURRENT_GAME_KEY)];
                case 1:
                    _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Current game deleted');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('[SaveGame] Failed to delete current game:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if a current game save exists.
 */
function hasCurrentGame() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.getItem(CURRENT_GAME_KEY)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data !== null];
                case 2:
                    error_4 = _a.sent();
                    console.error('[SaveGame] Failed to check current game existence:', error_4);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// ===== WAYPOINT SAVES =====
/**
 * Save a waypoint (hard save).
 * Creates a new waypoint save with the given name.
 * If waypoint(s) with the same name already exist, ALL will be replaced.
 * This ensures only ONE waypoint save per waypoint type.
 * Returns the ID of the created waypoint.
 */
function saveWaypoint(state, waypointName) {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot, index, existingWaypoints, _i, existingWaypoints_1, waypoint, oldWaypointKey, filteredIndex, id, metadata, record, waypointKey, updatedIndex, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, , 12]);
                    snapshot = (0, gameState_1.toSnapshot)(state);
                    return [4 /*yield*/, loadWaypointIndex()];
                case 1:
                    index = _a.sent();
                    existingWaypoints = index.filter(function (item) { return item.name === waypointName; });
                    if (!(existingWaypoints.length > 0)) return [3 /*break*/, 7];
                    if (__DEV__) {
                        console.log("[SaveGame] Replacing ".concat(existingWaypoints.length, " existing waypoint(s):"), waypointName);
                    }
                    _i = 0, existingWaypoints_1 = existingWaypoints;
                    _a.label = 2;
                case 2:
                    if (!(_i < existingWaypoints_1.length)) return [3 /*break*/, 5];
                    waypoint = existingWaypoints_1[_i];
                    oldWaypointKey = WAYPOINT_ITEM_PREFIX + waypoint.id;
                    return [4 /*yield*/, async_storage_1.default.removeItem(oldWaypointKey)];
                case 3:
                    _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Deleted waypoint ID:', waypoint.id);
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    filteredIndex = index.filter(function (item) { return item.name !== waypointName; });
                    return [4 /*yield*/, saveWaypointIndex(filteredIndex)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    id = "".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 11), "-").concat(Math.random().toString(36).substring(2, 11));
                    metadata = {
                        id: id,
                        name: waypointName,
                        createdAt: new Date().toISOString(),
                        levelId: state.currentLevelId,
                        playerPosition: state.player.position,
                        playerHP: state.player.hp,
                        playerMaxHP: state.player.maxHP,
                    };
                    record = __assign(__assign({}, metadata), { snapshot: snapshot });
                    waypointKey = WAYPOINT_ITEM_PREFIX + id;
                    return [4 /*yield*/, async_storage_1.default.setItem(waypointKey, JSON.stringify(record))
                        // Update index with new waypoint
                    ];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, loadWaypointIndex()];
                case 9:
                    updatedIndex = _a.sent();
                    updatedIndex.push(metadata);
                    return [4 /*yield*/, saveWaypointIndex(updatedIndex)];
                case 10:
                    _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Waypoint saved:', waypointName, 'ID:', id);
                    }
                    return [2 /*return*/, id];
                case 11:
                    error_5 = _a.sent();
                    console.error('[SaveGame] Failed to save waypoint:', error_5);
                    throw error_5;
                case 12: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load a waypoint save by ID.
 * Returns the snapshot, or null if not found.
 */
function loadWaypoint(id) {
    return __awaiter(this, void 0, void 0, function () {
        var waypointKey, data, record, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    waypointKey = WAYPOINT_ITEM_PREFIX + id;
                    return [4 /*yield*/, async_storage_1.default.getItem(waypointKey)];
                case 1:
                    data = _a.sent();
                    if (!data) {
                        console.warn('[SaveGame] Waypoint not found:', id);
                        return [2 /*return*/, null];
                    }
                    record = JSON.parse(data);
                    if (__DEV__) {
                        console.log('[SaveGame] Waypoint loaded:', record.name, 'ID:', id);
                    }
                    return [2 /*return*/, record.snapshot];
                case 2:
                    error_6 = _a.sent();
                    console.error('[SaveGame] Failed to load waypoint:', error_6);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * List all waypoint saves.
 * Returns metadata for all waypoints (for display in UI).
 */
function listWaypointSaves() {
    return __awaiter(this, void 0, void 0, function () {
        var index, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, loadWaypointIndex()];
                case 1:
                    index = _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Listed', index.length, 'waypoint saves');
                    }
                    return [2 /*return*/, index];
                case 2:
                    error_7 = _a.sent();
                    console.error('[SaveGame] Failed to list waypoint saves:', error_7);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Delete a waypoint save by ID.
 */
function deleteWaypoint(id) {
    return __awaiter(this, void 0, void 0, function () {
        var waypointKey, index, newIndex, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    waypointKey = WAYPOINT_ITEM_PREFIX + id;
                    return [4 /*yield*/, async_storage_1.default.removeItem(waypointKey)
                        // Update index
                    ];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, loadWaypointIndex()];
                case 2:
                    index = _a.sent();
                    newIndex = index.filter(function (item) { return item.id !== id; });
                    return [4 /*yield*/, saveWaypointIndex(newIndex)];
                case 3:
                    _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] Waypoint deleted:', id);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_8 = _a.sent();
                    console.error('[SaveGame] Failed to delete waypoint:', error_8);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Delete all waypoint saves.
 * Utility function, not exposed in UI.
 */
function deleteAllWaypointSaves() {
    return __awaiter(this, void 0, void 0, function () {
        var index, _i, index_1, item, waypointKey, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, loadWaypointIndex()
                        // Delete all waypoint items
                    ];
                case 1:
                    index = _a.sent();
                    _i = 0, index_1 = index;
                    _a.label = 2;
                case 2:
                    if (!(_i < index_1.length)) return [3 /*break*/, 5];
                    item = index_1[_i];
                    waypointKey = WAYPOINT_ITEM_PREFIX + item.id;
                    return [4 /*yield*/, async_storage_1.default.removeItem(waypointKey)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: 
                // Clear index
                return [4 /*yield*/, saveWaypointIndex([])];
                case 6:
                    // Clear index
                    _a.sent();
                    if (__DEV__) {
                        console.log('[SaveGame] All waypoint saves deleted');
                    }
                    return [3 /*break*/, 8];
                case 7:
                    error_9 = _a.sent();
                    console.error('[SaveGame] Failed to delete all waypoint saves:', error_9);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Debug utility to inspect current save in AsyncStorage.
 * Only available in development mode.
 */
function debugInspectCurrentSave() {
    return __awaiter(this, void 0, void 0, function () {
        var data, parsed, error_10;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!__DEV__)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    console.log('[SaveGame] ===== DEBUG INSPECT CURRENT SAVE =====');
                    return [4 /*yield*/, async_storage_1.default.getItem(CURRENT_GAME_KEY)];
                case 2:
                    data = _c.sent();
                    if (!data) {
                        console.log('[SaveGame] No save found in storage');
                        return [2 /*return*/];
                    }
                    parsed = JSON.parse(data);
                    console.log('[SaveGame] Save exists!');
                    console.log('[SaveGame] Version:', parsed.version);
                    console.log('[SaveGame] Saved at:', parsed.savedAt);
                    if (parsed.snapshot) {
                        console.log('[SaveGame] Snapshot currentLevelId:', parsed.snapshot.currentLevelId);
                        console.log('[SaveGame] Snapshot moveCount:', parsed.snapshot.moveCount);
                        console.log('[SaveGame] Snapshot player position:', (_a = parsed.snapshot.player) === null || _a === void 0 ? void 0 : _a.position);
                        console.log('[SaveGame] Snapshot player HP:', (_b = parsed.snapshot.player) === null || _b === void 0 ? void 0 : _b.hp);
                        console.log('[SaveGame] Snapshot subGamesCompleted keys:', Object.keys(parsed.snapshot.subGamesCompleted || {}));
                    }
                    console.log('[SaveGame] Raw save data length:', data.length);
                    console.log('[SaveGame] ===== END DEBUG INSPECT =====');
                    return [3 /*break*/, 4];
                case 3:
                    error_10 = _c.sent();
                    console.error('[SaveGame] Failed to inspect save:', error_10);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ===== INTERNAL HELPERS =====
/**
 * Load the waypoint index.
 * Returns empty array if no index exists.
 */
function loadWaypointIndex() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.getItem(WAYPOINT_INDEX_KEY)];
                case 1:
                    data = _a.sent();
                    if (!data) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, JSON.parse(data)];
                case 2:
                    error_11 = _a.sent();
                    console.error('[SaveGame] Failed to load waypoint index:', error_11);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Save the waypoint index.
 */
function saveWaypointIndex(index) {
    return __awaiter(this, void 0, void 0, function () {
        var error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.setItem(WAYPOINT_INDEX_KEY, JSON.stringify(index))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _a.sent();
                    console.error('[SaveGame] Failed to save waypoint index:', error_12);
                    throw error_12;
                case 3: return [2 /*return*/];
            }
        });
    });
}
