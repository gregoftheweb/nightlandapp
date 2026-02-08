// app/sub-games/jaunt-cave/_components/useBattleState.ts
// Custom hook for managing battle state machine logic and daemon AI behavior

import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { DaemonState, PositionKey } from './DaemonSprite';

// Re-export DaemonState for use in other modules
export { DaemonState };

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

export interface UseBattleStateProps {
  initialDaemonHP?: number;
  maxDaemonHP?: number;
  onDaemonHit?: () => void;
  onDaemonMiss?: () => void;
  // Animation refs passed in from parent
  shakeAnim: Animated.Value;
  // Game context
  dispatch: any;
  currentPlayerHP: number;
  router: any;
}

export interface UseBattleStateReturn {
  daemonState: DaemonState;
  currentPosition: PositionKey;
  attackDirection: 'left' | 'right';
  previousState: DaemonState;
  isCrossfading: boolean;
  daemonHP: number;
  handleDaemonTap: () => void;
  isVulnerable: boolean;
  isAttacking: boolean;
}

export function useBattleState(props: UseBattleStateProps): UseBattleStateReturn {
  const {
    initialDaemonHP = 100,
    maxDaemonHP = 100,
    onDaemonHit,
    onDaemonMiss,
    shakeAnim,
    dispatch,
    currentPlayerHP,
    router,
  } = props;

  // Daemon state
  const [daemonState, setDaemonState] = useState<DaemonState>(DaemonState.RESTING);
  const [currentPosition, setCurrentPosition] = useState<PositionKey>('center');
  const [attackDirection, setAttackDirection] = useState<'left' | 'right'>('left');
  const [previousState, setPreviousState] = useState<DaemonState>(DaemonState.RESTING);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [daemonHP] = useState(initialDaemonHP);

  // Single timer ref - THIS IS CRITICAL
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<PositionKey>('center');
  const isRunningRef = useRef(false);

  // Track current HP in a ref to avoid stale state reads
  // This prevents HP from appearing to increase when multiple attacks happen before re-render
  const currentHPRef = useRef<number>(currentPlayerHP);

  // Computed values
  const isVulnerable = daemonState === DaemonState.LANDED;
  const isAttacking = daemonState === DaemonState.ATTACKING;

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
                  }, TIMINGS.TRANSITION_TO_RESTING);
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
                }, TIMINGS.TRANSITION_TO_RESTING);
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
    currentHPRef.current = currentPlayerHP;
  }, [currentPlayerHP]);

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
    };
  }, [runAnimationCycle, clearTimer]);

  return {
    daemonState,
    currentPosition,
    attackDirection,
    previousState,
    isCrossfading,
    daemonHP,
    handleDaemonTap,
    isVulnerable,
    isAttacking,
  };
}
