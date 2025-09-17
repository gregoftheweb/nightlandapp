// modules/combat.ts - Enhanced d20 combat system with all combat logic
import { GameState, Position, Monster } from "../config/types";
import { getTextContent } from "./utils";

// Roll a d20
const rollD20 = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

// ==================== COMBAT UTILITIES ====================

const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};

// ==================== CORE COMBAT ACTIONS ====================

export const executeAttack = (
  attacker: any,
  defender: any,
  dispatch: any,
  showDialog?: (message: string, duration?: number) => void
): boolean => {
  const attackRoll = rollD20();
  const totalAttack = attackRoll + attacker.attack;
  const hit = totalAttack >= defender.ac;

  console.log(`\n🎲 ${attacker.name} attacks ${defender.name}:`);
  console.log(`   Roll: ${attackRoll} + Attack: ${attacker.attack} = ${totalAttack} vs AC: ${defender.ac}`);

  if (hit) {
    const damageRoll = Math.floor(Math.random() * 6) + 1;
    const totalDamage = damageRoll + Math.floor(attacker.attack / 2);
    const newHp = Math.max(0, defender.hp - totalDamage);

    console.log(`   💥 HIT! Damage: ${damageRoll} + ${Math.floor(attacker.attack / 2)} = ${totalDamage}`);
    console.log(`   ${defender.name} HP: ${defender.hp} → ${newHp}`);

    // Create different messages for Christos vs monsters
    let combatMessage = "";
    if (attacker.id === "christos") {
      // Christos attacking - use "the" before monster name
      const monsterName = defender.name || defender.shortName || "enemy";
      combatMessage = `Christos hit the ${monsterName} for ${totalDamage}` + (totalDamage >= 10 ? "!!" : "");
    } else {
      // Monster attacking - keep it simple
      combatMessage = `${attacker.name} hit for ${totalDamage}` + (totalDamage >= 10 ? "!!" : "");
    }

    // Dispatch combat log message
    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: combatMessage },
    });

    // Update HP
    if (defender.id === "christos") {
      dispatch({
        type: "UPDATE_PLAYER",
        payload: { updates: { hp: newHp } },
      });
    } else {
      dispatch({
        type: "UPDATE_MONSTER",
        payload: { id: defender.id, updates: { hp: newHp } },
      });
    }

    // Check if defender is dead
    if (newHp <= 0) {
      console.log(`   💀 ${defender.name} is defeated!`);
      
      // Create different death messages for Christos vs monsters
      let deathMessage = "";
      if (attacker.id === "christos") {
        const monsterName = defender.name || defender.shortName || "enemy";
        deathMessage = `Christos killed the ${monsterName}`;
      } else {
        deathMessage = `${attacker.name} killed ${defender.name}`;
      }
      
      dispatch({
        type: "ADD_COMBAT_LOG",
        payload: { message: deathMessage },
      });

      if (defender.id !== "christos") {
        dispatch({
          type: "REMOVE_MONSTER",
          payload: { id: defender.id },
        });
        return true;
      } else {
        dispatch({ type: "GAME_OVER" });
        return true;
      }
    }
  } else {
    console.log(`   ❌ MISS!`);
    
    // Create different miss messages for Christos vs monsters
    let missMessage = "";
    if (attacker.id === "christos") {
      const monsterName = defender.name || defender.shortName || "enemy";
      missMessage = `Christos missed the ${monsterName}`;
    } else {
      missMessage = `${attacker.name} missed`;
    }
    
    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: missMessage },
    });
  }

  return false;
};

// ==================== COMBAT TURN PROCESSING ====================

export const processCombatTurn = (
  state: GameState,
  dispatch: any,
  showDialog?: (message: string, duration?: number) => void,
  targetId?: string
): void => {
  if (!state.inCombat || !state.attackSlots || state.attackSlots.length === 0) {
    console.log("No combat to process");
    return;
  }

  console.log(`\n⚔️ COMBAT ROUND STARTING (Turn ${state.moveCount + 1})`);
  console.log(`   Player HP: ${state.player.hp}/${state.player.maxHP}`);
  console.log(`   Monsters in combat: ${state.attackSlots.length}`);

  const combatOrder = [state.player, ...state.attackSlots];

  for (const entity of combatOrder) {
    if (entity.hp <= 0) continue;

    if (entity.id === "christos") {
      console.log(`\n👤 ${entity.name}'s turn:`);
      let targetMonster = null;
      if (targetId) {
        targetMonster = state.attackSlots.find((m: any) => m.id === targetId && m.hp > 0);
      }
      if (!targetMonster) {
        targetMonster = state.attackSlots.find((m: any) => m.hp > 0);
      }

      if (targetMonster) {
        const monsterDied = executeAttack(entity, targetMonster, dispatch, showDialog);
        if (monsterDied) {
          const updatedAttackSlots = state.attackSlots.filter((m: any) => m.id !== targetMonster.id);
          dispatch({
            type: "SET_COMBAT",
            payload: {
              ...state,
              attackSlots: updatedAttackSlots,
              inCombat: updatedAttackSlots.length > 0,
            },
          });
        }
      } else {
        console.log(`   No valid target for ${entity.name}'s attack`);
        dispatch({
          type: "ADD_COMBAT_LOG",
          payload: { message: `${entity.name} has no target to attack!` },
        });
      }
    } else {
      console.log(`\n👹 ${entity.name}'s turn:`);
      const playerDied = executeAttack(entity, state.player, dispatch, showDialog);
      if (playerDied) {
        console.log("💀 GAME OVER - Player defeated!");
        return;
      }
    }
  }

  // Move waiting monsters into empty attack slots
  moveWaitingMonstersToAttackSlots(state, dispatch);

  console.log(`\n📊 COMBAT ROUND COMPLETE`);
  console.log(`   Player HP: ${state.player.hp}/${state.player.maxHP}`);
  state.attackSlots.forEach((monster: any) => {
    if (monster.hp > 0) {
      console.log(`   ${monster.name} HP: ${monster.hp}/${monster.maxHP}`);
    }
  });
};

// ==================== COMBAT MANAGEMENT ====================

const moveWaitingMonstersToAttackSlots = (
  state: GameState,
  dispatch: any
): void => {
  const aliveMonsters = state.attackSlots.filter((m: any) => m.hp > 0);
  const availableSlots = (state.maxAttackers || 4) - aliveMonsters.length;
  
  if (availableSlots > 0 && state.waitingMonsters.length > 0) {
    const newAttackSlots = [...aliveMonsters];
    const newWaitingMonsters = [...state.waitingMonsters];
    const slotPositions = [
      { row: state.player.position.row - 1, col: state.player.position.col - 1 },
      { row: state.player.position.row - 1, col: state.player.position.col + 1 },
      { row: state.player.position.row + 1, col: state.player.position.col - 1 },
      { row: state.player.position.row + 1, col: state.player.position.col + 1 },
    ];

    const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0);
    let monstersMoved = 0;

    for (let i = 0; i < newWaitingMonsters.length && monstersMoved < availableSlots; i++) {
      const monster = newWaitingMonsters[i];
      const nextUISlot = [0, 1, 2, 3].find((slot) => !usedUISlots.includes(slot));
      if (nextUISlot !== undefined) {
        const combatMonster = {
          ...monster,
          position: { ...slotPositions[nextUISlot] },
          uiSlot: nextUISlot,
          inCombatSlot: true,
        };
        newAttackSlots.push(combatMonster);
        dispatch({
          type: "MOVE_MONSTER",
          payload: { id: monster.id, position: combatMonster.position },
        });
        console.log(`✅ Monster ${monster.name} moved from waiting to attack slot ${nextUISlot}`);
        dispatch({
          type: "ADD_COMBAT_LOG",
          payload: { message: `${monster.name} joins the combat!` },
        });
        usedUISlots.push(nextUISlot);
        newWaitingMonsters.splice(i, 1);
        i--;
        monstersMoved++;
      }
    }

    dispatch({
      type: "SET_COMBAT",
      payload: {
        ...state,
        attackSlots: newAttackSlots,
        waitingMonsters: newWaitingMonsters,
        turnOrder: [state.player, ...newAttackSlots],
        combatTurn: state.player,
      },
    });
  }
};

export const checkCombatEnd = (
  state: GameState,
  dispatch: any,
  showDialog?: (message: string, duration?: number) => void
): boolean => {
  const aliveMonsters = state.attackSlots?.filter((m: any) => m.hp > 0) || [];

  if (aliveMonsters.length === 0) {
    console.log("🏆 Combat won - all monsters defeated!");
    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: "All enemies defeated!" },
    });
    dispatch({
      type: "SET_COMBAT",
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
    console.log("💀 Combat lost - player defeated!");
    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: "Christos has been defeated!" },
    });
    return true;
  }

  return false;
};

// ==================== COMBAT SETUP AND INITIALIZATION ====================

export const setupCombat = (
  state: GameState,
  dispatch: (action: any) => void,
  monster: Monster,
  playerPosOverride?: Position
): void => {
  console.log(`\n⚔️ SETTING UP COMBAT with ${monster.name}`);
  
  let newAttackSlots = [...(state.attackSlots || [])];
  let newWaitingMonsters = [...(state.waitingMonsters || [])];

  // Define attack slot positions around player
  const slotPositions = [
    { row: state.player.position.row - 1, col: state.player.position.col - 1 }, // Slot 0
    { row: state.player.position.row - 1, col: state.player.position.col + 1 }, // Slot 1
    { row: state.player.position.row + 1, col: state.player.position.col - 1 }, // Slot 2
    { row: state.player.position.row + 1, col: state.player.position.col + 1 }, // Slot 3
  ];

  // Check if monster is already in combat
  if (newAttackSlots.some((slot: any) => slot.id === monster.id)) {
    console.warn(`Monster ${monster.name} already in attack slots`);
    return;
  }

  // Try to add to attack slots
  if (newAttackSlots.length < (state.maxAttackers || 4)) {
    const usedUISlots = newAttackSlots.map((slot: any) => slot.uiSlot || 0);
    const nextUISlot = [0, 1, 2, 3].find(slot => !usedUISlots.includes(slot));
    
    if (nextUISlot !== undefined) {
      const combatMonster = {
        ...monster,
        position: { ...slotPositions[nextUISlot] },
        uiSlot: nextUISlot,
        inCombatSlot: true,
      };
      
      newAttackSlots.push(combatMonster);
      
      dispatch({
        type: "MOVE_MONSTER",
        payload: { id: monster.id, position: combatMonster.position },
      });

      // Add combat log entry
      dispatch({
        type: "ADD_COMBAT_LOG",
        payload: { message: `${monster.name} enters combat!` },
      });

      console.log(`✅ Monster ${monster.name} assigned to attack slot ${nextUISlot}`);
    } else {
      console.warn("No available UI slot for combat monster");
      return;
    }
  } else {
    // Add to waiting monsters
    if (!newWaitingMonsters.some((m: any) => m.id === monster.id)) {
      newWaitingMonsters.push(monster);
      console.log(`Monster ${monster.name} added to waiting queue`);
    }
    return;
  }

  const newTurnOrder = [state.player, ...newAttackSlots];

  const combatPayload = {
    inCombat: true,
    attackSlots: newAttackSlots,
    waitingMonsters: newWaitingMonsters,
    turnOrder: newTurnOrder,
    combatTurn: newTurnOrder[0] || state.player,
  };

  console.log("🎯 Dispatching SET_COMBAT:", combatPayload);
  dispatch({ type: "SET_COMBAT", payload: combatPayload });

  // Add player comment at start of combat if combat just began
  if (!state.inCombat) {
    dispatch({
      type: "ADD_COMBAT_LOG",
      payload: { message: getTextContent("combatStartPlayerComment") },
    });
  }

  // Add monster-specific combat start message
  dispatch({
    type: "ADD_COMBAT_LOG",
    payload: { message: getTextContent("combatStart", [monster.name]) },
  });

  console.log(`⚔️ Combat initiated! ${newAttackSlots.length} monsters in attack slots`);
};

// ==================== COMBAT TURN HANDLER ====================

export const handleCombatTurn = (
  state: GameState,
  dispatch: any,
  action: string,
  targetId?: string,
  showDialog?: (message: string, duration?: number) => void,
  setDeathMessage?: (message: string) => void
): void => {
  if (!state.inCombat) {
    console.warn("handleCombatTurn called but not in combat");
    return;
  }

  console.log(`\n⚔️ PROCESSING COMBAT ACTION: ${action} (target: ${targetId || 'none'})`);

  // Process the full combat round, passing targetId for player attack
  processCombatTurn(state, dispatch, showDialog, targetId);

  // Check if combat has ended
  const combatEnded = checkCombatEnd(state, dispatch, showDialog);

  if (combatEnded) {
    console.log("Combat has ended");
    if (state.player.hp <= 0) {
      setDeathMessage?.("You have been defeated in combat!");
      dispatch({ type: "GAME_OVER" });
    }
  } else {
    console.log("Combat continues...");
  }
};

// ==================== MONSTER MOVEMENT AND COLLISION ====================

export const checkForCombatCollision = (
  state: GameState,
  monster: Monster,
  newPosition: Position,
  playerPos: Position
): boolean => {
  if (checkCollision(newPosition, playerPos)) {
    if (!state.player.isHidden) {
      return true; // Combat should be initiated
    }
  }
  return false;
};