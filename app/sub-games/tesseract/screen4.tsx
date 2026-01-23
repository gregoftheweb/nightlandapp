// app/sub-games/tesseract/screen4.tsx
// Screen 4: Success screen for the tesseract sub-game
import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@/lib/subGames'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'

const bgScreen4 = require('@/assets/images/teseract-screen4.png')

export default function TesseractScreen4() {
  const router = useRouter()
  const { dispatch, signalRpgResume } = useGameContext()
  const [showScrollModal, setShowScrollModal] = useState(false)

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

    // Mark tesseract puzzle as completed
    dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: {
        subGameName: 'tesseract',
        completed: true,
      },
    })

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
            Christos successfully spelled TESSERACT.{'\n\n'}
            A scroll appears at his feet. It is a message from Persius.
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
        <Modal
          visible={showScrollModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScrollModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Message from Persius</Text>
              <Text style={styles.modalText}>
                Christos,{'\n\n'}
                Return to the Redoubt.{'\n\n'}
                Your quest may yet save mankind, but you must risk no other souls in its pursuit.{'\n\n'}
                I go now in search of the Tesseract.{'\n\n'}
                — Persius
              </Text>
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
