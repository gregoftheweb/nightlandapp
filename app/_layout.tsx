import { Stack } from 'expo-router'
import { View, StyleSheet, StatusBar, Platform } from 'react-native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as NavigationBar from 'expo-navigation-bar'
import { useEffect, useCallback, useState } from 'react'
import { createInitialGameState, serializeGameState } from '../modules/gameState'
import { GameProvider } from '../context/GameContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { audioManager } from '../modules/audioManager'

SplashScreen.preventAutoHideAsync()

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

  const [gameState] = useState(() => {
    const gs = createInitialGameState()
    // console.log("Initial game state:", gs);
    return gs
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
    const initAudio = async () => {
      try {
        await audioManager.initializeAudio()
        await audioManager.loadBackgroundMusic()
        console.log('Audio system initialized')
      } catch (error) {
        console.error('Failed to initialize audio system:', error)
      }
    }

    initAudio()

    // Cleanup on unmount
    return () => {
      audioManager.cleanup()
    }
  }, [])

  // Android immersive mode and status bar handling
  useEffect(() => {
    const setupNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden') // Hides nav buttons
        await NavigationBar.setBehaviorAsync('overlay-swipe') // Swipe up to show
        // Log to confirm navigation bar setup
        console.log('Navigation bar set to hidden with overlay-swipe')
      } catch (e) {
        console.warn('NavigationBar control not supported:', e)
      }
    }
    setupNavigationBar()
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
          translucent={true} // Android: ensures status bar doesn't affect layout
          backgroundColor="transparent" // Android: prevents color artifacts
        />

        <GameProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              statusBarHidden: true,
            }}
          >
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="princess/index" />
            <Stack.Screen name="death/index" />
            <Stack.Screen
              name="game/index"
              options={{
                presentation: 'fullScreenModal',
                statusBarHidden: true,
              }}
            />
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
