// Shared timed-encounter rockfall screen
// Screen 1.5: Rockfall interstitial screen for the jaunt-cave sub-game
import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../BackgroundImage'
import { BottomActionBar } from '../BottomActionBar'
import { ReadableTextBox } from '../ReadableTextBox'
import { subGameTheme } from '../subGameTheme'
import type { TimedEncounterConfig } from './types'

export default function TimedEncounterRockfall({ config }: { config: TimedEncounterConfig }) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const shake = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Create aggressive shake animation sequence
    // Each sequence is 350ms, looped to fill 2 seconds
    const shakeSequence = Animated.sequence([
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ])

    // Loop the shake animation continuously
    const animation = Animated.loop(shakeSequence)
    animation.start()

    // Stop animation after 2 seconds and reveal content
    const timer = setTimeout(() => {
      animation.stop()
      shake.setValue(0)
      setShowContent(true)
    }, 2000)

    // Cleanup to prevent memory leaks
    return () => {
      animation.stop()
      clearTimeout(timer)
    }
  }, [shake])

  const handleContinue = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave] Continuing to screen2 from rockfall')
    }
    router.push(`/sub-games/jaunt-cave/${config.instanceId}/battle` as any)
  }

  return (
    <View style={styles.rootContainer}>
      <Animated.View style={[styles.fullScreen, { transform: [{ translateX: shake }] }]}>
        <BackgroundImage source={config.presentation.battleBackground}>
          <View style={styles.container}>
            <View style={styles.contentArea}>
              {showContent && (
                <ReadableTextBox textStyle={styles.narrativeText}>
                  {config.narrative.rockfallText}
                </ReadableTextBox>
              )}
            </View>

            {showContent && (
              <BottomActionBar>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleContinue}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>{config.narrative.rockfallContinueLabel}</Text>
                  </TouchableOpacity>
                </View>
              </BottomActionBar>
            )}
          </View>
        </BackgroundImage>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  narrativeText: {
    textAlign: 'center',
    fontWeight: '600',
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
