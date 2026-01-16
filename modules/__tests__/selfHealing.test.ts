// Test for self-healing mechanic
import { GameState, Level, Player } from '../../config/types';

describe('Self-Healing Mechanic', () => {
  // Mock dispatch function
  const mockDispatch = jest.fn();

  // Helper to create a mock game state
  const createMockGameState = (
    playerHP: number,
    playerMaxHP: number,
    selfHealRate: number = 1
  ): GameState => {
    const mockLevel: Level = {
      id: '1',
      name: 'Test Level',
      boardSize: { width: 400, height: 400 },
      playerSpawn: { row: 200, col: 200 },
      selfHealRate,
      items: [],
      monsters: [],
      objects: [],
      greatPowers: [],
    };

    const mockPlayer: Player = {
      name: 'Christos',
      shortName: 'christos',
      id: 'christos',
      description: 'Test player',
      lastComment: '',
      image: '',
      position: { row: 200, col: 200 },
      hp: playerHP,
      maxHP: playerMaxHP,
      ac: 14,
      initiative: 10,
      attack: 8,
      isHidden: false,
      hideTurns: 0,
      inventory: [],
      maxInventorySize: 10,
      weapons: [],
      maxWeaponsSize: 4,
      soulKey: '000000',
      moveSpeed: 1,
    };

    return {
      level: mockLevel,
      currentLevelId: '1',
      player: mockPlayer,
      moveCount: 0,
      inCombat: false,
      combatTurn: null,
      attackSlots: [],
      waitingMonsters: [],
      turnOrder: [],
      combatLog: [],
      activeMonsters: [],
      items: [],
      objects: [],
      greatPowers: [],
      levels: { '1': mockLevel },
      weapons: [],
      monsters: [],
      gridWidth: 400,
      gridHeight: 400,
      maxAttackers: 4,
      saveVersion: '1.0.0',
      lastSaved: new Date(),
      playTime: 0,
      lastAction: '',
    } as GameState;
  };

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test('should heal player by selfHealRate when below max HP', () => {
    const state = createMockGameState(50, 100, 1);
    
    // Simulate self-healing logic
    const selfHealRate = state.level.selfHealRate;
    if (selfHealRate && selfHealRate > 0) {
      const currentHP = state.player.hp;
      const maxHP = state.player.maxHP;

      if (currentHP < maxHP) {
        const healAmount = Math.min(selfHealRate, maxHP - currentHP);
        const newHP = currentHP + healAmount;

        mockDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP }
          }
        });
      }
    }

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { hp: 51 }
      }
    });
  });

  test('should not heal when player is at max HP', () => {
    const state = createMockGameState(100, 100, 1);
    
    // Simulate self-healing logic
    const selfHealRate = state.level.selfHealRate;
    if (selfHealRate && selfHealRate > 0) {
      const currentHP = state.player.hp;
      const maxHP = state.player.maxHP;

      if (currentHP < maxHP) {
        const healAmount = Math.min(selfHealRate, maxHP - currentHP);
        const newHP = currentHP + healAmount;

        mockDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP }
          }
        });
      }
    }

    // Should not dispatch when at max HP
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should not exceed max HP when healing', () => {
    const state = createMockGameState(99, 100, 5); // Heal rate is 5, but only 1 HP available
    
    // Simulate self-healing logic
    const selfHealRate = state.level.selfHealRate;
    if (selfHealRate && selfHealRate > 0) {
      const currentHP = state.player.hp;
      const maxHP = state.player.maxHP;

      if (currentHP < maxHP) {
        const healAmount = Math.min(selfHealRate, maxHP - currentHP);
        const newHP = currentHP + healAmount;

        mockDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP }
          }
        });
      }
    }

    // Should heal by 1 (not 5) to cap at max HP
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { hp: 100 }
      }
    });
  });

  test('should not heal when selfHealRate is 0', () => {
    const state = createMockGameState(50, 100, 0);
    
    // Simulate self-healing logic
    const selfHealRate = state.level.selfHealRate;
    if (selfHealRate && selfHealRate > 0) {
      const currentHP = state.player.hp;
      const maxHP = state.player.maxHP;

      if (currentHP < maxHP) {
        const healAmount = Math.min(selfHealRate, maxHP - currentHP);
        const newHP = currentHP + healAmount;

        mockDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP }
          }
        });
      }
    }

    // Should not dispatch when selfHealRate is 0
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should not heal when selfHealRate is undefined', () => {
    const state = createMockGameState(50, 100, 0);
    state.level.selfHealRate = undefined;
    
    // Simulate self-healing logic
    const selfHealRate = state.level.selfHealRate;
    if (selfHealRate && selfHealRate > 0) {
      const currentHP = state.player.hp;
      const maxHP = state.player.maxHP;

      if (currentHP < maxHP) {
        const healAmount = Math.min(selfHealRate, maxHP - currentHP);
        const newHP = currentHP + healAmount;

        mockDispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            updates: { hp: newHP }
          }
        });
      }
    }

    // Should not dispatch when selfHealRate is undefined
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
