import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import type {
  EncounterPlacement,
  GreatPower,
  LevelObjectInstance,
  NonCollisionObject,
  Position,
} from '@config/types'

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
  greatPowers: readonly GreatPower[]
  levelObjects: readonly LevelObjectInstance[]
  nonCollisionObjects: readonly NonCollisionObject[]
  playerPosition: Position
  mapSize?: number
}

const STATIC_BUILDING_IDS = new Set(['redoubt', 'healingPool', 'poisonPool', 'cursedTotem'])

const LEGEND_ITEMS = [
  { label: 'Player', color: '#00ff66' },
  { label: 'Encounters', color: '#ffcc00' },
  { label: 'Footsteps', color: '#91a0ad' },
  { label: 'Generated trail', color: '#e53935' },
  { label: 'Great Powers', color: '#d65cff' },
  { label: 'Buildings', color: '#ff7a1a' },
  { label: 'River', color: '#00d9ff' },
] as const

interface InspectableMarker {
  key: string
  point: { x: number; y: number }
  info: string
}

const INSPECTION_RADIUS_PX = 12

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

export function describeEncounterLocation(placement: EncounterPlacement): string {
  switch (placement.location.type) {
    case 'trunk':
      return `Trunk: ${(placement.location.progressPct * 100).toFixed(1)}%`
    case 'branch':
      return `Branch ${placement.location.branchId}: ${(placement.location.branchProgressPct * 100).toFixed(1)}%`
  }
}

function markerPosition(point: { x: number; y: number }, diameter: number) {
  return { left: point.x - diameter / 2, top: point.y - diameter / 2 }
}

function footprintCenter(
  position: Position,
  footprint: { width: number; height: number }
): Position {
  return {
    row: position.row + footprint.height / 2,
    col: position.col + footprint.width / 2,
  }
}

export default function DebugMinimap({
  visible,
  onClose,
  boardSize,
  encounterPlacements,
  greatPowers,
  levelObjects,
  nonCollisionObjects,
  playerPosition,
  mapSize,
}: DebugMinimapProps) {
  const { width: screenWidth } = useWindowDimensions()
  const actualMapSize = mapSize ?? screenWidth
  const footsteps = nonCollisionObjects.filter((object) => object.type === 'footstep')
  const rivers = nonCollisionObjects.filter((object) => object.type === 'river')
  const staticBuildings = levelObjects.filter((object) => {
    const identity = typeof object.templateId === 'string' ? object.templateId : object.shortName
    return STATIC_BUILDING_IDS.has(identity)
  })
  const playerPoint = positionToMinimapPoint(playerPosition, boardSize, actualMapSize)
  const inspectableMarkers = useMemo<InspectableMarker[]>(() => {
    const markers: InspectableMarker[] = []

    footsteps.forEach((footstep) => {
      markers.push({
        key: `footstep-${footstep.id}`,
        point: positionToMinimapPoint(footstep.position, boardSize, actualMapSize),
        info: `Footstep\nPosition: (${footstep.position.row}, ${footstep.position.col})\nRotation: ${footstep.rotation}°`,
      })
    })

    rivers.forEach((river) => {
      markers.push({
        key: `river-${river.id}`,
        point: positionToMinimapPoint(
          footprintCenter(river.position, { width: river.width, height: river.height }),
          boardSize,
          actualMapSize
        ),
        info: `${river.shortName}\nAnchor: (${river.position.row}, ${river.position.col})\nFootprint: ${river.width}×${river.height}`,
      })
    })

    staticBuildings.forEach((building) => {
      if (!building.position) return
      const footprint = building.size ?? { width: 1, height: 1 }
      markers.push({
        key: `building-${building.id}`,
        point: positionToMinimapPoint(
          footprintCenter(building.position, footprint),
          boardSize,
          actualMapSize
        ),
        info: `${building.name || building.shortName}\nPosition: (${building.position.row}, ${building.position.col})\nFootprint: ${footprint.width}×${footprint.height}`,
      })
    })

    greatPowers.forEach((greatPower) => {
      const footprint = { width: greatPower.width ?? 1, height: greatPower.height ?? 1 }
      markers.push({
        key: `great-power-${greatPower.id}`,
        point: positionToMinimapPoint(
          footprintCenter(greatPower.position, footprint),
          boardSize,
          actualMapSize
        ),
        info: `${greatPower.name || greatPower.shortName}\nPosition: (${greatPower.position.row}, ${greatPower.position.col})\nFootprint: ${footprint.width}×${footprint.height}`,
      })
    })

    encounterPlacements.forEach((placement) => {
      markers.push({
        key: `encounter-${placement.occupancyId}`,
        point: encounterPlacementToMinimapPoint(placement, boardSize, actualMapSize),
        info: `${placement.instanceId}\n${describeEncounterLocation(placement)}`,
      })
    })

    markers.push({
      key: 'player',
      point: playerPoint,
      info: `Player\nPosition: (${playerPosition.row}, ${playerPosition.col})`,
    })

    return markers
  }, [
    actualMapSize,
    boardSize,
    encounterPlacements,
    footsteps,
    greatPowers,
    playerPoint,
    playerPosition,
    rivers,
    staticBuildings,
  ])
  const [selectedMarkers, setSelectedMarkers] = useState<InspectableMarker[]>([])
  const labelOpacity = useRef(new Animated.Value(0)).current
  const labelAnimation = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(
    () => () => {
      labelAnimation.current?.stop()
    },
    []
  )

  const inspectNear = (target: InspectableMarker) => {
    const nearby = inspectableMarkers.filter((marker) => {
      const dx = marker.point.x - target.point.x
      const dy = marker.point.y - target.point.y
      return Math.sqrt(dx * dx + dy * dy) <= INSPECTION_RADIUS_PX
    })
    labelAnimation.current?.stop()
    setSelectedMarkers(nearby)
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
      if (finished) setSelectedMarkers([])
    })
  }

  const markerByKey = (key: string) =>
    inspectableMarkers.find((marker) => marker.key === key) as InspectableMarker

  const handleClose = () => {
    labelAnimation.current?.stop()
    labelOpacity.setValue(0)
    setSelectedMarkers([])
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

          {selectedMarkers.length > 0 && (
            <Animated.View style={[styles.encounterLabel, { opacity: labelOpacity }]}>
              {selectedMarkers.map((marker, index) => (
                <Text key={marker.key} style={styles.encounterLabelText}>
                  {index > 0 ? '\n' : ''}
                  {marker.info}
                </Text>
              ))}
            </Animated.View>
          )}

          {footsteps.map((footstep) => {
            const point = positionToMinimapPoint(footstep.position, boardSize, actualMapSize)
            const generated = footstep.shortName.startsWith('generated-footsteps-')
            return (
              <Pressable
                key={footstep.id}
                accessibilityLabel={`${generated ? 'Generated footstep' : 'Footstep'} at row ${footstep.position.row}, column ${footstep.position.col}`}
                onPress={() => inspectNear(markerByKey(`footstep-${footstep.id}`))}
                hitSlop={8}
                style={[
                  generated ? styles.generatedFootstepMarker : styles.footstepMarker,
                  markerPosition(point, 3),
                ]}
              />
            )
          })}

          {rivers.flatMap((river) =>
            (river.collisionMask ?? []).map((segment, index) => {
              const point = positionToMinimapPoint(
                {
                  row: river.position.row + segment.row,
                  col: river.position.col + segment.col,
                },
                boardSize,
                actualMapSize
              )
              const width = Math.max(
                2,
                ((segment.width ?? 1) / Math.max(1, boardSize.width - 1)) * actualMapSize
              )
              const height = Math.max(
                2,
                ((segment.height ?? 1) / Math.max(1, boardSize.height - 1)) * actualMapSize
              )
              return (
                <View
                  key={`${river.id}-segment-${index}`}
                  accessibilityLabel={`River segment ${index + 1}`}
                  style={[styles.riverSegment, { left: point.x, top: point.y, width, height }]}
                />
              )
            })
          )}

          {rivers.map((river) => {
            const anchor = positionToMinimapPoint(river.position, boardSize, actualMapSize)
            const width = Math.max(
              3,
              (river.width / Math.max(1, boardSize.width - 1)) * actualMapSize
            )
            const height = Math.max(
              3,
              (river.height / Math.max(1, boardSize.height - 1)) * actualMapSize
            )
            return (
              <Pressable
                key={`river-hit-${river.id}`}
                accessibilityLabel={`River ${river.shortName}`}
                onPress={() => inspectNear(markerByKey(`river-${river.id}`))}
                hitSlop={8}
                style={[styles.riverHitTarget, { left: anchor.x, top: anchor.y, width, height }]}
              />
            )
          })}

          {staticBuildings.map((building) => {
            if (!building.position) return null
            const footprint = building.size ?? { width: 1, height: 1 }
            const point = positionToMinimapPoint(
              footprintCenter(building.position, footprint),
              boardSize,
              actualMapSize
            )
            return (
              <Pressable
                key={`building-${building.id}`}
                accessibilityLabel={`Building ${building.name}`}
                onPress={() => inspectNear(markerByKey(`building-${building.id}`))}
                hitSlop={8}
                style={[styles.buildingMarker, markerPosition(point, 9)]}
              />
            )
          })}

          {greatPowers.map((greatPower) => {
            const footprint = { width: greatPower.width ?? 1, height: greatPower.height ?? 1 }
            const point = positionToMinimapPoint(
              footprintCenter(greatPower.position, footprint),
              boardSize,
              actualMapSize
            )
            return (
              <Pressable
                key={`great-power-${greatPower.id}`}
                accessibilityLabel={`Great Power ${greatPower.name}`}
                onPress={() => inspectNear(markerByKey(`great-power-${greatPower.id}`))}
                hitSlop={8}
                style={[styles.greatPowerMarker, markerPosition(point, 11)]}
              />
            )
          })}

          {encounterPlacements.map((placement) => {
            const point = encounterPlacementToMinimapPoint(placement, boardSize, actualMapSize)
            return (
              <Pressable
                key={placement.occupancyId}
                accessibilityLabel={`Encounter ${placement.instanceId}`}
                onPress={() => inspectNear(markerByKey(`encounter-${placement.occupancyId}`))}
                hitSlop={8}
                style={[styles.encounterMarker, markerPosition(point, 10)]}
              />
            )
          })}

          <Pressable
            accessibilityLabel="Player position"
            onPress={() => inspectNear(markerByKey('player'))}
            hitSlop={8}
            style={[styles.playerMarker, markerPosition(playerPoint, 8)]}
          />

          <View style={styles.legend} accessibilityLabel="Minimap legend">
            {LEGEND_ITEMS.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
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
    backgroundColor: 'rgba(145, 160, 173, 0.7)',
  },
  generatedFootstepMarker: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#e53935',
  },
  riverSegment: {
    position: 'absolute',
    backgroundColor: '#00d9ff',
    borderRadius: 1,
    zIndex: 1,
  },
  riverHitTarget: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  buildingMarker: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#ff7a1a',
    zIndex: 2,
  },
  greatPowerMarker: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#d65cff',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 3,
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
  legend: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    zIndex: 5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    marginRight: 5,
    borderRadius: 1,
  },
  legendText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 12,
  },
})
