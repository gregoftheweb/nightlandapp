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

// Sprite mapping by phase
const SPRITE_MAP: Record<Phase, any> = {
  resting: sprite1,
  prep1: sprite2,
  prep2: sprite3,
  landed: sprite4,
  attackL: sprite5,
  attackR: sprite6,
}

// Timing configuration (all in milliseconds)
const TIMING = {
  prep1: 200, // Quick
  prep2: 200, // Quick
  landed: 200, // Quick (vulnerable window)
  attack: 300, // Quick attack swipe
  resting: 1200, // Slow return to rest
}

// ===== COMPONENT =====

export default function JauntCaveScreen2() {
  const router = useRouter()

  // Layout dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

  // State machine
  const [phase, setPhase] = useState<Phase>('resting')
  const [currentAnchor, setCurrentAnchor] = useState<AnchorKey>('center')
  const [feedbackText, setFeedbackText] = useState<string | null>(null)

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

  // State machine: runs animation loop
  useEffect(() => {
    const runCycle = () => {
      // Decide: side-to-side jaunt (70%) or jaunt-to-attack (30%)
      const isAttack = Math.random() < 0.3

      if (isAttack) {
        // Sequence: resting -> prep1 -> prep2 -> attack -> landed -> resting
        const sequence: Array<{ phase: Phase; duration: number }> = [
          { phase: 'prep1', duration: TIMING.prep1 },
          { phase: 'prep2', duration: TIMING.prep2 },
          { phase: Math.random() < 0.5 ? 'attackL' : 'attackR', duration: TIMING.attack },
          { phase: 'landed', duration: TIMING.landed }, // Pick new anchor here
          { phase: 'resting', duration: TIMING.resting },
        ]

        let index = 0
        const step = () => {
          if (index >= sequence.length) {
            // Cycle complete, start again
            timerRef.current = setTimeout(runCycle, 0)
            return
          }

          const { phase: nextPhase, duration } = sequence[index]

          // Pick new anchor when landing
          if (nextPhase === 'landed') {
            pickNewAnchor()
          }

          setPhase(nextPhase)
          index++
          timerRef.current = setTimeout(step, duration)
        }

        step()
      } else {
        // Sequence: resting -> prep1 -> prep2 -> landed -> resting
        const sequence: Array<{ phase: Phase; duration: number }> = [
          { phase: 'prep1', duration: TIMING.prep1 },
          { phase: 'prep2', duration: TIMING.prep2 },
          { phase: 'landed', duration: TIMING.landed }, // Pick new anchor here
          { phase: 'resting', duration: TIMING.resting },
        ]

        let index = 0
        const step = () => {
          if (index >= sequence.length) {
            // Cycle complete, start again
            timerRef.current = setTimeout(runCycle, 0)
            return
          }

          const { phase: nextPhase, duration } = sequence[index]

          // Pick new anchor when landing
          if (nextPhase === 'landed') {
            pickNewAnchor()
          }

          setPhase(nextPhase)
          index++
          timerRef.current = setTimeout(step, duration)
        }

        step()
      }
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
        {/* HUD */}
        <View style={styles.hud}>
          {/* Daemon HP Bar */}
          <View style={styles.hpBarContainer}>
            <Text style={styles.hpLabel}>Jaunt Daemon</Text>
            <View style={styles.hpBarOuter}>
              <View
                style={[styles.hpBarInner, { width: `${(daemonHP / daemonMaxHP) * 100}%` }]}
              />
            </View>
            <Text style={styles.hpText}>
              {daemonHP} / {daemonMaxHP}
            </Text>
          </View>

          {/* Christos HP */}
          <View style={styles.hpBarContainer}>
            <Text style={styles.hpLabel}>Christos</Text>
            <View style={styles.hpBarOuter}>
              <View
                style={[
                  styles.hpBarInner,
                  styles.christosHpBar,
                  { width: `${(christosHP / christosMaxHP) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.hpText}>
              {christosHP} / {christosMaxHP}
            </Text>
          </View>
        </View>

        {/* Content Area - Daemon */}
        <View style={styles.contentArea}>
          {containerSize && (
            <>
              {/* Daemon Sprite */}
              {!isAttackPhase && (
                <Pressable
                  style={[
                    styles.daemonContainer,
                    {
                      left: daemonPosition.left,
                      top: daemonPosition.top,
                      transform: [{ translateX: -75 }, { translateY: -75 }], // Center on anchor
                    },
                    isVulnerable && styles.vulnerable,
                  ]}
                  onPress={handleDaemonTap}
                >
                  <Image source={SPRITE_MAP[phase]} style={styles.daemonSprite} />
                </Pressable>
              )}

              {/* Attack Swipe Overlay */}
              {isAttackPhase && (
                <Pressable style={styles.attackOverlay} onPress={handleDaemonTap}>
                  <Image
                    source={SPRITE_MAP[phase]}
                    style={styles.attackSprite}
                    resizeMode="contain"
                  />
                </Pressable>
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
  hud: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 100,
    gap: 10,
  },
  hpBarContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  hpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: subGameTheme.red,
    marginBottom: 4,
  },
  hpBarOuter: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
  },
  hpBarInner: {
    height: '100%',
    backgroundColor: subGameTheme.red,
  },
  christosHpBar: {
    backgroundColor: '#00cc00',
  },
  hpText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textAlign: 'right',
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
  vulnerable: {
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
  attackSprite: {
    width: '90%',
    height: '90%',
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
