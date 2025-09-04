import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Level } from "@/config/types"; // import your Level type

interface PositionDisplayProps {
  position?: { row: number; col: number };
  level?: Level;
}

export const PositionDisplay: React.FC<PositionDisplayProps> = ({ position, level }) => {
  if (!position || !level) {
    return null; // or render "Loading..."
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Level: {level.name || level.id} {"\n"}
        ({position.row},{position.col})
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
