// app/death/index.tsx
import React from 'react'
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SPLASH_STRINGS } from '@/assets/copy/splashscreen'
import { useGameContext } from '@/context/GameContext'
import { clearAllSubGameSaves } from '../sub-games/_shared/persistence'
import { deleteCurrentGame } from '@/modules/saveGame'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function DeathScreen() {
  const router = useRouter()
  const { state, dispatch } = useGameContext()

  // Generate unique instance ID for this component
  const instanceId = React.useRef(`DeathScreen-${Math.random().toString(36).substr(2, 9)}`)

  // Log component lifecycle
  React.useEffect(() => {
    console.log(`☠️☠️☠️ [${instanceId.current}] DeathScreen component MOUNTED`)
    return () => {
      console.log(`☠️☠️☠️ [${instanceId.current}] DeathScreen component UNMOUNTED`)
    }
  }, [])

  // Prevent multiple restart button presses
  const isRestarting = React.useRef(false)

  const handlePress = async () => {
    // Guard against multiple button presses
    if (isRestarting.current) {
      console.log(`☠️☠️☠️ [${instanceId.current}] Restart already in progress, ignoring duplicate press`)
      return
    }
    
    isRestarting.current = true
    console.log(`☠️☠️☠️ [${instanceId.current}] Restarting game from death screen`)
    
    try {
      // Clear all sub-game puzzle saves (aerowreck, tesseract, etc.)
      await clearAllSubGameSaves()
      
      // Delete current game autosave (death deletes autosave, but NOT waypoint saves)
      await deleteCurrentGame()
      
      dispatch({ type: 'RESET_GAME' })
      router.replace('/game')
    } finally {
      // Reset the flag after navigation completes (or fails)
      // Use a small delay to ensure navigation has started
      setTimeout(() => {
        isRestarting.current = false
      }, 1000)
    }
  }

  // Extract stats from game state
  const monstersKilled = state.monstersKilled || 0
  const distanceTraveled = state.distanceTraveled || 0
  const killerName = state.killerName || 'unknown horror'

  console.log(`☠️☠️☠️ [${instanceId.current}] Rendering DeathScreen component`)
  return (
    <ImageBackground
      source={require('../../assets/images/splashscreen.png')}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{SPLASH_STRINGS.deathScreen.title}</Text>
          <Text style={styles.text}>
            {SPLASH_STRINGS.deathScreen.slainByText(killerName)}
            {SPLASH_STRINGS.deathScreen.monstersKilledText(monstersKilled)}
            {SPLASH_STRINGS.deathScreen.distanceTraveledText(distanceTraveled)}
          </Text>
        </View>

        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>{SPLASH_STRINGS.deathScreen.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40, // Fixed top padding to prevent layout shift
    paddingBottom: 80, // Fixed bottom padding for button area
  },
  textContainer: {
    borderWidth: 2,
    borderColor: 'red',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 20,
  },
  title: {
    color: 'red',
    fontSize: 50,
    fontFamily: 'Gabrielle',
    textAlign: 'center',
  },
  text: {
    color: 'red',
    fontSize: 30,
    fontFamily: 'Gabrielle',
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'transparent',
    borderColor: 'red',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: 'red',
    fontSize: 30,
    fontFamily: 'Gabrielle',
    textAlign: 'center',
  },
})
