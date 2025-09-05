// modules/combat.ts
import { GameState, Monster, Player } from "../config/types";
import { decodeSoulKey, getAttributeModifier } from "./utils";

export type CombatAction = "PLAYER_ATTACK" | "MONSTER_ATTACK" | "PASS_TURN";

export interface CombatStepResult {
  hit: boolean;
  damage: number;
  actorName: string;
  targetName: string;
  targetHp: number;
}

export class CombatManager {
  constructor(
    private dispatch: (action: any) => void,
    private setLastAction: (action: any) => void
  ) {}

  /**
   * Execute a single combat step for the current turn actor.
   */
  step(state: GameState): CombatStepResult | null {
    if (!state.inCombat || !state.combatTurn) return null;

    const turnActor = state.combatTurn;
    const player: Player = state.player;
    const monsters: Monster[] = state.attackSlots || [];

    const actorIsPlayer = turnActor.name === player.name;
    const target = actorIsPlayer
      ? monsters.find((m) => m.hp > 0)
      : player;

    if (!target) {
      this.dispatch({ type: "ADVANCE_COMBAT_TURN" });
      return null;
    }

    // Roll d20 for attack
    const attackRoll = Math.floor(Math.random() * 20) + 1;

    const actorAttributes = decodeSoulKey(actorIsPlayer ? player.soulKey : turnActor.soulKey);
    const strMod = getAttributeModifier(actorAttributes.str);

    const totalAttack = (actorIsPlayer ? player.attack : turnActor.attack) + strMod + attackRoll;

    // Target AC (player uses dex modifier)
    const targetAC = actorIsPlayer
      ? (target.ac || 10) + (target.soulKey ? getAttributeModifier(decodeSoulKey(target.soulKey).dex) : 0)
      : 10;

    const hit = totalAttack >= targetAC || attackRoll === 20;
    const damage = hit ? Math.max(1, (actorIsPlayer ? player.attack : turnActor.attack) + strMod) : 0;

    // Apply damage
    if (actorIsPlayer && target && "hp" in target) {
      this.dispatch({
        type: "UPDATE_MONSTER_HP",
        payload: { id: target.id, hp: Math.max(0, target.hp - damage) },
      });
    } else if (!actorIsPlayer) {
      this.dispatch({
        type: "UPDATE_PLAYER_HP",
        payload: { hp: Math.max(0, player.hp - damage) },
      });
    }

    // Remove dead monsters
    if (actorIsPlayer && target && target.hp - damage <= 0) {
      this.dispatch({
        type: "REMOVE_MONSTER_FROM_SLOT",
        payload: target.id,
      });
    }

    // Update last action for UI or logging
    this.setLastAction({
      type: actorIsPlayer ? (hit ? "PLAYER_HIT" : "PLAYER_MISS") : (hit ? "ENEMY_HIT" : "ENEMY_MISS"),
      damage,
      actorName: turnActor.name,
      targetName: target.name,
    });

    // Advance turn
    this.dispatch({ type: "ADVANCE_COMBAT_TURN" });

    return {
      hit,
      damage,
      actorName: turnActor.name,
      targetName: target.name,
      targetHp: target.hp - damage,
    };
  }

  /**
   * Handle player passing their turn (no movement, just advance combat)
   */
  passTurn(state: GameState): void {
    if (!state.inCombat) return;
    this.dispatch({ type: "ADVANCE_COMBAT_TURN" });
    this.setLastAction({ type: "PASS_TURN" });
  }

  /**
   * Start combat with a monster (adds it to attack slots)
   */
  startCombat(state: GameState, monster: Monster): void {
    if (!state.attackSlots) state.attackSlots = [];
    if (!state.attackSlots.includes(monster)) {
      state.attackSlots.push(monster);
    }
    this.dispatch({ type: "START_COMBAT", payload: { monster } });
  }

  /**
   * Check if combat is over (player dead or all monsters dead)
   */
  isCombatOver(state: GameState): boolean {
    const playerDead = state.player.hp <= 0;
    const allMonstersDead = (state.attackSlots || []).every((m) => m.hp <= 0);
    return playerDead || allMonstersDead;
  }
}
