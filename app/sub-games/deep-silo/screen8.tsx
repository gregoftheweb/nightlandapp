// app/sub-games/deep-silo/screen8.tsx
// Deep Silo - Power restored
import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { useSubGameLifecycle } from '../_shared/lifecycle'
import { canCompleteDeepSilo, useDeepSiloPuzzleState } from './puzzleState'

const bg = require('@assets/images/backgrounds/subgames/deep-silo/silo-screen8.webp')

export default function DeepSiloScreen8() {
  const router = useRouter()
  const puzzle = useDeepSiloPuzzleState()
  const lifecycle = useSubGameLifecycle('deep-silo')
  const viewState = lifecycle.isCompleted()
    ? { ...puzzle.state, weaponCharged: true, discosOnTable: false }
    : puzzle.state

  const handleBack = () => {
    if (__DEV__) console.log('[DeepSilo] Heading back to control panel')
    router.back()
  }

  const handleComplete = async () => {
    if (canCompleteDeepSilo(viewState)) await lifecycle.completeSubGame()
  }

  const copy = !viewState.weaponCharged
    ? 'The station shudders awake, but the current has nowhere to gather. The secret in Persius’s note remains unfulfilled.'
    : viewState.discosOnTable
      ? 'Discos hums upon the plate, bright with stored Earth Current. The charge has taken—but the weapon must be reclaimed.'
      : 'Discos rests once more in your hand. A deep, steady current answers your grip; the old weapon has awakened to greater power.'

  return (
    <BackgroundImage source={bg}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {!puzzle.isLoading && <Text style={styles.storyText}>{copy}</Text>}
        </View>
        <BottomActionBar>
          {!puzzle.isLoading &&
            (canCompleteDeepSilo(viewState) ? (
              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={() => void handleComplete()}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Return to the Redoubt</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.7}>
                <Text style={styles.buttonText}>
                  {viewState.weaponCharged ? 'Go back and pick up Discos' : 'Go back'}
                </Text>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'flex-end',
    padding: 20,
  },
  storyText: {
    color: subGameTheme.white,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderColor: subGameTheme.blue,
    borderWidth: 2,
    borderRadius: 12,
    padding: 18,
    fontSize: 17,
    lineHeight: 25,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: subGameTheme.blue,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: subGameTheme.red,
    borderColor: subGameTheme.blue,
  },
})
