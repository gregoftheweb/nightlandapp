// app/sub-games/jaunt-cave/screen3.tsx
// Screen 3: Victory screen for the jaunt-cave sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { useGameContext } from '@context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen3.png')

export default function JauntCaveScreen3() {
  const router = useRouter()
  const { state, dispatch, signalRpgResume } = useGameContext()

  // Check if this is a return visit (jaunt-cave already completed)
  const isReturnVisit = state.subGamesCompleted?.['jaunt-cave'] === true

  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave] Victory - returning to Night Land')
    }

    // Only mark as completed AFTER the player confirms victory on this screen.
    // This ensures first-time victory messaging displays even if completion is set later.
    if (!isReturnVisit) {
      if (__DEV__) {
        console.log('[Jaunt Cave] Marking sub-game as completed on victory confirm')
      }

      dispatch({
        type: 'SET_SUB_GAME_COMPLETED',
        payload: {
          subGameName: 'jaunt-cave',
          completed: true,
        },
      })
    }

    // Signal RPG to refresh
    signalRpgResume()

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true })
  }

  return (
    <BackgroundImage source={BACKGROUND}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.title}>Victory!</Text>

          <Text style={styles.description}>
            {isReturnVisit
              ? 'Christos has already defeated the Jaunt Daemon.\n\nOnly a pile of black dust remains.'
              : 'Christos has slain the Jaunt Daemon!\n\nThe creature dissolves into shadow and ash.\n\nThe cave falls silent.'}
          </Text>
          <Text style={styles.description}>
            {isReturnVisit
              ? 'Christos should not tarry here, nothing but fire and woe remain.'
              : 'Christos claims the Jaunt Daemon\'s Black Diamond Heart!\n\nHe feels a new power surge through him.'}
          </Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleReturnToNightLand} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Return to the Night Land</Text>
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
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 40,
  },
  description: {
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
