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
exports.reducer = void 0;
var levels_1 = require("../config/levels");
var gameState_1 = require("./gameState");
var utils_1 = require("./utils");
var saveGame_1 = require("./saveGame");
var reducer = function (state, action) {
    var _a, _b, _c;
    var _d, _e, _f, _g, _h, _j, _k, _l;
    if (state === void 0) { state = (0, gameState_1.getInitialState)('1'); }
    var newState;
    switch (action.type) {
        // ============ LEVEL MANAGEMENT ============
        case 'SET_LEVEL': {
            var targetLevelId = action.levelId;
            if (!(targetLevelId in levels_1.levels)) {
                (0, utils_1.logIfDev)("\u26A0\uFE0F  Unknown levelId: ".concat(String(targetLevelId)));
                return state;
            }
            (0, utils_1.logIfDev)("\uD83D\uDDFA\uFE0F  Changing level to: ".concat(targetLevelId));
            var levelId = targetLevelId;
            var newLevelConfig = levels_1.levels[levelId];
            return __assign(__assign({}, state), { level: newLevelConfig, levels: __assign(__assign({}, state.levels), (_a = {}, _a[action.levelId] = newLevelConfig, _a)), monsters: newLevelConfig.monsters || [], greatPowers: newLevelConfig.greatPowers || [], objects: newLevelConfig.objects || [], nonCollisionObjects: newLevelConfig.nonCollisionObjects || [], activeMonsters: [], attackSlots: [], waitingMonsters: [], inCombat: false, turnOrder: [], combatTurn: null, moveCount: 0, combatLog: [], player: __assign(__assign({}, state.player), { hp: state.player.maxHP, position: { row: 395, col: 200 } }) });
        }
        // ============ PLAYER MOVEMENT ============
        case 'MOVE_PLAYER':
            if (state.inCombat) {
                (0, utils_1.logIfDev)('Player cannot move while in combat');
                return state;
            }
            var newPlayerPos = void 0;
            if (action.payload.position) {
                newPlayerPos = action.payload.position;
            }
            else if (action.payload.direction) {
                var currentPos = state.player.position;
                if (!currentPos) {
                    if (__DEV__) {
                        console.error('Player position is undefined!');
                    }
                    return state;
                }
                var newRow = currentPos.row;
                var newCol = currentPos.col;
                switch (action.payload.direction) {
                    case 'up':
                        newRow = Math.max(0, currentPos.row - 1);
                        break;
                    case 'down':
                        newRow = Math.min(state.gridHeight - 1, currentPos.row + 1);
                        break;
                    case 'left':
                        newCol = Math.max(0, currentPos.col - 1);
                        break;
                    case 'right':
                        newCol = Math.min(state.gridWidth - 1, currentPos.col + 1);
                        break;
                    default:
                        if (__DEV__) {
                            console.warn('Unknown direction:', action.payload.direction);
                        }
                        return state;
                }
                newPlayerPos = { row: newRow, col: newCol };
            }
            else {
                if (__DEV__) {
                    console.error('MOVE_PLAYER: No position or direction provided');
                }
                return state;
            }
            var oldPosition = state.player.position;
            var newState_1 = __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { position: newPlayerPos }) });
            var distanceMoved = Math.abs(newPlayerPos.row - oldPosition.row) + Math.abs(newPlayerPos.col - oldPosition.col);
            if (distanceMoved > 0) {
                newState_1.distanceTraveled = (state.distanceTraveled || 0) + distanceMoved;
            }
            return newState_1;
        case 'UPDATE_MOVE_COUNT':
            return __assign(__assign({}, state), { moveCount: action.payload.moveCount });
        case 'PASS_TURN':
            return __assign(__assign({}, state), { moveCount: state.moveCount + 1, lastAction: 'PASS_TURN' });
        // ============ MONSTER MOVEMENT ============
        case 'MOVE_MONSTER':
            return __assign(__assign({}, state), { activeMonsters: state.activeMonsters.map(function (monster) {
                    return monster.id === action.payload.id
                        ? __assign(__assign({}, monster), { position: action.payload.position }) : monster;
                }) });
        case 'SPAWN_MONSTER':
            var newMonster = action.payload.monster;
            (0, utils_1.logIfDev)('Spawning monster:', newMonster.name);
            return __assign(__assign({}, state), { activeMonsters: __spreadArray(__spreadArray([], state.activeMonsters, true), [newMonster], false) });
        case 'UPDATE_ACTIVE_MONSTERS':
            return __assign(__assign({}, state), { activeMonsters: action.payload.activeMonsters });
        case 'AWAKEN_GREAT_POWER':
            return __assign(__assign({}, state), { level: __assign(__assign({}, state.level), { greatPowers: ((_d = state.level.greatPowers) === null || _d === void 0 ? void 0 : _d.map(function (power) {
                        return power.id === action.payload.greatPowerId ? __assign(__assign({}, power), { awakened: true }) : power;
                    })) || [] }) });
        // ============ COMBAT SYSTEM ============
        case 'SET_COMBAT':
            (0, utils_1.logIfDev)("\uD83C\uDFAF SET_COMBAT dispatched, inCombat: ".concat(action.payload.inCombat));
            // Check if we're exiting combat
            var exitingCombat = !action.payload.inCombat && state.inCombat;
            // Check if there are any living monsters remaining
            var hasRemainingMonsters = action.payload.attackSlots.length > 0 ||
                state.activeMonsters.some(function (m) { return m.hp > 0 && m.active !== false; });
            // Determine if we should clear ranged mode
            // Clear when: entering combat OR exiting combat with no monsters left
            var shouldClearRangedMode = action.payload.inCombat || (exitingCombat && !hasRemainingMonsters);
            return __assign(__assign({}, state), { inCombat: action.payload.inCombat, attackSlots: action.payload.attackSlots, waitingMonsters: action.payload.waitingMonsters || [], turnOrder: action.payload.turnOrder, combatTurn: action.payload.combatTurn, combatLog: action.payload.inCombat ? state.combatLog || [] : [], 
                // Clear ranged attack mode when entering combat OR when exiting combat with no monsters left
                rangedAttackMode: shouldClearRangedMode ? false : state.rangedAttackMode, targetedMonsterId: shouldClearRangedMode ? null : state.targetedMonsterId });
        case 'START_COMBAT':
            return __assign(__assign({}, state), { inCombat: true, activeMonsters: state.activeMonsters.map(function (monster) { var _a; return monster.id === ((_a = action.payload.monster) === null || _a === void 0 ? void 0 : _a.id) ? __assign(__assign({}, monster), { inCombatSlot: true }) : monster; }) });
        case 'UPDATE_TURN':
            return __assign(__assign({}, state), { turnOrder: action.payload.turnOrder, combatTurn: action.payload.combatTurn });
        case 'UPDATE_WAITING_MONSTERS':
            return __assign(__assign({}, state), { waitingMonsters: action.payload.waitingMonsters });
        // ============ COMBAT LOG ============
        case 'ADD_COMBAT_LOG':
            (0, utils_1.logIfDev)('ADD_COMBAT_LOG dispatched:', action.payload);
            return __assign(__assign({}, state), { combatLog: __spreadArray(__spreadArray([], (state.combatLog || []), true), [
                    {
                        id: "".concat(Date.now(), "-").concat(Math.random()),
                        message: action.payload.message,
                        turn: state.moveCount,
                    },
                ], false) });
        case 'CLEAR_COMBAT_LOG':
            (0, utils_1.logIfDev)('🎯 CLEAR_COMBAT_LOG dispatched');
            return __assign(__assign({}, state), { combatLog: [] });
        // ============ HEALTH SYSTEM ============
        case 'UPDATE_PLAYER':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), action.payload.updates) });
        case 'UPDATE_MONSTER':
            return __assign(__assign({}, state), { activeMonsters: state.activeMonsters.map(function (monster) {
                    return monster.id === action.payload.id ? __assign(__assign({}, monster), action.payload.updates) : monster;
                }), attackSlots: state.attackSlots.map(function (slot) {
                    return slot.id === action.payload.id ? __assign(__assign({}, slot), action.payload.updates) : slot;
                }) });
        case 'REMOVE_MONSTER':
            return __assign(__assign({}, state), { activeMonsters: state.activeMonsters.filter(function (monster) { return monster.id !== action.payload.id; }), attackSlots: state.attackSlots.filter(function (slot) { return slot.id !== action.payload.id; }), waitingMonsters: state.waitingMonsters.filter(function (monster) { return monster.id !== action.payload.id; }), monstersKilled: (state.monstersKilled || 0) + 1, 
                // If the removed monster was the targeted monster, clear the target but keep ranged mode on
                // This allows the player to retarget another monster without re-entering ranged mode
                targetedMonsterId: state.targetedMonsterId === action.payload.id ? null : state.targetedMonsterId });
        case 'UPDATE_PLAYER_HP':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { hp: action.payload.hp }) });
        case 'UPDATE_SELF_HEAL_COUNTER':
            return __assign(__assign({}, state), { selfHealTurnCounter: action.payload.counter });
        case 'UPDATE_MONSTER_HP':
            return __assign(__assign({}, state), { activeMonsters: state.activeMonsters.map(function (monster) {
                    return monster.id === action.payload.id ? __assign(__assign({}, monster), { hp: action.payload.hp }) : monster;
                }), attackSlots: state.attackSlots.map(function (slot) {
                    return slot.id === action.payload.id ? __assign(__assign({}, slot), { hp: action.payload.hp }) : slot;
                }) });
        case 'RESET_HP':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { hp: state.player.maxHP }) });
        case 'GAME_OVER': {
            // Mark the player as dead and clear combat state
            // Full reset happens when RESET_GAME is dispatched from death screen
            (0, utils_1.logIfDev)("\uD83D\uDC80 GAME_OVER: ".concat(((_e = action.payload) === null || _e === void 0 ? void 0 : _e.message) || 'Player died'));
            (0, utils_1.logIfDev)("   Killer: ".concat(((_f = action.payload) === null || _f === void 0 ? void 0 : _f.killerName) || 'unknown'));
            // Delete current save when player dies (async, but don't block state update)
            (0, saveGame_1.deleteCurrentGame)().catch(function (err) {
                return console.error('Failed to delete current save on death:', err);
            });
            return __assign(__assign({}, state), { gameOver: true, gameOverMessage: ((_g = action.payload) === null || _g === void 0 ? void 0 : _g.message) || 'You have been defeated.', killerName: ((_h = action.payload) === null || _h === void 0 ? void 0 : _h.killerName) || 'unknown horror', suppressDeathDialog: ((_j = action.payload) === null || _j === void 0 ? void 0 : _j.suppressDeathDialog) || false, inCombat: false, attackSlots: [], waitingMonsters: [], turnOrder: [], combatTurn: null, combatLog: [], activeMonsters: [] });
        }
        case 'RESET_GAME': {
            /**
             * Complete game reset to initial state.
             * This is triggered from the death screen or manual restart.
             *
             * Decision: Reset ALL state including sub-game completion flags
             * to provide a "fresh run" experience. Players who died should
             * start from scratch, including re-completing sub-games.
             *
             * If we want to preserve sub-game progress across deaths in the future,
             * we can modify this to:
             *   const preservedFlags = state.subGamesCompleted
             *   return { ...getInitialState('1'), subGamesCompleted: preservedFlags }
             */
            (0, utils_1.logIfDev)('🔄 RESET_GAME: Resetting to fresh initial state');
            // Return a FRESH initial state (not the stale initialState constant)
            return (0, gameState_1.getInitialState)('1');
        }
        // ============ INVENTORY MANAGEMENT ============
        case 'ADD_TO_INVENTORY':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { inventory: __spreadArray(__spreadArray([], state.player.inventory, true), [action.payload.item], false) }) });
        case 'REMOVE_FROM_INVENTORY':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { inventory: state.player.inventory.filter(function (item) { return item.id !== action.payload.id; }) }) });
        case 'TOGGLE_INVENTORY':
            return __assign(__assign({}, state), { showInventory: !state.showInventory, showWeaponsInventory: false });
        case 'ADD_TO_WEAPONS':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { weapons: __spreadArray(__spreadArray([], state.player.weapons, true), [action.payload.weapon], false) }) });
        case 'REMOVE_FROM_WEAPONS':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { weapons: state.player.weapons.filter(function (w) { return w.id !== action.payload.id; }) }) });
        case 'EQUIP_WEAPON':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { weapons: state.player.weapons.map(function (w) {
                        return w.id === action.payload.id ? __assign(__assign({}, w), { equipped: true }) : __assign(__assign({}, w), { equipped: false });
                    }) }) });
        case 'ADD_RANGED_WEAPON': {
            // Add a ranged weapon to the player's inventory
            var weaponId = action.payload.id;
            // Check if weapon is already in inventory
            if (state.player.rangedWeaponInventoryIds.includes(weaponId)) {
                (0, utils_1.logIfDev)("Weapon ".concat(weaponId, " is already in ranged weapon inventory"));
                return state;
            }
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { rangedWeaponInventoryIds: __spreadArray(__spreadArray([], state.player.rangedWeaponInventoryIds, true), [weaponId], false) }) });
        }
        case 'EQUIP_RANGED_WEAPON': {
            // Equip a ranged weapon by ID
            // Only one ranged weapon can be equipped at a time
            var weaponId = action.payload.id;
            // Check if the weapon is in the ranged weapon inventory
            if (!state.player.rangedWeaponInventoryIds.includes(weaponId)) {
                (0, utils_1.logIfDev)("Weapon ".concat(weaponId, " not found in ranged weapon inventory"));
                return state;
            }
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { equippedRangedWeaponId: weaponId }) });
        }
        case 'DROP_WEAPON': {
            var weaponId = action.payload.id;
            if (weaponId === 'weapon-discos-001') {
                (0, utils_1.logIfDev)('Cannot drop the Discos!');
                return state;
            }
            var weaponDetails = state.weapons.find(function (w) { return w.id === action.payload.id; });
            if (!weaponDetails) {
                if (__DEV__) {
                    console.warn("Weapon with ID ".concat(weaponId, " not found"));
                }
                return state;
            }
            var newWeaponItem = {
                name: weaponDetails.name,
                shortName: weaponDetails.shortName,
                position: __assign({}, state.player.position),
                description: weaponDetails.description,
                active: true,
                collectible: true,
                type: 'weapon',
                weaponId: weaponId,
                category: 'weapon',
            };
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { weapons: state.player.weapons.filter(function (w) { return w.id !== action.payload.id; }) }), items: __spreadArray(__spreadArray([], state.items, true), [newWeaponItem], false), dropSuccess: true });
        }
        case 'TOGGLE_WEAPONS_INVENTORY':
            return __assign(__assign({}, state), { showWeaponsInventory: !state.showWeaponsInventory, showInventory: false });
        // ============ ITEM MANAGEMENT ============
        case 'DROP_ITEM': {
            var _m = action.payload, item_1 = _m.item, position = _m.position;
            var updatedInventory = state.player.inventory.filter(function (invItem) { return invItem.id !== item_1.id; });
            var droppedItem = __assign(__assign({}, item_1), { position: __assign({}, position), active: true, collectible: true });
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { inventory: updatedInventory }), items: __spreadArray(__spreadArray([], state.items, true), [droppedItem], false) });
        }
        case 'REMOVE_ITEM_FROM_GAMEBOARD':
            (0, utils_1.logIfDev)("Removing item from gameboard: ".concat(action.payload.shortName, " from position (").concat(action.payload.position.row, ", ").concat(action.payload.position.col, ")"));
            return __assign(__assign({}, state), { items: state.items.filter(function (item) {
                    var _a, _b;
                    return !(((_a = item.position) === null || _a === void 0 ? void 0 : _a.row) === action.payload.position.row &&
                        ((_b = item.position) === null || _b === void 0 ? void 0 : _b.col) === action.payload.position.col &&
                        item.shortName === action.payload.shortName);
                }) });
        case 'UPDATE_ITEM':
            return __assign(__assign({}, state), { items: state.items.map(function (item) {
                    return item.shortName === action.payload.shortName
                        ? __assign(__assign({}, item), action.payload.updates) : item;
                }) });
        // ============ EFFECTS SYSTEM ============
        // NOTE: Effect execution has been moved to /modules/effects.ts
        // All effects are now applied through the unified applyEffect() function
        // This provides consistent behavior for items, objects, abilities, etc.
        case 'CLEAR_HIDE':
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { isHidden: false }) });
        case 'DECREMENT_CLOAKING_TURNS':
            var newHideTurns = Math.max(0, state.player.hideTurns - 1);
            return __assign(__assign({}, state), { player: __assign(__assign({}, state.player), { hideTurns: newHideTurns, isHidden: newHideTurns > 0 }) });
        // ============ WORLD OBJECTS ============
        case 'UPDATE_OBJECT':
            return __assign(__assign({}, state), { objects: state.objects.map(function (obj) {
                    return obj.shortName === action.payload.shortName ? __assign(__assign({}, obj), action.payload.updates) : obj;
                }) });
        // ============ UI STATE ============
        case 'UPDATE_DIALOG':
            return __assign(__assign({}, state), { dialogData: action.payload.dialogData });
        case 'SET_AUDIO_STARTED':
            return __assign(__assign({}, state), { audioStarted: action.payload });
        // ============ RANGED ATTACK MODE ============
        case 'TOGGLE_RANGED_MODE':
            (0, utils_1.logIfDev)("\uD83C\uDFAF TOGGLE_RANGED_MODE: active=".concat(action.payload.active, ", targetId=").concat(action.payload.targetId));
            return __assign(__assign({}, state), { rangedAttackMode: action.payload.active, targetedMonsterId: action.payload.active ? action.payload.targetId : null });
        case 'SET_TARGET_MONSTER':
            (0, utils_1.logIfDev)("\uD83C\uDFAF SET_TARGET_MONSTER: monsterId=".concat(action.payload.monsterId));
            return __assign(__assign({}, state), { targetedMonsterId: action.payload.monsterId });
        case 'CLEAR_RANGED_MODE':
            (0, utils_1.logIfDev)("\uD83C\uDFAF CLEAR_RANGED_MODE");
            return __assign(__assign({}, state), { rangedAttackMode: false, targetedMonsterId: null });
        // ============ PROJECTILE MANAGEMENT ============
        case 'ADD_PROJECTILE':
            (0, utils_1.logIfDev)("\uD83C\uDFAF ADD_PROJECTILE: id=".concat(action.payload.id));
            return __assign(__assign({}, state), { activeProjectiles: __spreadArray(__spreadArray([], state.activeProjectiles, true), [action.payload], false) });
        case 'REMOVE_PROJECTILE':
            (0, utils_1.logIfDev)("\uD83C\uDFAF REMOVE_PROJECTILE: id=".concat(action.payload.id));
            return __assign(__assign({}, state), { activeProjectiles: state.activeProjectiles.filter(function (p) { return p.id !== action.payload.id; }) });
        // ============ SUB-GAME MANAGEMENT ============
        case 'SET_SUB_GAME_COMPLETED':
            (0, utils_1.logIfDev)("\uD83C\uDFAE SET_SUB_GAME_COMPLETED: ".concat(action.payload.subGameName, " = ").concat(action.payload.completed));
            return __assign(__assign({}, state), { subGamesCompleted: __assign(__assign({}, (state.subGamesCompleted || {})), (_b = {}, _b[action.payload.subGameName] = action.payload.completed, _b)) });
        // ============ SAVE/LOAD MANAGEMENT ============
        case 'HYDRATE_GAME_STATE':
            (0, utils_1.logIfDev)('💾 HYDRATE_GAME_STATE: Loading saved game state');
            (0, utils_1.logIfDev)("\uD83D\uDCBE Current state moveCount: ".concat(state.moveCount));
            (0, utils_1.logIfDev)("\uD83D\uDCBE New state moveCount: ".concat(action.payload.state.moveCount));
            (0, utils_1.logIfDev)("\uD83D\uDCBE Current state player position: ".concat(JSON.stringify((_k = state.player) === null || _k === void 0 ? void 0 : _k.position)));
            (0, utils_1.logIfDev)("\uD83D\uDCBE New state player position: ".concat(JSON.stringify((_l = action.payload.state.player) === null || _l === void 0 ? void 0 : _l.position)));
            // Replace entire state with loaded state (fromSnapshot already handles cleanup)
            return action.payload.state;
        case 'SET_WAYPOINT_CREATED':
            (0, utils_1.logIfDev)("\uD83D\uDCBE SET_WAYPOINT_CREATED: ".concat(action.payload.waypointName));
            return __assign(__assign({}, state), { waypointSavesCreated: __assign(__assign({}, (state.waypointSavesCreated || {})), (_c = {}, _c[action.payload.waypointName] = true, _c)) });
        // ============ CLEANUP ============
        default:
            if (__DEV__) {
                console.warn("\u26A0\uFE0F  Unhandled action type: ".concat(action.type));
            }
            return state;
    }
};
exports.reducer = reducer;
