// app/sub-games/aerowreckage-puzzle/safe.tsx
// Screen [B]: Safe cracking puzzle screen
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
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
  const { width, height } = useWindowDimensions()

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
      }, 2000)
    }
  }

  const handleCenterTap = () => {
    handleTryCombination()
  }

  const handleModalDismiss = () => {
    setModalVisible(false)
  }

  /**
   * Responsive dial scaling:
   * - Base off the shortest dimension, so portrait phones shrink the dial.
   * - Clamp so it never gets absurdly huge on tablets or too tiny on small phones.
   */
  const dialScale = useMemo(() => {
    const shortest = Math.min(width, height)

    // Target: dial uses ~70% of shortest dimension; clamp to avoid extremes.
    const targetDialPx = Math.max(240, Math.min(380, shortest * 0.7))

    // Dial component likely has an internal "comfortable" size around 340-360px.
    // Scaling an outer wrapper is safest without changing Dial internals.
    const base = 360
    const scale = targetDialPx / base

    return Math.max(0.72, Math.min(1.0, scale))
  }, [width, height])

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

          {/* Dial Centered + Responsive Scale */}
          <View style={styles.dialArea}>
            <View
              style={[
                styles.dialScaledWrapper,
                { transform: [{ translateX: 22 }, { scale: dialScale }] }, // 👈 nudge right
              ]}
            >
              <Dial
                currentAngle={state.currentAngle}
                currentNumber={state.currentNumber}
                onAngleChange={updateAngle}
                onCenterTap={handleCenterTap}
              />
            </View>
          </View>

          {/* Buttons at Bottom */}
          <BottomActionBar>
            <View style={styles.buttonRow}>
              

              <TouchableOpacity
                style={[styles.buttonBase, styles.primaryButton]}
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
  },

  stepContainer: {
    paddingTop: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  /**
   * dialArea takes remaining space between StepIndicator and BottomActionBar.
   * Padding ensures the dial never kisses the edges on portrait.
   */
  dialArea: {
    flex: 1,
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  /**
   * Scaling wrapper: keeps the dial centered while shrinking on phones.
   * Important: scale affects the dial and its side buttons together.
   */
  dialScaledWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Two buttons, always visible:
   * - On wider screens: side-by-side
   * - On narrow screens: wraps into two rows
   */
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 12,
  },

  buttonBase: {
    flexGrow: 1,
    flexBasis: 180,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: subGameTheme.red,
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

  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: subGameTheme.blue,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
})
