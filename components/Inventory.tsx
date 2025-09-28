import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  NativeSyntheticEvent,
  NativeTouchEvent,
  ScrollView,
} from "react-native";
import { Item } from "@/config/types";
import { useGameContext } from "../context/GameContext";
import { useItem, canUseItem } from "@/modules/effects";

const { width, height } = Dimensions.get("window");

interface InventoryProps {
  visible: boolean;
  onClose: () => void;
  inventory: Item[];
  showDialog?: (message: string, duration?: number) => void;
}

export default function Inventory({
  visible,
  onClose,
  inventory,
  showDialog,
}: InventoryProps) {
  const handleClosePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation(); // Prevent touch from bubbling to parent
    onClose();
  };

  const { state, dispatch } = useGameContext();

  const handleDrop = (item: Item) => {
    console.log("Dropping item:", item.name);

    dispatch({
      type: "DROP_ITEM",
      payload: {
        item,
        position: { ...state.player.position },
      },
    });
  };

  const handleUse = (item: Item) => {
    console.log("Using item:", item.name);
    
    // Check if item can be used
    if (!canUseItem(item)) {
      showDialog?.(`${item.name} cannot be used.`, 2000);
      return;
    }

    // Use the item through the effects system
    const result = useItem(item, {
      state,
      dispatch,
      showDialog,
      item
    });

    // Handle the result
    if (result.success) {
      // Remove item from inventory if it should be consumed
      if (result.consumeItem) {
        dispatch({
          type: "REMOVE_FROM_INVENTORY",
          payload: { id: item.id }
        });
        console.log(`Consumed item: ${item.name}`);
      }
    } else {
      // Show failure message
      showDialog?.(result.message, 2000);
    }
  };

  const handleEquip = (item: Item) => {
    console.log("Equip weapon:", item.name);
    // TODO: Implement equip functionality
  };

  const renderInventoryItem = (item: Item, index: number) => {
    const isWeapon = item.type === "weapon";
    const isUsable = canUseItem(item);
    
    console.log("in inventory render:", item.name);
    
    return (
      <View
        key={`${item.id || item.shortName}_${index}`}
        style={styles.inventoryItem}
      >
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDrop(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>drop</Text>
          </TouchableOpacity>
          
          <Text style={styles.separator}>|</Text>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              !isUsable && styles.disabledButton
            ]}
            onPress={() => handleUse(item)}
            activeOpacity={isUsable ? 0.7 : 1}
            disabled={!isUsable}
          >
            <Text style={[
              styles.actionButtonText,
              !isUsable && styles.disabledButtonText
            ]}>
              use
            </Text>
          </TouchableOpacity>
          
          {isWeapon && (
            <>
              <Text style={styles.separator}>|</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEquip(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>equip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={styles.overlay}
        onTouchStart={(event) => event.stopPropagation()} // Capture touches on overlay
      >
        <View style={styles.inventoryContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Inventory</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePress}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {inventory.length === 0 ? (
                <Text style={styles.emptyInventoryText}>
                  Your inventory is empty
                </Text>
              ) : (
                inventory.map((item, index) => renderInventoryItem(item, index))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryContainer: {
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#990000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#990000",
  },
  closeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 28,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  inventoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  itemName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    color: "#990000",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: "rgba(153, 0, 0, 0.5)",
  },
  separator: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 14,
    marginHorizontal: 4,
  },
  emptyInventoryText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
});