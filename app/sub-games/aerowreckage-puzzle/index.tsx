// app/sub-games/aerowreckage-puzzle/index.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/context/GameContext';
import { exitSubGame } from '@/lib/subGames';

export default function AeroWreckagePuzzle() {
  const router = useRouter();
  const { state, dispatch, signalRpgResume } = useGameContext();

  useEffect(() => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Mounted, current gamestate:', state);
    }
  }, [state]);

  const handleWin = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player won! Updating gamestate...');
    }

    // Update gamestate: mark aerowreckage puzzle as completed
    dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: {
        subGameName: 'aerowreckage-puzzle',
        completed: true,
      },
    });

    // Signal RPG to refresh
    signalRpgResume();

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Aero-Wreckage Puzzle</Text>
        <Text style={styles.description}>
          You investigate the ancient aerocraft wreckage. Strange devices and
          mysterious mechanisms lie before you.
        </Text>
        
        <TouchableOpacity
          style={styles.winButton}
          onPress={handleWin}
          activeOpacity={0.7}
        >
          <Text style={styles.winButtonText}>I Win</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  winButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#990000',
  },
  winButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
