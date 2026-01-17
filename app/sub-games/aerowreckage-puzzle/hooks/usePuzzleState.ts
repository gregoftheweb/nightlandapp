// app/sub-games/aerowreckage-puzzle/hooks/usePuzzleState.ts
// Core state management and validation logic for the Dead Dial puzzle

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { PuzzleState, DialDirection } from '../types';
import { PUZZLE_CONFIG, SAVE_KEY, INITIAL_STATE } from '../config';
import { getSubGameSave, setSubGameSave, clearSubGameSave } from '../../_shared';
import { angleToNumber, getRotationDirection, isWithinTolerance } from '../utils';

export function usePuzzleState() {
  const [state, setState] = useState<PuzzleState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for tracking
  const lastNumberRef = useRef<number>(0);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const lastAngleRef = useRef<number>(0);
  
  // Load saved state on mount
  useEffect(() => {
    loadSave();
  }, []);
  
  // Auto-save on state changes (throttled)
  useEffect(() => {
    if (!isLoading && !state.isOpened) {
      throttledSave();
    }
  }, [state, isLoading]);
  
  const loadSave = async () => {
    try {
      const saved = await getSubGameSave<PuzzleState>(SAVE_KEY);
      if (saved && saved.data) {
        setState(saved.data);
        lastNumberRef.current = saved.data.currentNumber;
        lastAngleRef.current = saved.data.currentAngle;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[DeadDial] Error loading save:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const throttledSave = useCallback(() => {
    if (saveThrottleRef.current) {
      clearTimeout(saveThrottleRef.current);
    }
    
    saveThrottleRef.current = setTimeout(() => {
      setSubGameSave(SAVE_KEY, state);
    }, 250);
  }, [state]);
  
  const clearDwellTimer = () => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  };
  
  const resetPuzzle = async () => {
    clearDwellTimer();
    await clearSubGameSave(SAVE_KEY);
    setState(INITIAL_STATE);
    lastNumberRef.current = 0;
    lastAngleRef.current = 0;
  };
  
  const updateAngle = useCallback((newAngle: number) => {
    const newNumber = angleToNumber(newAngle);
    const angleDelta = newAngle - lastAngleRef.current;
    const rotationDirection = getRotationDirection(angleDelta);
    
    // Update last angle
    lastAngleRef.current = newAngle;
    
    // Trigger haptic tick if crossing into a new number
    if (newNumber !== lastNumberRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastNumberRef.current = newNumber;
    }
    
    // If puzzle is already opened, just update angle/number
    if (state.isOpened) {
      setState(prev => ({
        ...prev,
        currentAngle: newAngle,
        currentNumber: newNumber,
      }));
      return;
    }
    
    // Check if we're on the current step
    const currentStep = PUZZLE_CONFIG.codeSteps[state.currentStepIndex];
    if (!currentStep) return;
    
    // Check if rotation direction changed (reset if wrong direction)
    if (rotationDirection && state.lastRotationDirection && rotationDirection !== state.lastRotationDirection) {
      // Direction changed - check if it matches the required direction
      if (rotationDirection !== currentStep.direction) {
        // Wrong direction! Cancel dwell and provide feedback
        clearDwellTimer();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        setState(prev => ({
          ...prev,
          currentAngle: newAngle,
          currentNumber: newNumber,
          lastRotationDirection: rotationDirection,
          dwellStartTime: null,
        }));
        return;
      }
    }
    
    // Update rotation direction if we have movement
    const newRotationDirection = rotationDirection || state.lastRotationDirection;
    
    // Check if we're within tolerance of the target
    const withinTolerance = isWithinTolerance(newNumber, currentStep.target);
    
    if (withinTolerance && newRotationDirection === currentStep.direction) {
      // Start or continue dwell timer
      if (state.dwellStartTime === null) {
        const dwellStartTime = Date.now();
        setState(prev => ({
          ...prev,
          currentAngle: newAngle,
          currentNumber: newNumber,
          lastRotationDirection: newRotationDirection,
          dwellStartTime,
        }));
        
        // Set timer to lock this step
        dwellTimerRef.current = setTimeout(() => {
          lockStep();
        }, currentStep.dwellMs);
      } else {
        // Already dwelling, just update angle/number
        setState(prev => ({
          ...prev,
          currentAngle: newAngle,
          currentNumber: newNumber,
          lastRotationDirection: newRotationDirection,
        }));
      }
    } else {
      // Left tolerance zone - cancel dwell
      clearDwellTimer();
      setState(prev => ({
        ...prev,
        currentAngle: newAngle,
        currentNumber: newNumber,
        lastRotationDirection: newRotationDirection,
        dwellStartTime: null,
      }));
    }
  }, [state]);
  
  const lockStep = useCallback(() => {
    clearDwellTimer();
    
    const newStepIndex = state.currentStepIndex + 1;
    const isLastStep = newStepIndex >= PUZZLE_CONFIG.codeSteps.length;
    
    // Medium haptic for successful lock
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isLastStep) {
      // Safe opened! Success pattern
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setState(prev => ({
        ...prev,
        currentStepIndex: newStepIndex,
        stepHistory: [...prev.stepHistory, prev.currentNumber],
        isOpened: true,
        dwellStartTime: null,
        lastRotationDirection: null,
      }));
    } else {
      // Step completed, move to next
      setState(prev => ({
        ...prev,
        currentStepIndex: newStepIndex,
        stepHistory: [...prev.stepHistory, prev.currentNumber],
        dwellStartTime: null,
        lastRotationDirection: null,
      }));
    }
  }, [state]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDwellTimer();
      if (saveThrottleRef.current) {
        clearTimeout(saveThrottleRef.current);
      }
    };
  }, []);
  
  return {
    state,
    isLoading,
    updateAngle,
    resetPuzzle,
  };
}
