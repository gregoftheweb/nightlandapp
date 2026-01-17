// components/Projectile.tsx
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

interface ProjectileProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angleDeg: number;
  color: string;
  durationMs: number;
  onComplete: (id: string) => void;
}

const PROJECTILE_LENGTH = 12; // pixels
const PROJECTILE_WIDTH = 3; // pixels

export default function Projectile({
  id,
  startX,
  startY,
  endX,
  endY,
  angleDeg,
  color,
  durationMs,
  onComplete,
}: ProjectileProps) {
  const translateX = useRef(new Animated.Value(startX)).current;
  const translateY = useRef(new Animated.Value(startY)).current;

  useEffect(() => {
    // Animate the projectile from start to end
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration: durationMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration: durationMs,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onComplete when animation finishes
      onComplete(id);
    });
  }, [id, startX, startY, endX, endY, durationMs, onComplete, translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.projectile,
        {
          backgroundColor: color,
          width: PROJECTILE_LENGTH,
          height: PROJECTILE_WIDTH,
          transform: [
            { translateX },
            { translateY },
            { rotate: `${angleDeg}deg` },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  projectile: {
    position: "absolute",
    borderRadius: 1.5,
  },
});
