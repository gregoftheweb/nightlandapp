// app/sub-games/aerowreckage-puzzle/success.tsx
// Screen [C]: Success screen after opening the safe
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/context/GameContext';
import { exitSubGame } from '@/lib/subGames';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { subGameTheme } from '../_shared/subGameTheme';
import { usePuzzleState } from './hooks/usePuzzleState';

const bgSuccess = require('@/assets/images/aerowreck-safe3.png');

export default function AeroWreckageSuccess() {
  const router = useRouter();
  const { dispatch, signalRpgResume } = useGameContext();
  const { resetPuzzle } = usePuzzleState();

  const handleReturnToQuest = () => {
    if (__DEV__) {
      console.log('[AeroWreckageSuccess] Player returning to quest after success');
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

  const handleResetPuzzle = async () => {
    if (__DEV__) {
      console.log('[AeroWreckageSuccess] Resetting puzzle for testing');
    }
    await resetPuzzle();
    router.replace('/sub-games/aerowreckage-puzzle/entry' as any);
  };

  return (
    <BackgroundImage source={bgSuccess}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.successText}>Christos Succeeds!</Text>
        </View>

        <BottomActionBar>
          {__DEV__ && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFull]}
            onPress={handleReturnToQuest}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Return to Quest</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    letterSpacing: 2,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonFull: {
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: subGameTheme.blue,
    textAlign: 'center',
  },
});
