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
import { STRINGS } from "../../resources/strings";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PrincessScreen() {
  const router = useRouter();

  const handlePress = () => {
    console.log("Navigating to gameplay");
    router.push("../gameplay");
  };

  console.log("Rendering PrincessScreen component");
  return (
    <ImageBackground
      source={require("../../assets/images/sadprincess.png")} // Adjust path if needed
      resizeMode="cover"
      style={styles.backgroundImage}
    >
        <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>{STRINGS.princessScreen.text}</Text>
        </View>

        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>
              {STRINGS.princessScreen.buttonText}
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
  text: {
    color: "red",
    fontSize: 22,
    fontFamily: 'Gabrielle',
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
    fontFamily: 'Gabrielle',
  },
});
