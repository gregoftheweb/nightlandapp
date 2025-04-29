// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  console.log('Rendering Home component');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
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
    borderColor: 'purple',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});