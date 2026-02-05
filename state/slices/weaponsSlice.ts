// state/slices/weaponsSlice.ts
import { GameState } from '../../config/types'
import { logIfDev } from '../../modules/utils'

export function reduceWeapons(state: GameState, action: any): GameState | null {
  switch (action.type) {
    case 'ADD_TO_WEAPONS':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: [...state.player.weapons, action.payload.weapon],
        },
      }

    case 'REMOVE_FROM_WEAPONS':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter((w) => w.id !== action.payload.id),
        },
      }

    case 'EQUIP_WEAPON':
      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.map((w) =>
            w.id === action.payload.id ? { ...w, equipped: true } : { ...w, equipped: false }
          ),
        },
      }

    case 'ADD_RANGED_WEAPON': {
      // Add a ranged weapon to the player's inventory
      const weaponId = action.payload.id

      // Check if weapon is already in inventory
      if (state.player.rangedWeaponInventoryIds.includes(weaponId)) {
        logIfDev(`Weapon ${weaponId} is already in ranged weapon inventory`)
        return state
      }

      return {
        ...state,
        player: {
          ...state.player,
          rangedWeaponInventoryIds: [...state.player.rangedWeaponInventoryIds, weaponId],
        },
      }
    }

    case 'EQUIP_RANGED_WEAPON': {
      // Equip a ranged weapon by ID
      // Only one ranged weapon can be equipped at a time
      const weaponId = action.payload.id

      // Check if the weapon is in the ranged weapon inventory
      if (!state.player.rangedWeaponInventoryIds.includes(weaponId)) {
        logIfDev(`Weapon ${weaponId} not found in ranged weapon inventory`)
        return state
      }

      return {
        ...state,
        player: {
          ...state.player,
          equippedRangedWeaponId: weaponId,
        },
      }
    }

    case 'DROP_WEAPON': {
      const weaponId = action.payload.id
      if (weaponId === 'weapon-discos-001') {
        logIfDev('Cannot drop the Discos!')
        return state
      }

      const weaponDetails = state.weapons.find((w) => w.id === action.payload.id)
      if (!weaponDetails) {
        if (__DEV__) {
          console.warn(`Weapon with ID ${weaponId} not found`)
        }
        return state
      }

      const newWeaponItem = {
        name: weaponDetails.name,
        shortName: weaponDetails.shortName,
        position: { ...state.player.position },
        description: weaponDetails.description,
        active: true,
        collectible: true,
        type: 'weapon' as const,
        weaponId: weaponId,
        category: 'weapon' as const,
      }

      return {
        ...state,
        player: {
          ...state.player,
          weapons: state.player.weapons.filter((w) => w.id !== action.payload.id),
        },
        items: [...state.items, newWeaponItem],
        dropSuccess: true,
      }
    }

    case 'TOGGLE_WEAPONS_INVENTORY':
      return {
        ...state,
        showWeaponsInventory: !state.showWeaponsInventory,
        showInventory: false,
      }

    default:
      return null
  }
}
