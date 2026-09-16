// app/death/index.tsx
import React from 'react'
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameContext } from '@context/GameContext'
import { clearAllSubGameSaves } from '../sub-games/_shared/persistence'
import { invalidateAutoSaveAndDeleteCurrentGame } from '@modules/autoSave'
import { SafeAreaContent } from '@components/SafeAreaContent'

export default function DeathScreen() {
  const router = useRouter()
  const { state } = useGameContext()

  // Generate unique instance ID for this component
  const instanceId = React.useRef(`DeathScreen-${Math.random().toString(36).substr(2, 9)}`)

  // Log component lifecycle
  React.useEffect(() => {
    const id = instanceId.current
    console.log(`☠️☠️☠️ [${id}] DeathScreen component MOUNTED`)
    return () => {
      console.log(`☠️☠️☠️ [${id}] DeathScreen component UNMOUNTED`)
    }
  }, [])

  // Prevent multiple restart button presses
  const isRestarting = React.useRef(false)

  const handlePress = async () => {
    // Guard against multiple button presses
    if (isRestarting.current) {
      console.log(
        `☠️☠️☠️ [${instanceId.current}] Restart already in progress, ignoring duplicate press`
      )
      return
    }

    isRestarting.current = true
    console.log(`☠️☠️☠️ [${instanceId.current}] Navigating to load screen from death screen`)

    try {
      // Clear all sub-game puzzle saves (aerowreck, tesseract, etc.)
      await clearAllSubGameSaves()

      // Delete current game autosave (death deletes autosave, but NOT waypoint saves)
      await invalidateAutoSaveAndDeleteCurrentGame()

      // Navigate to load screen (splash screen with New | Current | Saved options)
      // Use replace to prevent back navigation to death screen
      router.replace('/')
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
      source={require('@assets/images/backgrounds/splash/splashscreen.webp')}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <SafeAreaContent style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.overline}>EXPEDITION ENDED</Text>
          <Text style={styles.title}>The Night has taken Christos.</Text>
          <Text style={styles.killer}>Slain by {killerName}.</Text>
          <View style={styles.rule} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{distanceTraveled}</Text>
              <Text style={styles.statLabel}>steps from safety</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{monstersKilled}</Text>
              <Text style={styles.statLabel}>horrors slain</Text>
            </View>
          </View>
          <Text style={styles.memoryText}>
            The current expedition is lost. Any waypoint memories made before death remain at the
            title screen.
          </Text>
        </View>

        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>Return to the Last Redoubt</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaContent>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  textContainer: {
    borderLeftWidth: 3,
    borderColor: '#842828',
    padding: 22,
    backgroundColor: 'rgba(5, 6, 8, 0.86)',
    marginBottom: 20,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    marginTop: 20,
  },
  overline: { color: '#847861', fontSize: 10, letterSpacing: 2.4, fontWeight: '700' },
  title: {
    color: '#b84038',
    fontSize: 38,
    lineHeight: 45,
    fontFamily: 'Gabrielle',
    marginTop: 8,
  },
  killer: { color: '#b8aa8b', fontSize: 17, marginTop: 8 },
  rule: { width: 72, height: 1, backgroundColor: '#6e2927', marginVertical: 20 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderTopWidth: 1, borderColor: '#44382c', paddingTop: 9 },
  statValue: { color: '#d4c39e', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#766d5d', fontSize: 11, marginTop: 2 },
  memoryText: {
    color: '#8d826e',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 22,
  },
  overlay: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: 'transparent',
    borderColor: '#8f302d',
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#d0c09a',
    fontSize: 23,
    fontFamily: 'Gabrielle',
    textAlign: 'center',
  },
})
