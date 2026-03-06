// app/sub-games/deep-silo/screen6.tsx
// Deep Silo - The deepest level
import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bg = require('@assets/images/backgrounds/subgames/silo-screen6.png')

export default function DeepSiloScreen6() {
  const router = useRouter()

  const handleBack = () => {
    if (__DEV__) console.log('[DeepSilo] Heading back up to screen 5')
    router.back()
  }

  return (
    <BackgroundImage source={bg}>
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.buttonText}>Head back up</Text>
          </TouchableOpacity>
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
})
