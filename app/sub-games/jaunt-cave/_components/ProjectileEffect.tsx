import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ProjectileEffectProps {
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  color: string;
  duration?: number;
  size?: number;
  onComplete?: () => void;
}

export const ProjectileEffect: React.FC<ProjectileEffectProps> = ({
  from,
  to,
  color,
  duration = 250,
  size = 16,
  onComplete,
}) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Only animate when both from and to are set
    if (!from || !to) {
      return;
    }

    // Reset position to starting point (accounting for size to center the projectile)
    position.setValue({ x: from.x - size / 2, y: from.y - size / 2 });
    opacity.setValue(1);

    // Animate to target position
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: to.x - size / 2, y: to.y - size / 2 },
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
       // duration: duration * 0.8, // Fade out slightly before reaching target
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call completion callback
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    });

    // Cleanup function
    return () => {
      position.stopAnimation();
      opacity.stopAnimation();
    };
  }, [from, to, duration, size, position, opacity]);

  // Don't render if from or to are null
  if (!from || !to) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.projectile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          transform: position.getTranslateTransform(),
          opacity,
        },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  projectile: {
    position: 'absolute',
    zIndex: 150, // Above daemon (50), below attack overlay (100)
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
