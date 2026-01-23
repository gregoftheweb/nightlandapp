import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native'
import {
  Monster,
  LevelObjectInstance,
  Player,
  GameState,
  CombatLogEntry,
  Item,
  GreatPower,
  Position,
  NonCollisionObject,
} from '@/config/types'
import { InfoBox } from './InfoBox'
import { CombatDialog } from './CombatDialog'
import { getTextContent, isPlayerOnObject } from '../modules/utils'
import { getItemTemplate } from '@/config/objects'
import deadChristosIMG from '@assets/images/deadChristos.png'
import Projectile from './Projectile'
import { enterSubGame } from '@/modules/subGames'

const { width, height } = Dimensions.get('window')

export const CELL_SIZE = 32
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE)
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE)

export { VIEWPORT_ROWS, VIEWPORT_COLS }

// Background tile configuration
const BACKGROUND_TILE_SIZE = 320
const BACKGROUND_SCALE = CELL_SIZE / 32
const SCALED_TILE_SIZE = BACKGROUND_TILE_SIZE * BACKGROUND_SCALE

interface GameBoardProps {
  state: GameState
  cameraOffset: { offsetX: number; offsetY: number }
  onPlayerTap?: () => void
  onMonsterTap?: (monster: Monster) => void
  onBuildingTap?: (building: LevelObjectInstance) => void
  onItemTap?: (item: Item) => void
  onGreatPowerTap?: (greatPower: GreatPower) => void
  onNonCollisionObjectTap?: (obj: NonCollisionObject) => void
  onDeathInfoBoxClose?: () => void
  onProjectileComplete?: (projectileId: string) => void
  onShowInfoRef?: React.MutableRefObject<
    | ((
        name: string,
        description: string,
        image?: ImageSourcePropType,
        ctaLabel?: string,
        onCtaPress?: () => void
      ) => void)
    | null
  >
  onCloseInfoRef?: React.MutableRefObject<(() => void) | null>
}

export default function GameBoard({
  state,
  cameraOffset,
  onPlayerTap,
  onMonsterTap,
  onBuildingTap,
  onItemTap,
  onGreatPowerTap,
  onNonCollisionObjectTap,
  onDeathInfoBoxClose,
  onProjectileComplete,
  onShowInfoRef,
  onCloseInfoRef,
}: GameBoardProps) {
  const [infoVisible, setInfoVisible] = useState(false)
  const [infoData, setInfoData] = useState<{
    name: string
    description: string
    image?: ImageSourcePropType
    ctaLabel?: string
    onCtaPress?: () => void
  }>({
    name: '',
    description: '',
    image: undefined,
    ctaLabel: undefined,
    onCtaPress: undefined,
  })
  const [combatInfoVisible, setCombatInfoVisible] = useState(false)
  const [combatMessages, setCombatMessages] = useState<string[]>([])
  const [previousInCombat, setPreviousInCombat] = useState(false)
  const [previousCombatLogLength, setPreviousCombatLogLength] = useState(0)
  const [previousRangedMode, setPreviousRangedMode] = useState(false)

  // Memoized entity position maps for O(1) lookups (perf: replaces linear scans)
  const monsterPositionMap = useMemo(() => {
    const map = new Map<string, Monster>()
    ;[...(state.activeMonsters || []), ...(state.level.monsters || [])].forEach((m) => {
      if (m.position && !m.inCombatSlot && m.active !== false) {
        const key = `${m.position.row}-${m.position.col}`
        map.set(key, m)
      }
    })
    return map
  }, [state.activeMonsters, state.level.monsters])

  const greatPowerPositionMap = useMemo(() => {
    const map = new Map<string, GreatPower>()
    ;(state.level.greatPowers || []).forEach((gp) => {
      if (gp.position && gp.active !== false) {
        const key = `${gp.position.row}-${gp.position.col}`
        map.set(key, gp)
      }
    })
    return map
  }, [state.level.greatPowers])

  const itemPositionMap = useMemo(() => {
    const map = new Map<string, Item>()
    ;(state.items || []).forEach((item) => {
      if (item.active && item.position) {
        const key = `${item.position.row}-${item.position.col}`
        map.set(key, item)
      }
    })
    return map
  }, [state.items])

  // Fast position finders using maps (perf: O(1) vs O(n))
  const findMonsterAtPosition = useMemo(
    () =>
      (worldRow: number, worldCol: number): Monster | undefined =>
        monsterPositionMap.get(`${worldRow}-${worldCol}`),
    [monsterPositionMap]
  )

  const findGreatPowerAtPosition = useMemo(
    () =>
      (worldRow: number, worldCol: number): GreatPower | undefined =>
        greatPowerPositionMap.get(`${worldRow}-${worldCol}`),
    [greatPowerPositionMap]
  )

  const findItemAtPosition = useMemo(
    () =>
      (worldRow: number, worldCol: number): Item | undefined =>
        itemPositionMap.get(`${worldRow}-${worldCol}`),
    [itemPositionMap]
  )

  // Handle combat start and log updates (dev logs wrapped)
  useEffect(() => {
    // if (__DEV__) {
    //   console.log(
    //     '🎯 Combat effect running - inCombat:',
    //     state.inCombat,
    //     'combatLog.length:',
    //     state.combatLog.length,
    //     'previousCombatLogLength:',
    //     previousCombatLogLength,
    //     'rangedAttackMode:',
    //     state.rangedAttackMode
    //   )
    // }

    // PRIORITY 1: Check if we just entered ranged attack mode (MUST be first to show dialog immediately)
    if (state.rangedAttackMode && !previousRangedMode && state.combatLog.length > 0) {
      // Just entered ranged mode - show dialog immediately with targeting message
      setCombatMessages(state.combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
      if (__DEV__) {
        console.log(
          '🎯 Entered ranged attack mode, showing CombatDialog immediately with targeting message'
        )
      }
    }
    // PRIORITY 2: Check if combat just started
    else if (state.inCombat && !previousInCombat && state.attackSlots.length > 0) {
      const firstMonster = state.attackSlots[0]
      const monsterName = firstMonster.name || firstMonster.shortName || 'Monster'
      const combatStartMessage = getTextContent('combatStart', [monsterName])
      setCombatMessages([combatStartMessage, ...state.combatLog.map((log) => log.message)])
      setCombatInfoVisible(true)
      if (__DEV__) {
        console.log(
          '🎯 Combat started (detected transition), showing CombatDialog with message:',
          combatStartMessage
        )
      }
    } else if (state.inCombat && state.combatLog.length > 0) {
      setCombatMessages(state.combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
      if (__DEV__) {
        console.log('🎯 In combat, updating messages')
      }
    } else if (!state.inCombat && previousInCombat) {
      // Combat ended - hide dialog UNLESS we're in ranged mode with messages
      if (!state.rangedAttackMode || state.combatLog.length === 0) {
        setCombatInfoVisible(false)
        setCombatMessages([])
        if (__DEV__) {
          console.log('🎯 Combat ended (detected transition), hiding CombatDialog')
        }
      } else {
        // Keep dialog visible if in ranged mode with messages
        setCombatMessages(state.combatLog.map((log) => log.message))
        setCombatInfoVisible(true)
        if (__DEV__) {
          console.log(
            '🎯 Combat ended but ranged mode active with messages, keeping dialog visible'
          )
        }
      }
    } else if (!state.inCombat && state.combatLog.length > previousCombatLogLength) {
      // Show combat dialog for ranged attacks (outside of combat)
      // Only show when new messages are added (prevents showing stale messages)
      setCombatMessages(state.combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
      if (__DEV__) {
        console.log('🎯 Showing CombatDialog for ranged attack messages')
      }
    } else if (!state.inCombat && state.combatLog.length === 0 && previousCombatLogLength > 0) {
      // Combat log was cleared (all monsters defeated in ranged mode)
      setCombatInfoVisible(false)
      setCombatMessages([])
      if (__DEV__) {
        console.log('🎯 Combat log cleared, hiding CombatDialog')
      }
    }
    setPreviousInCombat(state.inCombat)
    setPreviousCombatLogLength(state.combatLog.length)
    setPreviousRangedMode(state.rangedAttackMode || false)

    if (__DEV__) {
      console.log(
        '🎯 Combat effect complete - combatInfoVisible:',
        state.inCombat || state.combatLog.length > 0
      )
    }
  }, [state.inCombat, state.attackSlots, state.combatLog, state.rangedAttackMode, previousInCombat])

  // Game over effect - only show dialog on transition and respect suppressDeathDialog
  // Use a ref to track previous gameOver state to prevent stacking dialogs
  const previousGameOver = useRef(false)

  useEffect(() => {
    // Only trigger on alive->dead transition (edge trigger, not level trigger)
    // This prevents dialog stacking on repeated deaths
    if (state.gameOver && !previousGameOver.current) {
      // Check if death dialog should be suppressed (e.g., for puzzle deaths)
      if (!state.suppressDeathDialog) {
        const deathMessage =
          state.gameOverMessage || 'Your journey ends here. The darkness claims another soul...'
        if (__DEV__) {
          console.log('DEATH DETECTED - Showing InfoBox (alive->dead transition):', deathMessage)
        }
        setInfoData({
          name: 'DEATH',
          description: deathMessage,
          image: deadChristosIMG,
        })
        setInfoVisible(true)
      } else {
        if (__DEV__) {
          console.log('DEATH DETECTED - Dialog suppressed (suppressDeathDialog=true)')
        }
      }
    }

    // Update previous state for next render
    previousGameOver.current = state.gameOver || false
  }, [state.gameOver, state.gameOverMessage, state.suppressDeathDialog])

  if (!state.level || !state.level.objects) {
    if (__DEV__) {
      console.warn('GameBoard: state.level is undefined or missing objects!')
    }
    return <View style={styles.gridContainer} />
  }

  // Memoized showInfo (perf: avoids closure recreation; dev log wrapped)
  const showInfo = useCallback(
    (
      name: string,
      description: string,
      image?: ImageSourcePropType,
      ctaLabel?: string,
      onCtaPress?: () => void
    ) => {
      if (__DEV__) {
        console.log('showInfo called:', {
          name,
          description,
          image,
          ctaLabel,
          infoVisible,
        })
      }
      setInfoData({ name, description, image, ctaLabel, onCtaPress })
      setInfoVisible(true)
    },
    [infoVisible]
  )

  // Memoized closeInfo to hide InfoBox
  const closeInfo = useCallback(() => {
    if (__DEV__) {
      console.log('closeInfo called')
    }
    setInfoVisible(false)
  }, [])

  // Expose showInfo to parent component via ref
  useEffect(() => {
    if (onShowInfoRef) {
      onShowInfoRef.current = showInfo
    }
  }, [showInfo, onShowInfoRef])

  // Expose closeInfo to parent component via ref
  useEffect(() => {
    if (onCloseInfoRef) {
      onCloseInfoRef.current = closeInfo
    }
  }, [closeInfo, onCloseInfoRef])

  // Memoized handlers (perf: stable refs for child props/optimizations)
  const handlePlayerTap = useCallback(() => {
    if (__DEV__) {
      console.log('handlePlayerTap called, player:', state.player)
    }
    const player = state.player
    const weaponInfo = player.weapons?.length ? ` | Weapon: ${player.weapons[0].id}` : ''
    showInfo(
      player.name || 'Christos',
      `${
        player.description || 'The brave hero of the Last Redoubt.'
      }\n\n Level: ${state.level.name}\n${state.level.description}\n${
        player.position.row
      }- ${player.position.col}`,
      player.image || require('../assets/images/christos.png') // Use player's image if available, fallback to hardcoded
    )
    onPlayerTap?.()
  }, [state.player, state.level, showInfo, onPlayerTap])

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      if (__DEV__) {
        console.log('handleMonsterTap called, monster:', monster)
      }
      // Don't show info dialog if in ranged attack mode (player is targeting/retargeting)
      if (!state.rangedAttackMode) {
        showInfo(
          monster.name || monster.shortName || 'Monster',
          monster.description || `A dangerous creature. HP: ${monster.hp || 'Unknown'}`,
          getMonsterImage(monster)
        )
      }
      onMonsterTap?.(monster)
    },
    [showInfo, onMonsterTap, state.rangedAttackMode]
  )

  const handleCombatDialogClose = useCallback(() => {
   
    setCombatInfoVisible(false)
  }, [])

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      if (__DEV__) {
        console.log('handleGreatPowerTap called, greatPower:', greatPower)
      }
      const statusInfo = greatPower.awakened ? 'AWAKENED' : 'Sleeping'
      showInfo(
        greatPower.name || greatPower.shortName || 'Great Power',
        `${
          greatPower.description || 'An ancient entity of immense power.'
        }\n\nStatus: ${statusInfo}\nHP: ${greatPower.hp}/${
          greatPower.maxHP
        }\nAC: ${greatPower.ac}\nAttack: ${greatPower.attack}`,
        getGreatPowerImage(greatPower)
      )
      onGreatPowerTap?.(greatPower)
    },
    [showInfo, onGreatPowerTap]
  )

  const handleBuildingTap = useCallback(
    (building: LevelObjectInstance) => {
      if (__DEV__) {
        console.log('handleBuildingTap called, building:', building)
      }

      // Check if building has sub-game launch config
      const launch = building.subGame
      // Get dimensions from size object or fallback to width/height properties
      const buildingWidth = building.size?.width || building.width || 1
      const buildingHeight = building.size?.height || building.height || 1

      const playerOnObject =
        launch && building.position
          ? isPlayerOnObject(
              state.player.position,
              building.position,
              buildingWidth,
              buildingHeight
            )
          : false

      const canLaunch = launch && (!launch.requiresPlayerOnObject || playerOnObject)

      if (__DEV__) {
        console.log('Sub-game check:', {
          hasSubGame: !!launch,
          subGameName: launch?.subGameName,
          requiresPlayerOnObject: launch?.requiresPlayerOnObject,
          playerPosition: state.player.position,
          buildingPosition: building.position,
          buildingSize: { width: buildingWidth, height: buildingHeight },
          playerOnObject,
          canLaunch,
        })
      }

      if (canLaunch && launch) {
        // Show InfoBox with CTA button
        const handleCtaPress = () => {
          setInfoVisible(false)
          enterSubGame(launch.subGameName, { objectId: building.id })
        }

        showInfo(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image as ImageSourcePropType,
          launch.ctaLabel,
          handleCtaPress
        )
      } else {
        // Show InfoBox without CTA
        showInfo(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image as ImageSourcePropType
        )
      }

      onBuildingTap?.(building)
    },
    [showInfo, onBuildingTap, state.player.position]
  )

  const handleItemTap = useCallback(
    (item: Item) => {
      if (__DEV__) {
        console.log('handleItemTap called, item:', item)
      }
      showInfo(
        item.name || item.shortName || 'Item',
        item.description || 'An object of interest.',
        getItemImage(item)
      )
      onItemTap?.(item)
    },
    [showInfo, onItemTap]
  )

  const handleNonCollisionObjectTap = useCallback(
    (obj: NonCollisionObject) => {
      if (__DEV__) {
        console.log('handleNonCollisionObjectTap called, obj:', obj)
      }
      showInfo(
        obj.name || obj.shortName || 'Object',
        obj.description || 'A decorative object in the world.',
        obj.image as ImageSourcePropType
      )
      onNonCollisionObjectTap?.(obj)
    },
    [showInfo, onNonCollisionObjectTap]
  )

  // Background style (unchanged, but memoized for consistency)
  const getBackgroundStyle = useMemo(
    () => () => {
      const scaledTileSize = BACKGROUND_TILE_SIZE * BACKGROUND_SCALE
      const offsetX = -(cameraOffset.offsetX * CELL_SIZE) % scaledTileSize
      const offsetY = -(cameraOffset.offsetY * CELL_SIZE) % scaledTileSize
      return {
        transform: [{ translateX: offsetX }, { translateY: offsetY }],
        width: width + scaledTileSize,
        height: height + scaledTileSize,
      }
    },
    [cameraOffset.offsetX, cameraOffset.offsetY]
  )

  // Memoized grid cells (perf: deps on camera + entities; skips if unchanged)
  const renderGridCells = useMemo(() => {
    const tiles: React.ReactNode[] = []
    for (let row = 0; row < VIEWPORT_ROWS; row++) {
      for (let col = 0; col < VIEWPORT_COLS; col++) {
        const worldRow = row + cameraOffset.offsetY
        const worldCol = col + cameraOffset.offsetX

        const isPlayer =
          !!state.player?.position &&
          worldRow === state.player.position.row &&
          worldCol === state.player.position.col
        const monsterAtPosition = findMonsterAtPosition(worldRow, worldCol)
        const greatPowerAtPosition = findGreatPowerAtPosition(worldRow, worldCol)

        tiles.push(
          <View
            key={`cell-${worldRow}-${worldCol}`}
            style={[
              styles.cell,
              {
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                borderColor: getCellBorderColor(
                  isPlayer,
                  monsterAtPosition,
                  greatPowerAtPosition,
                  state.inCombat
                ),
                backgroundColor: getCellBackgroundColor(
                  isPlayer,
                  monsterAtPosition,
                  greatPowerAtPosition,
                  state.inCombat
                ),
              },
            ]}
          />
        )
      }
    }
    return tiles
  }, [
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    state.player?.position,
    monsterPositionMap,
    greatPowerPositionMap,
    state.inCombat,
  ])

  // Memoized entity renders (perf: deps on relevant state slices)
  const renderCombatMonsters = useMemo(() => {
    if (!state.inCombat || !state.attackSlots) return []
    return state.attackSlots
      .map((monster: Monster, index) => {
        if (!monster.position || !monster.uiSlot) return null
        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX
        const inView =
          screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
        if (!inView) return null

        // Check if this monster is the targeted monster for ranged attack
        const isTargeted = state.targetedMonsterId === monster.id

        return (
          <View
            key={`combat-monster-${monster.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: 4,
            }}
            pointerEvents="none"
          >
            <Image
              source={getMonsterImage(monster)}
              style={[
                styles.character,
                isTargeted && {
                  borderWidth: 1,
                  borderColor: 'yellow',
                },
              ]}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [
    state.inCombat,
    state.attackSlots,
    state.targetedMonsterId,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    handleMonsterTap,
  ])

  const renderPlayer = useMemo(() => {
    if (!state.player?.position) return null
    const screenRow = state.player.position.row - cameraOffset.offsetY
    const screenCol = state.player.position.col - cameraOffset.offsetX
    const inView =
      screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
    if (!inView) return null
    return (
      <View
        key="player"
        style={{
          position: 'absolute',
          left: screenCol * CELL_SIZE,
          top: screenRow * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          zIndex: 5,
        }}
        pointerEvents="none"
      >
        <Image
          source={require('../assets/images/christos.png')}
          style={styles.character}
          resizeMode="contain"
        />
      </View>
    )
  }, [state.player?.position, cameraOffset.offsetY, cameraOffset.offsetX, handlePlayerTap])

  const renderMonsters = useMemo(() => {
    if (!state.activeMonsters) return []
    return state.activeMonsters
      .map((monster, index) => {
        if (!monster.position || monster.inCombatSlot) return null
        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX
        const inView =
          screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
        if (!inView) return null

        // Check if this monster is the targeted monster for ranged attack
        const isTargeted = state.targetedMonsterId === monster.id

        return (
          <View
            key={`monster-${monster.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: 3,
            }}
            pointerEvents="none"
          >
            <Image
              source={getMonsterImage(monster)}
              style={[
                styles.character,
                isTargeted && {
                  borderWidth: 1,
                  borderColor: 'yellow',
                },
              ]}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [
    state.activeMonsters,
    state.targetedMonsterId,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    handleMonsterTap,
  ])

  const renderGreatPowers = useMemo(() => {
    if (!state.level.greatPowers) return []
    return state.level.greatPowers
      .map((greatPower, index) => {
        if (!greatPower.position || greatPower.active === false) return null
        const screenRow = greatPower.position.row - cameraOffset.offsetY
        const screenCol = greatPower.position.col - cameraOffset.offsetX
        const gpWidth = greatPower.width || 1
        const gpHeight = greatPower.height || 1
        const inView =
          screenRow + gpHeight > 0 &&
          screenRow < VIEWPORT_ROWS &&
          screenCol + gpWidth > 0 &&
          screenCol < VIEWPORT_COLS
        if (!inView) return null
        return (
          <View
            key={`greatpower-${greatPower.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: gpWidth * CELL_SIZE,
              height: gpHeight * CELL_SIZE,
              zIndex: 2,
            }}
            pointerEvents="none"
          >
            <Image
              source={getGreatPowerImage(greatPower)}
              style={{
                width: '100%',
                height: '100%',
                opacity: greatPower.awakened ? 1.0 : 0.7,
              }}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [state.level.greatPowers, cameraOffset.offsetY, cameraOffset.offsetX, handleGreatPowerTap])

  const renderItems = useMemo(() => {
    if (!state.items) return []
    return state.items
      .map((item, index) => {
        if (!item.position || !item.active) return null
        const screenRow = item.position.row - cameraOffset.offsetY
        const screenCol = item.position.col - cameraOffset.offsetX
        const inView =
          screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
        if (!inView) return null
        return (
          <View
            key={`item-${item.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: item.zIndex || 1,
            }}
            pointerEvents="none"
          >
            <Image
              source={getItemImage(item)}
              style={{
                width: CELL_SIZE * 0.6,
                height: CELL_SIZE * 0.6,
                position: 'absolute',
                left: CELL_SIZE * 0.2,
                top: CELL_SIZE * 0.2,
              }}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [state.items, cameraOffset.offsetY, cameraOffset.offsetX, handleItemTap])

  const renderBuildings = useMemo(() => {
    return state.level.objects
      .map((obj: LevelObjectInstance, index) => {
        if (!obj.position || !obj.image) return null
        const screenRow = obj.position.row - cameraOffset.offsetY
        const screenCol = obj.position.col - cameraOffset.offsetX
        const objWidth = obj.size?.width ?? 1
        const objHeight = obj.size?.height ?? 1
        const inView =
          screenRow + objHeight > 0 &&
          screenRow < VIEWPORT_ROWS &&
          screenCol + objWidth > 0 &&
          screenCol < VIEWPORT_COLS
        if (!inView) return null

        // Get rotation from instance, default to 0
        const rotation = obj.rotation ?? 0

        return (
          <View
            key={`building-${obj.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: objWidth * CELL_SIZE,
              height: objHeight * CELL_SIZE,
              zIndex: obj.zIndex || 0,
            }}
            pointerEvents="none"
          >
            <Image
              source={obj.image as ImageSourcePropType}
              style={{
                width: '100%',
                height: '100%',
                transform: [{ rotate: `${rotation}deg` }],
              }}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [state.level.objects, cameraOffset.offsetY, cameraOffset.offsetX, handleBuildingTap])

  const renderNonCollisionObjects = useMemo(() => {
    if (!state.nonCollisionObjects || state.nonCollisionObjects.length === 0) return []

    const elements: React.ReactElement[] = []

    state.nonCollisionObjects.forEach((obj, index) => {
      if (!obj.position) return

      const screenRow = obj.position.row - cameraOffset.offsetY
      const screenCol = obj.position.col - cameraOffset.offsetX
      const objWidth = obj.width || 1
      const objHeight = obj.height || 1

      const inView =
        screenRow + objHeight > 0 &&
        screenRow < VIEWPORT_ROWS &&
        screenCol + objWidth > 0 &&
        screenCol < VIEWPORT_COLS

      if (!inView) return

      const isInteractable = obj.canTap !== false

      // Render the main image (non-interactable if it has collision mask)
      const hasCollisionMask = obj.collisionMask && obj.collisionMask.length > 0

      // if (hasCollisionMask) {
      //   console.log(
      //     'Rendering collision mask for:',
      //     obj.name,
      //     'mask tiles:',
      //     obj.collisionMask?.length
      //   )
      // }

      // All non-collision objects now use View instead of TouchableOpacity
      // Interaction is handled via long-press in game/index.tsx
      elements.push(
        <View
          key={`noncollision-${obj.id}-${index}`}
          style={{
            position: 'absolute',
            left: screenCol * CELL_SIZE,
            top: screenRow * CELL_SIZE,
            width: objWidth * CELL_SIZE,
            height: objHeight * CELL_SIZE,
            zIndex: obj.zIndex || 1,
          }}
          pointerEvents="none"
        >
          <Image
            source={obj.image as ImageSourcePropType}
            style={{
              width: '100%',
              height: '100%',
              transform: [{ rotate: `${obj.rotation}deg` }],
            }}
            resizeMode="contain"
          />
        </View>
      )

      // Render collision mask tiles (also as non-interactive Views)
      if (hasCollisionMask) {
        obj.collisionMask!.forEach((mask, maskIndex) => {
          const maskScreenRow = screenRow + mask.row
          const maskScreenCol = screenCol + mask.col
          const maskWidth = mask.width || 1
          const maskHeight = mask.height || 1

          elements.push(
            <View
              key={`collision-mask-${obj.id}-${maskIndex}`}
              style={{
                position: 'absolute',
                left: maskScreenCol * CELL_SIZE,
                top: maskScreenRow * CELL_SIZE,
                width: maskWidth * CELL_SIZE,
                height: maskHeight * CELL_SIZE,
                zIndex: (obj.zIndex || 1) + 1,
                // backgroundColor: "rgba(0, 255, 255, 0.2)", // Debug visualization
                // borderWidth: 1,
                // borderColor: "cyan",
              }}
              pointerEvents="none"
            />
          )
        })
      }
    })

    return elements
  }, [
    state.nonCollisionObjects,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    handleNonCollisionObjectTap,
  ])

  // Render active projectiles
  const renderProjectiles = useMemo(() => {
    if (!state.activeProjectiles || state.activeProjectiles.length === 0) {
      return []
    }

    return state.activeProjectiles.map((projectile) => (
      <Projectile
        key={projectile.id}
        id={projectile.id}
        startX={projectile.startX}
        startY={projectile.startY}
        endX={projectile.endX}
        endY={projectile.endY}
        angleDeg={projectile.angleDeg}
        color={projectile.color}
        durationMs={projectile.durationMs}
        lengthPx={projectile.lengthPx}
        thicknessPx={projectile.thicknessPx}
        glow={projectile.glow}
        onComplete={onProjectileComplete || (() => {})}
      />
    ))
  }, [state.activeProjectiles, onProjectileComplete])

  // Memoized grid render (perf: batches entities + z-sort only if needed)
  const renderGrid = useMemo(() => {
    const gridCells = renderGridCells
    const allEntities = [
      ...renderNonCollisionObjects,
      ...renderBuildings,
      ...renderMonsters,
      ...renderGreatPowers,
      ...renderItems,
      ...renderCombatMonsters,
      renderPlayer,
    ].filter((entity): entity is React.ReactElement => entity !== null)

    // Sort by z-index (perf: only if allEntities changed)
    if (allEntities.length > 1) {
      allEntities.sort((a, b) => {
        const getZIndex = (element: React.ReactElement): number => {
          const props = element.props as any
          const style = props.style
          if (Array.isArray(style)) {
            for (const s of style) {
              if (s && typeof s === 'object' && 'zIndex' in s) {
                return (s as any).zIndex || 0
              }
            }
            return 0
          }
          return style?.zIndex || 0
        }
        return getZIndex(a) - getZIndex(b)
      })
    }

    return [...gridCells, ...allEntities]
  }, [
    renderGridCells,
    renderNonCollisionObjects,
    renderBuildings,
    renderMonsters,
    renderGreatPowers,
    renderItems,
    renderCombatMonsters,
    renderPlayer,
  ])

  // Tiled background (unchanged; already memoized well)
  const tiledBackground = useMemo(() => {
    const cols = Math.ceil(width / SCALED_TILE_SIZE) + 2
    const rows = Math.ceil(height / SCALED_TILE_SIZE) + 2
    const rawX =
      (((cameraOffset.offsetX * CELL_SIZE) % SCALED_TILE_SIZE) + SCALED_TILE_SIZE) %
      SCALED_TILE_SIZE
    const rawY =
      (((cameraOffset.offsetY * CELL_SIZE) % SCALED_TILE_SIZE) + SCALED_TILE_SIZE) %
      SCALED_TILE_SIZE
    const offsetX = -rawX
    const offsetY = -rawY
    const tiles: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = offsetX + c * SCALED_TILE_SIZE
        const top = offsetY + r * SCALED_TILE_SIZE
        tiles.push(
          <Image
            key={`bg-${r}-${c}`}
            source={require('../assets/images/dark-blue-bg-320.png')}
            style={{
              position: 'absolute',
              left,
              top,
              width: SCALED_TILE_SIZE,
              height: SCALED_TILE_SIZE,
            }}
            resizeMode="stretch"
          />
        )
      }
    }
    return tiles
  }, [cameraOffset.offsetX, cameraOffset.offsetY, width, height, SCALED_TILE_SIZE])

  return (
    <View style={styles.gridContainer}>
      {/* Tiled Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {tiledBackground}
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>{renderGrid}</View>

      {/* Projectiles - render above game content */}
      {renderProjectiles}

      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        image={infoData.image}
        ctaLabel={infoData.ctaLabel}
        onCtaPress={infoData.onCtaPress}
        onClose={() => {
          if (__DEV__) {
            console.log('InfoBox onClose called, setting infoVisible to false')
          }
          setInfoVisible(false)
          // If this is the death InfoBox, trigger navigation to death screen
          if (infoData.name === 'DEATH' && onDeathInfoBoxClose) {
            onDeathInfoBoxClose()
          }
        }}
      />

      <CombatDialog
        visible={combatInfoVisible}
        messages={combatMessages}
        onClose={handleCombatDialogClose}
      />
    </View>
  )
}

// Utility functions (unchanged, but could memoize if called in loops)
const getCellBackgroundColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  if (isPlayer) return 'rgba(45, 81, 105, 0.4)'
  if (hasMonster) return 'rgba(88, 57, 57, 0.4)'
  return 'rgba(17, 17, 17, 0.3)'
}

const getCellBorderColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  if (isPlayer) return 'rgba(84, 124, 255, 0.7)'
  if (hasMonster) return 'rgba(255, 8, 8, 0.6)'
  return 'rgba(17, 17, 17, 0.3)'
}

const getMonsterImage = (monster: Monster) => {
  return monster.image || require('../assets/images/abhuman.png')
}

const getGreatPowerImage = (greatPower: GreatPower) => {
  return greatPower.image || require('../assets/images/watcherse.png')
}

const getItemImage = (item: Item) => {
  if (item.image) return item.image
  const template = getItemTemplate(item.shortName)
  return template?.image || require('../assets/images/potion.png')
}

const styles = StyleSheet.create({
  gridContainer: {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width,
    height,
  },
  gameContent: {
    width,
    height,
    position: 'relative',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(8, 8, 8, 0.3)',
  },
  character: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: 'absolute',
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
  },
})
