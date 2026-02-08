// app/sub-games/jaunt-cave/_components/BattleHealthBars.tsx
// Vertical health bars for Daemon (left) and Christos (right) in battle

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BattleHealthBarsProps {
  daemonHP: number;
  maxDaemonHP: number;
  christosHP: number;
  maxChristosHP: number;
}

/**
 * Presentational component that renders vertical health bars for both combatants
 * - Left: Daemon HP (red bar)
 * - Right: Christos HP (green bar)
 * Bars fill from bottom to top based on HP percentage
 */
export function BattleHealthBars({
  daemonHP,
  maxDaemonHP,
  christosHP,
  maxChristosHP,
}: BattleHealthBarsProps) {
  return (
    <View style={styles.hud}>
      {/* Daemon HP bar - Left side */}
      <View style={styles.leftHPContainer}>
        <Text style={styles.hpLabel}>Daemon</Text>
        <View style={styles.verticalHPBarBackground}>
          <View
            style={[
              styles.verticalHPBarFill,
              { height: `${(daemonHP / maxDaemonHP) * 100}%` },
              styles.daemonHPFill,
            ]}
          />
        </View>
      </View>

      {/* Christos HP bar - Right side */}
      <View style={styles.rightHPContainer}>
        <View style={styles.verticalHPBarBackground}>
          <View
            style={[
              styles.verticalHPBarFill,
              { height: `${(christosHP / maxChristosHP) * 100}%` },
              styles.christosHPFill,
            ]}
          />
        </View>
        <Text style={styles.hpLabel}>Christos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: '10%', // 10% from top
    paddingBottom: '10%', // 10% from bottom
    zIndex: 200,
    pointerEvents: 'none',
  },
  leftHPContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: 10,
  },
  rightHPContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingRight: 10,
  },
  hpLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  verticalHPBarBackground: {
    width: 12,
    flex: 1, // Stretch to fill available space
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'flex-end',
  },
  verticalHPBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  daemonHPFill: {
    backgroundColor: '#ff4444',
  },
  christosHPFill: {
    backgroundColor: '#44ff44',
  },
});
