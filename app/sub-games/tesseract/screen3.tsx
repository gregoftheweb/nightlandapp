// app/sub-games/tesseract/screen3.tsx
// Screen 3: Failure screen for the tesseract sub-game
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bgScreen3 = require('@/assets/images/teseract-screen3.png')

export default function TesseractScreen3() {
  const router = useRouter()
  const { dispatch } = useGameContext()

  const handleAcceptDoom = () => {
    if (__DEV__) {
      console.log('[Tesseract] Player accepts doom - triggering death with suppressDeathDialog')
    }
    
    // Dispatch GAME_OVER action to set death state
    // suppressDeathDialog prevents the death InfoBox from appearing
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: 'Christos failed to guess the right word. An ancient evil rose from the earth and devoured his soul.',
        killerName: 'Ancient Evil',
        suppressDeathDialog: true, // Suppress the death dialog for puzzle death
      },
    })
    
    // Navigate to death screen
    router.push('/death' as any)
  }

  return (
    <BackgroundImage source={bgScreen3} foregroundFit="cover">
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.descriptionText}>
            Christos fails to guess the right word.{'\n\n'}
            An ancient evil rises from the earth and devours his soul.
          </Text>
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAcceptDoom}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>accept your doom</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60, // Fixed top padding to prevent layout shift
    paddingBottom: 120, // Fixed bottom padding for button area
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'stretch',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
