// app/princess/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrincessScreen() {
  const router = useRouter();

  const handlePress = () => {
    console.log('Navigating to gameplay');
    router.push('../gameplay');
  };

  console.log('Rendering PrincessScreen component');
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/sadprincess.png')}
        style={styles.princessImage}
        resizeMode="contain"
        onError={(error) => console.log('Image load error:', error.nativeEvent)}
        onLoad={() => console.log('Image loaded successfully')}
      />
      <Text style={styles.title}>The Princess Awaits</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Start Game</Text>
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
  princessImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: '#fff',
  },
  title: {
    color: '#fff',
    fontSize: 28,
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