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
import { DaemonSprite, DaemonState, PositionKey } from './_components/DaemonSprite';
import { FeedbackMessage } from './_components/FeedbackMessage';
import { Item } from '@config/types';

// Landing positions (configurable percentages)
const POSITIONS = {
  left: { x: 0.2, y: 0.37 },
  center: { x: 0.5, y: 0.38 },
  right: { x: 0.8, y: 0.38 },
} as const;

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png');

// Combat helpers
const rollToHit = (): boolean => {
  return Math.random() < 0.8; // 80% hit chance
};

const rollDamage = (): number => {
  return Math.floor(Math.random() * 16) + 10; // 10-25 inclusive
};

// Timing constants (in milliseconds)
const TIMINGS = {
  RESTING_MIN: 3000,
  RESTING_MAX: 7000,
  PREP1: 500,
  PREP2: 200,
  LANDED: 800,
  ATTACK: 750,
  TRANSITION_TO_RESTING: 400,
};

// Beam VFX constants
const BEAM_HOLD_DURATION = 200; // How long beam stays at full opacity (ms)
const BEAM_FADEOUT_DURATION = 300; // How long beam takes to fade out (ms)
const BEAM_THICKNESS = 8; // Thickness of main beam in pixels
const BEAM_GLOW_MULTIPLIER = 2; // Glow effect is 2x thicker than main beam
const DEFAULT_BOLT_COLOR = '#990000'; // Fallback color when no weapon equipped

interface JauntCaveScreen2Props {
  daemonHP?: number;
  maxDaemonHP?: number;
  onDaemonHit?: () => void;
  onDaemonMiss?: () => void;
}

const JauntCaveScreen2: React.FC<JauntCaveScreen2Props> = ({
  daemonHP = 100,
  maxDaemonHP = 100,
  onDaemonHit,
  onDaemonMiss,
}) => {
  const router = useRouter();
  const { state, dispatch } = useGameContext();
  
  // Get real Christos HP from game state
  const christosHP = state.player.currentHP;
  const maxChristosHP = state.player.maxHP;
  const [daemonState, setDaemonState] = useState<DaemonState>(DaemonState.RESTING);
  const [currentPosition, setCurrentPosition] = useState<PositionKey>('center');
  const [attackDirection, setAttackDirection] = useState<'left' | 'right'>('left');
  const [previousState, setPreviousState] = useState<DaemonState>(DaemonState.RESTING);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [arenaSize, setArenaSize] = useState<{ width: number; height: number } | null>(null);
  
  // Single timer ref - THIS IS CRITICAL
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<PositionKey>('center');
  const isRunningRef = useRef(false);
  
  // Track current HP in a ref to avoid stale state reads
  // This prevents HP from appearing to increase when multiple attacks happen before re-render
  const currentHPRef = useRef<number>(state.player.currentHP);
  
  // Battle HUD state
  const [showInventory, setShowInventory] = useState(false);
  const [isZapMenuOpen, setIsZapMenuOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const zapMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Beam state
  const [beamFrom, setBeamFrom] = useState<{ x: number; y: number } | null>(null);
  const [beamTo, setBeamTo] = useState<{ x: number; y: number } | null>(null);
  const [beamColor, setBeamColor] = useState<string>(DEFAULT_BOLT_COLOR);

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const beamOpacity = useRef(new Animated.Value(0)).current;


  
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

  // Clear any existing timer - SINGLE SOURCE OF TRUTH
  const clearTimer = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  // Get random position (avoiding back-to-back repeats)
  const getNextPosition = useCallback((): PositionKey => {
    const positions: PositionKey[] = ['left', 'center', 'right'];
    const available = positions.filter(p => p !== lastPositionRef.current);
    const next = available[Math.floor(Math.random() * available.length)];
    lastPositionRef.current = next;
    return next;
  }, []);

  // Shake effect for attack
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

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

  const isVulnerable = daemonState === DaemonState.LANDED;
  const isAttacking = daemonState === DaemonState.ATTACKING;


  // Apply damage and handle death
  const applyDaemonDamage = useCallback(() => {
    const hit = rollToHit();
    
    if (hit) {
      const damage = rollDamage();
      // Read from ref to get the actual current HP (not stale state)
      // This prevents HP from appearing to increase when multiple attacks happen before re-render
      const currentHP = currentHPRef.current;
      const newHP = Math.max(0, currentHP - damage);
      
      // Update ref immediately to prevent race conditions
      currentHPRef.current = newHP;
      
      // Apply damage to Christos
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { updates: { currentHP: newHP } },
      });

      // Check for death
      if (newHP <= 0) {
        // Dispatch GAME_OVER action immediately
        dispatch({
          type: 'GAME_OVER',
          payload: {
            message: 'Christos was killed by the Jaunt Daemon.',
            killerName: 'Jaunt Daemon',
            suppressDeathDialog: true,
          },
        });

        // Delay navigation to death screen until after attack animation completes
        // This allows the attack overlay to display for its full duration (750ms)
        deathNavigationTimerRef.current = setTimeout(() => {
          router.replace('/death');
        }, TIMINGS.ATTACK);
      }
    }
  }, [dispatch, router]);

  // THE STATE MACHINE - Single orchestrator
  const runAnimationCycle = useCallback(() => {
    // Prevent multiple simultaneous loops
    if (isRunningRef.current) {
      return;
    }
    isRunningRef.current = true;

    const executeSequence = () => {
      clearTimer(); // Clear before setting new timer

      // Decide if this cycle includes an attack
      const willAttack = Math.random() < 0.6; // 60% chance to attack
      const nextPosition = getNextPosition();

      // STATE 1: RESTING
      setDaemonState(DaemonState.RESTING);

      const restingTime = TIMINGS.RESTING_MIN + 
        Math.random() * (TIMINGS.RESTING_MAX - TIMINGS.RESTING_MIN);

      animationTimerRef.current = setTimeout(() => {
        // STATE 2: PREP1 (charging up in current position - don't move yet!)
        setDaemonState(DaemonState.PREP1);

        animationTimerRef.current = setTimeout(() => {
          // STATE 3: PREP2 (still charging in current position - don't move yet!)
          setDaemonState(DaemonState.PREP2);

          animationTimerRef.current = setTimeout(() => {
            // >>> TELEPORT NOW! Move to new position <<<
            setCurrentPosition(nextPosition);

            if (willAttack) {
              // ATTACK SEQUENCE (daemon appears at new position with attack overlay)
              setAttackDirection(Math.random() < 0.5 ? 'left' : 'right');
              setDaemonState(DaemonState.ATTACKING);
              triggerShake();

              animationTimerRef.current = setTimeout(() => {
                // Apply damage after attack animation completes (more realistic)
                applyDaemonDamage();
                
                // STATE 4: LANDED (after attack, already at new position)
                setDaemonState(DaemonState.LANDED);

                animationTimerRef.current = setTimeout(() => {
                  // Back to RESTING with crossfade
                  setPreviousState(DaemonState.LANDED);
                  setIsCrossfading(true);
                  setDaemonState(DaemonState.RESTING);
                  
                  // Wait for crossfade to complete before next cycle
                  animationTimerRef.current = setTimeout(() => {
                    setIsCrossfading(false);
                    executeSequence();
                  }, 400); // Match crossfade duration
                }, TIMINGS.LANDED);
              }, TIMINGS.ATTACK);
            } else {
              // NO ATTACK - daemon appears at new position in landed state
              setDaemonState(DaemonState.LANDED);

              animationTimerRef.current = setTimeout(() => {
                // Back to RESTING with crossfade
                setPreviousState(DaemonState.LANDED);
                setIsCrossfading(true);
                setDaemonState(DaemonState.RESTING);
                
                // Wait for crossfade to complete before next cycle
                animationTimerRef.current = setTimeout(() => {
                  setIsCrossfading(false);
                  executeSequence();
                }, 400); // Match crossfade duration
              }, TIMINGS.LANDED);
            }
          }, TIMINGS.PREP2);
        }, TIMINGS.PREP1);
      }, restingTime);
    };

    executeSequence();
  }, [clearTimer, getNextPosition, triggerShake, applyDaemonDamage]);

  // Handle tap on daemon
  const handleDaemonTap = useCallback(() => {
    if (daemonState === DaemonState.LANDED) {
      // HIT!
      onDaemonHit?.();
      // Could add hit feedback animation here
    } else {
      // MISS
      onDaemonMiss?.();
      // Could add miss feedback animation here
    }
  }, [daemonState, onDaemonHit, onDaemonMiss]);

  // Keep HP ref in sync with state
  useEffect(() => {
    currentHPRef.current = state.player.currentHP;
  }, [state.player.currentHP]);

  // Start the loop on mount, cleanup on unmount
  useEffect(() => {
    runAnimationCycle();

    return () => {
      isRunningRef.current = false;
      clearTimer();
      // Clear death navigation timer if component unmounts
      if (deathNavigationTimerRef.current) {
        clearTimeout(deathNavigationTimerRef.current);
        deathNavigationTimerRef.current = null;
      }
      // Clear zap menu timer if component unmounts
      if (zapMenuTimerRef.current) {
        clearTimeout(zapMenuTimerRef.current);
        zapMenuTimerRef.current = null;
      }
    };
  }, [runAnimationCycle, clearTimer]);

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
    
    // Trigger beam VFX
    if (arenaSize && bgRect) {
      // Calculate start point (bottom center of arena)
      const startX = arenaSize.width / 2;
      const startY = arenaSize.height - 20;
      
      // Get end point (selected target spawn position - already calculated!)
      const endPosition = getSpawnPosition(target);
      
      // Set beam state
      setBeamFrom({ x: startX, y: startY });
      setBeamTo(endPosition);
      setBeamColor(boltColor);
      
      // Stop any previous animation
      beamOpacity.stopAnimation();
      
      // Animate beam: appear → hold → fade
      Animated.sequence([
        Animated.timing(beamOpacity, {
          toValue: 1,
          duration: 0, // Immediate appearance
          useNativeDriver: true,
        }),
        Animated.delay(BEAM_HOLD_DURATION),
        Animated.timing(beamOpacity, {
          toValue: 0,
          duration: BEAM_FADEOUT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Clear beam state after animation
        setBeamFrom(null);
        setBeamTo(null);
      });
    }
    
    if (__DEV__) {
      console.log('[JauntCave] Zap target selected:', target);
    }
  }, [arenaSize, bgRect, boltColor, beamOpacity, getSpawnPosition]);
  
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

        {/* Zap Beam VFX Overlay */}
        {beamFrom && beamTo && (
          <View style={styles.beamOverlay} pointerEvents="none">
            {(() => {
              const dx = beamTo.x - beamFrom.x;
              const dy = beamTo.y - beamFrom.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angleRad = Math.atan2(dy, dx);
              const angleDeg = (angleRad * 180) / Math.PI;

              return (
                <>
                  {/* Glow effect (thicker, lower opacity) */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: beamFrom.x,
                      top: beamFrom.y,
                      width: length,
                      height: BEAM_THICKNESS * BEAM_GLOW_MULTIPLIER,
                      backgroundColor: beamColor,
                      opacity: beamOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.3],
                      }),
                      transform: [
                        { translateY: -BEAM_THICKNESS },
                        { rotate: `${angleDeg}deg` },
                      ],
                    }}
                  />
                  
                  {/* Main beam */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: beamFrom.x,
                      top: beamFrom.y,
                      width: length,
                      height: BEAM_THICKNESS,
                      backgroundColor: beamColor,
                      opacity: beamOpacity,
                      transform: [
                        { translateY: -BEAM_THICKNESS / 2 },
                        { rotate: `${angleDeg}deg` },
                      ],
                    }}
                  />
                </>
              );
            })()}
          </View>
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
  beamOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150, // Above daemon (50), below attack overlay (100) and HUD (200)
    pointerEvents: 'none',
  },
});

export default JauntCaveScreen2;