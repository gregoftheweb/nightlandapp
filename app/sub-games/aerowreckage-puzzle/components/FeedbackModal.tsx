// app/sub-games/aerowreckage-puzzle/components/FeedbackModal.tsx
// Modal dialog for showing attempt feedback

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { THEME } from '../theme';
import { subGameTheme } from '../../_shared/subGameTheme';

interface FeedbackModalProps {
  visible: boolean;
  type: 'step_locked' | 'safe_opened' | 'wrong_direction' | 'wrong_number' | 'insufficient_dwell' | 'already_opened' | 'error';
  message: string;
  hint?: string;
  onDismiss: () => void;
}

export function FeedbackModal({ visible, type, message, hint, onDismiss }: FeedbackModalProps) {
  const isSuccess = type === 'step_locked' || type === 'safe_opened';
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modal, isSuccess && styles.modalSuccess]}>
            <Text style={[styles.message, isSuccess && styles.messageSuccess]}>
              {message}
            </Text>
            {hint && (
              <Text style={styles.hint}>{hint}</Text>
            )}
            <TouchableOpacity
              style={[styles.button, isSuccess && styles.buttonSuccess]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.brass,
    padding: 30,
    alignItems: 'center',
    shadowColor: THEME.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalSuccess: {
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.red,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 26,
  },
  messageSuccess: {
    color: subGameTheme.red,
  },
  hint: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: THEME.brass,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.brassLight,
    minWidth: 100,
  },
  buttonSuccess: {
    backgroundColor: subGameTheme.red,
    borderColor: subGameTheme.red,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.background,
    textAlign: 'center',
  },
});
