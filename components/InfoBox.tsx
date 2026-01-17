import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, NativeSyntheticEvent, NativeTouchEvent, Image, ImageSourcePropType } from 'react-native';

interface InfoBoxProps {
  visible: boolean;
  name: string;
  description: string;
  image?: ImageSourcePropType;
  onClose: () => void;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  visible,
  name,
  description,
  image,
  onClose,
  ctaLabel,
  onCtaPress
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, opacity]);

  const handleClosePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation();
    onClose();
  };

  if (!isModalVisible) {
    return null;
  }

  return (
    <Modal transparent={true} visible={isModalVisible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.infoBox, { opacity }]}>
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePress}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {image && (
            <View style={styles.imageContainer}>
              <Image 
                source={image} 
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
          
          <Text style={styles.description}>{description}</Text>
          
          {ctaLabel && onCtaPress && (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onCtaPress}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaButtonText}>{ctaLabel}</Text>
            </TouchableOpacity>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: -10,
    top: -15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#990000',
  },
  closeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  image: {
    maxWidth: 150,
    maxHeight:150,
    aspectRatio: 1,
  },
  description: {
    fontSize: 14,
    color: '#ff0000',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  ctaButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#990000',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});