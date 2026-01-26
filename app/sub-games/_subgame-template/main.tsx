// app/sub-games/_subgame-template/main.tsx
// Screen 1: Intro screen for the sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

// TODO: Replace with your sub-game's background image
const bgMain = require('@/assets/images/tesseract-screen1.png')

// TODO: Change this to your sub-game's name (use kebab-case, e.g., 'my-puzzle')
const SUB_GAME_NAME = '_subgame-template'

export default function SubGameTemplateMain() {
  const router = useRouter()

  const handleLeaveWithoutExploring = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Leaving without exploring`)
    }
    exitSubGame({ completed: false })
  }

  const handleStartPuzzle = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Starting puzzle`)
    }
    // TODO: Update route to match your sub-game folder name
    router.push('/sub-games/_subgame-template/puzzle' as any)
  }

  return (
    <BackgroundImage source={bgMain}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* TODO: Replace with your intro text */}
          <Text style={styles.introText}>
            Christos encounters a mysterious structure in the wasteland...
          </Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLeaveWithoutExploring}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Leave without exploring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleStartPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Investigate</Text>
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
  introText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 26,
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
