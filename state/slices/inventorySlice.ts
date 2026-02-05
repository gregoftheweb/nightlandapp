// state/slices/inventorySlice.ts
import { GameState } from '../../config/types'

export function reduceInventory(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'ADD_TO_INVENTORY':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, action.payload.item],
        },
      }

    case 'REMOVE_FROM_INVENTORY':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: state.player.inventory.filter((item) => item.id !== action.payload.id),
        },
      }

    case 'TOGGLE_INVENTORY':
      return {
        ...state,
        showInventory: !state.showInventory,
        showWeaponsInventory: false,
      }

    default:
      return null
  }
}
