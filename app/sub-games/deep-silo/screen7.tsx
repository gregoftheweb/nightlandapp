// app/sub-games/deep-silo/screen7.tsx
// Deep Silo - Control panel with power switch
import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bg = require('@assets/images/backgrounds/subgames/deep-silo/silo-screen7.png')

export default function DeepSiloScreen7() {
  const router = useRouter()

  const handleBack = () => {
    if (__DEV__) console.log('[DeepSilo] Heading back to screen 6')
    router.back()
  }

  const handleThrowSwitch = () => {
    if (__DEV__) console.log('[DeepSilo] Throwing the power switch')
    router.push('/sub-games/deep-silo/switch-animation' as any)
  }

  return (
    <BackgroundImage source={bg}>
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Go back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.switchButton]}
              onPress={handleThrowSwitch}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Throw switch</Text>
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
  contentArea: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: subGameTheme.blue,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  switchButton: {
    backgroundColor: subGameTheme.red,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
})
