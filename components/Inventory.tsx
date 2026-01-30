import React, { useMemo, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  ScrollView,
} from 'react-native'
import { Item } from '@/config/types'
import { useGameContext } from '../context/GameContext'
import { applyItem, canUseItem } from '@/modules/effects' // <-- renamed from useItem

const { width, height } = Dimensions.get('window')

type TabType = 'items' | 'weapons'

interface InventoryProps {
  visible: boolean
  onClose: () => void
  inventory: Item[]
  showDialog?: (message: string, duration?: number) => void
}

export default function Inventory({ visible, onClose, inventory, showDialog }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('items')
  const { state, dispatch } = useGameContext()

  const handleClosePress = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      event.stopPropagation()
      onClose()
    },
    [onClose]
  )

  const handleDrop = useCallback(
    (item: Item) => {
      if (__DEV__) console.log('Dropping item:', item.name)

      dispatch({
        type: 'DROP_ITEM',
        payload: {
          item,
          position: { ...state.player.position },
        },
      })
    },
    [dispatch, state.player.position]
  )

  const handleUse = useCallback(
    (item: Item) => {
      if (__DEV__) console.log('Using item:', item.name)

      // Check if item can be used
      if (!canUseItem(item)) {
        showDialog?.(`${item.name} cannot be used.`, 2000)
        return
      }

      // Use the item through the unified effects system
      // NOTE: applyItem is a normal function; it is NOT a React hook
      const result = applyItem(item, state, dispatch, showDialog)

      if (result.success) {
        if (result.consumeItem) {
          dispatch({
            type: 'REMOVE_FROM_INVENTORY',
            payload: { id: item.id },
          })
          if (__DEV__) console.log(`Consumed item: ${item.name}`)
        }
      } else {
        showDialog?.(result.message, 2000)
      }
    },
    [dispatch, showDialog, state]
  )

  const handleEquip = useCallback((item: Item) => {
    if (__DEV__) console.log('Equip weapon:', item.name)
    // TODO: Implement equip functionality
  }, [])

  const handleEquipRangedWeapon = useCallback(
    (weaponId: string) => {
      if (__DEV__) console.log('Equipping ranged weapon:', weaponId)
      dispatch({
        type: 'EQUIP_RANGED_WEAPON',
        payload: { id: weaponId },
      })
    },
    [dispatch]
  )

  const rangedWeapons = useMemo(() => {
    const rangedWeaponIds = state.player.rangedWeaponInventoryIds || []
    return state.weapons.filter(
      (weapon) =>
        weapon.weaponType === 'ranged' && weapon.id != null && rangedWeaponIds.includes(weapon.id)
    )
  }, [state.player.rangedWeaponInventoryIds, state.weapons])

  const renderWeaponRow = useCallback(
    (weapon: Item, index: number) => {
      const isEquipped = weapon.id === state.player.equippedRangedWeaponId

      return (
        <View key={`${weapon.id}_${index}`} style={styles.inventoryItem}>
          <Text style={[styles.itemName, isEquipped && styles.equippedWeaponName]}>
            {weapon.name}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isEquipped && styles.disabledButton]}
              onPress={() => handleEquipRangedWeapon(weapon.id!)}
              activeOpacity={isEquipped ? 1 : 0.7}
              disabled={isEquipped}
            >
              <Text style={[styles.actionButtonText, isEquipped && styles.disabledButtonText]}>
                {isEquipped ? 'equipped' : 'equip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    },
    [handleEquipRangedWeapon, state.player.equippedRangedWeaponId]
  )

  const renderInventoryItem = useCallback(
    (item: Item, index: number) => {
      const isWeapon = item.type === 'weapon'
      const isUsable = canUseItem(item)

      return (
        <View key={`${item.id || item.shortName}_${index}`} style={styles.inventoryItem}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDrop(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>drop</Text>
            </TouchableOpacity>

            <Text style={styles.separator}>|</Text>

            <TouchableOpacity
              style={[styles.actionButton, !isUsable && styles.disabledButton]}
              onPress={() => handleUse(item)}
              activeOpacity={isUsable ? 0.7 : 1}
              disabled={!isUsable}
            >
              <Text style={[styles.actionButtonText, !isUsable && styles.disabledButtonText]}>
                use
              </Text>
            </TouchableOpacity>

            {isWeapon && (
              <>
                <Text style={styles.separator}>|</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEquip(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>equip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )
    },
    [handleDrop, handleEquip, handleUse]
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} onTouchStart={(event) => event.stopPropagation()}>
        <View style={styles.inventoryContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Inventory</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePress}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'items' && styles.activeTab]}
              onPress={() => setActiveTab('items')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
                Items
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'weapons' && styles.activeTab]}
              onPress={() => setActiveTab('weapons')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'weapons' && styles.activeTabText]}>
                Weapons
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {activeTab === 'items' ? (
                inventory.length === 0 ? (
                  <Text style={styles.emptyInventoryText}>Your inventory is empty</Text>
                ) : (
                  inventory.map(renderInventoryItem)
                )
              ) : rangedWeapons.length === 0 ? (
                <Text style={styles.emptyInventoryText}>No ranged weapons in inventory</Text>
              ) : (
                rangedWeapons.map(renderWeaponRow)
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryContainer: {
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#990000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#990000',
  },
  closeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(153, 0, 0, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: '#990000',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  equippedWeaponName: {
    color: '#990000',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    color: '#990000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(153, 0, 0, 0.5)',
  },
  separator: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
    marginHorizontal: 4,
  },
  emptyInventoryText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
})
