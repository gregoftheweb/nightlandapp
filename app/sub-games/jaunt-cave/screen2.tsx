import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { useGameContext } from '@context/GameContext';
import { BattleHUD } from './_components/BattleHUD';
import { BattleHealthBars } from './_components/BattleHealthBars';
import { WeaponsInventoryModal } from './_components/WeaponsInventoryModal';
import { DaemonSprite } from './_components/DaemonSprite';
import { FeedbackMessage } from './_components/FeedbackMessage';
import { ProjectileEffect } from './_components/ProjectileEffect';
import { HitIndicator } from './_components/HitIndicator';
import { useBattleState } from './_components/useBattleState';
import { useWeapon, ZAP_TARGETS } from './_components/useWeapon';
import { useArenaLayout } from './_components/useArenaLayout';

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png');

// Projectile duration constant (from ProjectileEffect component)
const PROJECTILE_DURATION = 250; // ms

/**
 * Props for the Jaunt Cave Screen 2 component
 * 
 * @property {number} daemonHP - Initial health points for the daemon (default: 100)
 * @property {number} maxDaemonHP - Maximum health points for the daemon (default: 100)
 * @property {() => void} onDaemonHit - Optional callback when daemon is successfully hit
 * @property {() => void} onDaemonMiss - Optional callback when attack misses the daemon
 */
interface JauntCaveScreen2Props {
  daemonHP?: number;
  maxDaemonHP?: number;
  onDaemonHit?: () => void;
  onDaemonMiss?: () => void;
}

/**
 * Jaunt Cave Screen 2 - Battle with teleporting daemon
 * 
 * This component orchestrates the battle sequence by combining specialized hooks
 * and components. The daemon teleports between positions, attacks, and can be
 * targeted with ranged weapons during its vulnerable state.
 * 
 * Architecture:
 * - useBattleState: Manages daemon AI state machine and battle logic
 * - useArenaLayout: Handles all arena sizing and positioning calculations
 * - useWeapon: Manages weapon selection and projectile firing
 * - Render components: DaemonSprite, ProjectileEffect, BattleHealthBars, BattleHUD
 * 
 * @param {JauntCaveScreen2Props} props - Component props
 */
const JauntCaveScreen2: React.FC<JauntCaveScreen2Props> = ({
  daemonHP: initialDaemonHP = 100,
  maxDaemonHP = 100,
  onDaemonHit,
  onDaemonMiss,
}) => {
  const router = useRouter();
  
  // Game context - provides global game state and dispatch for updates
  const { state, dispatch } = useGameContext();
  
  // Get real Christos HP from game state
  const christosHP = state.player.currentHP;
  const maxChristosHP = state.player.maxHP;
  
  // Feedback message state - displays temporary battle feedback to player
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  // Debug target visualization state
  // Note: setShowDebugTargets available for runtime toggling if needed
  const [showDebugTargets, setShowDebugTargets] = useState(__DEV__);

  // Projectile animation state - tracks start and end positions for projectile effects
  const [projectileFrom, setProjectileFrom] = useState<{ x: number; y: number } | null>(null);
  const [projectileTo, setProjectileTo] = useState<{ x: number; y: number } | null>(null);

  // Animation ref - shake effect when player takes damage
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Battle state machine - manages daemon AI, state transitions, and battle logic
  const battleState = useBattleState({
    initialDaemonHP,
    maxDaemonHP,
    onDaemonHit,
    onDaemonMiss,
    shakeAnim,
    dispatch,
    currentPlayerHP: state.player.currentHP,
    router,
  });

  const {
    daemonState,
    currentPosition,
    attackDirection,
    previousState,
    isCrossfading,
    daemonHP,
    handleDaemonTap,
    isVulnerable,
    isAttacking,
  } = battleState;

  // Arena layout and positioning - calculates daemon position and arena dimensions
  const {
    arenaSize,
    bgRect,
    daemonX,
    daemonY,
    handleArenaLayout,
    getSpawnPosition,
  } = useArenaLayout({
    backgroundImage: BACKGROUND,
    currentPosition,
  });

  // Helper function to get equipped weapon damage
  const getEquippedWeaponDamage = useCallback(() => {
    if (!state.player.equippedRangedWeaponId) return null;
    const weapon = state.weapons.find((w) => w.id === state.player.equippedRangedWeaponId);
    if (!weapon?.damage) return null;
    // Use weapon damage as base, with ±20% variance
    const min = Math.max(1, Math.floor(weapon.damage * 0.8));
    const max = Math.ceil(weapon.damage * 1.2);
    return { min, max };
  }, [state.player.equippedRangedWeaponId, state.weapons]);

  // Weapon management - handles weapon selection, zap menu, and projectile firing
  const {
    showInventory,
    isZapMenuOpen,
    rangedWeapons,
    equippedWeaponName,
    boltColor,
    handleZapPress,
    handleZapTargetPress,
    handleOpenInventory,
    handleCloseInventory,
    handleSelectWeapon,
    closeZapMenu,
    hitIndicator,
  } = useWeapon({
    gameState: state,
    dispatch,
    arenaSize,
    onSetFeedback: setFeedbackText,
    onFireProjectile: (from, to) => {
      setProjectileFrom(from);
      setProjectileTo(to);
    },
    getDaemonState: () => daemonState,
    getCurrentDaemonPosition: () => currentPosition,
    getEquippedWeaponDamage,
    onDaemonHit: battleState.applyPlayerDamage,
    projectileDuration: PROJECTILE_DURATION,
  });

  // Block action handler
  const handleBlockPress = useCallback(() => {
    // Close zap menu if open
    closeZapMenu();
    
    // Show "Block" feedback
    setFeedbackText('Block');
    
    if (__DEV__) {
      console.log('[JauntCave] Block action triggered');
    }
  }, [closeZapMenu]);

  return (
    <BackgroundImage source={BACKGROUND} overlayOpacity={0}>
      <View style={styles.container} onLayout={handleArenaLayout}>
        {/* Shake container for attack effect */}
        <Animated.View
          style={[
            styles.gameContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {/* Daemon sprite - handles all daemon rendering and animations */}
          {bgRect && (
            <DaemonSprite
              daemonState={daemonState}
              currentPosition={currentPosition}
              attackDirection={attackDirection}
              previousState={previousState}
              isCrossfading={isCrossfading}
              daemonX={daemonX}
              daemonY={daemonY}
              arenaSize={arenaSize}
              isVulnerable={isVulnerable}
              isAttacking={isAttacking}
              onDaemonTap={handleDaemonTap}
            />
          )}
        </Animated.View>

        {/* Projectile Effect */}
        <ProjectileEffect
          from={projectileFrom}
          to={projectileTo}
          color={boltColor}
          onComplete={() => {
            setProjectileFrom(null);
            setProjectileTo(null);
          }}
        />

        {/* Hit Indicator */}
        <HitIndicator
          position={hitIndicator?.position ?? null}
          type={hitIndicator?.type ?? 'block'}
        />

        {/* Debug target visualization */}
        {showDebugTargets && arenaSize && (
          <>
            {Object.entries(ZAP_TARGETS).map(([key, targetPos]) => (
              <View
                key={key}
                style={{
                  position: 'absolute',
                  left: arenaSize.width * targetPos.x - 10,
                  top: arenaSize.height * targetPos.y - 10,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#00ff00',
                  zIndex: 999,
                }}
              />
            ))}
          </>
        )}

        {/* HUD - Vertical Health Bars */}
        <BattleHealthBars
          daemonHP={daemonHP}
          maxDaemonHP={maxDaemonHP}
          christosHP={christosHP}
          maxChristosHP={maxChristosHP}
        />
      </View>

      <BottomActionBar>
        <BattleHUD
          onZapPress={handleZapPress}
          onBlockPress={handleBlockPress}
          onOpenInventory={handleOpenInventory}
          isZapMenuOpen={isZapMenuOpen}
          onZapTargetPress={handleZapTargetPress}
          equippedWeaponName={equippedWeaponName}
        />
      </BottomActionBar>
      
      {/* Feedback message box */}
      <FeedbackMessage 
        message={feedbackText} 
        onDismiss={() => setFeedbackText(null)} 
      />
      
      {/* Weapons inventory modal */}
      <WeaponsInventoryModal
        visible={showInventory}
        weapons={rangedWeapons}
        onClose={handleCloseInventory}
        onSelectWeapon={handleSelectWeapon}
        equippedWeaponId={state.player.equippedRangedWeaponId}
      />
    </BackgroundImage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContainer: {
    flex: 1,
  },
});

export default JauntCaveScreen2;