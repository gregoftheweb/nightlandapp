// components/playerHUD.tsx
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import turnButtonIMG from '@assets/images/ui/icons/buttonTurn.webp'
import attackButtonIMG from '@assets/images/ui/icons/buttonAttack.webp'
import inventoryButtonIMG from '@assets/images/ui/icons/buttonInventory.webp'
import zapButtonIMG from '@assets/images/ui/icons/buttonZap.webp'
import hideButtonIMG from '@assets/images/ui/icons/buttonHide.webp'
import jauntButtonIMG from '@assets/images/ui/icons/buttonJaunt.webp'

interface PlayerHUDProps {
  currentHP: number
  maxHP: number
  inCombat: boolean
  onGearPress?: () => void
  onTurnPress?: () => void
  onAttackPress?: () => void
  onInventoryPress?: () => void // New prop for inventory
  onZapPress?: () => void // New prop for zap button
  onHidePress?: () => void // New prop for hide button
  onJauntPress?: () => void // New prop for jaunt button
  // Hide ability state
  hideUnlocked?: boolean
  hideChargeTurns?: number
  hideActive?: boolean
  // Jaunt ability state
  canJaunt?: boolean
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({
  currentHP,
  maxHP,
  inCombat,
  onGearPress,
  onTurnPress,
  onAttackPress,
  onInventoryPress, // New prop
  onZapPress, // New prop
  onHidePress, // New prop
  onJauntPress, // New prop
  hideUnlocked = false,
  hideChargeTurns = 0,
  hideActive = false,
  canJaunt = false,
}) => {
  const insets = useSafeAreaInsets()

  const handleGearPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    onGearPress?.()
  }

  const handleActionPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    if (inCombat) {
      onAttackPress?.()
    } else {
      onTurnPress?.()
    }
  }

  const handleInventoryPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    onInventoryPress?.()
  }

  const handleZapPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    // TODO: Implement special ability/power attack functionality
    onZapPress?.()
  }

  const handleHidePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    onHidePress?.()
  }

  const handleJauntPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation()
    onJauntPress?.()
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
      pointerEvents="box-none"
    >
      <View
        style={hideUnlocked || canJaunt ? styles.hudFrameExpanded : styles.hudFrame}
        pointerEvents="box-none"
      >
        <View
          style={hideUnlocked || canJaunt ? styles.statusBarExpanded : styles.statusBar}
          pointerEvents="box-none"
        >
          <Text style={styles.hpText}>HP: {currentHP}</Text>

          <TouchableOpacity style={styles.gearButton} onPress={handleGearPress} activeOpacity={0.7}>
            <Image source={require('@assets/images/ui/icons/gear.webp')} style={styles.gearIcon} />
          </TouchableOpacity>
        </View>

        {/* Zap Button */}
        <TouchableOpacity
          style={hideUnlocked || canJaunt ? styles.zapButtonExpanded : styles.zapButton}
          onPress={handleZapPress}
          activeOpacity={0.7}
        >
          <Image source={zapButtonIMG} style={styles.zapButtonImage} />
        </TouchableOpacity>

        {/* Hide Button - only show if unlocked */}
        {hideUnlocked && (
          <View style={styles.hideButtonContainer}>
            {/* Background indicator - shows through the H */}
            {hideActive && <View style={styles.hideActiveBackground} />}
            <TouchableOpacity
              style={[styles.hideButton, hideChargeTurns === 0 && styles.hideButtonDepleted]}
              onPress={handleHidePress}
              activeOpacity={0.7}
              disabled={hideChargeTurns === 0 && !hideActive}
            >
              <Image
                source={hideButtonIMG}
                style={[
                  styles.hideButtonImage,
                  hideChargeTurns === 0 && styles.hideButtonImageDepleted,
                ]}
              />
            </TouchableOpacity>
            {/* Charge meter */}
            <View style={styles.chargeMeter}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.chargeTick, i < hideChargeTurns && styles.chargeTickFilled]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Center Turn/Attack */}
        <TouchableOpacity style={styles.turnButton} onPress={handleActionPress} activeOpacity={0.7}>
          <Image
            source={inCombat ? attackButtonIMG : turnButtonIMG}
            style={styles.turnButtonImage}
          />
        </TouchableOpacity>

        {/* Inventory Button */}
        <TouchableOpacity
          style={hideUnlocked || canJaunt ? styles.inventoryButtonExpanded : styles.inventoryButton}
          onPress={handleInventoryPress}
          activeOpacity={0.7}
        >
          <Image source={inventoryButtonIMG} style={styles.inventoryButtonImage} />
        </TouchableOpacity>

        {/* Jaunt Button - only show if unlocked (mirrored position to Hide button) */}
        {canJaunt && (
          <TouchableOpacity
            style={styles.jauntButton}
            onPress={handleJauntPress}
            activeOpacity={0.7}
          >
            <Image source={jauntButtonIMG} style={styles.jauntButtonImage} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const HUD_WIDTH = 350 // Standard bar width
const HUD_WIDTH_EXPANDED = 420 // Expanded bar width when hide button is unlocked

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },

  // NEW: the reference box for absolute positioning
  hudFrame: {
    width: HUD_WIDTH,
    position: 'relative',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  // Expanded frame when hide button is unlocked
  hudFrameExpanded: {
    width: HUD_WIDTH_EXPANDED,
    position: 'relative',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  // Your existing bar (the only bar)
  statusBar: {
    width: HUD_WIDTH, // <-- make the bar wide enough
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#990000',
    marginBottom: 10,
    zIndex: 15,
  },

  // Expanded status bar when hide button is unlocked
  statusBarExpanded: {
    width: HUD_WIDTH_EXPANDED,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#990000',
    marginBottom: 10,
    zIndex: 15,
  },

  hpText: {
    color: '#990000',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  gearButton: {
    padding: 4,
    borderRadius: 12,
  },

  gearIcon: {
    width: 20,
    height: 20,
    tintColor: '#990000',
    zIndex: 20,
  },

  // Buttons now position relative to hudFrame width, not screen
  turnButton: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -30,
    zIndex: 20,
  },

  turnButtonImage: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
  },

  zapButton: {
    position: 'absolute',
    bottom: 15,
    left: 80,
    zIndex: 20,
  },

  // Zap button when hide is unlocked - moved closer to center
  zapButtonExpanded: {
    position: 'absolute',
    bottom: 15,
    left: 130,
    zIndex: 20,
  },

  zapButtonImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  inventoryButton: {
    position: 'absolute',
    bottom: 15,
    right: 72,
    zIndex: 20,
  },

  // Inventory button when hide is unlocked - moved left to mirror zap movement
  inventoryButtonExpanded: {
    position: 'absolute',
    bottom: 15,
    right: 122,
    zIndex: 20,
  },

  inventoryButtonImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  // Hide button (aligned with Zap button)
  hideButtonContainer: {
    position: 'absolute',
    bottom: 15,
    left: 80,
    zIndex: 20,
    alignItems: 'center',
  },

  // Background indicator that shows through the H
  hideActiveBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#00aa00',
    borderRadius: 20,
    zIndex: 19,
  },

  hideButton: {
    width: 40,
    height: 40,
    zIndex: 21,
  },

  hideButtonDepleted: {
    opacity: 0.4,
  },

  hideButtonImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  hideButtonImageDepleted: {
    opacity: 0.5,
  },

  // Charge meter below hide button
  chargeMeter: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    flexDirection: 'row',
    gap: 1,
    zIndex: 25, // Above the hide button
  },

  chargeTick: {
    width: 3,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },

  chargeTickFilled: {
    backgroundColor: '#888888', // Changed from bright green to gray
  },

  // Jaunt button (mirrored position to Hide button - on the right side)
  jauntButton: {
    position: 'absolute',
    bottom: 15,
    right: 80,
    width: 40,
    height: 40,
    zIndex: 20,
  },

  jauntButtonImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
})

export default PlayerHUD
