// app/death/index.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SPLASH_STRINGS } from "@/assets/copy/splashscreen";
import { useGameContext } from "@/context/GameContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DeathScreen() {
  const router = useRouter();
  const { state, dispatch } = useGameContext();

  const handlePress = () => {
    console.log("Restarting game from death screen");
    dispatch({ type: "RESET_GAME" });
    router.push("/princess");
  };

  // Extract stats from game state
  const monstersKilled = state.monstersKilled || 0;
  const distanceTraveled = state.distanceTraveled || 0;
  const killerName = state.killerName || "unknown horror";

  console.log("Rendering DeathScreen component");
  return (
    <ImageBackground
      source={require("../../assets/images/splashscreen.png")}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{SPLASH_STRINGS.deathScreen.title}</Text>
          <Text style={styles.text}>
            {`\nSlain by the ${killerName}.\n\n`}
            {`Monsters killed: ${monstersKilled}\n`}
            {`Distance traveled: ${distanceTraveled} steps`}
          </Text>
        </View>

        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>
              {SPLASH_STRINGS.deathScreen.buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  textContainer: {
    borderWidth: 2,
    borderColor: "red",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  title: {
    color: "red",
    fontSize: 28,
    fontFamily: "Gabrielle",
    fontWeight: "bold",
  },
  text: {
    color: "red",
    fontSize: 22,
    fontFamily: "Gabrielle",
  },
  overlay: {
    alignItems: "center",
    paddingBottom: 60,
  },
  button: {
    backgroundColor: "transparent",
    borderColor: "red",
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "red",
    fontSize: 26,
    fontFamily: "Gabrielle",
  },
});
