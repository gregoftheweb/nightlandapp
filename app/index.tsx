import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { STRINGS } from '../assets/copy/strings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const handlePress = () => {
    router.replace('/princess');
  };

  return (
    <ImageBackground
      source={require('../assets/images/splashscreen.png')} // Adjust path if needed
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>{STRINGS.splashScreen.buttonText}</Text>
        </TouchableOpacity>
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
  overlay: {
    flex: 1,
    justifyContent: "center", // center vertically
    alignItems: "center",     // center horizontally
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
