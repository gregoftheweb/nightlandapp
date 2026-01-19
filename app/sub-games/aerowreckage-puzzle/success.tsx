// app/sub-games/aerowreckage-puzzle/success.tsx
// Screen [C]: Success screen after opening the safe
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGameContext } from '@/context/GameContext';
import { exitSubGame } from '@/lib/subGames';
import { BackgroundImage } from '../_shared/BackgroundImage';
import { BottomActionBar } from '../_shared/BottomActionBar';
import { subGameTheme } from '../_shared/subGameTheme';
import { usePuzzleState } from './hooks/usePuzzleState';

const bgSuccess = require('@/assets/images/aerowreck-safe3.png');

const LAZER_PISTOL_WEAPON_ID = 'weapon-lazer-pistol-001';

export default function AeroWreckageSuccess() {
  const router = useRouter();
  const { state, dispatch, signalRpgResume } = useGameContext();
  const { resetPuzzle } = usePuzzleState();
  const [showAcquiredModal, setShowAcquiredModal] = useState(false);

  // Check if Lazer Pistol is already in inventory
  const hasLazerPistol = state.player.rangedWeaponInventoryIds.includes(LAZER_PISTOL_WEAPON_ID);

  const handlePickUpLazerPistol = () => {
    if (hasLazerPistol) {
      if (__DEV__) {
        console.log('[AeroWreckageSuccess] Lazer Pistol already acquired');
      }
      return;
    }

    if (__DEV__) {
      console.log('[AeroWreckageSuccess] Picking up Lazer Pistol');
    }

    // Add weapon to inventory
    dispatch({
      type: 'ADD_RANGED_WEAPON',
      payload: {
        id: LAZER_PISTOL_WEAPON_ID,
      },
    });

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show acquisition modal
    setShowAcquiredModal(true);
  };

  const handleReturnToQuest = () => {
    if (__DEV__) {
      console.log('[AeroWreckageSuccess] Player returning to quest after success');
    }

    // Update gamestate: mark aerowreckage puzzle as completed
    dispatch({
      type: 'SET_SUB_GAME_COMPLETED',
      payload: {
        subGameName: 'aerowreckage-puzzle',
        completed: true,
      },
    });

    // Signal RPG to refresh
    signalRpgResume();

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true });
  };

  const handleResetPuzzle = async () => {
    if (__DEV__) {
      console.log('[AeroWreckageSuccess] Resetting puzzle for testing');
    }
    await resetPuzzle();
    router.replace('/sub-games/aerowreckage-puzzle/entry' as any);
  };

  return (
    <BackgroundImage source={bgSuccess}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.successText}>Christos Succeeds!</Text>
        </View>

        <BottomActionBar>
          {__DEV__ && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
            </TouchableOpacity>
          )}
          
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
              <Text style={[
                styles.primaryButtonText,
                hasLazerPistol && styles.disabledButtonText,
              ]}>
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
        </BottomActionBar>

        {/* Acquisition Modal */}
        <Modal
          visible={showAcquiredModal}
          transparent={true}
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
      </View>
    </BackgroundImage>
  );
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
    fontSize: 28,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    letterSpacing: 2,
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
  primaryButtonFull: {
    alignSelf: 'stretch',
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
});
