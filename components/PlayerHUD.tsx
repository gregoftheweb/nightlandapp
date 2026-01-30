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
import turnButtonIMG from '@assets/images/buttonTurn.png'
import attackButtonIMG from '@assets/images/buttonAttack.png'
import inventoryButtonIMG from '@assets/images/buttonInventory.png'
import zapButtonIMG from '@assets/images/buttonZap.png'

interface PlayerHUDProps {
  hp: number
  maxHP: number
  inCombat: boolean
  onGearPress?: () => void
  onTurnPress?: () => void
  onAttackPress?: () => void
  onInventoryPress?: () => void // New prop for inventory
  onZapPress?: () => void // New prop for zap button
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({
  hp,
  maxHP,
  inCombat,
  onGearPress,
  onTurnPress,
  onAttackPress,
  onInventoryPress, // New prop
  onZapPress, // New prop
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

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
      pointerEvents="box-none"
    >
      <View style={styles.hudFrame} pointerEvents="box-none">
        <View style={styles.statusBar} pointerEvents="box-none">
          <Text style={styles.hpText}>HP: {hp}</Text>

          <TouchableOpacity style={styles.gearButton} onPress={handleGearPress} activeOpacity={0.7}>
            <Image source={require('@assets/images/gear.png')} style={styles.gearIcon} />
          </TouchableOpacity>
        </View>

        {/* Zap Button */}
        <TouchableOpacity style={styles.zapButton} onPress={handleZapPress} activeOpacity={0.7}>
          <Image source={zapButtonIMG} style={styles.zapButtonImage} />
        </TouchableOpacity>

        {/* Center Turn/Attack */}
        <TouchableOpacity style={styles.turnButton} onPress={handleActionPress} activeOpacity={0.7}>
          <Image
            source={inCombat ? attackButtonIMG : turnButtonIMG}
            style={styles.turnButtonImage}
          />
        </TouchableOpacity>

        {/* Inventory Button */}
        <TouchableOpacity
          style={styles.inventoryButton}
          onPress={handleInventoryPress}
          activeOpacity={0.7}
        >
          <Image source={inventoryButtonIMG} style={styles.inventoryButtonImage} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const HUD_WIDTH = 350 // your long bar width (tweak once)

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

  inventoryButtonImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
})

export default PlayerHUD
