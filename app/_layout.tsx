import { Stack } from 'expo-router'
import { View, StyleSheet, StatusBar, Platform } from 'react-native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useCallback } from 'react'
import { GameProvider } from '../context/GameContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { audioManager } from '../modules/audioManager'
import { settingsManager } from '../modules/settingsManager'
import { IOS_BACK_GESTURE_ROUTES } from '../config/routeGesturePolicy'

SplashScreen.preventAutoHideAsync()

let pendingAudioCleanup: Promise<void> = Promise.resolve()

export function waitForAudioCleanup(): Promise<void> {
  return pendingAudioCleanup
}

export function beginAudioCleanup(): Promise<void> {
  pendingAudioCleanup = audioManager.cleanup().catch((error) => {
    console.error('Failed to clean up audio system:', error)
  })
  return pendingAudioCleanup
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Gabrielle: require('../assets/fonts/Gabrielle.ttf'),

    Sofia: require('../assets/fonts/Sofia-Regular.ttf'),
    //Niconne-Regular
    Niconne: require('../assets/fonts/Niconne-Regular.ttf'),
    //Satisfy-Regular
    Satisfy: require('../assets/fonts/Satisfy-Regular.ttf'),
    //SpaceMono-Regular
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    //Thank You So Much Font by 7NTypes
    ThankYou: require('../assets/fonts/ThankYou.otf'),
    //BilboSwashCaps-Regular
    Bilbo: require('../assets/fonts/BilboSwashCaps-Regular.ttf'),
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  useEffect(() => {
    onLayoutRootView()
  }, [fontsLoaded, onLayoutRootView])

  // Initialize audio system
  useEffect(() => {
    let cancelled = false

    const initAudio = async () => {
      try {
        await waitForAudioCleanup()
        if (cancelled) return

        await audioManager.initializeAudio()
        if (cancelled) return

        await audioManager.loadBackgroundMusic()
        if (!cancelled) console.log('Audio system initialized')
      } catch (error) {
        console.error('Failed to initialize audio system:', error)
      }
    }

    void initAudio()

    // Cleanup on unmount
    return () => {
      cancelled = true
      void beginAudioCleanup()
    }
  }, [])

  // Initialize settings system
  useEffect(() => {
    const initSettings = async () => {
      try {
        await settingsManager.initialize()
        console.log('Settings system initialized')
      } catch (error) {
        console.error('Failed to initialize settings system:', error)
      }
    }

    initSettings()
  }, [])

  // Android immersive mode and status bar handling
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }

    const setupNavigationBar = async () => {
      const NavigationBar = await import('expo-navigation-bar')
      await NavigationBar.setVisibilityAsync('hidden') // Hides nav buttons
      await NavigationBar.setBehaviorAsync('overlay-swipe') // Swipe up to show
      // Log to confirm navigation bar setup
      console.log('Navigation bar set to hidden with overlay-swipe')
    }

    setupNavigationBar().catch((error) => {
      console.error('Failed to configure Android navigation bar:', error)
    })
  }, [])

  // Ensure status bar is hidden on mount
  useEffect(() => {
    StatusBar.setHidden(true, 'none') // Explicitly hide with no animation
    console.log('Status bar set to hidden')
    return () => {
      StatusBar.setHidden(false) // Restore on unmount (optional)
    }
  }, [])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        {/* Ensure status bar is hidden */}
        <StatusBar
          hidden={true}
          {...(Platform.OS === 'android' && {
            translucent: true, // Ensures status bar doesn't affect layout
            backgroundColor: 'transparent', // Prevents color artifacts
          })}
        />

        <GameProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              // iOS edge-swipe is opt-in per route below. Android retains the
              // existing navigator behavior; gestureEnabled is iOS-specific in
              // the native stack, but this keeps the platform intent explicit.
              gestureEnabled: Platform.OS !== 'ios',
              statusBarHidden: true,
            }}
          >
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="princess/index" />
            <Stack.Screen name="death/index" />
            <Stack.Screen
              name="game/index"
              options={{
                statusBarHidden: true,
              }}
            />
            {IOS_BACK_GESTURE_ROUTES.map((routeName) => (
              <Stack.Screen key={routeName} name={routeName} options={{ gestureEnabled: true }} />
            ))}
          </Stack>
        </GameProvider>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // Android: ensure full-screen by ignoring safe area insets
    ...(Platform.OS === 'android' && { paddingTop: 0 }),
  },
})
