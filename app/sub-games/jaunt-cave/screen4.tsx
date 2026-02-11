// app/sub-games/jaunt-cave/screen4.tsx
// Screen 4: Death screen for the jaunt-cave sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { ReadableTextBox } from '../_shared/ReadableTextBox'
import { subGameTheme } from '../_shared/subGameTheme'

const BACKGROUND = require('@assets/images/backgrounds/subgames/jaunt-cave-screen4.png')

export default function JauntCaveScreen4() {
  const router = useRouter()

 
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
          <ReadableTextBox textStyle={styles.titleText}>
            Defeated by the Daemon
          </ReadableTextBox>
          <ReadableTextBox textStyle={styles.descriptionText}>
            The Jaunt Daemon has slain Christos.{'\n\n'}
            Sophia will weep in sorrow for you, now lost to your doom in the Night Land.
          </ReadableTextBox>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
          
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToDeath}
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
