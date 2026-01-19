// app/sub-games/aerowreckage-puzzle/safe.tsx
// Screen [B]: Safe cracking puzzle screen
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { exitSubGame } from '@/lib/subGames';
import { usePuzzleState } from './hooks/usePuzzleState';
import { Dial } from './components/Dial';
import { StepIndicator } from './components/StepIndicator';
import { FeedbackModal } from './components/FeedbackModal';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { subGameTheme } from '../_shared/subGameTheme';
import { AttemptResult } from './types';

const bgPuzzle = require('@/assets/images/aerowreck-safe2.png');

export default function AeroWreckageSafe() {
  const router = useRouter();
  const { state, updateAngle, attemptLock, setDragging } = usePuzzleState();
  const [modalVisible, setModalVisible] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  // When puzzle opens, transition to success page
  useEffect(() => {
    if (state.isOpened) {
      router.replace('/sub-games/aerowreckage-puzzle/success' as any);
    }
  }, [state.isOpened]);

  const handleLeaveWithoutUnlocking = () => {
    if (__DEV__) {
      console.log('[AeroWreckageSafe] Player leaving without unlocking');
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
        router.replace('/sub-games/aerowreckage-puzzle/success' as any);
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
  };

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
          <BottomActionBar>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTryCombination}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Try Combination</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLeaveWithoutUnlocking}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Leave Without Unlocking</Text>
              </TouchableOpacity>
            </View>
          </BottomActionBar>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  primaryButton: {
    flex: 1,
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
});
