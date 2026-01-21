// app/sub-games/aerowreckage-puzzle/components/Dial.tsx
// Safe dial with button-based rotation - One tap = one number step
// NEW INTERACTION MODEL:
// - Left button (Clockwise) increments dial number by +1
// - Right button (Counter-Clockwise) decrements dial number by -1
// - Tapping center number attempts to lock that number in the combination
// - No drag/swipe gestures on the dial face

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Pressable, Image } from 'react-native';
import { PUZZLE_CONFIG } from '../config';
import { THEME } from '../theme';
import { formatDialNumber } from '../utils';

const CENTER_SIZE = 60;
const NUMBER_MARKERS = 12; // Major number markers around the dial
const TICK_MARKS = 8; // Decorative tick marks on rotating dial
const DIAL_ORIENTATION_OFFSET = -Math.PI / 2; // -90 degrees to align number 0 at 12 o'clock (top)
const TICK_ANIMATION_DURATION = 150; // ms - duration for dial to animate to next tick position

// Button images
const clockwiseButtonImage = require('@/assets/images/safe-dial-Clockwise.png');
const counterClockwiseButtonImage = require('@/assets/images/safe-dial-CC.png');

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
}

export function Dial({ currentAngle, currentNumber, onAngleChange, onCenterTap }: DialProps) {
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
  
  // Animated display angle for smooth tick transitions
  const displayAngleAnimated = useRef(new Animated.Value(
    (currentNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI + DIAL_ORIENTATION_OFFSET
  )).current;
  
  // Sync with parent's currentNumber when it changes externally (e.g., on load)
  useEffect(() => {
    // Immediately update display angle when externally changed (e.g., on load)
    const targetAngle = (currentNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI + DIAL_ORIENTATION_OFFSET;
    displayAngleAnimated.setValue(targetAngle);
  }, [currentNumber, displayAngleAnimated]);
  
  // Rotate clockwise by one step (decrement number by 1)
  // When dial rotates CW, the indicated number under the top pointer decreases
  const rotateClockwiseOneStep = () => {
    let newNumber = currentNumber - 1;
    // Wrap around if going below 0
    if (newNumber < 0) {
      newNumber = PUZZLE_CONFIG.totalNumbers - 1;
    }
    
    // Convert number to angle
    const newAngle = (newNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI;
    onAngleChange(newAngle);
    
    // Animate display angle to new target
    const targetAngle = newAngle + DIAL_ORIENTATION_OFFSET;
    Animated.timing(displayAngleAnimated, {
      toValue: targetAngle,
      duration: TICK_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };
  
  // Rotate counter-clockwise by one step (increment number by 1)
  // When dial rotates CCW, the indicated number under the top pointer increases
  const rotateCounterClockwiseOneStep = () => {
    let newNumber = currentNumber + 1;
    // Wrap around if exceeding max
    if (newNumber >= PUZZLE_CONFIG.totalNumbers) {
      newNumber = 0;
    }
    
    // Convert number to angle
    const newAngle = (newNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI;
    onAngleChange(newAngle);
    
    // Animate display angle to new target
    const targetAngle = newAngle + DIAL_ORIENTATION_OFFSET;
    Animated.timing(displayAngleAnimated, {
      toValue: targetAngle,
      duration: TICK_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };
  
  const tryCurrentNumber = () => {
    onCenterTap();
  };
  
  // Rotation for display - use animated value for smooth transitions
  const rotationInterpolated = displayAngleAnimated.interpolate({
    inputRange: [-Math.PI, Math.PI],
    outputRange: ['-180deg', '180deg'],
  });
  
  // Generate number markers around the dial
  const markers = [];
  const step = PUZZLE_CONFIG.totalNumbers / NUMBER_MARKERS;
  for (let i = 0; i < NUMBER_MARKERS; i++) {
    const number = Math.round(i * step) % PUZZLE_CONFIG.totalNumbers;
    // Markers are inside the rotating dial - position them opposite to DIAL_ORIENTATION_OFFSET
    // to counteract the dial's base rotation and align number 0 at 12 o'clock
    const angleRad = (number / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI - DIAL_ORIENTATION_OFFSET;
    const angle = (angleRad * 180 / Math.PI);
    
    markers.push(
      <Animated.View
        key={i}
        style={[
          styles.marker,
          {
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -(dialSize / 2 - 20) },
              // Counter-rotate to keep text upright
              // The text rotates by +angle to position around circle,
              // then must counter-rotate by -angle AND -dialRotation to stay upright
              // This ensures the number at top (under red triangle) always matches center
              { rotate: `${-angle}deg` },
              {
                rotate: displayAngleAnimated.interpolate({
                  inputRange: [-Math.PI, Math.PI],
                  outputRange: ['180deg', '-180deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.markerText}>{formatDialNumber(number)}</Text>
      </Animated.View>
    );
  }
  
  return (
    <View style={styles.outerContainer}>
      {/* Left Button - Clockwise */}
      <Pressable
        onPress={rotateClockwiseOneStep}
        style={({ pressed }) => [
          styles.controlButton,
          styles.leftButton,
          pressed && styles.controlButtonPressed,
        ]}
        accessibilityLabel="Rotate dial clockwise"
        accessibilityHint="Decrements the dial number by 1"
      >
        <Image source={clockwiseButtonImage} style={styles.controlButtonImage} />
      </Pressable>

      <View style={styles.container}>
        {/* Fixed indicator at 12 o'clock (top center) - OUTSIDE dial */}
        <View style={styles.fixedIndicator} pointerEvents="none">
          <View style={styles.indicatorTriangle} />
        </View>
        
        <View style={[styles.dial, { width: dialSize, height: dialSize }]}>
          {/* Dial background with geometric pattern */}
          <View style={styles.dialBackground}>
            {/* Outer ring */}
            <View style={styles.outerRing} />
            
            {/* Rotating inner dial with numbers and tick marks */}
            <Animated.View
              style={[
                styles.innerDial,
                {
                  transform: [{ rotate: rotationInterpolated }],
                },
              ]}
            >
              {/* Number markers - INSIDE rotating dial */}
              <View style={styles.markersContainer}>
                {markers}
              </View>
              
              {/* Tick marks */}
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
              onPress={tryCurrentNumber}
              activeOpacity={0.7}
              accessibilityLabel="Try current number"
              accessibilityHint="Attempts to lock this number in the combination"
            >
              <Text style={styles.currentNumber}>{formatDialNumber(currentNumber)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Right Button - Counter-Clockwise */}
      <Pressable
        onPress={rotateCounterClockwiseOneStep}
        style={({ pressed }) => [
          styles.controlButton,
          styles.rightButton,
          pressed && styles.controlButtonPressed,
        ]}
        accessibilityLabel="Rotate dial counter-clockwise"
        accessibilityHint="Increments the dial number by 1"
      >
        <Image source={counterClockwiseButtonImage} style={styles.controlButtonImage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
  },
  controlButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonPressed: {
    opacity: 0.6,
  },
  controlButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  leftButton: {
    // Positioned on the left
  },
  rightButton: {
    // Positioned on the right
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
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
