// app/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    console.log('Forcing navigation to splash');
    router.replace('/splash');
  }, []);

  console.log('Rendering Layout component');
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="splash"
          options={{ gestureEnabled: false }}
          redirect={false}
        />
        <Stack.Screen
          name="princess"
          redirect={false}
        />
        <Stack.Screen
          name="gameplay"
          redirect={false}
        />
        <Stack.Screen
          name="index"
          redirect={false}
        />
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