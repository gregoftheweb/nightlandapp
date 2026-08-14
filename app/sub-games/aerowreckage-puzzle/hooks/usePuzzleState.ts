// app/sub-games/aerowreckage-puzzle/hooks/usePuzzleState.ts
// Core state management and validation logic for the Dead Dial puzzle

import { useState, useEffect, useRef, useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { PuzzleState, DialDirection, AttemptResult } from '../types'
import { PUZZLE_CONFIG, SAVE_KEY, INITIAL_STATE } from '../config'
import { getSubGameSave, setSubGameSave, clearSubGameSave } from '../../_shared'
import { angleToNumber, getRotationDirection, isWithinTolerance } from '../utils'

export function usePuzzleState() {
  const [state, setState] = useState<PuzzleState>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(true)

  // Refs for tracking
  const lastNumberRef = useRef<number>(0)
  const saveThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const immediatelySavedStateRef = useRef<PuzzleState | null>(null)
  const lastAngleRef = useRef<number>(0)

  const enqueueSave = useCallback((snapshot: PuzzleState): Promise<void> => {
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => setSubGameSave(SAVE_KEY, snapshot))
    saveQueueRef.current = write
    return write
  }, [])

  // Load saved state on mount
  useEffect(() => {
    loadSave()
  }, [])

  // Auto-save on state changes (throttled)
  useEffect(() => {
    if (!isLoading && !state.isOpened) {
      if (immediatelySavedStateRef.current === state) {
        immediatelySavedStateRef.current = null
        return
      }

      if (saveThrottleRef.current) clearTimeout(saveThrottleRef.current)

      const snapshot = state
      saveThrottleRef.current = setTimeout(() => {
        saveThrottleRef.current = null
        void enqueueSave(snapshot)
      }, 250)
    }
  }, [enqueueSave, state, isLoading])

  const loadSave = async () => {
    try {
      const saved = await getSubGameSave<PuzzleState>(SAVE_KEY)
      if (saved && saved.data) {
        setState(saved.data)
        lastNumberRef.current = saved.data.currentNumber
        lastAngleRef.current = saved.data.currentAngle
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[DeadDial] Error loading save:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetPuzzle = async () => {
    if (saveThrottleRef.current) {
      clearTimeout(saveThrottleRef.current)
      saveThrottleRef.current = null
    }
    await saveQueueRef.current
    await clearSubGameSave(SAVE_KEY)
    setState(INITIAL_STATE)
    lastNumberRef.current = 0
    lastAngleRef.current = 0
  }

  const updateAngle = useCallback((newAngle: number, explicitDirection?: DialDirection) => {
    const newNumber = angleToNumber(newAngle)
    const angleDelta = newAngle - lastAngleRef.current
    const rotationDirection = explicitDirection ?? getRotationDirection(angleDelta)

    // Update last angle
    lastAngleRef.current = newAngle

    lastNumberRef.current = newNumber

    setState((prev) => {
      // If puzzle is already opened, just update angle/number
      if (prev.isOpened) {
        return {
          ...prev,
          currentAngle: newAngle,
          currentNumber: newNumber,
        }
      }

      return {
        ...prev,
        currentAngle: newAngle,
        currentNumber: newNumber,
        lastRotationDirection: rotationDirection || prev.lastRotationDirection,
      }
    })
  }, [])

  const attemptLock = useCallback((): AttemptResult => {
    if (state.isOpened) {
      return { success: false, message: 'Safe already opened', type: 'already_opened' }
    }

    const currentStep = PUZZLE_CONFIG.codeSteps[state.currentStepIndex]
    if (!currentStep) {
      return { success: false, message: 'No more steps', type: 'error' }
    }

    const currentNumber = state.currentNumber
    const currentDirection = state.lastRotationDirection

    // Check direction
    if (!currentDirection || currentDirection !== currentStep.direction) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const directionText = currentStep.direction === 'CW' ? 'clockwise' : 'counter-clockwise'
      return {
        success: false,
        message: 'Not yet…',
        hint: `Try rotating ${directionText}`,
        type: 'wrong_direction',
      }
    }

    // Check if within tolerance
    if (!isWithinTolerance(currentNumber, currentStep.target)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return {
        success: false,
        message: 'Wrong position',
        hint: 'Try the next mark',
        type: 'wrong_number',
      }
    }

    // Success! Lock this step
    // Only checking direction and position - no dwell time requirement
    const newStepIndex = state.currentStepIndex + 1
    const isLastStep = newStepIndex >= PUZZLE_CONFIG.codeSteps.length

    // Heavy haptic for successful lock (safe clunk)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    if (isLastStep) {
      // Safe opened! Success pattern
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    // Update state
    const newState = {
      ...state,
      currentStepIndex: newStepIndex,
      stepHistory: [...state.stepHistory, state.currentNumber],
      isOpened: isLastStep,
      lastRotationDirection: null,
    }

    immediatelySavedStateRef.current = newState
    setState(newState)

    // Cancel the older delayed snapshot, then serialize this milestone behind
    // any storage write that has already started so the milestone wins.
    if (saveThrottleRef.current) {
      clearTimeout(saveThrottleRef.current)
      saveThrottleRef.current = null
    }
    void enqueueSave(newState)

    return isLastStep
      ? {
          success: true,
          message: 'The safe groans open…',
          type: 'safe_opened',
        }
      : {
          success: true,
          message: 'Click… Tumblers set.',
          type: 'step_locked',
        }
  }, [enqueueSave, state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveThrottleRef.current) {
        clearTimeout(saveThrottleRef.current)
      }
    }
  }, [])

  return {
    state,
    isLoading,
    updateAngle,
    resetPuzzle,
    attemptLock,
  }
}
