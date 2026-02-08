// app/sub-games/jaunt-cave/_components/BattleHUD.tsx
// Battle-specific HUD component for Jaunt Cave screen2
// This is intentionally duplicated and NOT the shared PlayerHUD

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BattleHUDProps {
  onZapPress: () => void;
  onBlockPress: () => 'success' | 'too_early' | 'too_late';
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
    position: 'absolute',
    bottom: '100%', // Position above the button row
    left: 20,
    right: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#990000',
    padding: 12,
  },
  zapTargetLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#990000',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  zapTargetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  zapTargetButton: {
    minWidth: 60,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#990000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zapTargetButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#990000',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
    minHeight: 70,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#990000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(153, 0, 0, 0.3)',
    borderColor: '#990000',
  },
  actionButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#990000',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#990000',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  equippedWeaponText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#990000',
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
});
