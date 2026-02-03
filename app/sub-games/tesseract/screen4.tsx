// app/sub-games/tesseract/screen4.tsx
// Screen 4: Success screen for the tesseract sub-game
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/modules/subGames'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { collectible } from '@/config/objects'
import { Item } from '@/config/types'

const bgScreen4 = require('@assets/images/backgrounds/subgames/tesseract-screen4.webp')

const PERSIUS_SCROLL_TEXT = `Christos,

Return to the Redoubt. Do not follow me. Do not hinder me!

I can free mankind from this horror of the black night and all the dark evils.

Do not stop me in my quest.

I go now in search of the Tesseract, the device of the ancient science-wizards.

I must.

— Persius`

export default function TesseractScreen4() {
  const router = useRouter()
  const { state, dispatch, signalRpgResume } = useGameContext()
  const [showScrollModal, setShowScrollModal] = useState(false)
  
  // Check if this is a return visit (tesseract already completed)
  const isReturnVisit = state.subGamesCompleted?.['tesseract'] === true

  // Add Persius Scroll to inventory on mount (only once)
  useEffect(() => {
    const persiusScrollId = 'persius-scroll'
    const alreadyHasScroll = state.player.inventory.some((item) => item.id === persiusScrollId)

    // Only add scroll on first completion, not on return visits
    if (!alreadyHasScroll && !isReturnVisit) {
      if (__DEV__) {
        console.log('[Tesseract] Adding Persius Scroll to inventory (first completion)')
        console.log('[Tesseract] persiusScroll template:', collectible.persiusScroll)
      }

      // Create the scroll item from the collectible template
      // Cast to Item type to ensure all properties are preserved
      const scrollItem: Item = {
        ...collectible.persiusScroll,
        id: persiusScrollId,
        type: 'collectible',
        collectible: true,
      } as Item

      if (__DEV__) {
        console.log('[Tesseract] Created scroll item:', scrollItem)
        console.log('[Tesseract] Scroll item effects:', scrollItem.effects)
      }

      dispatch({
        type: 'ADD_TO_INVENTORY',
        payload: { item: scrollItem },
      })
    } else {
      if (__DEV__) {
        if (alreadyHasScroll) {
          console.log('[Tesseract] Persius Scroll already in inventory')
        }
        if (isReturnVisit) {
          console.log('[Tesseract] Return visit - not adding scroll again')
        }
      }
    }
  }, [dispatch, state.player.inventory, isReturnVisit])

  const handleReadScroll = () => {
    if (__DEV__) {
      console.log('[Tesseract] Opening scroll modal')
    }
    setShowScrollModal(true)
  }

  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log('[Tesseract] Returning to Night Land')
    }

    // Mark tesseract puzzle as completed (idempotent - safe to call multiple times)
    if (!isReturnVisit) {
      dispatch({
        type: 'SET_SUB_GAME_COMPLETED',
        payload: {
          subGameName: 'tesseract',
          completed: true,
        },
      })
    }

    // Signal RPG to refresh
    signalRpgResume()

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true })
  }

  return (
    <BackgroundImage source={bgScreen4}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.descriptionText}>
            {isReturnVisit 
              ? "The stone ruins are silent. The tesseract puzzle has already been solved.\n\nThe scroll from Persius is in your inventory."
              : "Christos successfully spelled TESSERACT.\n\nA scroll appears at his feet. It is a message from Persius."}
          </Text>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handleReadScroll}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>read the scroll</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handleReturnToNightLand}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>return to the Night Land</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>

        {/* Scroll Modal */}
        {showScrollModal && (
          <Modal
            visible
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowScrollModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Message from Persius</Text>
                <Text style={styles.modalText}>{PERSIUS_SCROLL_TEXT}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowScrollModal(false)}
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
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
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
    textAlign: 'left',
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
