// app/sub-games/jaunt-cave/screen2.tsx
// Screen 2: Jaunt Daemon battle - UI animation only (combat logic to be added)
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutChangeEvent,
  Pressable,
  Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

// Backgrounds and sprites
const bgScreen2 = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png')
const sprite1 = require('@assets/images/sprites/monsters/jaunt-deamon-1.png')
const sprite2 = require('@assets/images/sprites/monsters/jaunt-deamon-2.png')
const sprite3 = require('@assets/images/sprites/monsters/jaunt-deamon-3.png')
const sprite4 = require('@assets/images/sprites/monsters/jaunt-deamon-4.png')
const sprite5 = require('@assets/images/sprites/monsters/jaunt-deamon-5.png')
const sprite6 = require('@assets/images/sprites/monsters/jaunt-deamon-6.png')

const SUB_GAME_NAME = 'jaunt-cave'

// ===== CONFIGURATION =====

type AnchorKey = 'left' | 'center' | 'right'
type Phase = 'resting' | 'prep1' | 'prep2' | 'landed' | 'attackL' | 'attackR'

interface AnchorConfig {
  key: AnchorKey
  xPct: number
  yPct: number
}

// Daemon can land in 3 positions aligned with background composition
const JAUNT_ANCHORS: AnchorConfig[] = [
  { key: 'left', xPct: 0.25, yPct: 0.28 },
  { key: 'center', xPct: 0.5, yPct: 0.28 },
  { key: 'right', xPct: 0.75, yPct: 0.28 },
]

// Attack chance per cycle (independent of position)
const ATTACK_CHANCE = 0.35

// Speed multiplier - slows down all animations
const SPEED_MULTIPLIER = 2

// Sprite mapping by phase
const SPRITE_MAP: Record<Phase, any> = {
  resting: sprite1,
  prep1: sprite2,
  prep2: sprite3,
  landed: sprite4,
  attackL: sprite5,
  attackR: sprite6,
}

// Base timing configuration (all in milliseconds, multiplied by SPEED_MULTIPLIER)
const BASE_TIMING = {
  prep1: 200, // Quick
  prep2: 200, // Quick
  landed: 200, // Quick (vulnerable window)
  attack: 300, // Quick attack swipe
  resting: 1200, // Slow return to rest
  crossfade: 120, // Sprite crossfade duration
  shimmer: 150, // Landing shimmer duration
  shake: 100, // Attack shake duration
}

// Apply speed multiplier to all timings
const TIMING = Object.fromEntries(
  Object.entries(BASE_TIMING).map(([key, value]) => [key, value * SPEED_MULTIPLIER])
) as typeof BASE_TIMING

// ===== COMPONENT =====

export default function JauntCaveScreen2() {
  const router = useRouter()

  // Layout dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

  // State machine
  const [phase, setPhase] = useState<Phase>('resting')
  const [currentAnchor, setCurrentAnchor] = useState<AnchorKey>('center')
  const [feedbackText, setFeedbackText] = useState<string | null>(null)

  // Sprite crossfade state
  const [currentSprite, setCurrentSprite] = useState<any>(sprite1)
  const [nextSprite, setNextSprite] = useState<any | null>(null)
  const currentOpacity = useRef(new Animated.Value(1)).current
  const nextOpacity = useRef(new Animated.Value(0)).current

  // Landing shimmer state
  const shimmerOpacity = useRef(new Animated.Value(1)).current
  const shimmerScale = useRef(new Animated.Value(1)).current
  const glowScale = useRef(new Animated.Value(0)).current
  const glowOpacity = useRef(new Animated.Value(0)).current

  // Attack shake state
  const shakeX = useRef(new Animated.Value(0)).current

  // Refs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // TODO: Replace with real state from GameContext
  const daemonHP = 100
  const daemonMaxHP = 100
  const christosHP = 50
  const christosMaxHP = 100

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  // Helper: Crossfade to new sprite
  const crossfadeToSprite = (newPhase: Phase) => {
    const newSpriteSource = SPRITE_MAP[newPhase]
    
    // If same sprite, no crossfade needed
    if (newSpriteSource === currentSprite) {
      setPhase(newPhase)
      return
    }

    setNextSprite(newSpriteSource)
    setPhase(newPhase)

    // Animate crossfade
    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 0,
        duration: TIMING.crossfade,
        useNativeDriver: true,
      }),
      Animated.timing(nextOpacity, {
        toValue: 1,
        duration: TIMING.crossfade,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After crossfade completes, swap sprites
      setCurrentSprite(newSpriteSource)
      setNextSprite(null)
      currentOpacity.setValue(1)
      nextOpacity.setValue(0)
    })
  }

  // Helper: Trigger landing shimmer effect
  const triggerLandingShimmer = () => {
    // Reset values
    shimmerOpacity.setValue(1)
    shimmerScale.setValue(0.95)
    glowScale.setValue(0.5)
    glowOpacity.setValue(0.8)

    // Shimmer sequence: opacity flicker and scale pulse
    Animated.sequence([
      Animated.parallel([
        Animated.timing(shimmerOpacity, {
          toValue: 0.7,
          duration: TIMING.shimmer * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerScale, {
          toValue: 1.05,
          duration: TIMING.shimmer * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1.5,
          duration: TIMING.shimmer,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: TIMING.shimmer,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: TIMING.shimmer * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerScale, {
          toValue: 1.0,
          duration: TIMING.shimmer * 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }

  // Helper: Trigger attack shake effect
  const triggerAttackShake = () => {
    shakeX.setValue(0)

    // Quick shake sequence
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 8,
        duration: TIMING.shake * 0.25,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -8,
        duration: TIMING.shake * 0.25,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 4,
        duration: TIMING.shake * 0.25,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: TIMING.shake * 0.25,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // State machine: runs animation loop
  useEffect(() => {
    const runCycle = () => {
      // Always pick a new position for this cycle
      pickNewAnchor()

      // Decide independently whether to attack this cycle
      const willAttack = Math.random() < ATTACK_CHANCE

      // Build sequence based on whether we're attacking
      const sequence: Array<{ phase: Phase; duration: number; onEnter?: () => void }> = [
        { 
          phase: 'prep1', 
          duration: TIMING.prep1,
          onEnter: () => crossfadeToSprite('prep1'),
        },
        { 
          phase: 'prep2', 
          duration: TIMING.prep2,
          onEnter: () => crossfadeToSprite('prep2'),
        },
      ]

      if (willAttack) {
        // Insert attack phase
        const attackPhase: Phase = Math.random() < 0.5 ? 'attackL' : 'attackR'
        sequence.push({
          phase: attackPhase,
          duration: TIMING.attack,
          onEnter: () => {
            crossfadeToSprite(attackPhase)
            triggerAttackShake()
            // TODO: Apply damage to Christos when combat logic is added
          },
        })
      }

      // Always land and return to rest
      sequence.push(
        { 
          phase: 'landed', 
          duration: TIMING.landed,
          onEnter: () => {
            crossfadeToSprite('landed')
            triggerLandingShimmer()
          },
        },
        { 
          phase: 'resting', 
          duration: TIMING.resting,
          onEnter: () => crossfadeToSprite('resting'),
        }
      )

      let index = 0
      const step = () => {
        if (index >= sequence.length) {
          // Cycle complete, start again
          timerRef.current = setTimeout(runCycle, 0)
          return
        }

        const { phase: nextPhase, duration, onEnter } = sequence[index]

        // Execute phase transition with animation
        if (onEnter) {
          onEnter()
        } else {
          setPhase(nextPhase)
        }

        index++
        timerRef.current = setTimeout(step, duration)
      }

      step()
    }

    // Start the animation loop after initial resting period
    timerRef.current = setTimeout(runCycle, TIMING.resting)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // Only run once on mount

  const pickNewAnchor = () => {
    const available = JAUNT_ANCHORS.filter((a) => a.key !== currentAnchor)
    const next = available[Math.floor(Math.random() * available.length)]
    setCurrentAnchor(next.key)
  }

  const handleDaemonTap = () => {
    const isVulnerable = phase === 'landed'

    if (isVulnerable) {
      // Hit!
      if (__DEV__) console.log('[JauntDaemon] Hit!')
      showFeedback('Hit!')
      // TODO: Apply damage when combat logic is added
    } else {
      // Miss
      if (__DEV__) console.log('[JauntDaemon] Miss!')
      showFeedback('Miss!')
      // TODO: Possibly trigger player damage when combat logic is added
    }
  }

  const showFeedback = (text: string) => {
    setFeedbackText(text)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedbackText(null), 800)
  }

  const handleReturnToSurface = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Returning to surface`)
    }
    router.push('/sub-games/jaunt-cave/main' as any)
  }

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setContainerSize({ width, height })
    }
  }

  // Calculate daemon position from anchor
  const getDaemonPosition = () => {
    if (!containerSize) return { left: 0, top: 0 }

    const anchor = JAUNT_ANCHORS.find((a) => a.key === currentAnchor)!
    const left = anchor.xPct * containerSize.width
    const top = anchor.yPct * containerSize.height

    return { left, top }
  }

  const daemonPosition = getDaemonPosition()
  const isVulnerable = phase === 'landed'
  const isAttackPhase = phase === 'attackL' || phase === 'attackR'

  return (
    <BackgroundImage source={bgScreen2}>
      <View style={styles.container} onLayout={handleLayout}>
        {/* HUD - Vertical Health Bars */}
        {/* Daemon HP Bar - Left Side */}
        <View style={styles.leftHpBar}>
          <Text style={styles.hpLabelSmall}>daemon</Text>
          <View style={styles.verticalHpBarOuter}>
            <View
              style={[
                styles.verticalHpBarInner,
                styles.daemonHpBar,
                { height: `${(daemonHP / daemonMaxHP) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Christos HP Bar - Right Side */}
        <View style={styles.rightHpBar}>
          <View style={styles.verticalHpBarOuter}>
            <View
              style={[
                styles.verticalHpBarInner,
                styles.christosHpBar,
                { height: `${(christosHP / christosMaxHP) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.hpLabelSmall}>christos</Text>
        </View>

        {/* Content Area - Daemon */}
        <View style={styles.contentArea}>
          {containerSize && (
            <>
              {/* Daemon Sprite with Crossfade and Effects */}
              {!isAttackPhase && (
                <Animated.View
                  style={[
                    styles.daemonContainer,
                    {
                      left: daemonPosition.left,
                      top: daemonPosition.top,
                      transform: [
                        { translateX: -75 }, 
                        { translateY: -75 },
                        { scale: shimmerScale },
                      ],
                    },
                  ]}
                >
                  {/* Purple glow ring for landing shimmer */}
                  <Animated.View
                    style={[
                      styles.glowRing,
                      {
                        opacity: glowOpacity,
                        transform: [{ scale: glowScale }],
                      },
                    ]}
                  />

                  {/* Crossfade layer: Current sprite */}
                  <Pressable onPress={handleDaemonTap} style={styles.spriteLayer}>
                    <Animated.Image
                      source={currentSprite}
                      style={[
                        styles.daemonSprite,
                        {
                          opacity: Animated.multiply(currentOpacity, shimmerOpacity),
                        },
                      ]}
                    />
                  </Pressable>

                  {/* Crossfade layer: Next sprite (when transitioning) */}
                  {nextSprite && (
                    <Animated.Image
                      source={nextSprite}
                      style={[
                        styles.daemonSprite,
                        styles.spriteOverlay,
                        {
                          opacity: Animated.multiply(nextOpacity, shimmerOpacity),
                        },
                      ]}
                      pointerEvents="none"
                    />
                  )}

                  {/* Vulnerability indicator */}
                  {isVulnerable && (
                    <View style={styles.vulnerable} pointerEvents="none" />
                  )}
                </Animated.View>
              )}

              {/* Attack Swipe Overlay with Shake */}
              {isAttackPhase && (
                <Animated.View
                  style={[
                    styles.attackOverlay,
                    {
                      transform: [{ translateX: shakeX }],
                    },
                  ]}
                >
                  <Pressable onPress={handleDaemonTap} style={styles.attackPressable}>
                    {/* Crossfade layer: Current sprite */}
                    <Animated.Image
                      source={currentSprite}
                      style={[
                        styles.attackSprite,
                        {
                          opacity: currentOpacity,
                        },
                      ]}
                      resizeMode="contain"
                    />

                    {/* Crossfade layer: Next sprite (when transitioning) */}
                    {nextSprite && (
                      <Animated.Image
                        source={nextSprite}
                        style={[
                          styles.attackSprite,
                          styles.spriteOverlay,
                          {
                            opacity: nextOpacity,
                          },
                        ]}
                        resizeMode="contain"
                        pointerEvents="none"
                      />
                    )}
                  </Pressable>
                </Animated.View>
              )}

              {/* Feedback Text */}
              {feedbackText && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackText}>{feedbackText}</Text>
                </View>
              )}
            </>
          )}
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleReturnToSurface}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Return to the surface</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  leftHpBar: {
    position: 'absolute',
    left: 15,
    top: 80,
    bottom: 80,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  rightHpBar: {
    position: 'absolute',
    right: 15,
    top: 80,
    bottom: 80,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  hpLabelSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textTransform: 'lowercase',
  },
  verticalHpBarOuter: {
    width: 12,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    justifyContent: 'flex-end',
  },
  verticalHpBarInner: {
    width: '100%',
  },
  daemonHpBar: {
    backgroundColor: subGameTheme.red,
  },
  christosHpBar: {
    backgroundColor: '#00cc00',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  daemonContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
  },
  spriteLayer: {
    width: 150,
    height: 150,
  },
  spriteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#9932cc',
    opacity: 0,
  },
  vulnerable: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
    shadowColor: '#ffff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  daemonSprite: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  attackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  attackPressable: {
    width: '90%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attackSprite: {
    width: '100%',
    height: '100%',
  },
  feedbackContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: subGameTheme.blue,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
