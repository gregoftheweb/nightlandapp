// app/sub-games/jaunt-cave/main.tsx
// Screen 1: Intro screen for the jaunt-cave sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bgMain = require('@assets/images/backgrounds/subgames/jaunt-cave-screen1.png')

const SUB_GAME_NAME = 'jaunt-cave'

// Sub-game metadata
const TITLE = 'Cave of the daemon of the walking shadows'
const DESCRIPTION =
  'A sulfur smelling wallow in the Night Lands plains lead to a cave shining with the light from lava. Christos is drawn to it, an aegis of foreboding and necessity upon him. He knows he MUST confront what is inside. Doom and Destiny collide within.'

export default function JauntCaveMain() {
  const router = useRouter()

  const handleRejectDestiny = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Rejecting destiny and returning to overworld`)
    }
    exitSubGame({ completed: false })
  }

  const handleEnterCave = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Entering the cave`)
    }
    router.push('/sub-games/jaunt-cave/screen2' as any)
  }

  return (
    <BackgroundImage source={bgMain}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.title}>{TITLE}</Text>
          <Text style={styles.description}>{DESCRIPTION}</Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleRejectDestiny}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Reject your destiny and return to the Night Land</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 32,
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
