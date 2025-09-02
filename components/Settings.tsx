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
} from "react-native";

const { width, height } = Dimensions.get("window");

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function Settings({ visible, onClose }: SettingsProps) {
  const handleClosePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    event.stopPropagation(); // Prevent touch from bubbling to parent
    onClose();
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
            <Text style={styles.placeholder}>Settings options will go here</Text>
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
  settingsContainer: {
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
  placeholder: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
});