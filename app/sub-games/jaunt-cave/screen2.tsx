import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { subGameTheme } from '../_shared/subGameTheme';
import { useGameContext } from '@context/GameContext';
import { BattleHUD } from './_components/BattleHUD';
import { WeaponsInventoryModal } from './_components/WeaponsInventoryModal';
import { Item } from '@config/types';

// Daemon sprite states
enum DaemonState {
  RESTING = 'resting',
  PREP1 = 'prep1',
  PREP2 = 'prep2',
  LANDED = 'landed',
  ATTACKING = 'attacking',
}

// Landing positions (configurable percentages)
const POSITIONS = {
  left: { x: 0.2, y: 0.37 },
  center: { x: 0.5, y: 0.38 },
  right: { x: 0.8, y: 0.38 },
} as const;

type PositionKey = keyof typeof POSITIONS;

// Sprite sources
const SPRITES = {
  resting: require('@assets/images/sprites/monsters/jaunt-deamon-1.png'),
  prep1: require('@assets/images/sprites/monsters/jaunt-deamon-2.png'),
  prep2: require('@assets/images/sprites/monsters/jaunt-deamon-3.png'),
  landed: require('@assets/images/sprites/monsters/jaunt-deamon-4.png'),
  attackLeft: require('@assets/images/sprites/monsters/jaunt-deamon-5.png'),
  attackRight: require('@assets/images/sprites/monsters/jaunt-deamon-6.png'),
};

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
  const [isBlocking, setIsBlocking] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [zapFeedback, setZapFeedback] = useState<string | null>(null);
  const zapFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fizzleAnim = useRef(new Animated.Value(0)).current;
  const brightnessAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = bright flash
  const crossfadeAnim = useRef(new Animated.Value(1)).current; // 1 = current sprite fully visible

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
    // Scale to ALWAYS match screen width
    const scale = containerW / imageW;

    const drawW = imageW * scale;
    const drawH = imageH * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;

    return { offsetX, offsetY, drawW, drawH };
  }, [arenaSize]);

  // Compute daemon absolute position from percentage
  const daemonPosition = useMemo(() => {
    if (!bgRect) return { x: 0, y: 0 };

    const position = POSITIONS[currentPosition];
    const daemonX = bgRect.offsetX + position.x * bgRect.drawW;
    const daemonY = bgRect.offsetY + position.y * bgRect.drawH;

    return { x: daemonX, y: daemonY };
  }, [bgRect, currentPosition]);

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

  // Glow effect for vulnerable state
  const startGlowEffect = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const stopGlowEffect = useCallback(() => {
    glowAnim.stopAnimation();
    glowAnim.setValue(0);
  }, [glowAnim]);

  // Shake effect for attack
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Fizzle effect for charge-up transitions (resting → prep1, prep1 → prep2)
  const triggerFizzle = useCallback(() => {
    fizzleAnim.setValue(0);
    Animated.timing(fizzleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      fizzleAnim.setValue(0);
    });
  }, [fizzleAnim]);

  // Brightness burst when teleporting (end of prep2)
  const triggerBrightness = useCallback(() => {
    brightnessAnim.setValue(1); // Bright flash
    Animated.timing(brightnessAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true, // Use native driver consistently
    }).start();
  }, [brightnessAnim]);

  // Crossfade between sprites (landed → resting transition)
  const triggerCrossfade = useCallback((fromState: DaemonState, toState: DaemonState) => {
    setPreviousState(fromState);
    setIsCrossfading(true);
    crossfadeAnim.setValue(0); // Start with previous sprite visible
    
    setDaemonState(toState);
    
    Animated.timing(crossfadeAnim, {
      toValue: 1,
      duration: 400, // 400ms crossfade
      useNativeDriver: true,
    }).start(() => {
      setIsCrossfading(false);
    });
  }, [crossfadeAnim]);

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
      const willAttack = Math.random() < 0.4; // 40% chance to attack
      const nextPosition = getNextPosition();

      // STATE 1: RESTING
      setDaemonState(DaemonState.RESTING);
      stopGlowEffect();
      brightnessAnim.setValue(0); // Ensure brightness is reset for next cycle

      const restingTime = TIMINGS.RESTING_MIN + 
        Math.random() * (TIMINGS.RESTING_MAX - TIMINGS.RESTING_MIN);

      animationTimerRef.current = setTimeout(() => {
        // STATE 2: PREP1 (charging up in current position - don't move yet!)
        setDaemonState(DaemonState.PREP1);
        triggerFizzle(); // Fizzle effect on resting → prep1

        animationTimerRef.current = setTimeout(() => {
          // STATE 3: PREP2 (still charging in current position - don't move yet!)
          setDaemonState(DaemonState.PREP2);
          triggerFizzle(); // Fizzle effect on prep1 → prep2

          animationTimerRef.current = setTimeout(() => {
            // >>> TELEPORT NOW! Move to new position <<<
            setCurrentPosition(nextPosition);
            triggerBrightness(); // Brightness burst on teleport

            if (willAttack) {
              // ATTACK SEQUENCE (daemon appears at new position with attack overlay)
              setAttackDirection(Math.random() < 0.5 ? 'left' : 'right');
              setDaemonState(DaemonState.ATTACKING);
              brightnessAnim.setValue(0); // Reset brightness before attack
              triggerShake();

              animationTimerRef.current = setTimeout(() => {
                // Apply damage after attack animation completes (more realistic)
                applyDaemonDamage();
                
                // STATE 4: LANDED (after attack, already at new position)
                setDaemonState(DaemonState.LANDED);
                startGlowEffect();

                animationTimerRef.current = setTimeout(() => {
                  // Back to RESTING with crossfade
                  stopGlowEffect();
                  triggerCrossfade(DaemonState.LANDED, DaemonState.RESTING);
                  
                  // Wait for crossfade to complete before next cycle
                  animationTimerRef.current = setTimeout(() => {
                    executeSequence();
                  }, 400); // Match crossfade duration
                }, TIMINGS.LANDED);
              }, TIMINGS.ATTACK);
            } else {
              // NO ATTACK - daemon appears at new position in landed state
              setDaemonState(DaemonState.LANDED);
              startGlowEffect();

              animationTimerRef.current = setTimeout(() => {
                // Back to RESTING with crossfade
                stopGlowEffect();
                triggerCrossfade(DaemonState.LANDED, DaemonState.RESTING);
                
                // Wait for crossfade to complete before next cycle
                animationTimerRef.current = setTimeout(() => {
                  executeSequence();
                }, 400); // Match crossfade duration
              }, TIMINGS.LANDED);
            }
          }, TIMINGS.PREP2);
        }, TIMINGS.PREP1);
      }, restingTime);
    };

    executeSequence();
  }, [clearTimer, getNextPosition, startGlowEffect, stopGlowEffect, triggerShake, triggerFizzle, triggerBrightness, triggerCrossfade, applyDaemonDamage]);

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
      stopGlowEffect();
      // Clear death navigation timer if component unmounts
      if (deathNavigationTimerRef.current) {
        clearTimeout(deathNavigationTimerRef.current);
        deathNavigationTimerRef.current = null;
      }
      // Clear zap feedback timer if component unmounts
      if (zapFeedbackTimerRef.current) {
        clearTimeout(zapFeedbackTimerRef.current);
        zapFeedbackTimerRef.current = null;
      }
    };
  }, [runAnimationCycle, clearTimer, stopGlowEffect]);

  // Get current sprite
  const getCurrentSprite = () => {
    switch (daemonState) {
      case DaemonState.RESTING:
        return SPRITES.resting;
      case DaemonState.PREP1:
        return SPRITES.prep1;
      case DaemonState.PREP2:
        return SPRITES.prep2;
      case DaemonState.LANDED:
        return SPRITES.landed;
      case DaemonState.ATTACKING:
        return attackDirection === 'left' ? SPRITES.attackLeft : SPRITES.attackRight;
      default:
        return SPRITES.resting;
    }
  };

  // Get sprite for a specific state (used for crossfade)
  const getSpriteForState = (state: DaemonState) => {
    switch (state) {
      case DaemonState.RESTING:
        return SPRITES.resting;
      case DaemonState.PREP1:
        return SPRITES.prep1;
      case DaemonState.PREP2:
        return SPRITES.prep2;
      case DaemonState.LANDED:
        return SPRITES.landed;
      case DaemonState.ATTACKING:
        return attackDirection === 'left' ? SPRITES.attackLeft : SPRITES.attackRight;
      default:
        return SPRITES.resting;
    }
  };

  // Battle HUD handlers
  const handleZap = useCallback(() => {
    // Stub: Show feedback
    setZapFeedback('Zap!');
    // Clear any existing timer
    if (zapFeedbackTimerRef.current) {
      clearTimeout(zapFeedbackTimerRef.current);
    }
    zapFeedbackTimerRef.current = setTimeout(() => {
      setZapFeedback(null);
      zapFeedbackTimerRef.current = null;
    }, 1000);
    if (__DEV__) {
      console.log('[JauntCave] Zap action triggered');
    }
  }, []);
  
  const handleBlock = useCallback(() => {
    setIsBlocking((prev) => {
      const newValue = !prev;
      if (__DEV__) {
        console.log('[JauntCave] Block toggled:', newValue);
      }
      return newValue;
    });
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
      console.log('[JauntCave] Equip weapon:', weapon.name);
    }
    // Stub: Just log and close for now
    setShowInventory(false);
  }, []);
  
  // Filter weapons from inventory
  const weapons = useMemo(() => {
    return state.player.inventory.filter(
      (item) => item.type === 'weapon'
    );
  }, [state.player.inventory]);

  // Memoized attack overlay style
  const attackOverlayStyle = useMemo(() => {
    if (!arenaSize) return styles.attackOverlay;
    return [styles.attackOverlay, { width: arenaSize.width, height: arenaSize.height }];
  }, [arenaSize]);

  // Position for daemon
  const position = POSITIONS[currentPosition];
  const daemonX = daemonPosition.x;
  const daemonY = daemonPosition.y;

  const isVulnerable = daemonState === DaemonState.LANDED;
  const isAttacking = daemonState === DaemonState.ATTACKING;

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
          {/* Attack overlay (full screen) */}
          {isAttacking && arenaSize && (
            <Image
              source={getCurrentSprite()}
              style={attackOverlayStyle}
              resizeMode="contain"
            />
          )}

          {/* Daemon (positioned) - only show when not attacking */}
          {!isAttacking && bgRect && (
            <TouchableOpacity
              style={[
                styles.daemonContainer,
                {
                  left: daemonX - 75, // Center the 150px sprite
                  top: daemonY - 75,
                },
              ]}
              onPress={handleDaemonTap}
              activeOpacity={1}
            >
              {/* Fizzle background effects */}
              {daemonState === DaemonState.PREP1 && (
                <Animated.View
                  style={[
                    styles.fizzleBackground,
                    {
                      opacity: fizzleAnim,
                      transform: [
                        {
                          scale: fizzleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.4],
                          }),
                        },
                      ],
                      backgroundColor: '#ff6600', // Orange fizzle for prep1
                    },
                  ]}
                />
              )}
              {daemonState === DaemonState.PREP2 && (
                <Animated.View
                  style={[
                    styles.fizzleBackground,
                    {
                      opacity: fizzleAnim,
                      transform: [
                        {
                          scale: fizzleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.4],
                          }),
                        },
                      ],
                      backgroundColor: '#ff00ff', // Magenta fizzle for prep2
                    },
                  ]}
                />
              )}

              <Animated.View
                style={[
                  styles.daemonWrapper,
                  isVulnerable && {
                    shadowColor: '#ff0',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: glowAnim,
                    shadowRadius: 20,
                  },
                ]}
              >
                {/* Previous sprite (fading out during crossfade) */}
                {isCrossfading && (
                  <Animated.Image
                    source={getSpriteForState(previousState)}
                    style={[
                      styles.daemonSprite,
                      styles.absoluteSprite,
                      {
                        opacity: crossfadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0],
                        }),
                      },
                    ]}
                    resizeMode="contain"
                  />
                )}
                
                {/* Current sprite (fading in during crossfade, or fully visible) */}
                <Animated.Image
                  source={getCurrentSprite()}
                  style={[
                    styles.daemonSprite,
                    isCrossfading && {
                      opacity: crossfadeAnim,
                    },
                  ]}
                  resizeMode="contain"
                />
                
                {/* Brightness overlay for teleport flash */}
                <Animated.View
                  style={[
                    styles.brightnessOverlay,
                    {
                      opacity: brightnessAnim,
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* HUD - Vertical Health Bars */}
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
      </View>

      <BottomActionBar>
        <BattleHUD
          onZap={handleZap}
          onBlock={handleBlock}
          onOpenInventory={handleOpenInventory}
          isBlocking={isBlocking}
        />
      </BottomActionBar>
      
      {/* Blocking indicator */}
      {isBlocking && (
        <View style={styles.blockingIndicator}>
          <Text style={styles.blockingText}>BLOCKING</Text>
        </View>
      )}
      
      {/* Zap feedback */}
      {zapFeedback && (
        <View style={styles.zapFeedback}>
          <Text style={styles.zapFeedbackText}>{zapFeedback}</Text>
        </View>
      )}
      
      {/* Weapons inventory modal */}
      <WeaponsInventoryModal
        visible={showInventory}
        weapons={weapons}
        onClose={handleCloseInventory}
        onSelectWeapon={handleSelectWeapon}
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
  attackOverlay: {
    position: 'absolute',
    zIndex: 100,
  },
  daemonContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    zIndex: 50,
  },
  daemonWrapper: {
    width: '100%',
    height: '100%',
  },
  fizzleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    zIndex: -1,
  },
  brightnessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderRadius: 75,
  },
  daemonSprite: {
    width: '100%',
    height: '100%',
  },
  absoluteSprite: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  blockingIndicator: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 300,
    pointerEvents: 'none',
  },
  blockingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.blue,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  zapFeedback: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 300,
    pointerEvents: 'none',
  },
  zapFeedbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.red,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: subGameTheme.red,
    textShadowColor: subGameTheme.red,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default JauntCaveScreen2;