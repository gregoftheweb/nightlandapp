// app/sub-games/tesseract/main.tsx
// Screen 1: Intro screen for the tesseract sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/lib/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bgScreen1 = require('@/assets/images/teseract-screen1.png')

export default function TesseractMain() {
  const router = useRouter()

  const handleLeaveWithoutExploring = () => {
    if (__DEV__) {
      console.log('[Tesseract] Leaving without exploring')
    }
    exitSubGame({ completed: false })
  }

  const handleExploreRuins = () => {
    if (__DEV__) {
      console.log('[Tesseract] Exploring the stone ruins')
    }
    router.push('/sub-games/tesseract/screen2' as any)
  }

  return (
    <BackgroundImage source={bgScreen1}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* Content area for potential flavor text or UI elements */}
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLeaveWithoutExploring}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>leave without exploring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleExploreRuins}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>explore the stone ruins</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
