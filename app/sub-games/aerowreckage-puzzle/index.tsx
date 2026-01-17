// app/sub-games/aerowreckage-puzzle/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/context/GameContext';
import { exitSubGame } from '@/lib/subGames';
import { usePuzzleState } from './hooks/usePuzzleState';
import { Dial } from './components/Dial';
import { StepIndicator } from './components/StepIndicator';
import { FeedbackModal } from './components/FeedbackModal';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { THEME } from './theme';
import { AttemptResult } from './types';

// Import background images
const bgIntro = require('@/assets/images/aerowreck-safe1.png');
const bgPuzzle = require('@/assets/images/aerowreck-safe2.png');

type GamePage = 'intro' | 'puzzle' | 'success';

export default function AeroWreckagePuzzle() {
  const router = useRouter();
  const { state: gameState, dispatch, signalRpgResume } = useGameContext();
  const { state, isLoading, updateAngle, resetPuzzle, attemptLock, setDragging } = usePuzzleState();
  const [currentPage, setCurrentPage] = useState<GamePage>('intro');
  const [modalVisible, setModalVisible] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Mounted, current gamestate:', gameState);
    }
  }, [gameState]);

  // If puzzle was already opened, go to success page
  useEffect(() => {
    if (!isLoading && state.isOpened) {
      setCurrentPage('success');
    }
  }, [isLoading, state.isOpened]);

  // When puzzle opens, transition to success page
  useEffect(() => {
    if (state.isOpened && currentPage === 'puzzle') {
      setCurrentPage('success');
    }
  }, [state.isOpened, currentPage]);

  const handleAttemptOpen = () => {
    setCurrentPage('puzzle');
  };

  const handleLeaveTreasure = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player leaving treasure untouched');
    }
    exitSubGame({ completed: false });
  };

  const handleResetPuzzle = async () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Resetting puzzle for testing');
    }
    await resetPuzzle();
    setCurrentPage('intro');
  };

  const handleLeaveWithoutUnlocking = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player leaving without unlocking');
    }
    exitSubGame({ completed: false });
  };

  const handleTryCombination = () => {
    const result = attemptLock();
    setAttemptResult(result);
    setModalVisible(true);
    
    // If safe opened, navigate to success page after a delay
    if (result.type === 'safe_opened') {
      setTimeout(() => {
        setModalVisible(false);
        setCurrentPage('success');
      }, 2000);
    }
  };

  const handleCenterTap = () => {
    handleTryCombination();
  };

  const handleDragStart = () => {
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const handleModalDismiss = () => {
    setModalVisible(false);
    // Don't navigate if safe opened - that's handled in handleTryCombination
  };

  const handleReturnToQuest = () => {
    if (__DEV__) {
      console.log('[AeroWreckagePuzzle] Player returning to quest after success');
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.brass} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Page 1: Introduction
  if (currentPage === 'intro') {
    return (
      <BackgroundImage source={bgIntro}>
        <View style={styles.container}>
          <View style={styles.centeredContent}>
            <Text style={styles.flavorText}>
              You find a dust covered safe under some strewn wreckage of the ancient craft.
            </Text>
            <Text style={styles.flavorTextSecondary}>
              Christos ponders the treasure within?
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAttemptOpen}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>He attempts to open it.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLeaveTreasure}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>He leaves the treasure untouched.</Text>
              </TouchableOpacity>
              
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={handleResetPuzzle}
                  activeOpacity={0.7}
                >
                  <Text style={styles.debugButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </BackgroundImage>
    );
  }

  // Page 2: Puzzle
  if (currentPage === 'puzzle') {
    return (
      <BackgroundImage source={bgPuzzle}>
        <View style={styles.container}>
          <View style={styles.puzzleContent}>
            {/* Step Progress at Top */}
            <View style={styles.stepContainer}>
              <StepIndicator
                currentStepIndex={state.currentStepIndex}
                stepHistory={state.stepHistory}
                isOpened={state.isOpened}
              />
            </View>

            {/* Dial Centered */}
            <View style={styles.dialContainer}>
              <Dial
                currentAngle={state.currentAngle}
                currentNumber={state.currentNumber}
                onAngleChange={updateAngle}
                onCenterTap={handleCenterTap}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </View>

            {/* Buttons at Bottom */}
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={styles.tryButton}
                onPress={handleTryCombination}
                activeOpacity={0.7}
              >
                <Text style={styles.tryButtonText}>Try Combination</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLeaveWithoutUnlocking}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Christos leaves without unlocking.</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Feedback Modal */}
          {attemptResult && (
            <FeedbackModal
              visible={modalVisible}
              type={attemptResult.type}
              message={attemptResult.message}
              hint={attemptResult.hint}
              onDismiss={handleModalDismiss}
            />
          )}
        </View>
      </BackgroundImage>
    );
  }

  // Page 3: Success
  return (
    <View style={styles.container}>
      <View style={styles.centeredContent}>
        <Text style={styles.successText}>Christos Succeeds!</Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleReturnToQuest}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>He returns to the quest.</Text>
          </TouchableOpacity>
          
          {__DEV__ && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleResetPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.debugButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 30,
  },
  flavorText: {
    fontSize: 18,
    color: THEME.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  flavorTextSecondary: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.success,
    textAlign: 'center',
    letterSpacing: 2,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: THEME.brass,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.brassLight,
    shadowColor: THEME.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.background,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.textMuted,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  puzzleContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  bottomButtonContainer: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 12,
  },
  tryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: THEME.brass,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.brassLight,
    shadowColor: THEME.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.background,
    textAlign: 'center',
    letterSpacing: 1,
  },
  debugButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#444',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
    marginTop: 10,
  },
  debugButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
    textAlign: 'center',
  },
});
