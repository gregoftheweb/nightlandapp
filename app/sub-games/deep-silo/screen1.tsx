// app/sub-games/deep-silo/screen1.tsx
// Deep Silo - Surface level
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bg = require('@assets/images/backgrounds/subgames/deep-silo/silo-screen1.png')

export default function DeepSiloScreen1() {
  const router = useRouter()

  const handleDown = () => {
    if (__DEV__) console.log('[DeepSilo] Going deeper - screen 2')
    router.push('/sub-games/deep-silo/screen2' as any)
  }

  const handleReturn = () => {
    if (__DEV__) console.log('[DeepSilo] Returning to surface')
    exitSubGame({ completed: false })
  }

  return (
    <BackgroundImage source={bg}>
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleReturn} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Return to the surface</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.downButton]}
              onPress={handleDown}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Down further</Text>
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
    gap: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
  downButton: {
    backgroundColor: subGameTheme.red,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
})
