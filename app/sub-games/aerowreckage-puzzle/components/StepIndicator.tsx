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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.brass,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.brass,
    marginBottom: 12,
    letterSpacing: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    gap: 18,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textMuted,
  },
  stepNumberActive: {
    color: THEME.brass,
  },
  stepNumberCompleted: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.background,
  },
  stepDirection: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  openedText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.success,
    letterSpacing: 2,
  },
});
