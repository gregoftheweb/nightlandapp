// app/sub-games/jaunt-cave/_components/DaemonSprite.tsx
// Daemon sprite rendering component for Jaunt Cave screen2

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

// Daemon sprite states
export enum DaemonState {
  RESTING = 'resting',
  PREP1 = 'prep1',
  PREP2 = 'prep2',
  LANDED = 'landed',
  ATTACKING = 'attacking',
}

// Sprite sources
export const SPRITES = {
  resting: require('@assets/images/sprites/monsters/jaunt-deamon-1.png'),
  prep1: require('@assets/images/sprites/monsters/jaunt-deamon-2.png'),
  prep2: require('@assets/images/sprites/monsters/jaunt-deamon-3.png'),
  landed: require('@assets/images/sprites/monsters/jaunt-deamon-4.png'),
  attackLeft: require('@assets/images/sprites/monsters/jaunt-deamon-5.png'),
  attackRight: require('@assets/images/sprites/monsters/jaunt-deamon-6.png'),
};

export type PositionKey = 'left' | 'center' | 'right';

interface DaemonSpriteProps {
  daemonState: DaemonState;
  currentPosition: PositionKey;
  attackDirection: 'left' | 'right';
  previousState: DaemonState;
  isCrossfading: boolean;
  daemonX: number;
  daemonY: number;
  arenaSize: { width: number; height: number } | null;
  isVulnerable: boolean;
  isAttacking: boolean;
  onDaemonTap: () => void;
}

export function DaemonSprite({
  daemonState,
  attackDirection,
  previousState,
  isCrossfading,
  daemonX,
  daemonY,
  isVulnerable,
  isAttacking,
  arenaSize,
  onDaemonTap,
}: DaemonSpriteProps) {
  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fizzleAnim = useRef(new Animated.Value(0)).current;
  const brightnessAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = bright flash
  const crossfadeAnim = useRef(new Animated.Value(1)).current; // 1 = current sprite fully visible

  // Get current sprite
  const getCurrentSprite = useCallback(() => {
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
  }, [daemonState, attackDirection]);

  // Get sprite for a specific state (used for crossfade)
  const getSpriteForState = useCallback((state: DaemonState) => {
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
  }, [attackDirection]);

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

  // Start/stop glow effect based on vulnerable state
  useEffect(() => {
    if (isVulnerable) {
      startGlowEffect();
    } else {
      stopGlowEffect();
    }
    return () => {
      stopGlowEffect();
    };
  }, [isVulnerable, startGlowEffect, stopGlowEffect]);

  // Fizzle effect for charge-up transitions (triggered by parent)
  useEffect(() => {
    if (daemonState === DaemonState.PREP1 || daemonState === DaemonState.PREP2) {
      fizzleAnim.setValue(0);
      Animated.timing(fizzleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        fizzleAnim.setValue(0);
      });
    }
  }, [daemonState, fizzleAnim]);

  // Brightness burst when teleporting (end of prep2 -> landed transition)
  useEffect(() => {
    if (daemonState === DaemonState.LANDED) {
      brightnessAnim.setValue(1); // Bright flash
      Animated.timing(brightnessAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [daemonState, brightnessAnim]);

  // Crossfade animation (triggered when isCrossfading changes)
  useEffect(() => {
    if (isCrossfading) {
      crossfadeAnim.setValue(0); // Start with previous sprite visible
      Animated.timing(crossfadeAnim, {
        toValue: 1,
        duration: 400, // 400ms crossfade
        useNativeDriver: true,
      }).start();
    }
  }, [isCrossfading, crossfadeAnim]);

  // Memoized attack overlay style
  const attackOverlayStyle = [
    styles.attackOverlay,
    arenaSize ? { width: arenaSize.width, height: arenaSize.height } : {},
  ];

  return (
    <>
      {/* Attack overlay (full screen) */}
      {isAttacking && arenaSize && (
        <Image
          source={getCurrentSprite()}
          style={attackOverlayStyle}
          resizeMode="contain"
        />
      )}

      {/* Daemon (positioned) - only show when not attacking */}
      {!isAttacking && (
        <TouchableOpacity
          style={[
            styles.daemonContainer,
            {
              left: daemonX - 75, // Center the 150px sprite
              top: daemonY - 75,
            },
          ]}
          onPress={onDaemonTap}
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
