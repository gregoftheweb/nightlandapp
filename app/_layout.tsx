// app/_layout.tsx
import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback, useState } from "react";
import { createInitialGameState, serializeGameState } from "../config/gameState";
import { GameProvider } from "../context/GameContext";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Gabrielle: require("../assets/fonts/Gabrielle.ttf"),
  });

  const [gameState] = useState(createInitialGameState());

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded, onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <GameProvider initialGameState={serializeGameState(gameState)}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen
            name="index"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="princess/index" />
          <Stack.Screen name="game/index" />
        </Stack>
      </GameProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});