// app/sub-games/jaunt-cave/_components/BattleHUD.tsx
// Battle-specific HUD component for Jaunt Cave screen2
// This is intentionally duplicated and NOT the shared PlayerHUD

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { subGameTheme } from '../../_shared/subGameTheme';

interface BattleHUDProps {
  onZap: () => void;
  onBlock: () => void;
  onOpenInventory: () => void;
  isBlocking?: boolean;
}

/**
 * Battle HUD with Z/B/I action buttons
 * - Z: Zap (shoot equipped ranged weapon)
 * - B: Block (block with discos)
 * - I: Inventory (open weapons-only inventory)
 */
export function BattleHUD({ onZap, onBlock, onOpenInventory, isBlocking }: BattleHUDProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {/* Zap button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onZap}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Z</Text>
          <Text style={styles.actionButtonLabel}>Zap</Text>
        </TouchableOpacity>

        {/* Block button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isBlocking && styles.actionButtonActive,
          ]}
          onPress={onBlock}
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
});
