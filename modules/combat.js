// /modules/combat.ts
import { moveMonsters, checkMonsterSpawn } from "./gameLoop";
import * as textContent from "../assets/copy/textcontent";
import { initialState } from "./gameState";
import { decodeSoulKey, getAttributeModifier } from "./utils"; // Add import

export const combatStep = (state, dispatch, setLastAction = () => {}) => {
  let newTurnOrder = [state.player, ...state.attackSlots];
  let newCombatTurn = state.combatTurn;
  let newAttackSlots = [...state.attackSlots];
  let newWaitingMonsters = [...state.waitingMonsters];

  const rollD20Attack = (attacker, target) => {
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackerAttrs = decodeSoulKey(attacker.soulKey);
    const strMod = getAttributeModifier(attackerAttrs.str);
    let attackBonus = attacker.attack; // Default for monsters or unarmed
    let toHitBonus = 0; // Default to 0
    let weapon = null;

    // If Christos, find equipped weapon from state.weapons
    if (attacker.name === "Christos" && attacker.weapons) {
      const equippedWeaponId = attacker.weapons.find((w) => w.equipped)?.id;
      weapon = equippedWeaponId
        ? state.weapons.find((w) => w.id === equippedWeaponId)
        : null;
      if (weapon) {
        attackBonus = weapon.attack;
        toHitBonus = weapon.toHit || 0; // Use weapon's toHit, default to 0
      } else {
        attackBonus = attacker.attack; // Unarmed fallback
      }
    }

    const totalAttack = attackRoll + attackBonus + strMod + toHitBonus;
    const isCrit = attackRoll === 20;

    const targetAttrs = decodeSoulKey(target.soulKey);
    const targetDexMod = getAttributeModifier(targetAttrs.dex);
    const effectiveAC = target.ac + targetDexMod;

    console.log(
      `${attacker.name} rolls ${attackRoll} + ${attackBonus} + STR ${strMod} + ToHit ${toHitBonus} = ${totalAttack} vs ${
        target.name
      }'s AC ${effectiveAC} (Base ${target.ac} + DEX ${targetDexMod})${isCrit ? " (CRIT)" : ""}`
    );
    return { hit: totalAttack >= effectiveAC || isCrit, isCrit, weapon };
  };

  if (state.player.isHidden) {
    if (state.combatTurn && state.combatTurn.name === state.player.name) {
      const target = newAttackSlots[0];
      if (target) {
        const { hit, isCrit, weapon } = rollD20Attack(state.player, target);
        if (hit) {
          const attackerAttrs = decodeSoulKey(state.player.soulKey);
          const strengthMod = getAttributeModifier(attackerAttrs.str);
          const equippedWeapon = weapon || { damage: { min: 1, max: 4 } }; // Unarmed fallback
          const baseDamage = Math.floor(
            Math.random() * (equippedWeapon.damage.max - equippedWeapon.damage.min + 1)
          ) + equippedWeapon.damage.min;
          const rawDamage = (isCrit ? baseDamage * 2 : baseDamage) + strengthMod;
          const damage = Math.max(1, rawDamage);
          console.log(`Player Damage: Base ${baseDamage} + STR ${strengthMod} = ${rawDamage} == ${damage})`);
          const newHP = Math.max(0, target.hp - damage);
          setLastAction({
            type: "PLAYER_HIT",
            damage,
            message: isCrit ? "Critical Hit!" : undefined,
          });
          if (newHP <= 0) {
            setLastAction({ type: "ENEMY_DEATH" });
          }
          newAttackSlots = newAttackSlots.map((slot) =>
            slot.id === target.id ? { ...slot, hp: newHP } : slot
          );
          dispatch({
            type: "UPDATE_MONSTER_HP",
            payload: { id: target.id, hp: newHP },
          });
        } else {
          setLastAction({ type: "PLAYER_MISS" });
        }
      }
      newCombatTurn = newAttackSlots.length > 0 ? newAttackSlots[0] : null;
    } else {
      setLastAction({ type: "ENEMY_SKIP", message: "The enemy cannot find you!" });
      newCombatTurn = state.player;
    }
  } else {
    if (
      state.combatTurn === null ||
      (state.combatTurn && state.combatTurn.name === state.player.name)
    ) {
      const target = newAttackSlots[0];
      if (target) {
        const { hit, isCrit, weapon } = rollD20Attack(state.player, target);
        if (hit) {
          const attackerAttrs = decodeSoulKey(state.player.soulKey);
          const strMod = getAttributeModifier(attackerAttrs.str);
          const equippedWeapon = weapon || { damage: { min: 1, max: 4 } }; // Unarmed fallback
          const baseDamage = Math.floor(
            Math.random() * (equippedWeapon.damage.max - equippedWeapon.damage.min + 1)
          ) + equippedWeapon.damage.min;
          const rawDamage = (isCrit ? baseDamage * 2 : baseDamage) + strMod;
          const damage = Math.max(1, rawDamage);
          console.log(`Player Damage: Base ${baseDamage} + STR ${strMod} = ${rawDamage} == ${damage}`);
          const newHP = Math.max(0, target.hp - damage);
          setLastAction({
            type: "PLAYER_HIT",
            damage,
            message: isCrit ? "Critical Hit!" : undefined,
          });
          if (newHP <= 0) {
            setLastAction({ type: "ENEMY_DEATH" });
          }
          newAttackSlots = newAttackSlots.map((slot) =>
            slot.id === target.id ? { ...slot, hp: newHP } : slot
          );
          dispatch({
            type: "UPDATE_MONSTER_HP",
            payload: { id: target.id, hp: newHP },
          });
        } else {
          setLastAction({ type: "PLAYER_MISS" });
        }
      }
      newCombatTurn = newAttackSlots.length > 0 ? newAttackSlots[0] : null;
    } else {
      const enemy = newAttackSlots.find((e) => e === state.combatTurn);
      if (enemy && enemy.hp > 0) {
        const { hit, isCrit } = rollD20Attack(enemy, state.player);
        if (hit) {
          const attackerAttrs = decodeSoulKey(enemy.soulKey);
          const strMod = getAttributeModifier(attackerAttrs.str);
          const baseDamage = Math.floor(Math.random() * enemy.attack) + 1;
          const rawDamage = (isCrit ? baseDamage * 2 : baseDamage) + strMod;
          const damage = Math.max(1, rawDamage);
          console.log(`Enemy Damage: Base ${baseDamage} + STR ${strMod} = ${rawDamage} (Clamped to ${damage})`);
          const newPlayerHP = Math.max(0, state.player.hp - damage);
          setLastAction({
            type: "ENEMY_HIT",
            damage,
            message: isCrit ? "Critical Hit!" : undefined,
          });
          if (newPlayerHP <= 0) {
            const deathMessageKey = `combatChristosDeath${enemy.shortName}`;
            const deathMessage = textContent[deathMessageKey] || textContent.combatChristosDeathDefault;
            setLastAction({ type: "PLAYER_DEATH", message: deathMessage });
          }
          dispatch({ type: "UPDATE_PLAYER_HP", payload: { hp: newPlayerHP } });
          if (newPlayerHP <= 0) {
            resetChristos(state, dispatch);
            return;
          }
        } else {
          setLastAction({ type: "ENEMY_MISS" });
        }
      }

      const currentIndex = newAttackSlots.indexOf(state.combatTurn);
      const nextIndex = currentIndex + 1;
      if (nextIndex < newAttackSlots.length) {
        newCombatTurn = newAttackSlots[nextIndex];
      } else {
        newCombatTurn = state.player;
      }
    }
  }
  // Clean up dead monsters
  const deadMonsterIds = newAttackSlots
    .filter((slot) => slot.hp <= 0)
    .map((slot) => slot.id);
  newAttackSlots = newAttackSlots.filter((slot) => slot.hp > 0);
  const updatedActiveMonsters = state.activeMonsters.filter(
    (m) => !deadMonsterIds.includes(m.id)
  );
  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: {
      activeMonsters: updatedActiveMonsters.map(
        (m) => newAttackSlots.find((slot) => slot.id === m.id) || m
      ),
    },
  });

  if (newAttackSlots.length !== state.attackSlots.length) {
    newTurnOrder = [state.player, ...newAttackSlots];
  }

  const combatContinues = newAttackSlots.length > 0;

  const { updatedAttackSlots, updatedWaitingMonsters } = moveWaitingMonsters(
    state,
    dispatch,
    newAttackSlots,
    newWaitingMonsters
  );
  newAttackSlots = updatedAttackSlots;
  newWaitingMonsters = updatedWaitingMonsters;

  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: combatContinues,
      attackSlots: newAttackSlots,
      waitingMonsters: newWaitingMonsters,
      turnOrder: newTurnOrder,
      combatTurn: newCombatTurn,
    },
  });

  const newMoveCount = state.moveCount + 1;
  dispatch({ type: "UPDATE_MOVE_COUNT", payload: { moveCount: newMoveCount } });
  checkMonsterSpawn(
    { ...state, moveCount: newMoveCount },
    dispatch,
    (msg) => {}
  );

  const isFullTurnComplete = newCombatTurn === state.player;
  if (isFullTurnComplete && combatContinues) {
    const showDialog = (msg) => {};
    moveMonsters(
      {
        ...state,
        attackSlots: newAttackSlots,
        waitingMonsters: newWaitingMonsters,
        inCombat: false,
      },
      dispatch,
      showDialog
    );
  }
};

const moveWaitingMonsters = (state, dispatch, attackSlots, waitingMonsters) => {
  if (!waitingMonsters || !Array.isArray(waitingMonsters)) {
    return {
      updatedAttackSlots: attackSlots,
      updatedWaitingMonsters: waitingMonsters,
    };
  }

  const availableSlots = state.maxAttackers - attackSlots.length;
  if (availableSlots <= 0 || waitingMonsters.length === 0) {
    return {
      updatedAttackSlots: attackSlots,
      updatedWaitingMonsters: waitingMonsters,
    };
  }

  const playerPos = state.player.position;
  const slotPositions = [
    { row: playerPos.row - 1, col: playerPos.col - 1 },
    { row: playerPos.row - 1, col: playerPos.col + 1 },
    { row: playerPos.row + 1, col: playerPos.col - 1 },
    { row: playerPos.row + 1, col: playerPos.col + 1 },
  ];

  let newAttackSlots = [...attackSlots];
  let newWaitingMonsters = [...waitingMonsters];

  waitingMonsters.slice(0, availableSlots).forEach((monster, index) => {
    const newPosition = slotPositions[(attackSlots.length + index) % 4];
    newAttackSlots.push({
      ...monster,
      position: newPosition,
      uiSlot: attackSlots.length + index,
    });
    newWaitingMonsters = newWaitingMonsters.filter((m) => m.id !== monster.id);

    const updatedActiveMonsters = state.activeMonsters.map((m) =>
      m.id === monster.id ? { ...m, position: newPosition } : m
    );
    dispatch({
      type: "UPDATE_ACTIVE_MONSTERS",
      payload: {
        activeMonsters: updatedActiveMonsters.map(
          (m) => newAttackSlots.find((slot) => slot.id === m.id) || m
        ),
      },
    });
  });

  return {
    updatedAttackSlots: newAttackSlots,
    updatedWaitingMonsters: newWaitingMonsters,
  };
};

export const resetChristos = (state, dispatch) => {
  dispatch({
    type: "UPDATE_PLAYER_HP",
    payload: { hp: initialState.player.hp },
  });
  dispatch({
    type: "MOVE_PLAYER",
    payload: { position: { row: 395, col: 200 } },
  });
  dispatch({
    type: "SET_COMBAT",
    payload: {
      inCombat: false,
      attackSlots: [],
      waitingMonsters: [],
      turnOrder: [],
      combatTurn: null,
    },
  });
  dispatch({
    type: "UPDATE_ACTIVE_MONSTERS",
    payload: { activeMonsters: [] },
  });
  dispatch({
    type: "UPDATE_MOVE_COUNT",
    payload: { moveCount: 0 },
  });
};
