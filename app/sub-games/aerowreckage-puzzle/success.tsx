// app/sub-games/aerowreckage-puzzle/success.tsx
// Screen [C]: Success screen after opening the safe
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Asset } from 'expo-asset'
import { useGameContext } from '@/context/GameContext'
import { exitSubGame } from '@/modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { subGameTheme } from '../_shared/subGameTheme'
//import { usePuzzleState } from './hooks/usePuzzleState'
import { LayoutChangeEvent } from 'react-native'

const bgSuccess = require('@/assets/images/aerowreck-safe3.png')
const LAZER_PISTOL_WEAPON_ID = 'weapon-lazer-pistol-001'

export default function AeroWreckageSuccess() {
  const router = useRouter()
  const { state, dispatch, signalRpgResume } = useGameContext()
  //const { resetPuzzle } = usePuzzleState()

  const [showAcquiredModal, setShowAcquiredModal] = useState(false)
  const [ready, setReady] = useState(false)

  // ✅ DEBUG HOOKS MUST BE ABOVE ANY EARLY RETURN
  const t0 = React.useRef(Date.now())
  const renderCount = React.useRef(0)
  renderCount.current += 1

  const onRootLayout = (e: LayoutChangeEvent) => {
    const { width, height, x, y } = e.nativeEvent.layout
    console.log(`[AeroWreckageSuccess] root onLayout +${Date.now() - t0.current}ms`, {
      width,
      height,
      x,
      y,
    })
  }

  // Preload background to prevent decode snap
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await Asset.fromModule(bgSuccess).downloadAsync()
      } catch (e) {
        if (__DEV__) console.warn('[AeroWreckageSuccess] Failed to preload background', e)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const hasLazerPistol = state.player.rangedWeaponInventoryIds.includes(LAZER_PISTOL_WEAPON_ID)

  // ✅ Safe: this is not a hook; just a log
  console.log(
    `[AeroWreckageSuccess] render #${renderCount.current} +${Date.now() - t0.current}ms`,
    { ready, showAcquiredModal, hasLazerPistol }
  )

  // (optional but useful) log when these flip
  useEffect(() => {
    console.log(`[AeroWreckageSuccess] ready changed +${Date.now() - t0.current}ms`, ready)
  }, [ready])

  useEffect(() => {
    console.log(
      `[AeroWreckageSuccess] showAcquiredModal changed +${Date.now() - t0.current}ms`,
      showAcquiredModal
    )
  }, [showAcquiredModal])

  if (!ready) {
    return <View style={styles.loadingFrame} />
  }

  const handlePickUpLazerPistol = () => {
    if (hasLazerPistol) return

    dispatch({
      type: 'ADD_RANGED_WEAPON',
      payload: { id: LAZER_PISTOL_WEAPON_ID },
    })

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setShowAcquiredModal(true)
  }

  const handleReturnToQuest = () => {
    dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: { subGameName: 'aerowreckage-puzzle', completed: true },
    })

    signalRpgResume()
    exitSubGame({ completed: true })
  }

  // const handleResetPuzzle = async () => {
  //   await resetPuzzle()
  //   router.replace('/sub-games/aerowreckage-puzzle/entry' as any)
  // }

  return (
    <View style={{ flex: 1 }} onLayout={onRootLayout}>
      <BackgroundImage source={bgSuccess} foregroundFit="cover">
        <View style={styles.container}>
          <View style={styles.contentArea}>
            <Text style={styles.successText}>Christos Succeeds!</Text>
          </View>

          {/* Bottom bar (screen3-style: absolute, fixed padding, no inset measurement) */}
          <View style={styles.bottomBar}>
            {/* {__DEV__ && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
            </TouchableOpacity>
          )} */}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.buttonHalf,
                  hasLazerPistol && styles.disabledButton,
                ]}
                onPress={handlePickUpLazerPistol}
                activeOpacity={hasLazerPistol ? 1 : 0.7}
                disabled={hasLazerPistol}
              >
                <Text
                  style={[styles.primaryButtonText, hasLazerPistol && styles.disabledButtonText]}
                >
                  {hasLazerPistol ? 'Acquired' : 'Pick up Lazer Pistol'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, styles.buttonHalf]}
                onPress={handleReturnToQuest}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Return to Quest</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Only mount Modal when visible (avoids late native attach/measure) */}
          {showAcquiredModal && (
            <Modal
              visible
              transparent
              animationType="fade"
              onRequestClose={() => setShowAcquiredModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Lazer Pistol acquired!</Text>
                  <Text style={styles.modalText}>
                    A high-tech energy weapon has been added to your ranged weapons inventory.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowAcquiredModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </BackgroundImage>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingFrame: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 140, // reserve space for bottom bar
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    letterSpacing: 2,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30, // fixed like screen3
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  primaryButton: {
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
  buttonHalf: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(153, 0, 0, 0.4)',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: subGameTheme.blue,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: subGameTheme.blue,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    alignSelf: 'center',
    minWidth: 100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
