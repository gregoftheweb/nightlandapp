// app/sub-games/jaunt-cave/screen1_5.tsx
// Screen 1.5: Rockfall interstitial screen for the jaunt-cave sub-game
import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png')

export default function JauntCaveScreen1_5() {
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
    router.push('/sub-games/jaunt-cave/screen2' as any)
  }

  return (
    <Animated.View
      style={[
        styles.fullScreen,
        { transform: [{ translateX: shake }] },
      ]}
    >
      <BackgroundImage source={BACKGROUND}>
        <View style={styles.container}>
          <View style={styles.contentArea}>
            {showContent && (
              <Text style={styles.title}>
                There is a rockfall in the cave! Christos is TRAPPED!{'\n'}
                In here his destiny becomes his DOOM!
              </Text>
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
                  <Text style={styles.buttonText}>He meets his doom</Text>
                </TouchableOpacity>
              </View>
            </BottomActionBar>
          )}
        </View>
      </BackgroundImage>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 32,
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
