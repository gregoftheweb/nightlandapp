import React from 'react'
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { STRINGS } from '../assets/copy/strings'
import { SPLASH_STRINGS } from '@/assets/copy/splashscreen'
import { useGameContext } from '@/context/GameContext'
import { hasCurrentGame, loadCurrentGame, deleteCurrentGame, listWaypointSaves, loadWaypoint, WaypointSaveMetadata } from '@/modules/saveGame'
import { fromSnapshot } from '@/modules/gameState'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SplashScreen() {
  const router = useRouter()
  const { dispatch } = useGameContext()
  
  const [hasCurrentSave, setHasCurrentSave] = React.useState(false)
  const [waypointSaves, setWaypointSaves] = React.useState<WaypointSaveMetadata[]>([])
  const [showWaypointModal, setShowWaypointModal] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Check for saves on mount
  React.useEffect(() => {
    checkSaves()
  }, [])

  const checkSaves = async () => {
    setIsLoading(true)
    try {
      const [currentExists, waypoints] = await Promise.all([
        hasCurrentGame(),
        listWaypointSaves(),
      ])
      setHasCurrentSave(currentExists)
      setWaypointSaves(waypoints)
    } catch (error) {
      console.error('[SplashScreen] Failed to check saves:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewGame = async () => {
    try {
      // Delete current save
      await deleteCurrentGame()
      // Navigate to princess intro (standard new game flow)
      router.replace('/princess')
    } catch (error) {
      console.error('[SplashScreen] Failed to start new game:', error)
    }
  }

  const handleContinue = async () => {
    try {
      console.log('[SplashScreen] ===== LOADING CURRENT GAME =====')
      const snapshot = await loadCurrentGame()
      if (!snapshot) {
        console.error('[SplashScreen] No current save found')
        return
      }
      
      console.log('[SplashScreen] Snapshot loaded successfully')
      console.log('[SplashScreen] Snapshot currentLevelId:', snapshot.currentLevelId)
      console.log('[SplashScreen] Snapshot player position:', snapshot.player?.position)
      console.log('[SplashScreen] Snapshot player HP:', snapshot.player?.hp)
      console.log('[SplashScreen] Snapshot moveCount:', snapshot.moveCount)
      console.log('[SplashScreen] Snapshot subGamesCompleted:', Object.keys(snapshot.subGamesCompleted || {}).length)
      
      // Hydrate game state from snapshot
      const loadedState = fromSnapshot(snapshot)
      console.log('[SplashScreen] State hydrated from snapshot')
      console.log('[SplashScreen] Loaded state currentLevelId:', loadedState.currentLevelId)
      console.log('[SplashScreen] Loaded state player position:', loadedState.player?.position)
      console.log('[SplashScreen] Loaded state player HP:', loadedState.player?.hp)
      console.log('[SplashScreen] Loaded state moveCount:', loadedState.moveCount)
      
      dispatch({ type: 'HYDRATE_GAME_STATE', payload: { state: loadedState } })
      console.log('[SplashScreen] HYDRATE_GAME_STATE dispatched')
      
      // Wait a tick to ensure state update is processed before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Navigate to game
      router.replace('/game')
      console.log('[SplashScreen] Navigated to /game')
    } catch (error) {
      console.error('[SplashScreen] Failed to load current game:', error)
    }
  }

  const handleLoadWaypoint = async (waypointId: string) => {
    try {
      const snapshot = await loadWaypoint(waypointId)
      if (!snapshot) {
        console.error('[SplashScreen] Waypoint not found:', waypointId)
        return
      }
      
      // Hydrate game state from snapshot
      const loadedState = fromSnapshot(snapshot)
      dispatch({ type: 'HYDRATE_GAME_STATE', payload: { state: loadedState } })
      
      // Only delete current save after successful load and hydration
      await deleteCurrentGame()
      
      // Close modal and navigate to game
      setShowWaypointModal(false)
      router.replace('/game')
    } catch (error) {
      console.error('[SplashScreen] Failed to load waypoint:', error)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <ImageBackground
      source={require('../assets/images/splashscreen.png')}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        {isLoading ? (
          <ActivityIndicator size="large" color="red" />
        ) : (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={handleNewGame}>
              <Text style={styles.buttonText}>New</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, !hasCurrentSave && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!hasCurrentSave}
            >
              <Text style={[styles.buttonText, !hasCurrentSave && styles.buttonTextDisabled]}>
                Current
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, waypointSaves.length === 0 && styles.buttonDisabled]}
              onPress={() => setShowWaypointModal(true)}
              disabled={waypointSaves.length === 0}
            >
              <Text style={[styles.buttonText, waypointSaves.length === 0 && styles.buttonTextDisabled]}>
                Saved
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Waypoint Saves Modal */}
      <Modal
        visible={showWaypointModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaypointModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Waypoint Saves</Text>
            
            <ScrollView style={styles.savesList}>
              {waypointSaves.map((save) => (
                <View key={save.id} style={styles.saveItem}>
                  <View style={styles.saveInfo}>
                    <Text style={styles.saveName}>{save.name}</Text>
                    <Text style={styles.saveDate}>{formatDate(save.createdAt)}</Text>
                    {save.playerHP !== undefined && save.playerMaxHP !== undefined && (
                      <Text style={styles.saveStats}>
                        HP: {save.playerHP}/{save.playerMaxHP}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.loadButton}
                    onPress={() => handleLoadWaypoint(save.id)}
                  >
                    <Text style={styles.loadButtonText}>Load</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWaypointModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    gap: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'transparent',
    borderColor: 'red',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  buttonDisabled: {
    borderColor: '#555',
    opacity: 0.5,
  },
  buttonText: {
    color: 'red',
    fontSize: 26,
    fontFamily: 'Gabrielle',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#555',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'red',
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    color: 'red',
    fontSize: 28,
    fontFamily: 'Gabrielle',
    textAlign: 'center',
    marginBottom: 20,
  },
  savesList: {
    maxHeight: 400,
  },
  saveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  saveInfo: {
    flex: 1,
    marginRight: 12,
  },
  saveName: {
    color: 'red',
    fontSize: 18,
    fontFamily: 'Gabrielle',
    marginBottom: 4,
  },
  saveDate: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  saveStats: {
    color: '#ccc',
    fontSize: 12,
  },
  loadButton: {
    backgroundColor: 'red',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Gabrielle',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderColor: 'red',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'red',
    fontSize: 18,
    fontFamily: 'Gabrielle',
  },
})
