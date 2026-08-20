import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import type { EncounterPlacement, NonCollisionObject, Position } from '@config/types'

export const DEBUG_MINIMAP_SIZE = 250

interface BoardDimensions {
  width: number
  height: number
}

interface DebugMinimapProps {
  visible: boolean
  onClose: () => void
  boardSize: BoardDimensions
  encounterPlacements: readonly EncounterPlacement[]
  nonCollisionObjects: readonly NonCollisionObject[]
  playerPosition: Position
  mapSize?: number
}

export function positionToMinimapPoint(
  position: Position,
  boardSize: BoardDimensions,
  mapSize: number = DEBUG_MINIMAP_SIZE
): { x: number; y: number } {
  const maxCol = Math.max(1, boardSize.width - 1)
  const maxRow = Math.max(1, boardSize.height - 1)
  return {
    x: (position.col / maxCol) * mapSize,
    y: (position.row / maxRow) * mapSize,
  }
}

export function encounterPlacementToMinimapPoint(
  placement: EncounterPlacement,
  boardSize: BoardDimensions,
  mapSize: number = DEBUG_MINIMAP_SIZE
): { x: number; y: number } {
  return positionToMinimapPoint(
    {
      row: placement.position.row + placement.footprint.height / 2,
      col: placement.position.col + placement.footprint.width / 2,
    },
    boardSize,
    mapSize
  )
}

function markerPosition(point: { x: number; y: number }, diameter: number) {
  return { left: point.x - diameter / 2, top: point.y - diameter / 2 }
}

export default function DebugMinimap({
  visible,
  onClose,
  boardSize,
  encounterPlacements,
  nonCollisionObjects,
  playerPosition,
  mapSize,
}: DebugMinimapProps) {
  const { width: screenWidth } = useWindowDimensions()
  const actualMapSize = mapSize ?? screenWidth
  const footsteps = nonCollisionObjects.filter((object) => object.type === 'footstep')
  const playerPoint = positionToMinimapPoint(playerPosition, boardSize, actualMapSize)
  const [selectedEncounter, setSelectedEncounter] = useState<string | null>(null)
  const labelOpacity = useRef(new Animated.Value(0)).current
  const labelAnimation = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(
    () => () => {
      labelAnimation.current?.stop()
    },
    []
  )

  const showEncounterName = (instanceId: string) => {
    labelAnimation.current?.stop()
    setSelectedEncounter(instanceId)
    labelOpacity.setValue(1)
    labelAnimation.current = Animated.sequence([
      Animated.delay(3000),
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
    labelAnimation.current.start(({ finished }) => {
      if (finished) setSelectedEncounter(null)
    })
  }

  const handleClose = () => {
    labelAnimation.current?.stop()
    labelOpacity.setValue(0)
    setSelectedEncounter(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.map, { width: actualMapSize, height: actualMapSize }]}>
          <TouchableOpacity
            accessibilityLabel="Close minimap"
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          {selectedEncounter && (
            <Animated.View style={[styles.encounterLabel, { opacity: labelOpacity }]}>
              <Text style={styles.encounterLabelText}>{selectedEncounter}</Text>
            </Animated.View>
          )}

          {footsteps.map((footstep) => {
            const point = positionToMinimapPoint(footstep.position, boardSize, actualMapSize)
            return (
              <View
                key={footstep.id}
                accessibilityLabel={`Footstep at row ${footstep.position.row}, column ${footstep.position.col}`}
                style={[styles.footstepMarker, markerPosition(point, 3)]}
              />
            )
          })}

          {encounterPlacements.map((placement) => {
            const point = encounterPlacementToMinimapPoint(placement, boardSize, actualMapSize)
            return (
              <Pressable
                key={placement.occupancyId}
                accessibilityLabel={`Encounter ${placement.instanceId}`}
                onPress={() => showEncounterName(placement.instanceId)}
                hitSlop={8}
                style={[styles.encounterMarker, markerPosition(point, 10)]}
              />
            )
          })}

          <View
            accessibilityLabel="Player position"
            style={[styles.playerMarker, markerPosition(playerPoint, 8)]}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  map: {
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  footstepMarker: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(100, 150, 190, 0.65)',
  },
  encounterMarker: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffcc00',
    zIndex: 2,
  },
  playerMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff66',
    borderWidth: 1,
    borderColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 0, 0, 0.85)',
    zIndex: 5,
  },
  closeText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: 'bold',
  },
  encounterLabel: {
    position: 'absolute',
    top: 16,
    left: 56,
    right: 56,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    zIndex: 4,
  },
  encounterLabelText: {
    color: '#ffcc00',
    fontSize: 17,
    fontWeight: 'bold',
  },
})
