import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  Animated,
} from 'react-native'
import { audioManager } from '../modules/audioManager'
import { settingsManager } from '../modules/settingsManager'

const { width, height } = Dimensions.get('window')

interface SettingsProps {
  visible: boolean
  onClose: () => void
}

interface ToggleProps {
  value: boolean
  onToggle: (value: boolean) => void
  label: string
}

function ModernToggle({ value, onToggle, label }: ToggleProps) {
  const [animation] = useState(new Animated.Value(value ? 1 : 0))

  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [value, animation])

  const handlePress = () => {
    onToggle(!value)
  }

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  })

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(120, 120, 120, 0.3)', '#4CAF50'],
  })

  return (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <TouchableOpacity style={styles.toggleButton} onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.toggleTrack, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.toggleThumb,
              {
                transform: [{ translateX }],
                backgroundColor: value ? '#fff' : '#f0f0f0',
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}

export default function Settings({ visible, onClose }: SettingsProps) {
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(audioManager.getIsEnabled())
  const [showCoordinates, setShowCoordinates] = useState(settingsManager.getShowCoordinates())

  // Update local state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setBackgroundMusicEnabled(audioManager.getIsEnabled())
      setShowCoordinates(settingsManager.getShowCoordinates())
    }
  }, [visible])

  const handleClosePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    onClose()
  }

  const handleBackgroundMusicToggle = (enabled: boolean) => {
    setBackgroundMusicEnabled(enabled)
    audioManager.setEnabled(enabled)
  }

  const handleShowCoordinatesToggle = (enabled: boolean) => {
    setShowCoordinates(enabled)
    settingsManager.setShowCoordinates(enabled)
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} onTouchStart={(event) => event.stopPropagation()}>
        <View style={styles.settingsContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePress}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio</Text>
              <ModernToggle
                value={backgroundMusicEnabled}
                onToggle={handleBackgroundMusicToggle}
                label="Background Music"
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Display</Text>
              <ModernToggle
                value={showCoordinates}
                onToggle={handleShowCoordinatesToggle}
                label="Show Coordinates"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#990000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 8,
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  toggleButton: {
    padding: 2,
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
