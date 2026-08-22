// Shared timed-encounter aftermath screen
// Screen 5: Aftermath screen - shown when re-entering Jaunt Cave after winning
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { BackgroundImage } from '../BackgroundImage'
import { BottomActionBar } from '../BottomActionBar'
import { ReadableTextBox } from '../ReadableTextBox'
import { subGameTheme } from '../subGameTheme'
import type { TimedEncounterConfig } from './types'
import type { SubGameLifecycleController } from '../lifecycle'

export default function TimedEncounterAftermath({
  config,
  lifecycle,
}: {
  config: TimedEncounterConfig
  lifecycle: SubGameLifecycleController
}) {
  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log('[Jaunt Cave Screen5] Returning to Night Land from aftermath screen')
    }
    // Use replace to prevent Back button from returning to Jaunt Cave
    void lifecycle.completeSubGame()
  }

  return (
    <BackgroundImage source={config.presentation.aftermathBackground}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <ReadableTextBox textStyle={styles.descriptionText}>
            {config.narrative.aftermathText}
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
