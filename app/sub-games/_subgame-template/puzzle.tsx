// app/sub-games/_subgame-template/puzzle.tsx
// Screen 2: Puzzle/game screen
import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

// TODO: Replace with your sub-game's background image
const bgPuzzle = require('@/assets/images/tesseract-screen3.png')

// TODO: Change this to your sub-game's name (use kebab-case, e.g., 'my-puzzle')
const SUB_GAME_NAME = '_subgame-template'

export default function SubGameTemplatePuzzle() {
  const router = useRouter()
  const [puzzleState, setPuzzleState] = useState<'idle' | 'solving' | 'solved'>('idle')

  const handleGiveUp = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Giving up on puzzle`)
    }
    exitSubGame({ completed: false })
  }

  const handleSolvePuzzle = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Puzzle solved!`)
    }
    // TODO: Implement your puzzle logic here
    setPuzzleState('solved')
    // Navigate to success screen
    // TODO: Update route to match your sub-game folder name
    router.push('/sub-games/_subgame-template/success' as any)
  }

  return (
    <BackgroundImage source={bgPuzzle}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* TODO: Replace with your puzzle UI */}
          <View style={styles.puzzleArea}>
            <Text style={styles.puzzleText}>Puzzle Area</Text>
            <Text style={styles.instructionText}>
              Replace this placeholder with your actual puzzle interface.
            </Text>

            {/* Example: Solve button (replace with your puzzle interaction) */}
            {puzzleState === 'idle' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleSolvePuzzle}>
                <Text style={styles.actionButtonText}>Solve Puzzle (Demo)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGiveUp}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Give up</Text>
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
  puzzleArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 30,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: subGameTheme.blue,
    alignItems: 'center',
    gap: 20,
  },
  puzzleText: {
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
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: subGameTheme.red,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
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
