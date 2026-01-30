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
exports.processRangedAttackImpact = exports.executeRangedAttack = exports.checkForCombatCollision = exports.handleCombatTurn = exports.setupCombat = exports.checkCombatEnd = exports.processCombatTurn = exports.executeAttack = void 0;
var utils_1 = require("./utils");
var combat_1 = require("@/assets/copy/combat");
// Roll a d20
var rollD20 = function () {
    return Math.floor(Math.random() * 20) + 1;
};
// Roll a d6
var rollD6 = function () {
    return Math.floor(Math.random() * 6) + 1;
};
// ==================== COMBAT UTILITIES ====================
var checkCollision = function (pos1, pos2) {
    return pos1.row === pos2.row && pos1.col === pos2.col;
};
// ==================== CORE COMBAT ACTIONS ====================
var executeAttack = function (attacker, defender, dispatch) {
    var attackRoll = rollD20();
    var totalAttack = attackRoll + attacker.attack;
    var hit = totalAttack >= defender.ac;
    (0, utils_1.logIfDev)("\n\uD83C\uDFB2 ".concat(attacker.name, " attacks ").concat(defender.name, ":"));
    (0, utils_1.logIfDev)("   Roll: ".concat(attackRoll, " + Attack: ").concat(attacker.attack, " = ").concat(totalAttack, " vs AC: ").concat(defender.ac));
    if (hit) {
        var damageRoll = Math.floor(Math.random() * 6) + 1;
        var totalDamage = damageRoll + Math.floor(attacker.attack / 2);
        var newHp = Math.max(0, defender.hp - totalDamage);
        (0, utils_1.logIfDev)("   \uD83D\uDCA5 HIT! Damage: ".concat(damageRoll, " + ").concat(Math.floor(attacker.attack / 2), " = ").concat(totalDamage));
        (0, utils_1.logIfDev)("   ".concat(defender.name, " HP: ").concat(defender.hp, " \u2192 ").concat(newHp));
        // Create different messages for Christos vs monsters
        var combatMessage = '';
        if (attacker.id === 'christos') {
            // Christos attacking - use "the" before monster name
            var monsterName = defender.name || defender.shortName || 'enemy';
            combatMessage =
                "Christos hit the ".concat(monsterName, " for ").concat(totalDamage) + (totalDamage >= 10 ? '!!' : '');
        }
        else {
            // Monster attacking - keep it simple
            combatMessage = "".concat(attacker.name, " hit for ").concat(totalDamage) + (totalDamage >= 10 ? '!!' : '');
        }
        // Dispatch combat log message
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: combatMessage },
        });
        // Update HP
        if (defender.id === 'christos') {
            dispatch({
                type: 'UPDATE_PLAYER',
                payload: { updates: { hp: newHp } },
            });
        }
        else {
            dispatch({
                type: 'UPDATE_MONSTER',
                payload: { id: defender.id, updates: { hp: newHp } },
            });
        }
        // Check if defender is dead
        if (newHp <= 0) {
            (0, utils_1.logIfDev)("\uD83D\uDC80 ".concat(defender.name, " is defeated!"));
            var deathMessage = '';
            if (attacker.id === 'christos') {
                var monsterName = defender.name || defender.shortName || 'enemy';
                deathMessage = "Christos killed the ".concat(monsterName);
            }
            else {
                deathMessage = "".concat(attacker.name, " killed ").concat(defender.name);
            }
            dispatch({
                type: 'ADD_COMBAT_LOG',
                payload: { message: deathMessage },
            });
            if (defender.id !== 'christos') {
                dispatch({
                    type: 'REMOVE_MONSTER',
                    payload: { id: defender.id },
                });
                return true;
            }
            else {
                // Player died - just dispatch GAME_OVER
                var killerName = attacker.name || attacker.shortName || 'unknown horror';
                // Use your COMBAT_STRINGS function here
                var deathMessage_1 = combat_1.COMBAT_STRINGS.death.player(killerName);
                dispatch({
                    type: 'ADD_COMBAT_LOG',
                    payload: { message: deathMessage_1 },
                });
                // Send the message and killer name into GAME_OVER reducer
                dispatch({
                    type: 'GAME_OVER',
                    payload: { message: deathMessage_1, killerName: killerName },
                });
                return true;
            }
        }
    }
    else {
        (0, utils_1.logIfDev)("   \u274C MISS!");
        // Create different miss messages for Christos vs monsters
        var missMessage = '';
        if (attacker.id === 'christos') {
            var monsterName = defender.name || defender.shortName || 'enemy';
            missMessage = "Christos missed the ".concat(monsterName);
        }
        else {
            missMessage = "".concat(attacker.name, " missed");
        }
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: missMessage },
        });
    }
    return false;
};
exports.executeAttack = executeAttack;
// ==================== COMBAT TURN PROCESSING ====================
var processCombatTurn = function (state, dispatch, targetId) {
    if (!state.inCombat || !state.attackSlots || state.attackSlots.length === 0) {
        (0, utils_1.logIfDev)('No combat to process');
        return;
    }
    (0, utils_1.logIfDev)("\n\u2694\uFE0F COMBAT ROUND STARTING (Turn ".concat(state.moveCount + 1, ")"));
    (0, utils_1.logIfDev)("   Player HP: ".concat(state.player.hp, "/").concat(state.player.maxHP));
    (0, utils_1.logIfDev)("   Monsters in combat: ".concat(state.attackSlots.length));
    var combatOrder = __spreadArray([state.player], state.attackSlots, true);
    var _loop_1 = function (entity) {
        if (entity.hp <= 0)
            return "continue";
        if (entity.id === 'christos') {
            (0, utils_1.logIfDev)("\n\uD83D\uDC64 ".concat(entity.name, "'s turn:"));
            var targetMonster_1 = null;
            if (targetId) {
                targetMonster_1 = state.attackSlots.find(function (m) { return m.id === targetId && m.hp > 0; });
            }
            if (!targetMonster_1) {
                targetMonster_1 = state.attackSlots.find(function (m) { return m.hp > 0; });
            }
            if (targetMonster_1) {
                var monsterDied = (0, exports.executeAttack)(entity, targetMonster_1, dispatch);
                if (monsterDied) {
                    var updatedAttackSlots = state.attackSlots.filter(function (m) { return m.id !== targetMonster_1.id; });
                    dispatch({
                        type: 'SET_COMBAT',
                        payload: __assign(__assign({}, state), { attackSlots: updatedAttackSlots, inCombat: updatedAttackSlots.length > 0 }),
                    });
                }
            }
            else {
                (0, utils_1.logIfDev)("   No valid target for ".concat(entity.name, "'s attack"));
                dispatch({
                    type: 'ADD_COMBAT_LOG',
                    payload: { message: "".concat(entity.name, " has no target to attack!") },
                });
            }
        }
        else {
            (0, utils_1.logIfDev)("\n\uD83D\uDC79 ".concat(entity.name, "'s turn:"));
            var playerDied = (0, exports.executeAttack)(entity, state.player, dispatch);
            if (playerDied) {
                (0, utils_1.logIfDev)('💀 GAME OVER - Player defeated!');
                return { value: void 0 };
            }
        }
    };
    for (var _i = 0, combatOrder_1 = combatOrder; _i < combatOrder_1.length; _i++) {
        var entity = combatOrder_1[_i];
        var state_1 = _loop_1(entity);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    // Move waiting monsters into empty attack slots
    moveWaitingMonstersToAttackSlots(state, dispatch);
    (0, utils_1.logIfDev)("\n\uD83D\uDCCA COMBAT ROUND COMPLETE");
    (0, utils_1.logIfDev)("   Player HP: ".concat(state.player.hp, "/").concat(state.player.maxHP));
    state.attackSlots.forEach(function (monster) {
        if (monster.hp > 0) {
            (0, utils_1.logIfDev)("   ".concat(monster.name, " HP: ").concat(monster.hp, "/").concat(monster.maxHP));
        }
    });
};
exports.processCombatTurn = processCombatTurn;
// ==================== COMBAT MANAGEMENT ====================
var moveWaitingMonstersToAttackSlots = function (state, dispatch) {
    var aliveMonsters = state.attackSlots.filter(function (m) { return m.hp > 0; });
    var availableSlots = (state.maxAttackers || 4) - aliveMonsters.length;
    if (availableSlots > 0 && state.waitingMonsters.length > 0) {
        var newAttackSlots = __spreadArray([], aliveMonsters, true);
        var newWaitingMonsters = __spreadArray([], state.waitingMonsters, true);
        var slotPositions = [
            {
                row: state.player.position.row - 1,
                col: state.player.position.col - 1,
            },
            {
                row: state.player.position.row - 1,
                col: state.player.position.col + 1,
            },
            {
                row: state.player.position.row + 1,
                col: state.player.position.col - 1,
            },
            {
                row: state.player.position.row + 1,
                col: state.player.position.col + 1,
            },
        ];
        var usedUISlots_1 = newAttackSlots.map(function (slot) { return slot.uiSlot || 0; });
        var monstersMoved = 0;
        for (var i = 0; i < newWaitingMonsters.length && monstersMoved < availableSlots; i++) {
            var monster = newWaitingMonsters[i];
            var nextUISlot = [0, 1, 2, 3].find(function (slot) { return !usedUISlots_1.includes(slot); });
            if (nextUISlot !== undefined) {
                var combatMonster = __assign(__assign({}, monster), { position: __assign({}, slotPositions[nextUISlot]), uiSlot: nextUISlot, inCombatSlot: true });
                newAttackSlots.push(combatMonster);
                dispatch({
                    type: 'MOVE_MONSTER',
                    payload: { id: monster.id, position: combatMonster.position },
                });
                console.log("\u2705 Monster ".concat(monster.name, " moved from waiting to attack slot ").concat(nextUISlot));
                dispatch({
                    type: 'ADD_COMBAT_LOG',
                    payload: { message: "".concat(monster.name, " joins the combat!") },
                });
                usedUISlots_1.push(nextUISlot);
                newWaitingMonsters.splice(i, 1);
                i--;
                monstersMoved++;
            }
        }
        dispatch({
            type: 'SET_COMBAT',
            payload: __assign(__assign({}, state), { attackSlots: newAttackSlots, waitingMonsters: newWaitingMonsters, turnOrder: __spreadArray([state.player], newAttackSlots, true), combatTurn: state.player }),
        });
    }
};
var checkCombatEnd = function (state, dispatch) {
    var _a, _b;
    var aliveMonsters = ((_a = state.attackSlots) === null || _a === void 0 ? void 0 : _a.filter(function (m) { return m.hp > 0; })) || [];
    if (aliveMonsters.length === 0) {
        (0, utils_1.logIfDev)('🏆 Combat won - all monsters defeated!');
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: 'All enemies defeated!' },
        });
        dispatch({
            type: 'SET_COMBAT',
            payload: {
                inCombat: false,
                attackSlots: [],
                waitingMonsters: state.waitingMonsters || [],
                turnOrder: [state.player],
                combatTurn: state.player,
                combatLog: [], // Clear log
            },
        });
        return true;
    }
    if (state.player.hp <= 0) {
        (0, utils_1.logIfDev)('💀 Combat lost - player defeated!');
        var killer = ((_b = aliveMonsters[0]) === null || _b === void 0 ? void 0 : _b.name) || 'unknown horror';
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: combat_1.COMBAT_STRINGS.death.player(killer) },
        });
        return true;
    }
    return false;
};
exports.checkCombatEnd = checkCombatEnd;
// ==================== COMBAT SETUP AND INITIALIZATION ====================
var setupCombat = function (state, dispatch, monster, playerPosOverride) {
    (0, utils_1.logIfDev)("\n\u2694\uFE0F SETTING UP COMBAT with ".concat(monster.name));
    (0, utils_1.logIfDev)("\uD83D\uDCCA BEFORE SETUP - state.attackSlots:", state.attackSlots);
    (0, utils_1.logIfDev)("\uD83D\uDCCA BEFORE SETUP - state.inCombat:", state.inCombat);
    var newAttackSlots = __spreadArray([], (state.attackSlots || []), true);
    var newWaitingMonsters = __spreadArray([], (state.waitingMonsters || []), true);
    // Define attack slot positions around player
    var slotPositions = [
        { row: state.player.position.row - 1, col: state.player.position.col - 1 }, // Slot 0
        { row: state.player.position.row - 1, col: state.player.position.col + 1 }, // Slot 1
        { row: state.player.position.row + 1, col: state.player.position.col - 1 }, // Slot 2
        { row: state.player.position.row + 1, col: state.player.position.col + 1 }, // Slot 3
    ];
    // Check if monster is already in combat
    if (newAttackSlots.some(function (slot) { return slot.id === monster.id; })) {
        console.warn("Monster ".concat(monster.name, " already in attack slots"));
        return;
    }
    // Try to add to attack slots
    if (newAttackSlots.length < (state.maxAttackers || 4)) {
        var usedUISlots_2 = newAttackSlots.map(function (slot) { return slot.uiSlot || 0; });
        var nextUISlot = [0, 1, 2, 3].find(function (slot) { return !usedUISlots_2.includes(slot); });
        if (nextUISlot !== undefined) {
            var combatMonster = __assign(__assign({}, monster), { position: __assign({}, slotPositions[nextUISlot]), uiSlot: nextUISlot, inCombatSlot: true });
            newAttackSlots.push(combatMonster);
            (0, utils_1.logIfDev)("\u2705 ADDED TO ATTACK SLOTS - Monster: ".concat(monster.name, ", ID: ").concat(monster.id, ", Slot: ").concat(nextUISlot));
            (0, utils_1.logIfDev)("\uD83D\uDCCA NEW attackSlots array length:", newAttackSlots.length);
            (0, utils_1.logIfDev)("\uD83D\uDCCA NEW attackSlots IDs:", newAttackSlots.map(function (m) { return m.id; }));
            dispatch({
                type: 'MOVE_MONSTER',
                payload: { id: monster.id, position: combatMonster.position },
            });
            // Add combat log entry
            dispatch({
                type: 'ADD_COMBAT_LOG',
                payload: { message: "".concat(monster.name, " enters combat!") },
            });
            (0, utils_1.logIfDev)("\u2705 Monster ".concat(monster.name, " assigned to attack slot ").concat(nextUISlot));
        }
        else {
            console.warn('No available UI slot for combat monster');
            return;
        }
    }
    else {
        // Add to waiting monsters
        if (!newWaitingMonsters.some(function (m) { return m.id === monster.id; })) {
            newWaitingMonsters.push(monster);
            (0, utils_1.logIfDev)("Monster ".concat(monster.name, " added to waiting queue"));
        }
        return;
    }
    var newTurnOrder = __spreadArray([state.player], newAttackSlots, true);
    var combatPayload = {
        inCombat: true,
        attackSlots: newAttackSlots,
        waitingMonsters: newWaitingMonsters,
        turnOrder: newTurnOrder,
        combatTurn: newTurnOrder[0] || state.player,
    };
    (0, utils_1.logIfDev)("\uD83C\uDFAF DISPATCHING SET_COMBAT with payload:");
    dispatch({ type: 'SET_COMBAT', payload: combatPayload });
    // Add player comment at start of combat if combat just began
    if (!state.inCombat) {
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: (0, utils_1.getTextContent)('combatStartPlayerComment') },
        });
    }
    // Add monster-specific combat start message
    dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: (0, utils_1.getTextContent)('combatStart', [monster.name]) },
    });
    (0, utils_1.logIfDev)("\u2694\uFE0F Combat initiated! ".concat(newAttackSlots.length, " monsters in attack slots"));
};
exports.setupCombat = setupCombat;
// ==================== COMBAT TURN HANDLER ====================
var handleCombatTurn = function (state, dispatch, action, targetId, setDeathMessage // Can remove this parameter now
) {
    if (!state.inCombat) {
        (0, utils_1.logIfDev)('handleCombatTurn called but not in combat');
        return;
    }
    (0, utils_1.logIfDev)("\n\u2694\uFE0F PROCESSING COMBAT ACTION: ".concat(action));
    (0, exports.processCombatTurn)(state, dispatch, targetId);
    (0, exports.checkCombatEnd)(state, dispatch);
};
exports.handleCombatTurn = handleCombatTurn;
// ==================== MONSTER MOVEMENT AND COLLISION ====================
var checkForCombatCollision = function (state, monster, newPosition, playerPos) {
    if (checkCollision(newPosition, playerPos)) {
        if (!state.player.isHidden) {
            return true; // Combat should be initiated
        }
    }
    return false;
};
exports.checkForCombatCollision = checkForCombatCollision;
// ==================== RANGED ATTACK ====================
/**
 * Get the name of the player's equipped ranged weapon
 * @param state - Current game state
 * @returns The weapon name or a default
 */
var getEquippedRangedWeaponName = function (state) {
    var _a;
    if (!state.player.equippedRangedWeaponId) {
        return 'bow'; // Default fallback
    }
    var weapon = (_a = state.weapons) === null || _a === void 0 ? void 0 : _a.find(function (w) { return w.id === state.player.equippedRangedWeaponId; });
    return (weapon === null || weapon === void 0 ? void 0 : weapon.name) || 'ranged weapon';
};
/**
 * Get the projectile color for the equipped ranged weapon
 * @param state - Current game state
 * @returns The projectile color or a default
 */
var getEquippedRangedWeaponProjectileColor = function (state) {
    var _a;
    if (!state.player.equippedRangedWeaponId) {
        return '#FFFFFF'; // Default white
    }
    var weapon = (_a = state.weapons) === null || _a === void 0 ? void 0 : _a.find(function (w) { return w.id === state.player.equippedRangedWeaponId; });
    return (weapon === null || weapon === void 0 ? void 0 : weapon.projectileColor) || '#FFFFFF';
};
/**
 * Get the projectile style (dimensions, glow) for the equipped ranged weapon
 * @param state - Current game state
 * @returns Object containing projectile style properties
 */
var getEquippedRangedWeaponProjectileStyle = function (state) {
    var _a;
    if (!state.player.equippedRangedWeaponId) {
        return {};
    }
    var weapon = (_a = state.weapons) === null || _a === void 0 ? void 0 : _a.find(function (w) { return w.id === state.player.equippedRangedWeaponId; });
    if (!weapon) {
        return {};
    }
    return {
        lengthPx: weapon.projectileLengthPx,
        thicknessPx: weapon.projectileThicknessPx,
        glow: weapon.projectileGlow,
    };
};
/**
 * Execute a ranged attack from the player to a target monster
 * This spawns a projectile and returns the projectile ID
 * The actual hit/miss/damage calculation happens when the projectile completes
 * @param state - Current game state
 * @param dispatch - Dispatch function for state updates
 * @param targetMonsterId - ID of the monster to attack
 * @param playerScreenX - Player's screen X coordinate (in pixels)
 * @param playerScreenY - Player's screen Y coordinate (in pixels)
 * @param monsterScreenX - Monster's screen X coordinate (in pixels)
 * @param monsterScreenY - Monster's screen Y coordinate (in pixels)
 * @returns Projectile ID if spawned, null otherwise
 */
var executeRangedAttack = function (state, dispatch, targetMonsterId, playerScreenX, playerScreenY, monsterScreenX, monsterScreenY) {
    // Find the target monster in either activeMonsters or attackSlots
    var targetMonster = state.activeMonsters.find(function (m) { return m.id === targetMonsterId && m.hp > 0; });
    if (!targetMonster) {
        targetMonster = state.attackSlots.find(function (m) { return m.id === targetMonsterId && m.hp > 0; });
    }
    if (!targetMonster) {
        (0, utils_1.logIfDev)('No valid target for ranged attack');
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: 'No target in range' },
        });
        return null;
    }
    var player = state.player;
    var weaponName = getEquippedRangedWeaponName(state);
    var projectileColor = getEquippedRangedWeaponProjectileColor(state);
    var projectileStyle = getEquippedRangedWeaponProjectileStyle(state);
    // Log attempt
    var monsterName = targetMonster.name || targetMonster.shortName || 'enemy';
    dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: "Christos attempts a shot with ".concat(weaponName, " at ").concat(monsterName, ".") },
    });
    (0, utils_1.logIfDev)("\n\uD83C\uDFF9 Christos ranged attack on ".concat(monsterName, ":"));
    // Calculate projectile trajectory
    var dx = monsterScreenX - playerScreenX;
    var dy = monsterScreenY - playerScreenY;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Calculate duration based on distance (faster for short distances, slower for long)
    var pixelsPerMs = 0.5; // Speed of projectile
    var durationMs = Math.max(120, Math.min(450, distance / pixelsPerMs));
    // Create projectile
    var projectileId = "projectile-".concat(Date.now(), "-").concat(Math.random());
    var projectile = {
        id: projectileId,
        startX: playerScreenX,
        startY: playerScreenY,
        endX: monsterScreenX,
        endY: monsterScreenY,
        angleDeg: angleDeg,
        color: projectileColor,
        createdAt: Date.now(),
        durationMs: durationMs,
        lengthPx: projectileStyle.lengthPx,
        thicknessPx: projectileStyle.thicknessPx,
        glow: projectileStyle.glow,
    };
    // Spawn projectile
    dispatch({
        type: 'ADD_PROJECTILE',
        payload: projectile,
    });
    (0, utils_1.logIfDev)("\uD83C\uDFAF Projectile spawned: id=".concat(projectileId, ", duration=").concat(durationMs, "ms, angle=").concat(angleDeg, "\u00B0"));
    return projectileId;
};
exports.executeRangedAttack = executeRangedAttack;
/**
 * Process the hit/miss/damage for a ranged attack after projectile impact
 * This is called when the projectile animation completes
 * @param state - Current game state
 * @param dispatch - Dispatch function for state updates
 * @param targetMonsterId - ID of the monster to attack
 * @returns true if the target died, false otherwise
 */
var processRangedAttackImpact = function (state, dispatch, targetMonsterId) {
    // Find the target monster in either activeMonsters or attackSlots
    var targetMonster = state.activeMonsters.find(function (m) { return m.id === targetMonsterId && m.hp > 0; });
    if (!targetMonster) {
        targetMonster = state.attackSlots.find(function (m) { return m.id === targetMonsterId && m.hp > 0; });
    }
    if (!targetMonster) {
        (0, utils_1.logIfDev)('Target no longer exists for ranged attack impact');
        return false;
    }
    var player = state.player;
    var monsterName = targetMonster.name || targetMonster.shortName || 'enemy';
    // Perform hit/miss roll using d20 system
    var attackRoll = rollD20();
    var totalAttack = attackRoll + player.attack;
    var hit = totalAttack >= targetMonster.ac;
    (0, utils_1.logIfDev)("   Roll: ".concat(attackRoll, " + Attack: ").concat(player.attack, " = ").concat(totalAttack, " vs AC: ").concat(targetMonster.ac));
    if (hit) {
        // Calculate damage using d6 dice roll
        var damageRoll = rollD6();
        var totalDamage = damageRoll + Math.floor(player.attack / 2);
        var newHp = Math.max(0, targetMonster.hp - totalDamage);
        (0, utils_1.logIfDev)("   \uD83D\uDCA5 HIT! Damage: ".concat(damageRoll, " + ").concat(Math.floor(player.attack / 2), " = ").concat(totalDamage));
        (0, utils_1.logIfDev)("   ".concat(monsterName, " HP: ").concat(targetMonster.hp, " \u2192 ").concat(newHp));
        // Log hit and damage
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: 'Hit!' },
        });
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: "".concat(monsterName, " takes ").concat(totalDamage, " damage.") },
        });
        // Update monster HP
        dispatch({
            type: 'UPDATE_MONSTER',
            payload: { id: targetMonster.id, updates: { hp: newHp } },
        });
        // Check if monster dies
        if (newHp <= 0) {
            (0, utils_1.logIfDev)("\uD83D\uDC80 ".concat(monsterName, " is defeated!"));
            dispatch({
                type: 'ADD_COMBAT_LOG',
                payload: { message: "".concat(monsterName, " dies.") },
            });
            dispatch({
                type: 'REMOVE_MONSTER',
                payload: { id: targetMonster.id },
            });
            return true; // Target died
        }
    }
    else {
        (0, utils_1.logIfDev)("   \u274C MISS!");
        dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: 'Miss!' },
        });
    }
    return false; // Target survived
};
exports.processRangedAttackImpact = processRangedAttackImpact;
