// components/playerHUD.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import turnButtonIMG from "@assets/images/buttonTurn.png";
import attackButtonIMG from "@assets/images/buttonAttack.png";
import inventoryButtonIMG from "@assets/images/buttonInventory.png";

const { width } = Dimensions.get("window");

interface PlayerHUDProps {
  hp: number;
  maxHP: number;
  inCombat: boolean;
  onGearPress?: () => void;
  onTurnPress?: () => void;
  onAttackPress?: () => void;
  onInventoryPress?: () => void; // New prop for inventory
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({
  hp,
  maxHP,
  inCombat,
  onGearPress,
  onTurnPress,
  onAttackPress,
  onInventoryPress, // New prop
}) => {
  const insets = useSafeAreaInsets();

  const handleGearPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation();
    onGearPress?.();
  };

  const handleActionPress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation();
    if (inCombat) {
      onAttackPress?.();
    } else {
      onTurnPress?.();
    }
  };

  const handleInventoryPress = (
    event: NativeSyntheticEvent<NativeTouchEvent>
  ) => {
    event.stopPropagation();
    onInventoryPress?.();
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
      pointerEvents="box-none"
    >
      <View style={styles.statusBar} pointerEvents="box-none">
        <Text style={styles.hpText}>HP: {hp}</Text>
        <TouchableOpacity
          style={styles.gearButton}
          onPress={handleGearPress}
          activeOpacity={0.7}
        >
          <Image
            source={require("@assets/images/gear.png")}
            style={styles.gearIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Dynamic Turn/Attack Button - Always centered */}
      <TouchableOpacity
        style={styles.turnButton}
        onPress={handleActionPress}
        activeOpacity={0.7}
      >
        <Image
          source={inCombat ? attackButtonIMG : turnButtonIMG}
          style={styles.turnButtonImage}
        />
      </TouchableOpacity>

      {/* Inventory Button - Right side */}
      <TouchableOpacity
        style={styles.inventoryButton}
        onPress={handleInventoryPress}
        activeOpacity={0.7}
      >
        <Image
          source={inventoryButtonIMG}
          style={styles.inventoryButtonImage}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  statusBar: {
    width: width * 0.7, // Widened from 0.55 to 0.75
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#990000",
  },
  hpText: {
    color: "#990000",
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
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
    tintColor: "#990000",
  },
  turnButton: {
    position: "absolute",
    bottom: 5,
    left: "50%",
    marginLeft: -30, // Half of button width (60/2) to center perfectly
  },
  turnButtonImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  inventoryButton: {
    position: "absolute",
    bottom: 15, // Slightly higher than turn button to align with HUD
    right: width * 0.28, // Position on the right side, matching HUD spacing
  },
  inventoryButtonImage: {
    width: 40, // Slightly smaller than turn button, close to HUD height
    height: 40,
    resizeMode: "contain",
  },
});

export default PlayerHUD;
