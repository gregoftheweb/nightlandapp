// app/sub-games/deep-silo/screen6.tsx
// Deep Silo - The deepest level, Persius Note 2 reveal
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameContext } from '@context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { collectible } from '@config/objects'
import { Item } from '@config/types'
import { SafeAreaContent } from '@components/SafeAreaContent'

const bg = require('@assets/images/backgrounds/subgames/deep-silo/silo-screen6.png')

const PERSIUS_NOTE_2_ID = 'persius-note-2'

export default function DeepSiloScreen6() {
  const router = useRouter()
  const { state, dispatch } = useGameContext()
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteRead, setNoteRead] = useState(false)

  const alreadyHasNote = state.player.inventory.some((item) => item.id === PERSIUS_NOTE_2_ID)

  // If returning and already have the note, skip straight to the "go to control panel" button
  useEffect(() => {
    if (alreadyHasNote) {
      setNoteRead(true)
    }
  }, [alreadyHasNote])

  const handleReadNote = () => {
    // Add to inventory when first read
    if (!alreadyHasNote) {
      const noteItem: Item = {
        ...collectible.persiusNote2,
        id: PERSIUS_NOTE_2_ID,
        type: 'collectible',
        collectible: true,
      } as Item

      dispatch({
        type: 'ADD_TO_INVENTORY',
        payload: { item: noteItem },
      })

      if (__DEV__) console.log('[DeepSilo] Added Persius Note 2 to inventory')
    }

    setShowNoteModal(true)
  }

  const handleCloseNote = () => {
    setShowNoteModal(false)
    setNoteRead(true)
  }

  const handleBack = () => {
    if (__DEV__) console.log('[DeepSilo] Heading back up to screen 5')
    router.back()
  }

  const handleGoToControlPanel = () => {
    if (__DEV__) console.log('[DeepSilo] Going to control panel - screen 7')
    router.push('/sub-games/deep-silo/screen7')
  }

  return (
    <BackgroundImage source={bg}>
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Head back up</Text>
            </TouchableOpacity>

            {noteRead ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleGoToControlPanel}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Go to control panel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleReadNote} activeOpacity={0.7}>
                <Text style={styles.buttonText}>Read note</Text>
              </TouchableOpacity>
            )}
          </View>
        </BottomActionBar>

        {/* Note Modal */}
        {showNoteModal && (
          <Modal visible transparent={true} animationType="fade" onRequestClose={handleCloseNote}>
            <SafeAreaContent style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Persius Note 2</Text>
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                  <Text style={styles.modalText}>{collectible.persiusNote2.description}</Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCloseNote}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaContent>
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
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: subGameTheme.blue,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.white,
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
  modalScroll: {
    maxHeight: 320,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
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
