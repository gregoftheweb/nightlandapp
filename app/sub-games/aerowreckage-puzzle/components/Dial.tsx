// app/sub-games/aerowreckage-puzzle/components/Dial.tsx
// Rotatable dial with gesture handling - Discrete tick model with smooth animation

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { PUZZLE_CONFIG } from '../config';
import { THEME } from '../theme';
import { normalizeAngle, formatDialNumber } from '../utils';

const CENTER_SIZE = 60;
const NUMBER_MARKERS = 12; // Major number markers around the dial
const TICK_MARKS = 8; // Decorative tick marks on rotating dial
const DIAL_ORIENTATION_OFFSET = -Math.PI / 2; // -90 degrees to align number 0 at 12 o'clock (top)
const ROTATION_SENSITIVITY = 0.4; // Slow down input for heavier feel (0.4 = 40% of finger movement)
const MAX_STEP_JUMP = 1; // Maximum number of steps dial can move in one update (only 1 for smooth click-by-click)
const TICK_ANIMATION_DURATION = 150; // ms - duration for dial to animate to next tick position (increased for slower, more deliberate feel)

// Detent/sticky dial parameters for realistic safe feel
const COMMIT_THRESHOLD = 0.18; // Radians of deliberate movement required to commit to next tick (increased from 0.12 to slow down clicks)
const DIRECTION_CONFIDENCE_DECAY = 0.85; // How quickly direction scores decay (0.85 = 15% decay per move)
const DIRECTION_DOMINANCE_MARGIN = 0.03; // Minimum score difference to establish dominant direction

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
  
  // Discrete tick dial model - Index is the single source of truth for the number
  const currentIndexRef = useRef(currentNumber);
  const tickAccumulatorRef = useRef(0); // Fractional angle between ticks
  const lastThetaRef = useRef<number | null>(null); // Last raw atan2 angle for unwrapping
  const grabOffsetRef = useRef<number>(0); // Offset to handle grab at arbitrary position
  
  // Detent/sticky behavior - Direction tracking for deliberate movement
  const directionScoreCW = useRef(0); // Confidence score for clockwise movement
  const directionScoreCCW = useRef(0); // Confidence score for counter-clockwise movement
  const lastCommittedDir = useRef<'CW' | 'CCW' | null>(null); // Last committed direction
  const commitAccumulator = useRef(0); // Accumulated movement toward commit threshold
  
  // Animated display angle for smooth tick transitions
  const displayAngleAnimated = useRef(new Animated.Value(
    (currentNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI + DIAL_ORIENTATION_OFFSET
  )).current;
  
  // Sync with parent's currentNumber when it changes externally (e.g., on load)
  useEffect(() => {
    currentIndexRef.current = currentNumber;
    // Immediately update display angle when externally changed (e.g., on load)
    const targetAngle = (currentNumber / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI + DIAL_ORIENTATION_OFFSET;
    displayAngleAnimated.setValue(targetAngle);
  }, [currentNumber, displayAngleAnimated]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Notify parent we're dragging
        onDragStart();
        
        // Calculate touch angle
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = dialSize / 2;
        const centerY = dialSize / 2;
        
        const dx = locationX - centerX;
        const dy = locationY - centerY;
        const touchAngle = Math.atan2(dy, dx);
        
        // Initialize tracking - "grab" at current dial position
        // Calculate current visual angle from index
        const currentVisualAngle = (currentIndexRef.current / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI;
        
        // Calculate grab offset to maintain current dial position
        // This offset ensures that when the user touches the dial at any position,
        // the dial continues from its current number without jumping.
        // Formula: offset = currentAngle - touchAngle
        // When applied in future moves, touchAngle + offset = currentAngle (maintained)
        grabOffsetRef.current = currentVisualAngle - touchAngle;
        
        lastThetaRef.current = touchAngle;
        tickAccumulatorRef.current = 0; // Reset accumulator on new grab
        
        // Reset detent/sticky state on new grab
        directionScoreCW.current = 0;
        directionScoreCCW.current = 0;
        commitAccumulator.current = 0;
        // Keep lastCommittedDir to maintain directional consistency across re-grabs
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = dialSize / 2;
        const centerY = dialSize / 2;
        
        const dx = locationX - centerX;
        const dy = locationY - centerY;
        const theta = Math.atan2(dy, dx);
        
        if (lastThetaRef.current !== null) {
          // Calculate delta with unwrapping to handle 2π discontinuity
          let deltaTheta = theta - lastThetaRef.current;
          
          // Unwrap: if we crossed the boundary, adjust
          if (deltaTheta > Math.PI) {
            deltaTheta -= 2 * Math.PI;
          } else if (deltaTheta < -Math.PI) {
            deltaTheta += 2 * Math.PI;
          }
          
          // Apply sensitivity to slow down rotation
          deltaTheta *= ROTATION_SENSITIVITY;
          
          // Update direction confidence scores
          // Decay existing scores slightly to favor recent movement
          directionScoreCW.current *= DIRECTION_CONFIDENCE_DECAY;
          directionScoreCCW.current *= DIRECTION_CONFIDENCE_DECAY;
          
          // Add to the score based on this move's direction
          // In our coordinate system: positive deltaTheta = CW, negative = CCW
          const absDelta = Math.abs(deltaTheta);
          if (deltaTheta > 0) {
            directionScoreCW.current += absDelta;
          } else if (deltaTheta < 0) {
            directionScoreCCW.current += absDelta;
          }
          
          // Determine dominant direction (if clear)
          let dominantDir: 'CW' | 'CCW' | null = null;
          if (directionScoreCW.current > directionScoreCCW.current + DIRECTION_DOMINANCE_MARGIN) {
            dominantDir = 'CW';
          } else if (directionScoreCCW.current > directionScoreCW.current + DIRECTION_DOMINANCE_MARGIN) {
            dominantDir = 'CCW';
          }
          
          // Accumulate movement toward commit threshold
          // Only accumulate in the dominant direction
          if (dominantDir === 'CW' && deltaTheta > 0) {
            commitAccumulator.current += absDelta;
          } else if (dominantDir === 'CCW' && deltaTheta < 0) {
            commitAccumulator.current += absDelta;
          } else {
            // Movement in non-dominant direction: slightly reduce accumulator (jiggle/reversal)
            commitAccumulator.current = Math.max(0, commitAccumulator.current - absDelta * 0.5);
          }
          
          // Check if we should commit to advancing a tick
          // Rules for committing:
          // 1. Must have accumulated enough deliberate movement (COMMIT_THRESHOLD)
          // 2. Must have a clear dominant direction
          // 3. Dominant direction must match lastCommittedDir OR lastCommittedDir is null
          //    OR we have enough confidence to reverse direction (both scores reset means clear reversal)
          
          const canCommit = commitAccumulator.current >= COMMIT_THRESHOLD && dominantDir !== null;
          const directionMatches = lastCommittedDir.current === null || 
                                   lastCommittedDir.current === dominantDir ||
                                   (directionScoreCW.current < 0.05 && directionScoreCCW.current < 0.05); // Both low = clear reversal
          
          if (canCommit && directionMatches) {
            // Commit to advancing one tick in the dominant direction
            const stepDirection = dominantDir === 'CW' ? 1 : -1;
            
            // Update index with wrap-around
            let newIndex = currentIndexRef.current + stepDirection;
            newIndex = ((newIndex % PUZZLE_CONFIG.totalNumbers) + PUZZLE_CONFIG.totalNumbers) % PUZZLE_CONFIG.totalNumbers;
            
            currentIndexRef.current = newIndex;
            
            // Update last committed direction
            lastCommittedDir.current = dominantDir;
            
            // Reset commit accumulator after successful commit
            commitAccumulator.current = 0;
            
            // Convert index to angle and notify parent
            const newAngle = (newIndex / PUZZLE_CONFIG.totalNumbers) * 2 * Math.PI;
            onAngleChange(newAngle);
            
            // Animate display angle to new target for smooth click-by-click feel
            const targetAngle = newAngle + DIAL_ORIENTATION_OFFSET;
            Animated.timing(displayAngleAnimated, {
              toValue: targetAngle,
              duration: TICK_ANIMATION_DURATION,
              useNativeDriver: true,
            }).start();
          }
        }
        
        lastThetaRef.current = theta;
      },
      onPanResponderRelease: () => {
        // Notify parent we stopped dragging
        onDragEnd();
        lastThetaRef.current = null;
        // Reset detent state on release
        tickAccumulatorRef.current = 0;
        directionScoreCW.current = 0;
        directionScoreCCW.current = 0;
        commitAccumulator.current = 0;
        // Keep lastCommittedDir to maintain directional consistency if user re-grabs quickly
      },
    })
  ).current;
  
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
