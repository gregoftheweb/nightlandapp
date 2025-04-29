// app/splash/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();

  const handlePress = () => {
    console.log('Navigating to princess');
    router.push('../princess');
  };

  console.log('Rendering Splash component');
  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>Splash Screen Rendering</Text>
      <Image
        source={require('../../assets/images/splashscreen.png')}
        style={styles.splashImage}
        resizeMode="contain"
        onError={(error) => console.log('Image load error:', error.nativeEvent)}
        onLoad={() => console.log('Image loaded successfully')}
      />
      <Text style={styles.title}>Nightland</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Enter the Nightland</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 10,
    borderColor: 'green',
  },
  debugText: {
    color: '#ff0',
    fontSize: 24,
    marginBottom: 20,
    backgroundColor: '#00f',
  },
  splashImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: '#fff',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});