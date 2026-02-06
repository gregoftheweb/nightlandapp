// app/sub-games/jaunt-cave/_components/WeaponsInventoryModal.tsx
// Weapons-only inventory modal for battle screen

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { subGameTheme } from '../../_shared/subGameTheme';
import { Item } from '@config/types';

interface WeaponsInventoryModalProps {
  visible: boolean;
  weapons: Item[];
  onClose: () => void;
  onSelectWeapon: (weapon: Item) => void;
}

/**
 * Modal overlay for selecting weapons during battle
 * Displays weapons-only from player inventory
 */
export function WeaponsInventoryModal({
  visible,
  weapons,
  onClose,
  onSelectWeapon,
}: WeaponsInventoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Weapons</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.weaponList}>
            {weapons.length === 0 ? (
              <Text style={styles.emptyText}>No weapons available</Text>
            ) : (
              weapons.map((weapon) => (
                <TouchableOpacity
                  key={weapon.id || weapon.weaponId || weapon.name}
                  style={styles.weaponItem}
                  onPress={() => onSelectWeapon(weapon)}
                  activeOpacity={0.7}
                >
                  <View style={styles.weaponInfo}>
                    <Text style={styles.weaponName}>{weapon.name}</Text>
                    {weapon.description && (
                      <Text style={styles.weaponDescription}>
                        {weapon.description}
                      </Text>
                    )}
                    <View style={styles.weaponStats}>
                      {weapon.damage && (
                        <Text style={styles.weaponStat}>
                          Damage: {weapon.damage}
                        </Text>
                      )}
                      {weapon.weaponType && (
                        <Text style={styles.weaponStat}>
                          Type: {weapon.weaponType}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: subGameTheme.blue,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: subGameTheme.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: subGameTheme.black,
    fontWeight: 'bold',
  },
  weaponList: {
    padding: 20,
  },
  emptyText: {
    color: subGameTheme.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  weaponItem: {
    backgroundColor: subGameTheme.red,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  weaponInfo: {
    gap: 8,
  },
  weaponName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.black,
  },
  weaponDescription: {
    fontSize: 14,
    color: subGameTheme.black,
    opacity: 0.8,
  },
  weaponStats: {
    flexDirection: 'row',
    gap: 12,
  },
  weaponStat: {
    fontSize: 12,
    fontWeight: '600',
    color: subGameTheme.black,
  },
});
