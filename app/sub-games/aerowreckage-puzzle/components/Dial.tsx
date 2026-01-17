// app/sub-games/aerowreckage-puzzle/components/Dial.tsx
// Rotatable dial with gesture handling

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { PUZZLE_CONFIG } from '../config';
import { THEME } from '../theme';
import { normalizeAngle, formatDialNumber } from '../utils';

const CENTER_SIZE = 60;
const NUMBER_MARKERS = 12; // Major number markers around the dial
const TICK_MARKS = 8; // Decorative tick marks on rotating dial
const DIAL_ORIENTATION_OFFSET = Math.PI / 2; // 90 degrees to align pointer upward

// Calculate responsive dial size based on screen dimensions
const getDialSize = (width: number, height: number) => {
  const aspectRatio = height / width;
  const minDimension = Math.min(width, height);
  
  // For square screens (aspect ratio close to 1), use smaller percentage
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
    return Math.min(minDimension * 0.5, 250);
  }
  // For portrait screens, allow slightly larger
  if (aspectRatio > 1.1) {
    return Math.min(width * 0.65, 280);
  }
  // For landscape screens
  return Math.min(height * 0.6, 280);
};

interface DialProps {
  currentAngle: number;
  currentNumber: number;
  onAngleChange: (angle: number) => void;
  onCenterTap: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function Dial({ currentAngle, currentNumber, onAngleChange, onCenterTap, onDragStart, onDragEnd }: DialProps) {
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return { width: window.width, height: window.height };
  });
  
  const dialSize = getDialSize(dimensions.width, dimensions.height);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, []);
  
  const panRef = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(currentAngle);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Notify parent we're dragging
        onDragStart();
        
        // Store initial touch position
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = dialSize / 2;
        const centerY = dialSize / 2;
        
        // Calculate initial angle from center
        const dx = locationX - centerX;
        const dy = locationY - centerY;
        const touchAngle = Math.atan2(dy, dx);
        
        // Store offset between current rotation and touch angle
        rotationRef.current = currentAngle;
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = dialSize / 2;
        const centerY = dialSize / 2;
        
        // Calculate angle from center to touch point
        const dx = locationX - centerX;
        const dy = locationY - centerY;
        const touchAngle = Math.atan2(dy, dx);
        
        // Update rotation
        const newAngle = normalizeAngle(touchAngle + DIAL_ORIENTATION_OFFSET);
        rotationRef.current = newAngle;
        onAngleChange(newAngle);
      },
      onPanResponderRelease: () => {
        // Notify parent we stopped dragging
        onDragEnd();
      },
    })
  ).current;
  
  const rotation = (currentAngle * 180) / Math.PI;
  
  // Generate number markers around the dial
  const markers = [];
  const step = PUZZLE_CONFIG.totalNumbers / NUMBER_MARKERS;
  for (let i = 0; i < NUMBER_MARKERS; i++) {
    const number = Math.round(i * step) % PUZZLE_CONFIG.totalNumbers;
    const angle = (number / PUZZLE_CONFIG.totalNumbers) * 360;
    
    markers.push(
      <View
        key={i}
        style={[
          styles.marker,
          {
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -(dialSize / 2 - 20) },
            ],
          },
        ]}
      >
        <Text style={styles.markerText}>{formatDialNumber(number)}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Fixed indicator at 12 o'clock (top center) - OUTSIDE dial */}
      <View style={styles.fixedIndicator} pointerEvents="none">
        <View style={styles.indicatorTriangle} />
      </View>
      
      <View
        style={[styles.dial, { width: dialSize, height: dialSize }]}
        {...panResponder.panHandlers}
      >
        {/* Dial background with geometric pattern */}
        <View style={styles.dialBackground}>
          {/* Outer ring */}
          <View style={styles.outerRing} />
          
          {/* Number markers */}
          <View style={styles.markersContainer}>
            {markers}
          </View>
          
          {/* Rotating inner dial - NO POINTER INSIDE */}
          <Animated.View
            style={[
              styles.innerDial,
              {
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            {/* Tick marks only - no pointer */}
            {Array.from({ length: TICK_MARKS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.tickMark,
                  {
                    transform: [
                      { rotate: `${i * (360 / TICK_MARKS)}deg` },
                      { translateY: -(dialSize / 2 - 40) },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
          
          {/* Center hub - TAPPABLE */}
          <TouchableOpacity
            style={styles.center}
            onPress={onCenterTap}
            activeOpacity={0.7}
          >
            <Text style={styles.currentNumber}>{formatDialNumber(currentNumber)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    position: 'relative',
  },
  fixedIndicator: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  indicatorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: THEME.pointerColor,
    shadowColor: THEME.pointerColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 10,
  },
  dial: {
    borderRadius: 1000,
    backgroundColor: THEME.dialBackground,
    borderWidth: 4,
    borderColor: THEME.dialBorder,
    shadowColor: THEME.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dialBackground: {
    flex: 1,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: THEME.brassDark,
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -15,
    marginTop: -10,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.numberColor,
    transform: [{ rotate: '-90deg' }],
  },
  innerDial: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: THEME.brassDark,
    left: '50%',
    top: '50%',
    marginLeft: -1,
    marginTop: -4,
  },
  center: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: THEME.dialCenter,
    borderWidth: 3,
    borderColor: THEME.brass,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 5,
  },
  currentNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.brassLight,
  },
});
