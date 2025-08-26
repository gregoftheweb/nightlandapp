// modules/playerUtils.ts
import textContent from "../assets/copy/textcontent";

export const handleMovePlayer = (
  state: any,
  dispatch: (action: any) => void,
  direction: string | null,
  setOverlay: (overlay: any) => void,
  showDialog: (message: string, duration?: number) => void,
  setDeathMessage: (message: string) => void
) => {
  if (state.inCombat) return;

  let isMove = true;
  const currentPosition = { ...state.player.position };
  const newPosition = { ...state.player.position };

  switch (direction) {
    case "up":
      newPosition.row = Math.max(0, currentPosition.row - 1);
      break;
    case "down":
      newPosition.row = Math.min(state.gridHeight - 1, currentPosition.row + 1);
      break;
    case "left":
      newPosition.col = Math.max(0, currentPosition.col - 1);
      break;
    case "right":
      newPosition.col = Math.min(state.gridWidth - 1, currentPosition.col + 1);
      break;
    case "stay":
      break;
    case null:
      return;
    default:
      console.warn(`Unhandled direction: ${direction}`);
      return;
  }
  console.log(
    `Moving player ${direction}: ${currentPosition.row},${currentPosition.col} → ${newPosition.row},${newPosition.col}`
  );

  if (isMove) {
    dispatch({ type: "MOVE_PLAYER", payload: { position: newPosition } });
  }
  const updatedState = {
    ...state,
    player: { ...state.player, position: newPosition },
  };

  const collectibleAtPosition = state.items.find((item: any) => {
    if (!item || !item.active || !item.collectible || !item.position)
      return false;

    const itemRowStart = item.position.row;
    const itemColStart = item.position.col;
    const itemWidth = item.size?.width || 1;
    const itemHeight = item.size?.height || 1;
    const itemRowEnd = itemRowStart + itemHeight - 1;
    const itemColEnd = itemColStart + itemWidth - 1;

    return (
      item.active &&
      item.collectible &&
      newPosition.row >= itemRowStart &&
      newPosition.row <= itemRowEnd &&
      newPosition.col >= itemColStart &&
      newPosition.col <= itemColEnd
    );
  });

  if (collectibleAtPosition?.splash) {
    setOverlay({
      image: collectibleAtPosition.splash.image,
      text: collectibleAtPosition.splash.text,
    });
  }

  if (collectibleAtPosition) {
    if (collectibleAtPosition.type === "weapon") {
      const weapon = state.weapons.find(
        (w: any) => w.id === collectibleAtPosition.weaponId
      );
      if (!weapon) {
        console.warn("Weapon not found:", collectibleAtPosition.weaponId);
        return;
      }
      const weaponEntry = {
        id: weapon.id,
        equipped: false,
      };
      dispatch({ type: "ADD_TO_WEAPONS", payload: { weapon: weaponEntry } });
      showDialog(`Picked up ${weapon.name}!`, 3000);
    } else {
      const item = {
        id: `${collectibleAtPosition.shortName}-${Date.now()}`,
        ...collectibleAtPosition,
      };
      dispatch({ type: "ADD_TO_INVENTORY", payload: { item } });
      showDialog(`Picked up ${item.name}!`, 3000);
    }
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        shortName: collectibleAtPosition.shortName,
        updates: { active: false },
      },
    });
  }

  const objectAtPosition = state.objects.find((obj: any) => {
    if (!obj.active) return false;

    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const objRowStart = obj.position.row + mask.row;
        const objColStart = obj.position.col + mask.col;
        const objRowEnd = objRowStart + (mask.height || 1) - 1;
        const objColEnd = objColStart + (mask.width || 1) - 1;

        return (
          newPosition.row >= objRowStart &&
          newPosition.row <= objRowEnd &&
          newPosition.col >= objColStart &&
          newPosition.col <= objColEnd
        );
      });
    } else {
      const objRowStart = obj.position.row;
      const objColStart = obj.position.col;
      const objWidth = obj.size?.width || 1;
      const objHeight = obj.size?.height || 1;
      const objRowEnd = objRowStart + objHeight - 1;
      const objColEnd = objColStart + objWidth - 1;

      return (
        newPosition.row >= objRowStart &&
        newPosition.row <= objRowEnd &&
        newPosition.col >= objColStart &&
        newPosition.col <= objColEnd
      );
    }
  });

  if (objectAtPosition && objectAtPosition.effects) {
    const now = Date.now();
    const lastTrigger = objectAtPosition.lastTrigger || 0;
    if (now - lastTrigger > 50000) {
      objectAtPosition.effects.forEach((effect: any) => {
        dispatch({
          type: "TRIGGER_EFFECT",
          payload: { effect, position: newPosition },
        });
        switch (effect.type) {
          case "swarm":
            showDialog(
              `A swarm of ${effect.monsterType}s emerges from the ${objectAtPosition.name}!`,
              3000
            );
            dispatch({
              type: "UPDATE_OBJECT",
              payload: {
                shortName: objectAtPosition.shortName,
                updates: { lastTrigger: now },
              },
            });
            break;
          case "hide":
            showDialog(
              `The ${objectAtPosition.name} cloaks you in silence.`,
              3000
            );
            break;
          case "heal":
            showDialog(
              `The ${objectAtPosition.name} restores your strength!`,
              3000
            );
            break;
          default:
            break;
        }
      });
    }
  }
};