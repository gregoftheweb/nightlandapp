// app/sub-games/aerowreckage-puzzle/safe.tsx
// Screen [B]: Safe cracking puzzle screen
import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/modules/subGames'
import { usePuzzleState } from './hooks/usePuzzleState'
import { Dial } from './components/Dial'
import { StepIndicator } from './components/StepIndicator'
import { FeedbackModal } from './components/FeedbackModal'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { AttemptResult } from './types'

const bgPuzzle = require('@/assets/images/aerowreck-safe2.png')

export default function AeroWreckageSafe() {
  const router = useRouter()
  const { state, updateAngle, attemptLock } = usePuzzleState()

  const [modalVisible, setModalVisible] = useState(false)
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null)

  // ✅ Prevent double navigation + cancel delayed timers on unmount
  const didNavigateRef = useRef(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToSuccessOnce = () => {
    if (didNavigateRef.current) return
    didNavigateRef.current = true

    if (__DEV__) console.log('[AeroWreckageSafe] Navigating to success (once)')
    router.replace('/sub-games/aerowreckage-puzzle/success' as any)
  }

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
        successTimerRef.current = null
        if (__DEV__) console.log('[AeroWreckageSafe] Cleared pending success timer on unmount')
      }
    }
  }, [])

  // When puzzle opens, transition to success page (but only once)
  useEffect(() => {
    if (state.isOpened) {
      // If we scheduled a delayed nav, cancel it and just go now
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
        successTimerRef.current = null
      }
      goToSuccessOnce()
    }
  }, [state.isOpened])

  const handleLeaveWithoutUnlocking = () => {
    if (__DEV__) console.log('[AeroWreckageSafe] Player leaving without unlocking')
     router.back()
  }

  const handleTryCombination = () => {
    const result = attemptLock()
    setAttemptResult(result)
    setModalVisible(true)

    // If safe opened, close modal after delay, but DO NOT navigate here.
    // The state.isOpened effect will do navigation once and will cancel this timer if needed.
    if (result.type === 'safe_opened') {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)

      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null
        setModalVisible(false)
        if (__DEV__) console.log('[AeroWreckageSafe] Closing modal after safe_opened delay')
        // ✅ no router.replace here
      }, 2000)
    }
  }

  const handleCenterTap = () => {
    handleTryCombination()
  }

  const handleModalDismiss = () => {
    setModalVisible(false)
  }

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
            />
          </View>

          {/* Buttons at Bottom */}
          <BottomActionBar>
            <View style={styles.buttonRow}>

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
  )
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
})
