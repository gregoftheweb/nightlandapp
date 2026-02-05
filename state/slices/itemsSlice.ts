// state/slices/itemsSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceItems(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'DROP_ITEM': {
      const { item, position } = action.payload

      const updatedInventory = state.player.inventory.filter((invItem) => invItem.id !== item.id)

      const droppedItem = {
        ...item,
        position: { ...position },
        active: true,
        collectible: true,
      }

      return {
        ...state,
        player: {
          ...state.player,
          inventory: updatedInventory,
        },
        items: [...state.items, droppedItem],
      }
    }

    case 'REMOVE_ITEM_FROM_GAMEBOARD':
      logIfDev(
        `Removing item from gameboard: ${action.payload.shortName} from position (${action.payload.position.row}, ${action.payload.position.col})`
      )
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.position?.row === action.payload.position.row &&
              item.position?.col === action.payload.position.col &&
              item.shortName === action.payload.shortName
            )
        ),
      }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.shortName === action.payload.shortName
            ? { ...item, ...action.payload.updates }
            : item
        ),
      }

    case 'UPDATE_OBJECT':
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.shortName === action.payload.shortName ? { ...obj, ...action.payload.updates } : obj
        ),
      }

    default:
      return null
  }
}
