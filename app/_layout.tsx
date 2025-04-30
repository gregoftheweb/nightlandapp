// app/_layout.tsx
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Gabrielle: require('../assets/fonts/Gabrielle.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded, onLayoutRootView]);

  if (!fontsLoaded) {
    // Render nothing (or a simple fallback) until font is loaded
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="index" // Home / splash screen
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="princess" />
        <Stack.Screen name="gameplay" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
