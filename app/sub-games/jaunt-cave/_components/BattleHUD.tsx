// app/sub-games/jaunt-cave/_components/BattleHUD.tsx
// Battle-specific HUD component for Jaunt Cave screen2
// This is intentionally duplicated and NOT the shared PlayerHUD

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { subGameTheme } from '../../_shared/subGameTheme';

interface BattleHUDProps {
  onZapPress: () => void;
  onBlockPress: () => void;
  onOpenInventory: () => void;
  isZapMenuOpen: boolean;
  onZapTargetPress: (target: 'left' | 'center' | 'right') => void;
  equippedWeaponName?: string | null;
}

/**
 * Battle HUD with Z/B/I action buttons
 * - Z: Zap (opens target menu for equipped ranged weapon)
 * - B: Block (block with discos)
 * - I: Inventory (open weapons-only inventory)
 */
export function BattleHUD({ 
  onZapPress, 
  onBlockPress, 
  onOpenInventory, 
  isZapMenuOpen,
  onZapTargetPress,
  equippedWeaponName,
}: BattleHUDProps) {
  return (
    <View style={styles.container}>
      {/* Zap Target Menu - appears above main buttons */}
      {isZapMenuOpen && (
        <View style={styles.zapTargetMenu}>
          <Text style={styles.zapTargetLabel}>Select Target:</Text>
          <View style={styles.zapTargetButtons}>
            <TouchableOpacity
              style={styles.zapTargetButton}
              onPress={() => onZapTargetPress('left')}
              activeOpacity={0.7}
            >
              <Text style={styles.zapTargetButtonText}>L</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zapTargetButton}
              onPress={() => onZapTargetPress('center')}
              activeOpacity={0.7}
            >
              <Text style={styles.zapTargetButtonText}>C</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zapTargetButton}
              onPress={() => onZapTargetPress('right')}
              activeOpacity={0.7}
            >
              <Text style={styles.zapTargetButtonText}>R</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Main action buttons */}
      <View style={styles.buttonRow}>
        {/* Zap button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isZapMenuOpen && styles.actionButtonActive,
          ]}
          onPress={onZapPress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Z</Text>
          <Text style={styles.actionButtonLabel}>Zap</Text>
          {equippedWeaponName && (
            <Text style={styles.equippedWeaponText} numberOfLines={1}>
              {equippedWeaponName}
            </Text>
          )}
        </TouchableOpacity>

        {/* Block button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onBlockPress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>B</Text>
          <Text style={styles.actionButtonLabel}>Block</Text>
        </TouchableOpacity>

        {/* Inventory button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpenInventory}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>I</Text>
          <Text style={styles.actionButtonLabel}>Inventory</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  zapTargetMenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    padding: 12,
    marginBottom: 12,
  },
  zapTargetLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  zapTargetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  zapTargetButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: subGameTheme.blue,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.red,
    alignItems: 'center',
  },
  zapTargetButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: subGameTheme.black,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    alignItems: 'center',
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonActive: {
    backgroundColor: subGameTheme.blue,
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.blue,
  },
  actionButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.black,
    marginBottom: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: subGameTheme.black,
  },
  equippedWeaponText: {
    fontSize: 9,
    fontWeight: '500',
    color: subGameTheme.black,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
});
