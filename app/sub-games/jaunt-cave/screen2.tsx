import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { useGameContext } from '@context/GameContext';
import { BattleHUD } from './_components/BattleHUD';
import { BattleHealthBars } from './_components/BattleHealthBars';
import { WeaponsInventoryModal } from './_components/WeaponsInventoryModal';
import { DaemonSprite, PositionKey } from './_components/DaemonSprite';
import { FeedbackMessage } from './_components/FeedbackMessage';
import { ProjectileEffect } from './_components/ProjectileEffect';
import { useBattleState } from './_components/useBattleState';
import { useWeaponInventory } from './_components/useWeaponInventory';

// Landing positions (configurable percentages)
const POSITIONS = {
  left: { x: 0.2, y: 0.37 },
  center: { x: 0.5, y: 0.38 },
  right: { x: 0.8, y: 0.38 },
} as const;

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png');

interface JauntCaveScreen2Props {
  daemonHP?: number;
  maxDaemonHP?: number;
  onDaemonHit?: () => void;
  onDaemonMiss?: () => void;
}

const JauntCaveScreen2: React.FC<JauntCaveScreen2Props> = ({
  daemonHP: initialDaemonHP = 100,
  maxDaemonHP = 100,
  onDaemonHit,
  onDaemonMiss,
}) => {
  const router = useRouter();
  const { state, dispatch } = useGameContext();
  
  // Get real Christos HP from game state
  const christosHP = state.player.currentHP;
  const maxChristosHP = state.player.maxHP;
  const [arenaSize, setArenaSize] = useState<{ width: number; height: number } | null>(null);
  
  // Battle HUD state (feedback only - weapon/inventory state in useWeaponInventory)
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  // Projectile state
  const [projectileFrom, setProjectileFrom] = useState<{ x: number; y: number } | null>(null);
  const [projectileTo, setProjectileTo] = useState<{ x: number; y: number } | null>(null);

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Battle state hook - manages all daemon AI behavior and state machine
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
  } = useBattleState({
    initialDaemonHP,
    maxDaemonHP,
    onDaemonHit,
    onDaemonMiss,
    shakeAnim,
    dispatch,
    currentPlayerHP: state.player.currentHP,
    router,
  });


  
  // Compute background image rect for resizeMode="cover"
  const bgRect = useMemo(() => {
    if (!arenaSize) return null;

    // Get intrinsic dimensions of background image
    const bgSource = Image.resolveAssetSource(BACKGROUND);
    if (!bgSource) return null;

    const imageW = bgSource.width;
    const imageH = bgSource.height;
    const containerW = arenaSize.width;
    const containerH = arenaSize.height;

    // Compute scale for resizeMode="cover" (fills container, may crop)
    const scale = Math.max(containerW / imageW, containerH / imageH);

    const drawW = imageW * scale;
    const drawH = imageH * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;

    return { offsetX, offsetY, drawW, drawH };
  }, [arenaSize]);

  // Helper to compute absolute position for any spawn point
  const getSpawnPosition = useCallback((positionKey: PositionKey) => {
    if (!bgRect) return { x: 0, y: 0 };

    const position = POSITIONS[positionKey];
    const x = bgRect.offsetX + position.x * bgRect.drawW;
    const y = bgRect.offsetY + position.y * bgRect.drawH;

    return { x, y };
  }, [bgRect]);

  // Compute daemon absolute position from percentage
  const daemonPosition = useMemo(() => {
    return getSpawnPosition(currentPosition);
  }, [getSpawnPosition, currentPosition]);

  // Handle arena layout
  const handleArenaLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setArenaSize({ width, height });
    }
  }, []);

  // Weapon inventory hook - manages all weapon/inventory UI state and interactions
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
  } = useWeaponInventory({
    gameState: state,
    dispatch,
    arenaSize,
    bgRect,
    getSpawnPosition,
    onSetFeedback: setFeedbackText,
    onFireProjectile: (from, to) => {
      setProjectileFrom(from);
      setProjectileTo(to);
    },
  });

  // Position for daemon
  const daemonX = daemonPosition.x;
  const daemonY = daemonPosition.y;

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