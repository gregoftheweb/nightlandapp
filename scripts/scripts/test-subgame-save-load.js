"use strict";
/**
 * Test script to validate sub-game save/load functionality
 *
 * This script tests that:
 * 1. Sub-game completion state is saved correctly
 * 2. Sub-game completion state is restored on load
 * 3. The save schema is forward-compatible
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
var gameState_1 = require("../modules/gameState");
// Test 1: Verify sub-game completion is saved
function testSubGameSaveCompletion() {
    console.log('\n=== Test 1: Sub-game completion is saved ===');
    var state = (0, gameState_1.getInitialState)('1');
    state.subGamesCompleted = {
        'hermit-hollow': true,
        'tesseract': true,
        'hermit-hollow:learned_great_power_exists': true,
    };
    var snapshot = (0, gameState_1.toSnapshot)(state);
    console.log('✓ State has subGamesCompleted:', Object.keys(state.subGamesCompleted));
    console.log('✓ Snapshot has subGamesCompleted:', Object.keys(snapshot.subGamesCompleted || {}));
    if (!snapshot.subGamesCompleted) {
        console.error('✗ FAIL: snapshot.subGamesCompleted is undefined');
        return false;
    }
    if (snapshot.subGamesCompleted['hermit-hollow'] !== true) {
        console.error('✗ FAIL: hermit-hollow completion not saved');
        return false;
    }
    if (snapshot.subGamesCompleted['tesseract'] !== true) {
        console.error('✗ FAIL: tesseract completion not saved');
        return false;
    }
    console.log('✓ PASS: Sub-game completion is saved correctly');
    return true;
}
// Test 2: Verify sub-game completion is restored on load
function testSubGameLoadCompletion() {
    console.log('\n=== Test 2: Sub-game completion is restored on load ===');
    var snapshot = __assign(__assign({}, (0, gameState_1.toSnapshot)((0, gameState_1.getInitialState)('1'))), { subGamesCompleted: {
            'hermit-hollow': true,
            'tesseract': true,
            'aerowreckagePuzzle': true,
        } });
    var loadedState = (0, gameState_1.fromSnapshot)(snapshot);
    console.log('✓ Loaded state has subGamesCompleted:', Object.keys(loadedState.subGamesCompleted || {}));
    if (!loadedState.subGamesCompleted) {
        console.error('✗ FAIL: loadedState.subGamesCompleted is undefined');
        return false;
    }
    if (loadedState.subGamesCompleted['hermit-hollow'] !== true) {
        console.error('✗ FAIL: hermit-hollow completion not restored');
        return false;
    }
    if (loadedState.subGamesCompleted['tesseract'] !== true) {
        console.error('✗ FAIL: tesseract completion not restored');
        return false;
    }
    if (loadedState.subGamesCompleted['aerowreckagePuzzle'] !== true) {
        console.error('✗ FAIL: aerowreckagePuzzle completion not restored');
        return false;
    }
    console.log('✓ PASS: Sub-game completion is restored correctly');
    return true;
}
// Test 3: Verify forward compatibility (unknown sub-game keys don't break loading)
function testForwardCompatibility() {
    console.log('\n=== Test 3: Forward compatibility with unknown sub-games ===');
    var snapshot = __assign(__assign({}, (0, gameState_1.toSnapshot)((0, gameState_1.getInitialState)('1'))), { subGamesCompleted: {
            'hermit-hollow': true,
            'future-subgame-v2': true, // Unknown sub-game
            'future-puzzle-2025': true, // Unknown sub-game
        } });
    try {
        var loadedState = (0, gameState_1.fromSnapshot)(snapshot);
        console.log('✓ Loaded state has subGamesCompleted:', Object.keys(loadedState.subGamesCompleted || {}));
        if (!loadedState.subGamesCompleted) {
            console.error('✗ FAIL: loadedState.subGamesCompleted is undefined');
            return false;
        }
        // Verify known sub-game is preserved
        if (loadedState.subGamesCompleted['hermit-hollow'] !== true) {
            console.error('✗ FAIL: known sub-game not preserved');
            return false;
        }
        // Verify unknown sub-games are preserved
        if (loadedState.subGamesCompleted['future-subgame-v2'] !== true) {
            console.error('✗ FAIL: unknown sub-game not preserved');
            return false;
        }
        console.log('✓ PASS: Forward compatibility works correctly');
        return true;
    }
    catch (error) {
        console.error('✗ FAIL: Error during load:', error);
        return false;
    }
}
// Test 4: Verify missing sub-game data defaults safely
function testMissingSubGameData() {
    console.log('\n=== Test 4: Missing sub-game data defaults safely ===');
    var snapshot = __assign({}, (0, gameState_1.toSnapshot)((0, gameState_1.getInitialState)('1')));
    // @ts-ignore - Testing runtime behavior
    delete snapshot.subGamesCompleted;
    var loadedState = (0, gameState_1.fromSnapshot)(snapshot);
    console.log('✓ Loaded state has subGamesCompleted:', loadedState.subGamesCompleted);
    // Should default to empty object, not undefined
    if (loadedState.subGamesCompleted === undefined) {
        console.error('✗ FAIL: subGamesCompleted should not be undefined');
        return false;
    }
    if (typeof loadedState.subGamesCompleted !== 'object') {
        console.error('✗ FAIL: subGamesCompleted should be an object');
        return false;
    }
    console.log('✓ PASS: Missing sub-game data defaults safely');
    return true;
}
// Run all tests
function runTests() {
    console.log('🧪 Testing Sub-Game Save/Load Functionality');
    console.log('='.repeat(50));
    var results = [
        testSubGameSaveCompletion(),
        testSubGameLoadCompletion(),
        testForwardCompatibility(),
        testMissingSubGameData(),
    ];
    var passed = results.filter(Boolean).length;
    var total = results.length;
    console.log('\n' + '='.repeat(50));
    console.log("Tests: ".concat(passed, "/").concat(total, " passed"));
    if (passed === total) {
        console.log('✅ All tests passed!');
        process.exit(0);
    }
    else {
        console.log('❌ Some tests failed');
        process.exit(1);
    }
}
// Run tests
runTests();
