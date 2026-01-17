// app/sub-games/aerowreckage-puzzle/components/StepIndicator.tsx
// Progress indicator showing locked steps

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PUZZLE_CONFIG } from '../config';
import { THEME } from '../theme';

interface StepIndicatorProps {
  currentStepIndex: number;
  stepHistory: number[];
  isOpened: boolean;
}

export function StepIndicator({ currentStepIndex, stepHistory, isOpened }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code Sequence</Text>
      <View style={styles.stepsContainer}>
        {PUZZLE_CONFIG.codeSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex && !isOpened;
          const lockedNumber = stepHistory[index];
          
          return (
            <View key={index} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCompleted,
                  isActive && styles.stepActive,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.stepNumberCompleted}>{lockedNumber}</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    ?
                  </Text>
                )}
              </View>
              <Text style={styles.stepDirection}>{step.direction}</Text>
            </View>
          );
        })}
      </View>
      {isOpened && (
        <Text style={styles.openedText}>✓ SAFE OPENED</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.brass,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.brass,
    marginBottom: 15,
    letterSpacing: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.stepInactive,
    borderWidth: 2,
    borderColor: THEME.brassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: THEME.dialCenter,
    borderColor: THEME.brass,
    borderWidth: 3,
  },
  stepCompleted: {
    backgroundColor: THEME.stepCompleted,
    borderColor: THEME.success,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.textMuted,
  },
  stepNumberActive: {
    color: THEME.brass,
  },
  stepNumberCompleted: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.background,
  },
  stepDirection: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  openedText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.success,
    letterSpacing: 2,
  },
});
