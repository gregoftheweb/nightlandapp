// app/sub-games/aerowreckage-puzzle/hooks/usePuzzleState.ts
// Core state management and validation logic for the Dead Dial puzzle

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { PuzzleState, DialDirection, AttemptResult } from '../types';
import { PUZZLE_CONFIG, SAVE_KEY, INITIAL_STATE } from '../config';
import { getSubGameSave, setSubGameSave, clearSubGameSave } from '../../_shared';
import { angleToNumber, getRotationDirection, isWithinTolerance } from '../utils';

const HAPTIC_TICK_MIN_INTERVAL_MS = 50; // Minimum 50ms between ticks for crisp feel

export function usePuzzleState() {
  const [state, setState] = useState<PuzzleState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for tracking
  const lastNumberRef = useRef<number>(0);
  const lastTickNumberRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const saveThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const lastAngleRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const inToleranceSinceRef = useRef<number | null>(null);
  
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
  
  const resetPuzzle = async () => {
    await clearSubGameSave(SAVE_KEY);
    setState(INITIAL_STATE);
    lastNumberRef.current = 0;
    lastAngleRef.current = 0;
    lastTickNumberRef.current = 0;
    lastTickTimeRef.current = 0;
    inToleranceSinceRef.current = null;
  };
  
  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);
  
  const updateAngle = useCallback((newAngle: number) => {
    const newNumber = angleToNumber(newAngle);
    const angleDelta = newAngle - lastAngleRef.current;
    const rotationDirection = getRotationDirection(angleDelta);
    
    // Update last angle
    lastAngleRef.current = newAngle;
    
    // Trigger haptic tick if crossing into a new number (only while dragging)
    if (isDraggingRef.current && newNumber !== lastTickNumberRef.current) {
      const now = Date.now();
      const timeSinceLastTick = now - lastTickTimeRef.current;
      
      if (timeSinceLastTick >= HAPTIC_TICK_MIN_INTERVAL_MS) {
        Haptics.selectionAsync(); // Light tick sound
        lastTickNumberRef.current = newNumber;
        lastTickTimeRef.current = now;
      }
    }
    
    lastNumberRef.current = newNumber;
    
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
    
    // Update rotation direction if we have movement
    const newRotationDirection = rotationDirection || state.lastRotationDirection;
    
    // Check if we're within tolerance of the target
    const withinTolerance = isWithinTolerance(newNumber, currentStep.target);
    
    // Track tolerance dwell time
    if (withinTolerance && newRotationDirection === currentStep.direction) {
      if (inToleranceSinceRef.current === null) {
        inToleranceSinceRef.current = Date.now();
      }
    } else {
      inToleranceSinceRef.current = null;
    }
    
    // Just update state, no auto-locking
    setState(prev => ({
      ...prev,
      currentAngle: newAngle,
      currentNumber: newNumber,
      lastRotationDirection: newRotationDirection,
    }));
  }, [state]);
  
  const attemptLock = useCallback((): AttemptResult => {
    if (state.isOpened) {
      return { success: false, message: 'Safe already opened', type: 'already_opened' };
    }
    
    const currentStep = PUZZLE_CONFIG.codeSteps[state.currentStepIndex];
    if (!currentStep) {
      return { success: false, message: 'No more steps', type: 'error' };
    }
    
    const currentNumber = state.currentNumber;
    const currentDirection = state.lastRotationDirection;
    
    // Check direction
    if (!currentDirection || currentDirection !== currentStep.direction) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return {
        success: false,
        message: 'Not yet…',
        hint: `Try rotating ${currentStep.direction === 'L' ? 'left' : 'right'}`,
        type: 'wrong_direction'
      };
    }
    
    // Check if within tolerance
    if (!isWithinTolerance(currentNumber, currentStep.target)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return {
        success: false,
        message: 'Wrong position',
        hint: 'Try the next mark',
        type: 'wrong_number'
      };
    }
    
    // Check dwell time
    const now = Date.now();
    const dwellTime = inToleranceSinceRef.current ? now - inToleranceSinceRef.current : 0;
    
    if (dwellTime < currentStep.dwellMs) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return {
        success: false,
        message: 'Hold steady…',
        hint: 'Keep the dial on this number a bit longer before trying',
        type: 'insufficient_dwell'
      };
    }
    
    // Success! Lock this step
    const newStepIndex = state.currentStepIndex + 1;
    const isLastStep = newStepIndex >= PUZZLE_CONFIG.codeSteps.length;
    
    // Heavy haptic for successful lock (safe clunk)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    if (isLastStep) {
      // Safe opened! Success pattern
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setState(prev => ({
        ...prev,
        currentStepIndex: newStepIndex,
        stepHistory: [...prev.stepHistory, prev.currentNumber],
        isOpened: true,
        lastRotationDirection: null,
      }));
      
      // Reset tolerance tracking
      inToleranceSinceRef.current = null;
      
      // Save immediately
      setSubGameSave(SAVE_KEY, {
        ...state,
        currentStepIndex: newStepIndex,
        stepHistory: [...state.stepHistory, state.currentNumber],
        isOpened: true,
        lastRotationDirection: null,
      });
      
      return {
        success: true,
        message: 'The safe groans open…',
        type: 'safe_opened'
      };
    } else {
      // Step completed, move to next
      setState(prev => ({
        ...prev,
        currentStepIndex: newStepIndex,
        stepHistory: [...prev.stepHistory, prev.currentNumber],
        lastRotationDirection: null,
      }));
      
      // Reset tolerance tracking for next step
      inToleranceSinceRef.current = null;
      
      // Save immediately
      setSubGameSave(SAVE_KEY, {
        ...state,
        currentStepIndex: newStepIndex,
        stepHistory: [...state.stepHistory, state.currentNumber],
        lastRotationDirection: null,
      });
      
      return {
        success: true,
        message: 'Click… Tumblers set.',
        type: 'step_locked'
      };
    }
  }, [state]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    attemptLock,
    setDragging,
  };
}
