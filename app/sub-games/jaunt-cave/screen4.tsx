// app/sub-games/jaunt-cave/screen4.tsx
// Screen 4: Death screen for the jaunt-cave sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen4.png')

export default function JauntCaveScreen4() {
  const router = useRouter()

  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave] Player died - returning to Night Land')
    }
    exitSubGame({ completed: false })
  }

  const handleGoToDeath = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave] Navigating to main death screen')
    }
    router.replace('/death')
  }

  return (
    <BackgroundImage source={BACKGROUND}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.title}>Defeated by the Daemon</Text>
          <Text style={styles.description}>
            The Jaunt Daemon has slain Christos.{'\n\n'}
            The darkness of the cave claims another victim.
          </Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToDeath}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Continue to Death Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleReturnToNightLand}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Return to Night Land</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 36,
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
