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
exports.getAllObjectTemplates = exports.getNonCollisionTemplate = exports.getItemTemplate = exports.getCollectibleTemplate = exports.getConsumableTemplate = exports.getBuildingTemplate = exports.getWeaponTemplate = exports.buildings = exports.nonCollisionTemplates = exports.collectible = exports.consumables = exports.weapons = void 0;
var redoubt2_png_1 = require("@assets/images/redoubt2.png");
var river1_png_1 = require("@assets/images/river1.png");
var cursedtotem_png_1 = require("@assets/images/cursedtotem.png");
var petrifiedWillow_png_1 = require("@assets/images/petrifiedWillow.png");
var maguffinRock_png_1 = require("@assets/images/maguffinRock.png");
var shortSword_png_1 = require("@assets/images/shortSword.png");
var potion_png_1 = require("@assets/images/potion.png");
var poolofpeace_png_1 = require("@assets/images/poolofpeace.png");
var footprints_blue_png_1 = require("@assets/images/footprints-blue.png");
var aero_wreckage_png_1 = require("@assets/images/aero-wreckage.png");
var tesseract_puzzle1_png_1 = require("@assets/images/tesseract-puzzle1.png");
var hermit_save2_png_1 = require("@assets/images/hermit-save2.png");
// WEAPONS TEMPLATES - Pure templates without position data
exports.weapons = {
    discos: {
        shortName: 'discos',
        category: 'weapon',
        name: 'Discos',
        description: 'The weapon of man. A spinning disc of the Earth Current on a staff of some length, attuned to the man himself.',
        damage: 10,
        hitBonus: 2,
        type: 'melee',
        weaponType: 'melee',
        range: 1,
        active: true,
    },
    ironSword: {
        shortName: 'ironSword',
        category: 'weapon',
        name: 'Iron Sword',
        description: 'A sturdy iron blade, well-balanced and sharp.',
        image: shortSword_png_1.default,
        damage: 8,
        hitBonus: 1,
        type: 'melee',
        weaponType: 'melee',
        range: 1,
        active: true,
    },
    valkyries_bow: {
        shortName: 'valkyries_bow',
        category: 'weapon',
        name: "Valkyrie's Bow",
        description: 'A legendary bow crafted by the Valkyries, it fires arrows of pure light that never miss their mark.',
        damage: 8,
        hitBonus: 3,
        type: 'weapon',
        weaponType: 'ranged',
        range: 10,
        active: true,
        projectileColor: '#0ce9e9ff', // Bright cyan arrow
    },
    shurikens: {
        shortName: 'shurikens',
        category: 'weapon',
        name: 'Shurikens',
        description: 'Razor-sharp throwing stars forged in the Last Redoubt. Swift and deadly from a distance.',
        damage: 6,
        hitBonus: 1,
        type: 'weapon',
        weaponType: 'ranged',
        range: 6,
        active: true,
        projectileColor: '#C0C0C0', // Silvery steel
    },
};
// CONSUMABLES TEMPLATES
exports.consumables = {
    healthPotion: {
        shortName: 'healthPotion',
        category: 'consumable',
        name: 'Health Potion',
        description: 'A red potion that restores health when consumed.',
        type: 'consumable',
        image: potion_png_1.default,
        active: true,
        effects: [
            {
                type: 'heal',
                value: 25,
            },
        ],
    },
};
// Scroll text constant - single source of truth
var PERSIUS_SCROLL_TEXT = "Christos,\n\nReturn to the Redoubt. Do not follow me. Do not hinder me!\n\nI can free mankind from this horror of the black night and all the dark evils.\n\nDo not stop me in my quest.\n\nI go now in search of the Tesseract, the device of the ancient science-wizards.\n\nI must.\n\n\u2014 Persius";
exports.collectible = {
    persiusScroll: {
        shortName: 'persiusScroll',
        category: 'collectible',
        name: 'Persius Scroll',
        description: PERSIUS_SCROLL_TEXT,
        type: 'collectible',
        collectible: true,
        active: true,
        usable: true,
        consumeOnUse: false,
        effects: [
            {
                type: 'showMessage',
                message: PERSIUS_SCROLL_TEXT,
            },
        ],
    },
    maguffinRock: {
        shortName: 'maguffinRock',
        category: 'collectible',
        name: 'Maguffin Rock',
        description: 'A mysterious rock formation with unknown properties.',
        type: 'collectible',
        image: maguffinRock_png_1.default,
        active: true,
        zIndex: 0,
    },
};
exports.nonCollisionTemplates = {
    footsteps: {
        shortName: 'footsteps',
        name: 'Footsteps of Persius',
        description: 'Faint tracks of Persius lie before you, leading you onward in the gloomy dust.',
        width: 2,
        height: 2,
        image: footprints_blue_png_1.default,
        zIndex: 1,
        type: 'footstep',
        canTap: true,
        active: true,
    },
    river: {
        shortName: 'river',
        name: 'Ancient River',
        description: 'A dried riverbed from ages past.',
        width: 2,
        height: 2,
        image: river1_png_1.default,
        zIndex: 0,
        type: 'river',
        canTap: false,
        active: true,
        collisionEffects: [
            {
                type: 'heal',
                value: 5,
                description: 'The cool river water refreshes you.',
            },
        ],
    },
};
// BUILDINGS TEMPLATES - Pure templates without position data
exports.buildings = {
    redoubt: {
        shortName: 'redoubt',
        category: 'building',
        name: 'The Last Redoubt',
        description: 'The Last home of the remnant of Mankind.',
        width: 8,
        height: 8,
        image: redoubt2_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'recuperate',
                value: 10,
            },
            {
                type: 'hide',
            },
        ],
    },
    river: {
        shortName: 'river',
        category: 'building',
        name: 'Ancient River',
        description: 'A dried riverbed from ages past.',
        width: 2,
        height: 6,
        image: river1_png_1.default,
        active: true,
        zIndex: 0,
    },
    cursedTotem: {
        shortName: 'cursedTotem',
        category: 'building',
        name: 'Cursed Totem',
        description: 'An ancient totem radiating malevolent energy.',
        width: 4,
        height: 8,
        image: cursedtotem_png_1.default,
        active: true,
        zIndex: 1,
        effects: [
            {
                type: 'swarm',
                monsterType: 'abhuman',
                count: 4,
                range: 12,
            },
        ],
    },
    petrifiedWillow: {
        shortName: 'petrifiedWillow',
        category: 'building',
        name: 'Petrified Willow',
        description: 'A once-living tree, now turned to stone.',
        width: 3,
        height: 3,
        image: petrifiedWillow_png_1.default,
        active: true,
        zIndex: 0,
    },
    healingPool: {
        shortName: 'healingPool',
        category: 'building',
        name: 'Healing Pool',
        description: 'A serene pool of restorative waters.',
        width: 4,
        height: 4,
        image: poolofpeace_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'recuperate',
                value: 10,
            },
            {
                type: 'hide',
            },
        ],
    },
    poisonPool: {
        shortName: 'poisonPool',
        category: 'building',
        name: 'Poison Pool',
        description: 'A bubbling pool of toxic sludge.',
        width: 2,
        height: 2,
        image: poolofpeace_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'poison',
                value: 10,
            },
        ],
    },
    aeroWreckage: {
        shortName: 'aeroWreckage',
        category: 'building',
        name: 'Aero-Wreckage',
        description: 'The twisted remnants of a long-lost crashed aerocraft from a forgotten age of the Redoubt. Ancient metal and strange devices lie scattered among the wreckage, relics of a time when humanity soared above the Night Land.',
        width: 4,
        height: 4,
        image: aero_wreckage_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'hide',
            },
        ],
        subGame: {
            subGameName: 'aerowreckage-puzzle',
            ctaLabel: 'Investigate',
            requiresPlayerOnObject: true,
        },
    },
    tesseract: {
        shortName: 'tesseract',
        category: 'building',
        name: 'Tesseract',
        description: 'An ancient circle of black stone, steeped in a will that is not its own. Those who seek to command its power gain forbidden knowledge… or vanish without even the mercy of death.',
        width: 6,
        height: 6,
        image: tesseract_puzzle1_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'hide',
            },
        ],
        subGame: {
            subGameName: 'tesseract',
            ctaLabel: 'Investigate',
            requiresPlayerOnObject: true,
        },
    },
    hermit: {
        shortName: 'hermit',
        category: 'building',
        name: 'Hermit',
        description: 'A lonely hermit sits next to small campfire, safety and peace eminate from him and the small copse of woods around him.',
        width: 4,
        height: 4,
        image: hermit_save2_png_1.default,
        active: true,
        zIndex: 0,
        effects: [
            {
                type: 'recuperate',
                value: 10,
            },
            {
                type: 'hide',
            },
        ],
        subGame: {
            subGameName: 'hermit-hollow',
            ctaLabel: 'Rest awhile',
            requiresPlayerOnObject: true,
        },
    },
};
// UTILITY FUNCTIONS TO GET TEMPLATES
var getWeaponTemplate = function (shortName) {
    return exports.weapons[shortName];
};
exports.getWeaponTemplate = getWeaponTemplate;
var getBuildingTemplate = function (shortName) {
    return exports.buildings[shortName];
};
exports.getBuildingTemplate = getBuildingTemplate;
var getConsumableTemplate = function (shortName) {
    return exports.consumables[shortName];
};
exports.getConsumableTemplate = getConsumableTemplate;
var getCollectibleTemplate = function (shortName) {
    return exports.collectible[shortName];
};
exports.getCollectibleTemplate = getCollectibleTemplate;
var getItemTemplate = function (shortName) {
    return exports.weapons[shortName] || exports.consumables[shortName];
};
exports.getItemTemplate = getItemTemplate;
var getNonCollisionTemplate = function (shortName) {
    return exports.nonCollisionTemplates[shortName];
};
exports.getNonCollisionTemplate = getNonCollisionTemplate;
// Get all templates combined (useful for lookups)
var getAllObjectTemplates = function () {
    return __assign(__assign(__assign({}, exports.weapons), exports.consumables), exports.buildings);
};
exports.getAllObjectTemplates = getAllObjectTemplates;
