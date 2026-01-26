// app/sub-games/_subgame-template/success.tsx
// Screen 3: Success screen after completing the puzzle
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/modules/subGames'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

// TODO: Replace with your sub-game's background image
const bgSuccess = require('@/assets/images/tesseract-screen4.png')

// TODO: Change this to your sub-game's name (use kebab-case, e.g., 'my-puzzle')
const SUB_GAME_NAME = '_subgame-template'

// TODO: Define your reward item ID
const REWARD_ITEM_ID = 'template-reward-item'

export default function SubGameTemplateSuccess() {
  const router = useRouter()
  const { state, dispatch, signalRpgResume } = useGameContext()
  const [showRewardModal, setShowRewardModal] = useState(false)

  // TODO: Replace with your reward logic
  // Example: Add item to inventory on mount (only once)
  useEffect(() => {
    const alreadyHasReward = state.player.inventory.some((item) => item.id === REWARD_ITEM_ID)

    if (!alreadyHasReward) {
      if (__DEV__) {
        console.log(`[${SUB_GAME_NAME}] Adding reward to inventory`)
      }

      // TODO: Replace with your actual reward item
      // Example: Add a collectible, weapon, or other item
      // dispatch({
      //   type: 'ADD_TO_INVENTORY',
      //   payload: {
      //     item: {
      //       id: REWARD_ITEM_ID,
      //       name: 'Template Reward',
      //       type: 'collectible',
      //       collectible: true,
      //       description: 'A reward from completing the template puzzle',
      //     },
      //   },
      // })

      // Or for a weapon:
      // dispatch({
      //   type: 'ADD_RANGED_WEAPON',
      //   payload: { id: REWARD_ITEM_ID },
      // })

      if (__DEV__) {
        console.log(`[${SUB_GAME_NAME}] TODO: Implement reward grant`)
      }
    }
  }, [dispatch, state.player.inventory])

  const handleClaimReward = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Claiming reward`)
    }
    setShowRewardModal(true)
  }

  const handleReturnToGame = () => {
    if (__DEV__) {
      console.log(`[${SUB_GAME_NAME}] Returning to game`)
    }

    // Mark sub-game as completed
    dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: {
        subGameName: SUB_GAME_NAME,
        completed: true,
      },
    })

    // Signal RPG to refresh
    signalRpgResume()

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true })
  }

  return (
    <BackgroundImage source={bgSuccess}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* TODO: Replace with your success message */}
          <Text style={styles.successText}>Success!</Text>
          <Text style={styles.descriptionText}>
            Christos has successfully completed the puzzle.
          </Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handleClaimReward}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Claim Reward</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handleReturnToGame}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Return to Quest</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>

        {/* Reward Modal */}
        {showRewardModal && (
          <Modal
            visible
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowRewardModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Reward Claimed!</Text>
                {/* TODO: Replace with your reward description */}
                <Text style={styles.modalText}>
                  TODO: Replace this with your actual reward description and item details.
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowRewardModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  successText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    letterSpacing: 2,
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  button: {
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
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
