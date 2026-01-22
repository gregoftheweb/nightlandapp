// app/sub-games/tesseract/screen2.tsx
// Screen 2: Puzzle board screen for the tesseract sub-game
import React from 'react'
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const puzzleBoard = require('@/assets/images/teseract-puzzle-board.png')

export default function TesseractScreen2() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const handleLeaveCourtyard = () => {
    if (__DEV__) {
      console.log('[Tesseract] Leaving the courtyard')
    }
    router.back()
  }

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <View style={[styles.contentArea, { paddingTop: insets.top + 20 }]}>
          <Image
            source={puzzleBoard}
            style={[styles.puzzleBoard, { width: screenWidth * 0.95 }]}
            resizeMode="contain"
          />
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLeaveCourtyard}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>leave the courtyard</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 10,
  },
  puzzleBoard: {
    maxWidth: '100%',
    aspectRatio: 1, // This will be overridden by the actual image aspect ratio when using contain
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
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
