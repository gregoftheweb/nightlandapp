"use strict";
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
exports.isClickWithinBounds = exports.disappearFarMonsters = exports.moveAway = exports.logIfDev = void 0;
exports.isPlayerOnObject = isPlayerOnObject;
exports.getObjectAtPoint = getObjectAtPoint;
exports.moveToward = moveToward;
exports.calculateCameraOffset = calculateCameraOffset;
exports.initializeEntityStyles = initializeEntityStyles;
exports.updateViewport = updateViewport;
exports.updateCombatDialogs = updateCombatDialogs;
exports.updateStatusBar = updateStatusBar;
exports.encodeSoulKey = encodeSoulKey;
exports.decodeSoulKey = decodeSoulKey;
exports.getAttributeModifier = getAttributeModifier;
exports.getTextContent = getTextContent;
var textcontent_1 = require("../assets/copy/textcontent");
/**
 * Development logging helper - only logs in development mode
 * Use this instead of console.log to prevent expensive console operations in production
 */
var logIfDev = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (__DEV__) {
        console.log.apply(console, __spreadArray([message], args, false));
    }
};
exports.logIfDev = logIfDev;
/**
 * Check if the player is standing on an object
 * @param playerPos - The player's position
 * @param objectPos - The object's position
 * @param objectWidth - The object's width (default: 1)
 * @param objectHeight - The object's height (default: 1)
 * @returns true if player position is within object bounds
 */
function isPlayerOnObject(playerPos, objectPos, objectWidth, objectHeight) {
    if (objectWidth === void 0) { objectWidth = 1; }
    if (objectHeight === void 0) { objectHeight = 1; }
    return (playerPos.row >= objectPos.row &&
        playerPos.row < objectPos.row + objectHeight &&
        playerPos.col >= objectPos.col &&
        playerPos.col < objectPos.col + objectWidth);
}
/**
 * Centralized hit-testing function to determine which object (if any) is at a world position.
 *
 * Priority order (highest to lowest):
 * 1. Player (if at exact position)
 * 2. Monsters (active monsters and combat slots)
 * 3. Great Powers
 * 4. Items
 * 5. Buildings (level objects)
 * 6. Non-collision objects (with collision masks)
 *
 * @param worldRow - World row coordinate
 * @param worldCol - World column coordinate
 * @param state - Current game state
 * @returns Object at the point with type and data, or null if no object found
 */
function getObjectAtPoint(worldRow, worldCol, state) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Priority 1: Player
    if ((_a = state.player) === null || _a === void 0 ? void 0 : _a.position) {
        if (state.player.position.row === worldRow && state.player.position.col === worldCol) {
            return { type: 'player', data: state.player };
        }
    }
    // Priority 2: Monsters (both active and in combat slots)
    // Note: We check !inCombatSlot to avoid detecting monsters that are positioned
    // at combat UI slots rather than their world position. Monsters in attackSlots
    // still have their world position and should be detectable there.
    var allMonsters = __spreadArray(__spreadArray([], (state.activeMonsters || []), true), (state.attackSlots || []), true);
    for (var _i = 0, allMonsters_1 = allMonsters; _i < allMonsters_1.length; _i++) {
        var monster = allMonsters_1[_i];
        if (monster.position &&
            !monster.inCombatSlot &&
            monster.active !== false &&
            monster.position.row === worldRow &&
            monster.position.col === worldCol) {
            return { type: 'monster', data: monster };
        }
    }
    // Priority 3: Great Powers
    if ((_b = state.level) === null || _b === void 0 ? void 0 : _b.greatPowers) {
        for (var _h = 0, _j = state.level.greatPowers; _h < _j.length; _h++) {
            var gp = _j[_h];
            if (gp.position && gp.active !== false) {
                var gpWidth = gp.width || 1;
                var gpHeight = gp.height || 1;
                if (worldRow >= gp.position.row &&
                    worldRow < gp.position.row + gpHeight &&
                    worldCol >= gp.position.col &&
                    worldCol < gp.position.col + gpWidth) {
                    return { type: 'greatPower', data: gp };
                }
            }
        }
    }
    // Priority 4: Items
    if (state.items) {
        for (var _k = 0, _l = state.items; _k < _l.length; _k++) {
            var item = _l[_k];
            if (item.active &&
                item.position &&
                item.position.row === worldRow &&
                item.position.col === worldCol) {
                return { type: 'item', data: item };
            }
        }
    }
    // Priority 5: Buildings (level objects)
    if ((_c = state.level) === null || _c === void 0 ? void 0 : _c.objects) {
        for (var _m = 0, _o = state.level.objects; _m < _o.length; _m++) {
            var obj = _o[_m];
            if (obj.position) {
                var objWidth = (_e = (_d = obj.size) === null || _d === void 0 ? void 0 : _d.width) !== null && _e !== void 0 ? _e : 1;
                var objHeight = (_g = (_f = obj.size) === null || _f === void 0 ? void 0 : _f.height) !== null && _g !== void 0 ? _g : 1;
                if (worldRow >= obj.position.row &&
                    worldRow < obj.position.row + objHeight &&
                    worldCol >= obj.position.col &&
                    worldCol < obj.position.col + objWidth) {
                    return { type: 'building', data: obj };
                }
            }
        }
    }
    // Priority 6: Non-collision objects (check collision masks if present)
    if (state.nonCollisionObjects) {
        for (var _p = 0, _q = state.nonCollisionObjects; _p < _q.length; _p++) {
            var obj = _q[_p];
            if (!obj.position || !obj.active || obj.canTap === false)
                continue;
            // If object has collision mask, check each mask tile
            if (obj.collisionMask && obj.collisionMask.length > 0) {
                for (var _r = 0, _s = obj.collisionMask; _r < _s.length; _r++) {
                    var mask = _s[_r];
                    var maskRow = obj.position.row + mask.row;
                    var maskCol = obj.position.col + mask.col;
                    var maskWidth = mask.width || 1;
                    var maskHeight = mask.height || 1;
                    if (worldRow >= maskRow &&
                        worldRow < maskRow + maskHeight &&
                        worldCol >= maskCol &&
                        worldCol < maskCol + maskWidth) {
                        return { type: 'nonCollisionObject', data: obj };
                    }
                }
            }
            else {
                // No collision mask, check main object bounds
                var objWidth = obj.width || 1;
                var objHeight = obj.height || 1;
                if (worldRow >= obj.position.row &&
                    worldRow < obj.position.row + objHeight &&
                    worldCol >= obj.position.col &&
                    worldCol < obj.position.col + objWidth) {
                    return { type: 'nonCollisionObject', data: obj };
                }
            }
        }
    }
    return null;
}
function moveToward(entity, targetRow, targetCol, speed, gridWidth, gridHeight) {
    if (speed === void 0) { speed = 1; }
    if (gridWidth === void 0) { gridWidth = 49; }
    if (gridHeight === void 0) { gridHeight = 49; }
    var dRow = targetRow - entity.position.row;
    var dCol = targetCol - entity.position.col;
    var stepsRow = Math.min(Math.abs(dRow), speed) * (dRow > 0 ? 1 : dRow < 0 ? -1 : 0);
    var stepsCol = Math.min(Math.abs(dCol), speed) * (dCol > 0 ? 1 : dCol < 0 ? -1 : 0);
    entity.position.row = Math.max(0, Math.min(gridHeight - 1, entity.position.row + stepsRow));
    entity.position.col = Math.max(0, Math.min(gridWidth - 1, entity.position.col + stepsCol));
}
var moveAway = function (monster, playerPosition, gridWidth, gridHeight) {
    var dx = monster.position.col - playerPosition.col;
    var dy = monster.position.row - playerPosition.row;
    var newRow = monster.position.row + Math.sign(dy); // Move away vertically
    var newCol = monster.position.col + Math.sign(dx); // Move away horizontally
    // Ensure the new position is within bounds
    newRow = Math.max(0, Math.min(gridHeight - 1, newRow));
    newCol = Math.max(0, Math.min(gridWidth - 1, newCol));
    return { row: newRow, col: newCol };
};
exports.moveAway = moveAway;
var disappearFarMonsters = function (monsters, playerPosition, distanceThreshold) {
    if (distanceThreshold === void 0) { distanceThreshold = 20; }
    return monsters.filter(function (monster) {
        var dx = monster.position.col - playerPosition.col;
        var dy = monster.position.row - playerPosition.row;
        var distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= distanceThreshold;
    });
};
exports.disappearFarMonsters = disappearFarMonsters;
// Fixed calculateCameraOffset function
function calculateCameraOffset(playerPosition, viewportCols, viewportRows, gridWidth, gridHeight) {
    // Add null/undefined check for playerPosition
    if (!playerPosition) {
        console.warn('playerPosition is undefined, returning default camera offset');
        return { offsetX: 0, offsetY: 0 };
    }
    var offsetX = Math.min(Math.max(playerPosition.col - Math.floor(viewportCols / 2), 0), gridWidth - viewportCols);
    var offsetY = Math.min(Math.max(playerPosition.row - Math.floor(viewportRows / 2), 0), gridHeight - viewportRows);
    return { offsetX: offsetX, offsetY: offsetY };
}
// nightland/src/modules/utils.ts
function initializeEntityStyles(state) {
    var _a, _b;
    var tileSize = state.tileSize;
    console.log('===== Initializing Entity Styles =====');
    console.log('Tile size:', tileSize);
    console.log('Player:', state.player);
    console.log('Objects array:', state.objects);
    console.log('Active Monsters array:', state.activeMonsters);
    console.log('Pools array:', state.pools);
    console.log('Great Powers array:', state.greatPowers);
    // Player
    var player = document.querySelector("#".concat((_a = state.player) === null || _a === void 0 ? void 0 : _a.shortName));
    if (player && ((_b = state.player) === null || _b === void 0 ? void 0 : _b.position)) {
        ;
        player.style.left = "".concat(state.player.position.col * tileSize, "px");
        player.style.top = "".concat(state.player.position.row * tileSize, "px");
        player.style.transform = 'none';
        player.style.visibility = 'visible';
        player.style.opacity = '1';
        console.log('Player positioned at:', state.player.position);
    }
    else {
        console.warn('Player element or position missing:', state.player);
    }
    // Objects (including Redoubt)
    ;
    (state.objects || []).forEach(function (object) {
        var _a, _b;
        var element = document.querySelector("#".concat(object.id));
        console.log('Object:', object.shortName, 'id:', object.id, 'DOM element found?', !!element);
        if (element && object.position) {
            ;
            element.style.left = "".concat(object.position.col * tileSize, "px");
            element.style.top = "".concat(object.position.row * tileSize, "px");
            element.style.width = "".concat((((_a = object.size) === null || _a === void 0 ? void 0 : _a.width) || 1) * tileSize, "px");
            element.style.height = "".concat((((_b = object.size) === null || _b === void 0 ? void 0 : _b.height) || 1) * tileSize, "px");
            element.style.transform = "rotate(".concat(object.direction || 0, "deg)");
            element.style.transformOrigin = 'center center';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            console.log('Positioned object:', object.shortName, 'at row:', object.position.row, 'col:', object.position.col);
        }
        else {
            console.warn('Object element or position missing:', object);
        }
    });
    (state.greatPowers || []).forEach(function (power) {
        var _a, _b;
        var element = document.querySelector("#".concat(power.shortName));
        console.log('GreatPower:', power.shortName, 'DOM element found?', !!element);
        if (element && power.position) {
            ;
            element.style.left = "".concat(power.position.col * tileSize, "px");
            element.style.top = "".concat(power.position.row * tileSize, "px");
            element.style.width = "".concat((((_a = power.size) === null || _a === void 0 ? void 0 : _a.width) || 1) * tileSize, "px");
            element.style.height = "".concat((((_b = power.size) === null || _b === void 0 ? void 0 : _b.height) || 1) * tileSize, "px");
            element.style.transform = 'none';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        }
        else {
            console.warn('GreatPower element or position missing:', power);
        }
    });
    (state.activeMonsters || []).forEach(function (monster) {
        var element = document.querySelector("#".concat(monster.id)) || document.querySelector("#combat-".concat(monster.id));
        console.log('Monster:', monster.name, 'id:', monster.id, 'DOM element found?', !!element);
        if (element && monster.position) {
            ;
            element.style.left = "".concat(monster.position.col * tileSize, "px");
            element.style.top = "".concat(monster.position.row * tileSize, "px");
            element.style.transform = 'none';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        }
        else {
            console.warn('Monster element or position missing:', monster);
        }
    });
    (state.pools || []).forEach(function (pool) {
        var _a, _b;
        var element = document.querySelector("#poolOfPeace-".concat(pool.id));
        console.log('Pool:', pool.shortName, 'id:', pool.id, 'DOM element found?', !!element);
        if (element && pool.position) {
            var template = state.poolsTemplate;
            element.style.left = "".concat(pool.position.col * tileSize, "px");
            element.style.top = "".concat(pool.position.row * tileSize, "px");
            element.style.width = "".concat((((_a = template.size) === null || _a === void 0 ? void 0 : _a.width) || 1) * tileSize, "px");
            element.style.height = "".concat((((_b = template.size) === null || _b === void 0 ? void 0 : _b.height) || 1) * tileSize, "px");
            element.style.transform = 'none';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        }
        else {
            console.warn('Pool element or position missing:', pool);
        }
    });
    console.log('===== Entity Styles Initialization Complete =====');
}
function updateViewport(state) {
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var statusBarHeight = 42;
    var playerRow = state.player.position.row;
    var playerCol = state.player.position.col;
    var tileSize = state.tileSize;
    var edgeDistance = 2.5; // Approximately 100px / 40px = 2.5 tiles
    var maxRow = state.gridHeight - 1; // 399 (updated from 48)
    var maxCol = state.gridWidth - 1; // 399 (updated from 48)
    var middleY = Math.floor(viewportHeight / (2 * tileSize));
    // Update Redoubt reference to use state.objects
    var redoubt = (state.objects || []).find(function (obj) { return obj.shortName === 'redoubt'; });
    if (!redoubt) {
        console.warn('Redoubt not found in state.objects');
        return;
    }
    var translateX = -(playerCol * tileSize) + viewportWidth / 2 - tileSize / 2;
    var translateY = -((redoubt.position.row + 4) * tileSize - viewportHeight + statusBarHeight); // Redoubt offset (4 tiles down)
    var playerViewportRow = playerRow + translateY / tileSize;
    if (playerViewportRow <= middleY) {
        translateY = -(playerRow * tileSize) + middleY * tileSize;
    }
    if (playerRow < edgeDistance) {
        translateY = -(playerRow * tileSize) + edgeDistance * tileSize;
    }
    else if (playerRow > maxRow - edgeDistance) {
        translateY = -((playerRow - (viewportHeight / tileSize - statusBarHeight / tileSize - edgeDistance)) *
            tileSize);
    }
    if (playerCol < edgeDistance) {
        translateX = -(playerCol * tileSize) + edgeDistance * tileSize;
    }
    else if (playerCol > maxCol - edgeDistance) {
        translateX = -((playerCol - (viewportWidth / tileSize - edgeDistance)) * tileSize);
    }
    var gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        ;
        gameBoard.style.transform = "translate(".concat(translateX, "px, ").concat(translateY, "px)");
        gameBoard.style.transition = 'transform 0.2s ease';
    }
}
function updateCombatDialogs(playerComment, enemyComments, player, monsters) {
    if (playerComment === void 0) { playerComment = ''; }
    if (enemyComments === void 0) { enemyComments = []; }
    var result = {
        player: { name: player.name, hp: player.hp, comment: playerComment },
        enemies: monsters.map(function (m, i) {
            return m
                ? { name: m.name, hp: Math.max(0, m.hp), comment: enemyComments[i] || '', dead: m.hp <= 0 }
                : null;
        }),
    };
    console.log('updateCombatDialogs - Player Comment:', playerComment, 'Result:', result);
    return result;
}
function updateStatusBar(player) {
    return { hp: player.hp };
}
var isClickWithinBounds = function (event, gameBoard, object, tileSize) {
    var _a, _b;
    // Get the click coordinates relative to the game board
    var clickX = event.clientX - gameBoard.left;
    var clickY = event.clientY - gameBoard.top;
    // Convert pixel coordinates to tile coordinates
    var clickCol = Math.floor(clickX / tileSize);
    var clickRow = Math.floor(clickY / tileSize);
    // Adjust for the object's position to get relative coordinates
    var relativeRow = clickRow - object.position.row;
    var relativeCol = clickCol - object.position.col;
    // If there's a collisionMask, check if the click is within it
    if (object.collisionMask) {
        return object.collisionMask.some(function (mask) {
            var maskRowStart = mask.row;
            var maskColStart = mask.col;
            var maskRowEnd = maskRowStart + (mask.height || 1) - 1;
            var maskColEnd = maskColStart + (mask.width || 1) - 1;
            return (relativeRow >= maskRowStart &&
                relativeRow <= maskRowEnd &&
                relativeCol >= maskColStart &&
                relativeCol <= maskColEnd);
        });
    }
    // If no collisionMask, check the full bounding box
    var objWidth = ((_a = object.size) === null || _a === void 0 ? void 0 : _a.width) || 1;
    var objHeight = ((_b = object.size) === null || _b === void 0 ? void 0 : _b.height) || 1;
    return relativeRow >= 0 && relativeRow < objHeight && relativeCol >= 0 && relativeCol < objWidth;
};
exports.isClickWithinBounds = isClickWithinBounds;
function encodeSoulKey(attributes) {
    var str = attributes.str, int = attributes.int, dex = attributes.dex, wil = attributes.wil, wis = attributes.wis, cha = attributes.cha;
    var plainBytes = [str, int, dex, wil, wis, cha];
    var key = [110, 105, 103, 104, 116]; // "night" ASCII values (n, i, g, h, t)
    var obfuscatedBytes = plainBytes.map(function (byte, i) { return byte ^ key[i % key.length]; });
    return obfuscatedBytes
        .map(function (byte) { return byte.toString(16).padStart(2, '0'); })
        .join('')
        .toUpperCase();
}
function decodeSoulKey(soulKey) {
    var bytes = soulKey.match(/.{2}/g).map(function (hex) { return parseInt(hex, 16); });
    var key = [110, 105, 103, 104, 116];
    var plainBytes = bytes.map(function (byte, i) { return byte ^ key[i % key.length]; });
    return {
        str: plainBytes[0],
        int: plainBytes[1],
        dex: plainBytes[2],
        wil: plainBytes[3],
        wis: plainBytes[4],
        cha: plainBytes[5],
    };
}
function getAttributeModifier(value) {
    return Math.floor((value - 10) / 2);
}
// New helper function to fetch and format text from textcontent.ts
function getTextContent(key, replacements) {
    if (replacements === void 0) { replacements = []; }
    var text = textcontent_1.default[key] || '';
    console.log("getTextContent called: key=".concat(key, ", text=\"").concat(text, "\", replacements="), replacements);
    // Perform replacements sequentially
    replacements.forEach(function (replacement, index) {
        var placeholder = "[".concat(index + 1, "]"); // Assumes placeholders are [1], [2], etc.
        text = text.replace(placeholder, replacement);
    });
    // Specifically handle [monster] for combatStart
    if (key === 'combatStart' && replacements.length > 0) {
        text = text.replace('[monster]', replacements[0]);
    }
    return text;
}
