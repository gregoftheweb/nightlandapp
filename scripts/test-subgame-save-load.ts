/**
 * Test script to validate sub-game save/load functionality
 * 
 * This script tests that:
 * 1. Sub-game completion state is saved correctly
 * 2. Sub-game completion state is restored on load
 * 3. The save schema is forward-compatible
 */

import { toSnapshot, fromSnapshot, getInitialState } from '../modules/gameState'
import { GameState, GameSnapshot } from '../config/types'

// Test 1: Verify sub-game completion is saved
function testSubGameSaveCompletion() {
  console.log('\n=== Test 1: Sub-game completion is saved ===')
  
  const state = getInitialState('1')
  state.subGamesCompleted = {
    'hermit-hollow': true,
    'tesseract': true,
    'hermit-hollow:learned_great_power_exists': true,
  }
  
  const snapshot = toSnapshot(state)
  
  console.log('✓ State has subGamesCompleted:', Object.keys(state.subGamesCompleted))
  console.log('✓ Snapshot has subGamesCompleted:', Object.keys(snapshot.subGamesCompleted || {}))
  
  if (!snapshot.subGamesCompleted) {
    console.error('✗ FAIL: snapshot.subGamesCompleted is undefined')
    return false
  }
  
  if (snapshot.subGamesCompleted['hermit-hollow'] !== true) {
    console.error('✗ FAIL: hermit-hollow completion not saved')
    return false
  }
  
  if (snapshot.subGamesCompleted['tesseract'] !== true) {
    console.error('✗ FAIL: tesseract completion not saved')
    return false
  }
  
  console.log('✓ PASS: Sub-game completion is saved correctly')
  return true
}

// Test 2: Verify sub-game completion is restored on load
function testSubGameLoadCompletion() {
  console.log('\n=== Test 2: Sub-game completion is restored on load ===')
  
  const snapshot: GameSnapshot = {
    ...toSnapshot(getInitialState('1')),
    subGamesCompleted: {
      'hermit-hollow': true,
      'tesseract': true,
      'aerowreckagePuzzle': true,
    },
  }
  
  const loadedState = fromSnapshot(snapshot)
  
  console.log('✓ Loaded state has subGamesCompleted:', Object.keys(loadedState.subGamesCompleted || {}))
  
  if (!loadedState.subGamesCompleted) {
    console.error('✗ FAIL: loadedState.subGamesCompleted is undefined')
    return false
  }
  
  if (loadedState.subGamesCompleted['hermit-hollow'] !== true) {
    console.error('✗ FAIL: hermit-hollow completion not restored')
    return false
  }
  
  if (loadedState.subGamesCompleted['tesseract'] !== true) {
    console.error('✗ FAIL: tesseract completion not restored')
    return false
  }
  
  if (loadedState.subGamesCompleted['aerowreckagePuzzle'] !== true) {
    console.error('✗ FAIL: aerowreckagePuzzle completion not restored')
    return false
  }
  
  console.log('✓ PASS: Sub-game completion is restored correctly')
  return true
}

// Test 3: Verify forward compatibility (unknown sub-game keys don't break loading)
function testForwardCompatibility() {
  console.log('\n=== Test 3: Forward compatibility with unknown sub-games ===')
  
  const snapshot: GameSnapshot = {
    ...toSnapshot(getInitialState('1')),
    subGamesCompleted: {
      'hermit-hollow': true,
      'future-subgame-v2': true, // Unknown sub-game
      'future-puzzle-2025': true, // Unknown sub-game
    },
  }
  
  try {
    const loadedState = fromSnapshot(snapshot)
    
    console.log('✓ Loaded state has subGamesCompleted:', Object.keys(loadedState.subGamesCompleted || {}))
    
    if (!loadedState.subGamesCompleted) {
      console.error('✗ FAIL: loadedState.subGamesCompleted is undefined')
      return false
    }
    
    // Verify known sub-game is preserved
    if (loadedState.subGamesCompleted['hermit-hollow'] !== true) {
      console.error('✗ FAIL: known sub-game not preserved')
      return false
    }
    
    // Verify unknown sub-games are preserved
    if (loadedState.subGamesCompleted['future-subgame-v2'] !== true) {
      console.error('✗ FAIL: unknown sub-game not preserved')
      return false
    }
    
    console.log('✓ PASS: Forward compatibility works correctly')
    return true
  } catch (error) {
    console.error('✗ FAIL: Error during load:', error)
    return false
  }
}

// Test 4: Verify missing sub-game data defaults safely
function testMissingSubGameData() {
  console.log('\n=== Test 4: Missing sub-game data defaults safely ===')
  
  const snapshot: GameSnapshot = {
    ...toSnapshot(getInitialState('1')),
    // Intentionally omit subGamesCompleted
  }
  
  // @ts-ignore - Testing runtime behavior
  delete snapshot.subGamesCompleted
  
  const loadedState = fromSnapshot(snapshot)
  
  console.log('✓ Loaded state has subGamesCompleted:', loadedState.subGamesCompleted)
  
  // Should default to empty object, not undefined
  if (loadedState.subGamesCompleted === undefined) {
    console.error('✗ FAIL: subGamesCompleted should not be undefined')
    return false
  }
  
  if (typeof loadedState.subGamesCompleted !== 'object') {
    console.error('✗ FAIL: subGamesCompleted should be an object')
    return false
  }
  
  console.log('✓ PASS: Missing sub-game data defaults safely')
  return true
}

// Run all tests
function runTests() {
  console.log('🧪 Testing Sub-Game Save/Load Functionality')
  console.log('=' .repeat(50))
  
  const results = [
    testSubGameSaveCompletion(),
    testSubGameLoadCompletion(),
    testForwardCompatibility(),
    testMissingSubGameData(),
  ]
  
  const passed = results.filter(Boolean).length
  const total = results.length
  
  console.log('\n' + '='.repeat(50))
  console.log(`Tests: ${passed}/${total} passed`)
  
  if (passed === total) {
    console.log('✅ All tests passed!')
    process.exit(0)
  } else {
    console.log('❌ Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests()
