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
exports.moveMonsters = exports.isMonsterInCombat = exports.calculateMonsterMovement = exports.moveAway = exports.calculateNewPosition = void 0;
exports.calculateDistance = calculateDistance;
exports.isAdjacentToPlayer = isAdjacentToPlayer;
var combat_1 = require("./combat");
var utils_1 = require("./utils");
// ==================== PLAYER MOVEMENT ====================
var calculateNewPosition = function (currentPos, direction, state) {
    var newPosition = __assign({}, currentPos);
    switch (direction) {
        case 'up':
            newPosition.row = Math.max(0, newPosition.row - 1);
            break;
        case 'down':
            newPosition.row = Math.min(state.gridHeight - 1, newPosition.row + 1);
            break;
        case 'left':
            newPosition.col = Math.max(0, newPosition.col - 1);
            break;
        case 'right':
            newPosition.col = Math.min(state.gridWidth - 1, newPosition.col + 1);
            break;
        case 'stay':
        case null:
            break;
        default:
            if (__DEV__) {
                console.warn("Unhandled direction: ".concat(direction));
            }
            break;
    }
    return newPosition;
};
exports.calculateNewPosition = calculateNewPosition;
// ==================== MONSTER MOVEMENT ====================
var moveAway = function (monster, playerPos, gridWidth, gridHeight) {
    var newPos = __assign({}, monster.position);
    var moveDistance = monster.moveRate || 1;
    if (monster.position.row < playerPos.row) {
        newPos.row = Math.max(0, monster.position.row - moveDistance);
    }
    else if (monster.position.row > playerPos.row) {
        newPos.row = Math.min(gridHeight - 1, monster.position.row + moveDistance);
    }
    if (monster.position.col < playerPos.col) {
        newPos.col = Math.max(0, monster.position.col - moveDistance);
    }
    else if (monster.position.col > playerPos.col) {
        newPos.col = Math.min(gridWidth - 1, monster.position.col + moveDistance);
    }
    return newPos;
};
exports.moveAway = moveAway;
var calculateMonsterMovement = function (monster, playerPos, state) {
    if (state.player.isHidden) {
        return (0, exports.moveAway)(monster, playerPos, state.gridWidth, state.gridHeight);
    }
    // Move towards player
    var moveDistance = monster.moveRate || 1;
    var newPos = __assign({}, monster.position);
    if (monster.position.row < playerPos.row) {
        newPos.row = Math.min(monster.position.row + moveDistance, playerPos.row);
    }
    else if (monster.position.row > playerPos.row) {
        newPos.row = Math.max(monster.position.row - moveDistance, playerPos.row);
    }
    if (monster.position.col < playerPos.col) {
        newPos.col = Math.min(monster.position.col + moveDistance, playerPos.col);
    }
    else if (monster.position.col > playerPos.col) {
        newPos.col = Math.max(monster.position.col - moveDistance, playerPos.col);
    }
    // Keep within grid bounds
    newPos.row = Math.max(0, Math.min(state.gridHeight - 1, newPos.row));
    newPos.col = Math.max(0, Math.min(state.gridWidth - 1, newPos.col));
    return newPos;
};
exports.calculateMonsterMovement = calculateMonsterMovement;
var isMonsterInCombat = function (monster, state) {
    var _a, _b;
    return (((_a = state.attackSlots) === null || _a === void 0 ? void 0 : _a.some(function (slot) { return slot.id === monster.id; })) ||
        ((_b = state.waitingMonsters) === null || _b === void 0 ? void 0 : _b.some(function (m) { return m.id === monster.id; })));
};
exports.isMonsterInCombat = isMonsterInCombat;
var moveMonsters = function (state, dispatch, showDialog, playerPosOverride) {
    var playerPos = playerPosOverride || state.player.position;
    state.activeMonsters.forEach(function (monster) {
        // Skip monsters already engaged in combat
        if ((0, exports.isMonsterInCombat)(monster, state)) {
            return;
        }
        // Calculate monster's new position
        var newPos = (0, exports.calculateMonsterMovement)(monster, playerPos, state);
        // Check for combat collision before moving
        if ((0, combat_1.checkForCombatCollision)(state, monster, newPos, playerPos)) {
            (0, combat_1.setupCombat)(state, dispatch, monster, playerPos);
            return;
        }
        // Move monster to new position
        dispatch({
            type: 'MOVE_MONSTER',
            payload: { id: monster.id, position: newPos },
        });
        (0, utils_1.logIfDev)("Monster ".concat(monster.name, " moved to (").concat(newPos.row, ", ").concat(newPos.col, ")"));
    });
};
exports.moveMonsters = moveMonsters;
// ==================== MOVEMENT UTILITIES ====================
function calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.row - pos1.row, 2) + Math.pow(pos2.col - pos1.col, 2));
}
function isAdjacentToPlayer(monster, playerPosition) {
    return calculateDistance(monster.position, playerPosition) <= 1.5;
}
