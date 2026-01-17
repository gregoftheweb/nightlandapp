// app/sub-games/aerowreckage-puzzle/index.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/context/GameContext';
import { exitSubGame } from '@/lib/subGames';
import { usePuzzleState } from './hooks/usePuzzleState';
import { Dial } from './components/Dial';
import { StepIndicator } from './components/StepIndicator';
import { InstructionOverlay } from './components/InstructionOverlay';
import { THEME } from './theme';

export default function AeroWreckagePuzzle() {
  const router = useRouter();
  const { state: gameState, dispatch, signalRpgResume } = useGameContext();
  const { state, isLoading, updateAngle, resetPuzzle } = usePuzzleState();

  useEffect(() => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Mounted, current gamestate:', gameState);
    }
  }, [gameState]);

  const handleCollect = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player collected maguffin! Updating gamestate...');
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

  const handleExit = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player exiting without completion');
    }

    // Exit without marking as completed
    exitSubGame({ completed: false });
  };

  const handleReset = async () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Resetting puzzle');
    }
    await resetPuzzle();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.brass} />
        <Text style={styles.loadingText}>Loading puzzle...</Text>
      </View>
    );
  }

  const isDwelling = state.dwellStartTime !== null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <InstructionOverlay isOpened={state.isOpened} />

        {/* Step Progress */}
        <StepIndicator
          currentStepIndex={state.currentStepIndex}
          stepHistory={state.stepHistory}
          isOpened={state.isOpened}
        />

        {/* Dial */}
        <Dial
          currentAngle={state.currentAngle}
          currentNumber={state.currentNumber}
          onAngleChange={updateAngle}
          isDwelling={isDwelling}
        />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {state.isOpened ? (
            <TouchableOpacity
              style={styles.collectButton}
              onPress={handleCollect}
              activeOpacity={0.7}
            >
              <Text style={styles.collectButtonText}>Collect Maguffin</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset Puzzle</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleExit}
            activeOpacity={0.7}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
  buttonContainer: {
    gap: 12,
    paddingHorizontal: 20,
  },
  collectButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: THEME.success,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.success,
    shadowColor: THEME.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  collectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.background,
    textAlign: 'center',
    letterSpacing: 1,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.brass,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.brass,
    textAlign: 'center',
  },
  exitButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.textMuted,
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textSecondary,
    textAlign: 'center',
  },
});
