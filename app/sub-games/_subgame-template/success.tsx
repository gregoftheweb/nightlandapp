import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { useSubGameLifecycle } from '../_shared/lifecycle'
import { subGameTheme } from '../_shared/subGameTheme'
import { SUB_GAME_INSTANCE_ID } from './lifecycleConfig'

const bgSuccess = require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen4.webp')

export default function SubGameTemplateSuccess() {
  const lifecycle = useSubGameLifecycle(SUB_GAME_INSTANCE_ID)

  return (
    <BackgroundImage source={bgSuccess}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.successText}>Success!</Text>
          <Text style={styles.descriptionText}>
            Christos has completed the puzzle. This reference config intentionally declares no
            reward or waypoint.
          </Text>
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={styles.button}
            onPress={() => void lifecycle.completeSubGame()}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Return to the Night Land</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  successText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 18,
    color: subGameTheme.white,
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
