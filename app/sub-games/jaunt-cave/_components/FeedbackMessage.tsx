// app/sub-games/jaunt-cave/_components/FeedbackMessage.tsx
// Floating feedback message component that appears above battle HUD

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subGameTheme } from '../../_shared/subGameTheme';

interface FeedbackMessageProps {
  message: string | null;
  duration?: number;
  onDismiss?: () => void;
}

/**
 * FeedbackMessage displays floating feedback text above the battle HUD.
 * It handles auto-dismissal after a configurable duration and manages its own timer internally.
 * 
 * @param message - The message to display (null means no message)
 * @param duration - Auto-dismiss duration in milliseconds (default: 1000ms)
 * @param onDismiss - Optional callback when message auto-dismisses
 */
export function FeedbackMessage({ 
  message, 
  duration = 1000, 
  onDismiss 
}: FeedbackMessageProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);

  // Keep ref up to date
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Start auto-dismiss timer when message changes to non-null value
    if (message !== null) {
      timerRef.current = setTimeout(() => {
        onDismissRef.current?.();
        timerRef.current = null;
      }, duration);
    }

    // Clear timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [message, duration]);

  // Only render when message is not null
  if (message === null) {
    return null;
  }

  return (
    <View style={styles.feedbackMessage}>
      <Text style={styles.feedbackMessageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackMessage: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 300,
    pointerEvents: 'none',
  },
  feedbackMessageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.white,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});
