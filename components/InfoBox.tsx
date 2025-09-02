// components/InfoBox.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';

interface InfoBoxProps {
  visible: boolean;
  name: string;
  description: string;
  onClose: () => void;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  visible,
  name,
  description,
  onClose
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Clear any existing timer and start a new one only if none exists
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          // Fade out
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            timerRef.current = null;
            onClose();
          });
        }, 3000);
      }
    }

    return () => {
      // Don't clear timer on cleanup - let it run
    };
  }, [visible, opacity, onClose]);

  // Clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent={true} visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.infoBox, { opacity }]}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ff0000',
    maxWidth: 300,
    margin: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#ff0000',
    textAlign: 'center',
    lineHeight: 20,
  },
});