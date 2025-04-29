// app/gameplay/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GameplayScreen() {
  console.log('Rendering GameplayScreen component');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Gameplay Screen</Text>
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
  text: {
    color: '#fff',
    fontSize: 24,
  },
});