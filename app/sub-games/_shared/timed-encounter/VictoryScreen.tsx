// Shared timed-encounter victory screen
// Screen 3: Victory screen for the jaunt-cave sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useGameContext } from '@context/GameContext'
import { BackgroundImage } from '../BackgroundImage'
import { BottomActionBar } from '../BottomActionBar'
import { ReadableTextBox } from '../ReadableTextBox'
import { subGameTheme } from '../subGameTheme'
import type { TimedEncounterConfig } from './types'
import type { SubGameLifecycleController } from '../lifecycle'

export default function TimedEncounterVictory({
  config,
  lifecycle,
}: {
  config: TimedEncounterConfig
  lifecycle: SubGameLifecycleController
}) {
  const { state } = useGameContext()

  // Check if this is a return visit (jaunt-cave already completed)
  const isReturnVisit = state.subGamesCompleted?.[config.instanceId] === true

  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave] Victory - returning to Night Land')
    }

    void lifecycle.completeSubGame()
  }

  return (
    <BackgroundImage source={config.presentation.victoryBackground}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <ReadableTextBox textStyle={styles.titleText}>
            {config.narrative.victoryTitle}
          </ReadableTextBox>

          <ReadableTextBox textStyle={styles.descriptionText}>
            {isReturnVisit ? config.narrative.revisitVictoryText : config.narrative.victoryText}
          </ReadableTextBox>
          <ReadableTextBox textStyle={styles.descriptionText}>
            {isReturnVisit ? config.narrative.revisitRewardText : config.narrative.rewardText}
          </ReadableTextBox>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleReturnToNightLand}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.narrative.returnLabel}</Text>
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
    fontSize: 24,
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
