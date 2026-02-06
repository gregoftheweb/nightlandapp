// app/sub-games/jaunt-cave/screen2.tsx
// Screen 2: Placeholder screen - puzzle mechanics to be added later
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bgScreen2 = require('@assets/images/backgrounds/subgames/jaunt-cave-screen1.png')

const SUB_GAME_NAME = 'jaunt-cave'

export default function JauntCaveScreen2() {
  const router = useRouter()

  const handleReturnToSurface = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Returning to surface`)
    }
    router.push('/sub-games/jaunt-cave/main' as any)
  }

  return (
    <BackgroundImage source={bgScreen2}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* TODO: Implement puzzle mechanics here */}
          <View style={styles.placeholderArea}>
            <Text style={styles.placeholderText}>Deep within the cave...</Text>
            <Text style={styles.instructionText}>
              The daemon of the walking shadows awaits. Puzzle mechanics will be implemented here.
            </Text>
          </View>
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
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  placeholderArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 30,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: subGameTheme.blue,
    alignItems: 'center',
    gap: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
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
