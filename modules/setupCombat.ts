// modules/setupCombat.ts
import { GameState, Monster } from "../config/types";
import { isAdjacentToPlayer } from "./monsterUtils";

export const MAX_ATTACK_SLOTS = 3;

/**
 * Initializes combat if any monsters are adjacent to the player.
 * Assigns monsters to attack slots (max 3) and queues the rest in waitingMonsters.
 */
export function setupCombat(
  state: GameState,
  dispatch: (action: any) => void
) {
  if (state.inCombat) return; // already in combat

  const adjacentMonsters = state.activeMonsters.filter((m: Monster) =>
    isAdjacentToPlayer(m, state.player.position)
  );

  if (adjacentMonsters.length === 0) return; // no combat triggered

  const attackSlots: Monster[] = [];
  const waitingMonsters: Monster[] = [];

  adjacentMonsters.forEach((monster, i) => {
    if (i < MAX_ATTACK_SLOTS) {
      attackSlots.push(monster);

      // Assign monster to a combat slot
      dispatch({
        type: "SET_MONSTER_COMBAT_SLOT",
        payload: { monsterId: monster.id, slotIndex: i },
      });
    } else {
      waitingMonsters.push(monster);
    }
  });

  // Build initial turn order: player always goes first
  const turnOrder = ["player", ...attackSlots.map((m) => m.id)];
  const combatTurn = 0;

  // Initialize combat state
  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: true,
      attackSlots,
      waitingMonsters,
      turnOrder,
      combatTurn,
    },
  });

  // Keep waiting list synced
  dispatch({
    type: "UPDATE_WAITING_MONSTERS",
    payload: waitingMonsters,
  });

  console.log("⚔️ Combat setup complete", {
    slots: attackSlots.map((m) => m.name),
    waiting: waitingMonsters.map((m) => m.name),
    turnOrder,
  });
}
