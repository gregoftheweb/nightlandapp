// app/sub-games/tesseract/screen3.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { subGameTheme } from '../_shared/subGameTheme'

const bgScreen3 = require('@assets/images/backgrounds/subgames/tesseract-screen3.png')

export default function TesseractScreen3() {
  const router = useRouter()
  const { dispatch } = useGameContext()

  const handleAcceptDoom = () => {
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: 'Christos failed to guess the right word.',
        killerName: 'Ancient Evil',
        suppressDeathDialog: true,
      },
    })

    router.replace('/death' as any)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false, // removes native header + back button
          animation: 'none', // removes nav transition blink
          gestureEnabled: false, // optional: prevents swipe-back on iOS
        }}
      />

      <BackgroundImage source={bgScreen3} foregroundFit="cover">
        <View style={styles.container}>
          <View style={styles.contentArea}>
            <Text style={styles.descriptionText}>
              Christos fails to guess the right word.
              {'\n\n'}A Great Power, a malevolent force of ancient evil rises from the earth to
              consume Christos&apos; soul in black fire.
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.button} onPress={handleAcceptDoom} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Christos&apos; doom awaits.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BackgroundImage>
    </>
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
    paddingBottom: 160,
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
  },
})
