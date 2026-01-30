"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableGreatPowerTypes = exports.getAvailableMonsterTypes = exports.getGreatPowerTemplate = exports.getMonsterTemplate = exports.greatPowers = exports.monsters = void 0;
var abhuman_png_1 = require("@assets/images/abhuman.png");
var nighthound4_png_1 = require("@assets/images/nighthound4.png");
var watcherse_png_1 = require("@assets/images/watcherse.png");
// -------------------- REGULAR MONSTERS --------------------
// Base monster templates - NO spawn configuration here
exports.monsters = [
    {
        shortName: 'abhuman',
        category: 'regular',
        name: 'Abhuman',
        description: 'Mutated humanoid with brute strength.',
        image: abhuman_png_1.default,
        position: { row: 0, col: 0 }, // Default position, will be set during spawning
        active: true,
        hp: 12,
        maxHP: 12,
        attack: 5,
        ac: 12,
        moveRate: 2,
        soulKey: 'str:16,dex:10,con:14,int:8,wis:8,cha:6',
    },
    {
        shortName: 'night_hound',
        category: 'regular',
        name: 'Night Hound',
        description: 'Swift, feral beast that hunts in packs.',
        image: nighthound4_png_1.default,
        position: { row: 0, col: 0 }, // Default position, will be set during spawning
        active: true,
        hp: 30,
        maxHP: 30,
        attack: 6,
        ac: 14,
        moveRate: 2,
        soulKey: 'str:12,dex:16,con:12,int:6,wis:10,cha:8',
    },
];
// -------------------- GREAT POWERS --------------------
exports.greatPowers = [
    {
        id: 'watcher_se',
        shortName: 'watcher_se',
        category: 'greatPower',
        name: 'Watcher of the South East',
        description: 'An ancient guardian with mystical powers that watches over the southeastern wastes.',
        image: watcherse_png_1.default,
        width: 6,
        height: 6,
        position: { row: 0, col: 0 }, // Will be set per level
        active: true,
        hp: 150,
        maxHP: 150,
        attack: 15,
        ac: 16,
        awakened: false,
        effects: [
            {
                type: 'soulsuck',
            },
        ],
        awakenCondition: 'player_within_range',
        soulKey: 'str:18,dex:12,con:16,int:14,wis:14,cha:12',
    },
];
// -------------------- HELPER FUNCTIONS --------------------
// Get monster template by shortName
var getMonsterTemplate = function (shortName) {
    return exports.monsters.find(function (monster) { return monster.shortName === shortName; });
};
exports.getMonsterTemplate = getMonsterTemplate;
// Get great power template by shortName
var getGreatPowerTemplate = function (shortName) {
    return exports.greatPowers.find(function (power) { return power.shortName === shortName; });
};
exports.getGreatPowerTemplate = getGreatPowerTemplate;
// Get all monster shortNames for validation
var getAvailableMonsterTypes = function () {
    return exports.monsters.map(function (monster) { return monster.shortName; });
};
exports.getAvailableMonsterTypes = getAvailableMonsterTypes;
// Get all great power shortNames for validation
var getAvailableGreatPowerTypes = function () {
    return exports.greatPowers.map(function (power) { return power.shortName; });
};
exports.getAvailableGreatPowerTypes = getAvailableGreatPowerTypes;
