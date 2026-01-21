// app/sub-games/tesseract/main.tsx
// Main screen for the tesseract sub-game - placeholder implementation
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { exitSubGame } from '@/lib/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

export default function TesseractMain() {
  const handleReturn = () => {
    if (__DEV__) {
      console.log('[Tesseract] Returning to RPG')
    }
    exitSubGame({ completed: false })
  }

  return (
    <BackgroundImage>
      {/* TODO: Replace placeholder background with tesseract puzzle artwork when available */}
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>TESSERACT PUZZLE</Text>
            <Text style={styles.subtitleText}>Placeholder Screen</Text>
            <Text style={styles.instructionText}>Puzzle artwork and gameplay coming soon</Text>
          </View>
        </View>

        <BottomActionBar>
          <TouchableOpacity style={styles.returnButton} onPress={handleReturn} activeOpacity={0.7}>
            <Text style={styles.returnButtonText}>Return</Text>
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
    paddingHorizontal: 30,
  },
  placeholderBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.blue,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#aaaaaa',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  returnButton: {
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
  returnButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
