import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Item } from '@config/types';
import { useBattleState } from './_components/useBattleState';

// Landing positions (configurable percentages)
const POSITIONS = {
  left: { x: 0.2, y: 0.37 },
  center: { x: 0.5, y: 0.38 },
  right: { x: 0.8, y: 0.38 },
} as const;

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png');

const DEFAULT_BOLT_COLOR = '#990000'; // Fallback color when no weapon equipped

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
  
  // Battle HUD state
  const [showInventory, setShowInventory] = useState(false);
  const [isZapMenuOpen, setIsZapMenuOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const zapMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Get ranged weapons from global weapons catalog based on player's ranged weapon inventory IDs
  const rangedWeapons = useMemo(() => {
    const rangedWeaponIds = state.player.rangedWeaponInventoryIds || [];
    return state.weapons.filter(
      (weapon) =>
        weapon.weaponType === 'ranged' && 
        weapon.id !== null && 
        weapon.id !== undefined &&
        rangedWeaponIds.includes(weapon.id)
    );
  }, [state.player.rangedWeaponInventoryIds, state.weapons]);
  
  // Get equipped ranged weapon name for display
  const equippedWeaponName = useMemo(() => {
    if (!state.player.equippedRangedWeaponId) return null;
    const weapon = state.weapons.find((w) => w.id === state.player.equippedRangedWeaponId);
    return weapon ? weapon.name : null;
  }, [state.player.equippedRangedWeaponId, state.weapons]);

  // Get bolt color from equipped weapon
  const boltColor = useMemo(() => {
    if (!state.player.equippedRangedWeaponId) return DEFAULT_BOLT_COLOR;
    const weapon = state.weapons.find((w) => w.id === state.player.equippedRangedWeaponId);
    return weapon?.projectileColor || DEFAULT_BOLT_COLOR;
  }, [state.player.equippedRangedWeaponId, state.weapons]);

  // Position for daemon
  const daemonX = daemonPosition.x;
  const daemonY = daemonPosition.y;

  // Battle HUD handlers
  const handleZapPress = useCallback(() => {
    // Toggle zap menu open/close
    setIsZapMenuOpen((prev) => !prev);
    if (__DEV__) {
      console.log('[JauntCave] Zap menu toggled');
    }
  }, []);

  const handleZapTargetPress = useCallback((target: 'left' | 'center' | 'right') => {
    const targetLabels = {
      left: 'Left',
      center: 'Center',
      right: 'Right',
    };
    
    // Show feedback
    setFeedbackText(`Zap - ${targetLabels[target]}`);
    
    // Clear any existing timer
    if (zapMenuTimerRef.current) {
      clearTimeout(zapMenuTimerRef.current);
    }
    
    // Auto-close zap menu after ~1s
    zapMenuTimerRef.current = setTimeout(() => {
      setIsZapMenuOpen(false);
      zapMenuTimerRef.current = null;
    }, 1000);
    
    // Trigger projectile VFX
    if (arenaSize && bgRect) {
      // Calculate start point (bottom center of arena)
      const startX = arenaSize.width / 2;
      const startY = arenaSize.height - 20;
      
      // Get end point (selected target spawn position)
      const endPosition = getSpawnPosition(target);
      
      // Set projectile state
      setProjectileFrom({ x: startX, y: startY });
      setProjectileTo(endPosition);
    }
    
    if (__DEV__) {
      console.log('[JauntCave] Zap target selected:', target);
    }
  }, [arenaSize, bgRect, getSpawnPosition]);
  
  const handleBlockPress = useCallback(() => {
    // Close zap menu if open
    setIsZapMenuOpen(false);
    
    // Show "Block" feedback
    setFeedbackText('Block');
    
    if (__DEV__) {
      console.log('[JauntCave] Block action triggered');
    }
  }, []);
  
  const handleOpenInventory = useCallback(() => {
    setShowInventory(true);
    if (__DEV__) {
      console.log('[JauntCave] Inventory opened');
    }
  }, []);
  
  const handleCloseInventory = useCallback(() => {
    setShowInventory(false);
  }, []);
  
  const handleSelectWeapon = useCallback((weapon: Item) => {
    if (__DEV__) {
      console.log('[JauntCave] Equip weapon:', weapon.id);
    }
    // Dispatch EQUIP_RANGED_WEAPON action
    if (weapon.id) {
      dispatch({
        type: 'EQUIP_RANGED_WEAPON',
        payload: { id: weapon.id },
      });
    }
    setShowInventory(false);
  }, [dispatch]);
  
  // Cleanup zap menu timer on unmount
  useEffect(() => {
    return () => {
      if (zapMenuTimerRef.current) {
        clearTimeout(zapMenuTimerRef.current);
        zapMenuTimerRef.current = null;
      }
    };
  }, []);

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