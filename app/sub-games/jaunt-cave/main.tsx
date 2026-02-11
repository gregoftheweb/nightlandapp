// app/sub-games/jaunt-cave/main.tsx
// Screen 1: Intro screen for the jaunt-cave sub-game
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { getSubGameDefinition } from '@config/subGames'
import { useGameContext } from '@context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { ReadableTextBox } from '../_shared/ReadableTextBox'
import { subGameTheme } from '../_shared/subGameTheme'

const SUB_GAME_ID = 'jaunt-cave'
const definition = getSubGameDefinition(SUB_GAME_ID)

export default function JauntCaveMain() {
  const router = useRouter()
  const { state } = useGameContext()
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true)

  // Extract completion status for use in effect dependency
  const isCompleted = state.subGamesCompleted?.[SUB_GAME_ID] ?? false

  // Check if Jaunt Cave has been completed on mount
  useEffect(() => {
    if (isCompleted) {
      if (__DEV__) {
        console.log(`[${SUB_GAME_ID}] Already completed - routing to aftermath screen (screen5)`)
      }
      router.replace('/sub-games/jaunt-cave/screen5' as any)
    } else {
      if (__DEV__) {
        console.log(`[${SUB_GAME_ID}] Not completed - showing intro screen`)
      }
      setIsCheckingCompletion(false)
    }
  }, [router, isCompleted])

  const handleRejectDestiny = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_ID}] Rejecting destiny and returning to overworld`)
    }
    exitSubGame({ completed: false })
  }

  const handleEnterCave = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_ID}] Entering the cave`)
    }
    router.push('/sub-games/jaunt-cave/screen1_5' as any)
  }

  // Prevent UI flicker while checking completion status
  if (isCheckingCompletion) {
    return null
  }

  return (
    <BackgroundImage source={definition.introBackgroundImage}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <ReadableTextBox textStyle={styles.titleText}>{definition.title}</ReadableTextBox>
          <ReadableTextBox textStyle={styles.descriptionText}>
            {definition.description}
          </ReadableTextBox>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleRejectDestiny}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                Reject your destiny and return to the Night Land
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleEnterCave} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Accept your doom and enter the cave</Text>
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
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionText: {
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
