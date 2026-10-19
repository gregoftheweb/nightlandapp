// components/GameBoard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { View, Image, StyleSheet, ImageSourcePropType, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import type {
  Monster,
  LevelObjectInstance,
  GameState,
  Item,
  GreatPower,
  NonCollisionObject,
} from '@config/types'
import { TerrainLayer } from './TerrainLayer'
import { InfoBox } from './InfoBox'
import { CombatDialog } from './CombatDialog'
import { getTextContent, isPlayerOnObject } from '../modules/utils'
import { getItemTemplate } from '@config/objects'
import deadChristosIMG from '@assets/images/ui/dialogs/deadChristos.webp'
import christosIdleIMG from '@assets/images/sprites/characters/christos.webp'
import cliffAtlasIMG from '@assets/images/backgrounds/ui_screens/cliff-wall-atlas-v2.png'
import { getMapBoundary, cliffTileAt } from '@modules/mapBoundary'
import Projectile from './Projectile'
import TeleportFlash from './effects/TeleportFlash'
import VictoryPopup from './effects/VictoryPopup'
import { getVictoryImage } from '@modules/victoryImages'
import { enterSubGame } from '@modules/subGames'
import { GAME_CELL_SIZE, type GameViewport } from '@modules/viewport'
import { getRenderedGameBoardTileSize } from '@modules/gameboardZoom'

export const CELL_SIZE = GAME_CELL_SIZE

// Background tile configuration
const BACKGROUND_TILE_SIZE = 320
// Keep absent collection props referentially stable across renders. Freezing the
// singleton also prevents one consumer from mutating every fallback collection.
const EMPTY_ARRAY = Object.freeze([])

export type GameBoardState = Pick<
  GameState,
  | 'activeMonsters'
  | 'activeProjectiles'
  | 'activeTeleportFlashes'
  | 'activeVictoryPopups'
  | 'attackSlots'
  | 'combatLog'
  | 'gameOver'
  | 'gameOverMessage'
  | 'inCombat'
  | 'items'
  | 'level'
  | 'nonCollisionObjects'
  | 'player'
  | 'rangedAttackMode'
  | 'suppressDeathDialog'
  | 'targetedMonsterId'
>

interface GameBoardProps {
  state: GameBoardState
  viewport: GameViewport
  cameraOffset: { offsetX: number; offsetY: number }
  zoomMultiplier: number
  onPlayerTap?: () => void
  onMonsterTap?: (monster: Monster) => void
  onBuildingTap?: (building: LevelObjectInstance) => void
  onItemTap?: (item: Item) => void
  onGreatPowerTap?: (greatPower: GreatPower) => void
  onNonCollisionObjectTap?: (obj: NonCollisionObject) => void
  onDeathInfoBoxClose?: () => void
  onProjectileComplete?: (projectileId: string) => void
  onTeleportFlashComplete?: (flashId: string) => void
  onVictoryPopupComplete?: (popupId: string) => void
  onShowInfoRef?: React.MutableRefObject<
    | ((
        name: string,
        description: string,
        image?: ImageSourcePropType,
        ctaLabel?: string,
        onCtaPress?: () => void,
        scrollableDescription?: boolean,
        descriptionFontFamily?: string
      ) => void)
    | null
  >
  onCloseInfoRef?: React.MutableRefObject<(() => void) | null>
}

function GameBoard({
  state,
  viewport,
  cameraOffset,
  zoomMultiplier,
  onPlayerTap,
  onMonsterTap,
  onBuildingTap,
  onItemTap,
  onGreatPowerTap,
  onNonCollisionObjectTap,
  onDeathInfoBoxClose,
  onProjectileComplete,
  onTeleportFlashComplete,
  onVictoryPopupComplete,
  onShowInfoRef,
  onCloseInfoRef,
}: GameBoardProps) {
  const renderedCellSize = getRenderedGameBoardTileSize(CELL_SIZE, zoomMultiplier)
  // Generate unique instance ID for this component
  const instanceId = useRef(`GameBoard-${Math.random().toString(36).slice(2, 11)}`)

  // Log component lifecycle
  useEffect(() => {
    const id = instanceId.current
    if (__DEV__) console.log(`🎲🎲🎲 [${id}] GameBoard component MOUNTED`)
    return () => {
      if (__DEV__) console.log(`🎲🎲🎲 [${id}] GameBoard component UNMOUNTED`)
    }
  }, [])

  const [infoVisible, setInfoVisible] = useState(false)
  const [infoData, setInfoData] = useState<{
    name: string
    description: string
    image?: ImageSourcePropType
    ctaLabel?: string
    onCtaPress?: () => void
    scrollableDescription?: boolean
    descriptionFontFamily?: string
  }>({
    name: '',
    description: '',
    image: undefined,
    ctaLabel: undefined,
    onCtaPress: undefined,
    scrollableDescription: false,
    descriptionFontFamily: undefined,
  })

  const [combatInfoVisible, setCombatInfoVisible] = useState(false)
  const [combatMessages, setCombatMessages] = useState<string[]>([])

  // Use refs for “previous” values so the main combat effect can have correct deps
  const prevInCombatRef = useRef<boolean>(false)
  const prevCombatLogLenRef = useRef<number>(0)
  const prevRangedModeRef = useRef<boolean>(false)

  // Track gameOver transition so the death dialog does not stack
  const previousGameOver = useRef(false)

  // ---- Player-hit feedback (haptic buzz + brief red vignette) ----
  // Pure "tighter feel" polish: the overworld combat log already reports
  // damage numbers, but nothing *physically* registers a hit on the player.
  // This mirrors the kind of hit feedback Jaunt Cave already has locally,
  // without touching any combat math or adding a new system.
  const prevPlayerHPRef = useRef(state.player.currentHP)
  const damageFlashOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const prevHP = prevPlayerHPRef.current
    const currentHP = state.player.currentHP
    if (currentHP < prevHP) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
      Animated.sequence([
        Animated.timing(damageFlashOpacity, {
          toValue: 0.35,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(damageFlashOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start()
    }
    prevPlayerHPRef.current = currentHP
  }, [state.player.currentHP, damageFlashOpacity])

  // ---- Defensive fallbacks (NO early returns before hooks) ----
  const level = state.level
  const levelObjects = level?.objects ?? EMPTY_ARRAY
  const activeMonsters = state.activeMonsters ?? EMPTY_ARRAY
  const levelGreatPowers = level?.greatPowers ?? EMPTY_ARRAY
  const items = state.items ?? EMPTY_ARRAY
  const combatLog = state.combatLog ?? EMPTY_ARRAY
  const attackSlots = state.attackSlots ?? EMPTY_ARRAY
  const nonCollisionObjects = state.nonCollisionObjects ?? EMPTY_ARRAY
  const activeProjectiles = state.activeProjectiles ?? EMPTY_ARRAY
  const activeTeleportFlashes = state.activeTeleportFlashes ?? EMPTY_ARRAY
  const activeVictoryPopups = state.activeVictoryPopups ?? EMPTY_ARRAY

  // Memoized showInfo
  const showInfo = useCallback(
    (
      name: string,
      description: string,
      image?: ImageSourcePropType,
      ctaLabel?: string,
      onCtaPress?: () => void,
      scrollableDescription = false,
      descriptionFontFamily?: string
    ) => {
      if (__DEV__) {
        console.log('showInfo called:', { name, ctaLabel, infoVisible })
      }
      setInfoData({
        name,
        description,
        image,
        ctaLabel,
        onCtaPress,
        scrollableDescription,
        descriptionFontFamily,
      })
      setInfoVisible(true)
    },
    [infoVisible]
  )

  // Memoized closeInfo
  const closeInfo = useCallback(() => {
    if (__DEV__) console.log('closeInfo called')
    setInfoVisible(false)
  }, [])

  // Expose showInfo to parent via ref
  useEffect(() => {
    if (!onShowInfoRef) return
    onShowInfoRef.current = showInfo
  }, [onShowInfoRef, showInfo])

  // Expose closeInfo to parent via ref
  useEffect(() => {
    if (!onCloseInfoRef) return
    onCloseInfoRef.current = closeInfo
  }, [onCloseInfoRef, closeInfo])

  // ---- Combat dialog orchestration ----
  useEffect(() => {
    const prevInCombat = prevInCombatRef.current
    const prevCombatLogLength = prevCombatLogLenRef.current
    const prevRanged = prevRangedModeRef.current

    const rangedMode = !!state.rangedAttackMode
    const inCombat = !!state.inCombat
    const logLen = combatLog.length

    // PRIORITY 1: Just entered ranged mode and there are messages
    if (rangedMode && !prevRanged && logLen > 0) {
      setCombatMessages(combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
      if (__DEV__) console.log('🎯 Entered ranged attack mode; showing CombatDialog')
    }
    // PRIORITY 2: Combat just started
    else if (inCombat && !prevInCombat && attackSlots.length > 0) {
      const firstMonster = attackSlots[0]
      const monsterName = firstMonster.name || firstMonster.shortName || 'Monster'
      const combatStartMessage = getTextContent('combatStart', [monsterName])
      setCombatMessages([combatStartMessage, ...combatLog.map((log) => log.message)])
      setCombatInfoVisible(true)
      if (__DEV__) console.log('🎯 Combat started; showing CombatDialog')
    }
    // In combat: show/update if there are messages
    else if (inCombat && logLen > 0) {
      setCombatMessages(combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
    }
    // Combat ended: hide unless ranged mode wants to keep it
    else if (!inCombat && prevInCombat) {
      if (!rangedMode || logLen === 0) {
        setCombatInfoVisible(false)
        setCombatMessages([])
      } else {
        setCombatMessages(combatLog.map((log) => log.message))
        setCombatInfoVisible(true)
      }
    }
    // Outside combat: ranged log updates
    else if (!inCombat && logLen > prevCombatLogLength) {
      setCombatMessages(combatLog.map((log) => log.message))
      setCombatInfoVisible(true)
    }
    // Log cleared
    else if (!inCombat && logLen === 0 && prevCombatLogLength > 0) {
      setCombatInfoVisible(false)
      setCombatMessages([])
    }

    prevInCombatRef.current = inCombat
    prevCombatLogLenRef.current = logLen
    prevRangedModeRef.current = rangedMode
  }, [state.inCombat, state.rangedAttackMode, attackSlots, combatLog])

  // Game over effect - only show dialog on transition and respect suppressDeathDialog
  useEffect(() => {
    const id = instanceId.current
    if (state.gameOver && !previousGameOver.current) {
      if (!state.suppressDeathDialog) {
        const deathMessage =
          state.gameOverMessage || 'Your journey ends here. The darkness claims another soul...'
        if (__DEV__) {
          console.log(`💀💀💀 [${id}] DEATH DETECTED - Showing InfoBox`)
        }
        setInfoData({
          name: 'DEATH',
          description: deathMessage,
          image: deadChristosIMG,
        })
        setInfoVisible(true)
      } else {
        if (__DEV__) {
          console.log(`💀💀💀 [${id}] DEATH DETECTED - Dialog suppressed`)
        }
      }
    }
    previousGameOver.current = !!state.gameOver
  }, [state.gameOver, state.gameOverMessage, state.suppressDeathDialog])

  // ---- Tap handlers (stable, unconditionally declared) ----
  const handlePlayerTap = useCallback(() => {
    const player = state.player
    if (!player) return

    if (__DEV__) console.log('handlePlayerTap called, player:', player)

    showInfo(
      player.name || 'Christos',
      `${
        player.description || 'The brave hero of the Last Redoubt.'
      }\n\nLevel: ${level?.name ?? ''}\n${level?.description ?? ''}\n${player.position.row}- ${
        player.position.col
      }`,
      player.image || require('@assets/images/sprites/characters/christos.webp')
    )
    onPlayerTap?.()
  }, [state.player, level?.name, level?.description, onPlayerTap, showInfo])

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      if (__DEV__) console.log('handleMonsterTap called, monster:', monster)

      if (!state.rangedAttackMode) {
        showInfo(
          monster.name || monster.shortName || 'Monster',
          monster.description || `A dangerous creature. HP: ${monster.currentHP ?? 'Unknown'}`,
          getMonsterImage(monster)
        )
      }
      onMonsterTap?.(monster)
    },
    [onMonsterTap, showInfo, state.rangedAttackMode]
  )

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      if (__DEV__) console.log('handleGreatPowerTap called, greatPower:', greatPower)
      showInfo(
        greatPower.name || greatPower.shortName || 'Great Power',
        greatPower.description || 'An ancient entity of immense power.',
        getGreatPowerImage(greatPower)
      )
      onGreatPowerTap?.(greatPower)
    },
    [onGreatPowerTap, showInfo]
  )

  const handleBuildingTap = useCallback(
    (building: LevelObjectInstance) => {
      if (__DEV__) console.log('handleBuildingTap called, building:', building)

      const launch = building.subGame
      const buildingWidth = building.size?.width || building.width || 1
      const buildingHeight = building.size?.height || building.height || 1

      const playerPos = state.player?.position
      const playerOnObject =
        !!(launch && building.position && playerPos) &&
        isPlayerOnObject(playerPos, building.position, buildingWidth, buildingHeight)

      const canLaunch = !!(launch && (!launch.requiresPlayerOnObject || playerOnObject))

      if (canLaunch && launch) {
        const handleCtaPress = () => {
          setInfoVisible(false)
          enterSubGame(launch.instanceId, { objectId: building.id })
        }

        showInfo(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image as ImageSourcePropType,
          launch.ctaLabel,
          handleCtaPress
        )
      } else {
        showInfo(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image as ImageSourcePropType
        )
      }

      onBuildingTap?.(building)
    },
    [onBuildingTap, showInfo, state.player?.position]
  )

  const handleItemTap = useCallback(
    (item: Item) => {
      if (__DEV__) console.log('handleItemTap called, item:', item)
      showInfo(
        item.name || item.shortName || 'Item',
        item.description || 'An object of interest.',
        getItemImage(item)
      )
      onItemTap?.(item)
    },
    [onItemTap, showInfo]
  )

  const handleNonCollisionObjectTap = useCallback(
    (obj: NonCollisionObject) => {
      if (__DEV__) console.log('handleNonCollisionObjectTap called, obj:', obj)
      showInfo(
        obj.name || obj.shortName || 'Object',
        obj.description || 'A decorative object in the world.',
        obj.image as ImageSourcePropType
      )
      onNonCollisionObjectTap?.(obj)
    },
    [onNonCollisionObjectTap, showInfo]
  )

  const handleCombatDialogClose = useCallback(() => {
    setCombatInfoVisible(false)
  }, [])

  // The line geometry never changes for this viewport, so movement does not
  // recreate or reconcile the grid itself.
  const renderGridLines = useMemo(() => {
    const lines: React.ReactNode[] = []
    for (let row = 0; row <= viewport.rows; row++) {
      lines.push(
        <View key={`grid-row-${row}`} style={[styles.gridRow, { top: row * renderedCellSize }]} />
      )
    }
    for (let col = 0; col <= viewport.cols; col++) {
      lines.push(
        <View
          key={`grid-col-${col}`}
          style={[styles.gridColumn, { left: col * renderedCellSize }]}
        />
      )
    }

    return lines
  }, [viewport.cols, viewport.rows, renderedCellSize, zoomMultiplier])

  // Only the handful of occupied cells move as the camera changes.
  const renderGridHighlights = useMemo(() => {
    const highlights: React.ReactNode[] = []
    activeMonsters.forEach((monster) => {
      if (!monster.position || monster.inCombatSlot) return
      const screenRow = monster.position.row - cameraOffset.offsetY
      const screenCol = monster.position.col - cameraOffset.offsetX
      const monsterWidth = monster.width ?? 1
      const monsterHeight = monster.height ?? 1
      if (
        screenRow + monsterHeight <= 0 ||
        screenRow >= viewport.rows ||
        screenCol + monsterWidth <= 0 ||
        screenCol >= viewport.cols
      ) {
        return
      }
      highlights.push(
        <View
          key={`grid-highlight-monster-${monster.id}`}
          style={[
            styles.cellHighlight,
            styles.monsterCellHighlight,
            {
              left: screenCol * renderedCellSize,
              top: screenRow * renderedCellSize,
              width: renderedCellSize * monsterWidth,
              height: renderedCellSize * monsterHeight,
            },
          ]}
        />
      )
    })

    const playerPosition = state.player?.position
    if (playerPosition) {
      const screenRow = playerPosition.row - cameraOffset.offsetY
      const screenCol = playerPosition.col - cameraOffset.offsetX
      if (
        screenRow >= 0 &&
        screenRow < viewport.rows &&
        screenCol >= 0 &&
        screenCol < viewport.cols
      ) {
        highlights.push(
          <View
            key="grid-highlight-player"
            style={[
              styles.cellHighlight,
              state.player.hideActive
                ? styles.hiddenPlayerCellHighlight
                : styles.playerCellHighlight,
              {
                left: screenCol * renderedCellSize,
                top: screenRow * renderedCellSize,
                width: renderedCellSize,
                height: renderedCellSize,
              },
            ]}
          />
        )
      }
    }

    return highlights
  }, [
    activeMonsters,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    state.player?.position,
    state.player?.hideActive,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderCombatMonsters = useMemo(() => {
    if (!state.inCombat || attackSlots.length === 0) return []

    return attackSlots
      .map((monster: Monster, index) => {
        if (!monster.position || !monster.uiSlot) return null

        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX
        const monsterWidth = monster.width ?? 1
        const monsterHeight = monster.height ?? 1

        const inView =
          screenRow + monsterHeight > 0 &&
          screenRow < viewport.rows &&
          screenCol + monsterWidth > 0 &&
          screenCol < viewport.cols
        if (!inView) return null

        const isTargeted = state.targetedMonsterId === monster.id

        return (
          <View
            key={`combat-monster-${monster.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * renderedCellSize,
              top: screenRow * renderedCellSize,
              width: renderedCellSize * monsterWidth,
              height: renderedCellSize * monsterHeight,
              zIndex: 4,
            }}
            pointerEvents="none"
          >
            <Image
              source={getMonsterImage(monster)}
              style={[
                styles.character,
                {
                  width: renderedCellSize * monsterWidth * 0.9,
                  height: renderedCellSize * monsterHeight * 0.9,
                  left: renderedCellSize * monsterWidth * 0.05,
                  top: renderedCellSize * monsterHeight * 0.05,
                },
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
    attackSlots,
    state.targetedMonsterId,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderPlayer = useMemo(() => {
    const pos = state.player?.position
    if (!pos) return null

    const screenRow = pos.row - cameraOffset.offsetY
    const screenCol = pos.col - cameraOffset.offsetX

    const inView =
      screenRow >= 0 && screenRow < viewport.rows && screenCol >= 0 && screenCol < viewport.cols
    if (!inView) return null

    return (
      <View
        key="player"
        style={{
          position: 'absolute',
          left: screenCol * renderedCellSize,
          top: screenRow * renderedCellSize,
          width: renderedCellSize,
          height: renderedCellSize,
          zIndex: 5,
        }}
        pointerEvents="none"
      >
        <Image
          source={christosIdleIMG}
          style={[
            styles.character,
            {
              width: renderedCellSize * 0.8,
              height: renderedCellSize * 0.8,
              left: renderedCellSize * 0.1,
              top: renderedCellSize * 0.1,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    )
  }, [
    state.player?.position,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderMonsters = useMemo(() => {
    if (activeMonsters.length === 0) return []

    return activeMonsters
      .map((monster, index) => {
        if (!monster.position || monster.inCombatSlot) return null

        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX
        const monsterWidth = monster.width ?? 1
        const monsterHeight = monster.height ?? 1

        const inView =
          screenRow + monsterHeight > 0 &&
          screenRow < viewport.rows &&
          screenCol + monsterWidth > 0 &&
          screenCol < viewport.cols
        if (!inView) return null

        const isTargeted = state.targetedMonsterId === monster.id

        return (
          <View
            key={`monster-${monster.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * renderedCellSize,
              top: screenRow * renderedCellSize,
              width: renderedCellSize * monsterWidth,
              height: renderedCellSize * monsterHeight,
              zIndex: 3,
            }}
            pointerEvents="none"
          >
            <Image
              source={getMonsterImage(monster)}
              style={[
                styles.character,
                {
                  width: renderedCellSize * monsterWidth * 0.9,
                  height: renderedCellSize * monsterHeight * 0.9,
                  left: renderedCellSize * monsterWidth * 0.05,
                  top: renderedCellSize * monsterHeight * 0.05,
                },
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
    activeMonsters,
    state.targetedMonsterId,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderGreatPowers = useMemo(() => {
    if (levelGreatPowers.length === 0) return []

    return levelGreatPowers
      .map((greatPower, index) => {
        if (!greatPower.position) return null

        const screenRow = greatPower.position.row - cameraOffset.offsetY
        const screenCol = greatPower.position.col - cameraOffset.offsetX

        const gpWidth = greatPower.width || 1
        const gpHeight = greatPower.height || 1

        // Enlarge Watcher artwork around its existing gameplay footprint center.
        const displayScale = greatPower.shortName.startsWith('watcher_') ? 2 : 1
        const displayWidth = gpWidth * displayScale
        const displayHeight = gpHeight * displayScale
        const displayRow = screenRow - (displayHeight - gpHeight) / 2
        const displayCol = screenCol - (displayWidth - gpWidth) / 2

        const inView =
          displayRow + displayHeight > 0 &&
          displayRow < viewport.rows &&
          displayCol + displayWidth > 0 &&
          displayCol < viewport.cols
        if (!inView) return null

        return (
          <View
            key={`greatpower-${greatPower.id}-${index}`}
            style={{
              position: 'absolute',
              left: displayCol * renderedCellSize,
              top: displayRow * renderedCellSize,
              width: displayWidth * renderedCellSize,
              height: displayHeight * renderedCellSize,
              zIndex: 2,
            }}
            pointerEvents="none"
          >
            <Image
              source={getGreatPowerImage(greatPower)}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [
    levelGreatPowers,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderItems = useMemo(() => {
    if (items.length === 0) return []

    return items
      .map((item, index) => {
        if (!item.position || !item.active) return null

        const screenRow = item.position.row - cameraOffset.offsetY
        const screenCol = item.position.col - cameraOffset.offsetX

        const inView =
          screenRow >= 0 && screenRow < viewport.rows && screenCol >= 0 && screenCol < viewport.cols
        if (!inView) return null

        return (
          <View
            key={`item-${item.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * renderedCellSize,
              top: screenRow * renderedCellSize,
              width: renderedCellSize,
              height: renderedCellSize,
              zIndex: item.zIndex || 1,
            }}
            pointerEvents="none"
          >
            <Image
              source={getItemImage(item)}
              style={{
                width: renderedCellSize * 0.6,
                height: renderedCellSize * 0.6,
                position: 'absolute',
                left: renderedCellSize * 0.2,
                top: renderedCellSize * 0.2,
              }}
              resizeMode="contain"
            />
          </View>
        )
      })
      .filter((item): item is React.ReactElement => item !== null)
  }, [
    items,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderBuildings = useMemo(() => {
    if (!level || levelObjects.length === 0) return []

    return levelObjects
      .map((obj: LevelObjectInstance, index) => {
        if (!obj.position || !obj.image) return null

        const screenRow = obj.position.row - cameraOffset.offsetY
        const screenCol = obj.position.col - cameraOffset.offsetX

        const objWidth = obj.size?.width ?? 1
        const objHeight = obj.size?.height ?? 1

        const inView =
          screenRow + objHeight > 0 &&
          screenRow < viewport.rows &&
          screenCol + objWidth > 0 &&
          screenCol < viewport.cols
        if (!inView) return null

        const rotation = obj.rotation ?? 0
        const isLastRedoubt = obj.shortName === 'redoubt'

        return (
          <View
            key={`building-${obj.id}-${index}`}
            style={{
              position: 'absolute',
              left: screenCol * renderedCellSize,
              top: screenRow * renderedCellSize,
              width: objWidth * renderedCellSize,
              height: objHeight * renderedCellSize,
              zIndex: obj.zIndex || 0,
            }}
            pointerEvents="none"
          >
            {isLastRedoubt && (
              <View
                style={{
                  position: 'absolute',
                  left: -renderedCellSize * 0.35,
                  top: -renderedCellSize * 0.35,
                  width: objWidth * renderedCellSize + renderedCellSize * 0.7,
                  height: objHeight * renderedCellSize + renderedCellSize * 0.7,
                  borderRadius: objWidth * renderedCellSize,
                  borderWidth: Math.max(2, renderedCellSize * 0.08),
                  borderColor: '#29bfff',
                  shadowColor: '#29bfff',
                  shadowOpacity: 0.95,
                  shadowRadius: renderedCellSize * 0.35,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                }}
              />
            )}
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
  }, [
    level,
    levelObjects,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  const renderNonCollisionObjects = useMemo(() => {
    if (nonCollisionObjects.length === 0) return []

    const elements: React.ReactElement[] = []

    nonCollisionObjects.forEach((obj, index) => {
      if (!obj.position) return

      const screenRow = obj.position.row - cameraOffset.offsetY
      const screenCol = obj.position.col - cameraOffset.offsetX
      const objWidth = obj.width || 1
      const objHeight = obj.height || 1

      const inView =
        screenRow + objHeight > 0 &&
        screenRow < viewport.rows &&
        screenCol + objWidth > 0 &&
        screenCol < viewport.cols
      if (!inView) return

      const hasCollisionMask = !!(obj.collisionMask && obj.collisionMask.length > 0)

      elements.push(
        <View
          key={`noncollision-${obj.id}-${index}`}
          style={{
            position: 'absolute',
            left: screenCol * renderedCellSize,
            top: screenRow * renderedCellSize,
            width: objWidth * renderedCellSize,
            height: objHeight * renderedCellSize,
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
                left: maskScreenCol * renderedCellSize,
                top: maskScreenRow * renderedCellSize,
                width: maskWidth * renderedCellSize,
                height: maskHeight * renderedCellSize,
                zIndex: (obj.zIndex || 1) + 1,
              }}
              pointerEvents="none"
            />
          )
        })
      }
    })

    return elements
  }, [
    nonCollisionObjects,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    viewport.cols,
    viewport.rows,
    renderedCellSize,
    zoomMultiplier,
  ])

  // Render only visible boundary/exterior cells from the shared collision mask.
  const renderBoardBorder = useMemo(() => {
    const boardWidth = level?.boardSize?.width
    const boardHeight = level?.boardSize?.height
    if (!boardWidth || !boardHeight) return []
    const boundary = getMapBoundary(boardWidth, boardHeight, level.id)
    const elements: React.ReactNode[] = []
    for (
      let row = Math.max(0, Math.floor(cameraOffset.offsetY));
      row < Math.min(boardHeight, cameraOffset.offsetY + viewport.rows);
      row++
    ) {
      for (
        let col = Math.max(0, Math.floor(cameraOffset.offsetX));
        col < Math.min(boardWidth, cameraOffset.offsetX + viewport.cols);
        col++
      ) {
        const index = row * boardWidth + col
        if (boundary.walkable[index]) continue
        const tile = cliffTileAt(boundary, row, col)
        elements.push(
          <View
            key={`cliff-${row}-${col}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (col - cameraOffset.offsetX) * renderedCellSize,
              top: (row - cameraOffset.offsetY) * renderedCellSize,
              width: renderedCellSize,
              height: renderedCellSize,
              overflow: 'hidden',
              backgroundColor: '#181c1b',
              zIndex: 1,
              transform: tile ? [{ rotate: `${tile.rotation}deg` }] : undefined,
            }}
          >
            {tile && (
              <Image
                source={cliffAtlasIMG}
                resizeMode="stretch"
                style={{
                  position: 'absolute',
                  width: renderedCellSize * 4,
                  height: renderedCellSize * 2,
                  left: -tile.column * renderedCellSize,
                  top: -tile.row * renderedCellSize,
                }}
              />
            )}
          </View>
        )
      }
    }
    return elements
  }, [
    level,
    cameraOffset.offsetX,
    cameraOffset.offsetY,
    viewport.rows,
    viewport.cols,
    renderedCellSize,
  ])

  // Render active projectiles
  const renderProjectiles = useMemo(() => {
    if (activeProjectiles.length === 0) return []

    return activeProjectiles.map((projectile) => {
      const isWorldBeam =
        projectile.kind === 'bile-beam' && projectile.startPosition && projectile.endPosition
      const startX = isWorldBeam
        ? (projectile.startPosition!.col - cameraOffset.offsetX) * renderedCellSize
        : projectile.startX
      const startY = isWorldBeam
        ? (projectile.startPosition!.row - cameraOffset.offsetY) * renderedCellSize
        : projectile.startY
      const endX = isWorldBeam
        ? (projectile.endPosition!.col - cameraOffset.offsetX) * renderedCellSize
        : projectile.endX
      const endY = isWorldBeam
        ? (projectile.endPosition!.row - cameraOffset.offsetY) * renderedCellSize
        : projectile.endY
      const deltaX = endX - startX
      const deltaY = endY - startY

      return (
        <Projectile
          key={projectile.id}
          id={projectile.id}
          startX={startX}
          startY={startY}
          endX={isWorldBeam ? startX : endX}
          endY={isWorldBeam ? startY : endY}
          angleDeg={
            isWorldBeam ? (Math.atan2(deltaY, deltaX) * 180) / Math.PI : projectile.angleDeg
          }
          color={projectile.color}
          durationMs={projectile.durationMs}
          lengthPx={isWorldBeam ? Math.hypot(deltaX, deltaY) : projectile.lengthPx}
          thicknessPx={isWorldBeam ? Math.max(4, renderedCellSize * 0.14) : projectile.thicknessPx}
          glow={projectile.glow}
          stationaryFade={projectile.stationaryFade}
          onComplete={onProjectileComplete || (() => {})}
        />
      )
    })
  }, [
    activeProjectiles,
    cameraOffset.offsetX,
    cameraOffset.offsetY,
    onProjectileComplete,
    renderedCellSize,
    zoomMultiplier,
  ])

  // Render active teleport flashes
  const renderTeleportFlashes = useMemo(() => {
    if (activeTeleportFlashes.length === 0) return []

    return activeTeleportFlashes.map((flash) => (
      <TeleportFlash
        key={flash.id}
        id={flash.id}
        gridCol={flash.gridCol}
        gridRow={flash.gridRow}
        cellSize={renderedCellSize}
        cameraOffsetX={cameraOffset.offsetX}
        cameraOffsetY={cameraOffset.offsetY}
        onComplete={onTeleportFlashComplete || (() => {})}
      />
    ))
  }, [
    activeTeleportFlashes,
    cameraOffset.offsetX,
    cameraOffset.offsetY,
    onTeleportFlashComplete,
    renderedCellSize,
    zoomMultiplier,
  ])

  // Render active melee-victory popups
  const renderVictoryPopups = useMemo(() => {
    if (activeVictoryPopups.length === 0) return []

    return activeVictoryPopups.flatMap((popup) => {
      const image = getVictoryImage(popup.monsterShortName, popup.imageIndex)
      if (!image) return []
      return [
        <VictoryPopup
          key={popup.id}
          id={popup.id}
          image={image}
          onComplete={onVictoryPopupComplete || (() => {})}
        />,
      ]
    })
  }, [activeVictoryPopups, onVictoryPopupComplete])

  // Memoized grid render
  const renderGrid = useMemo(() => {
    const allEntities = [
      <TerrainLayer
        key="terrain"
        regions={state.level.terrainRegions ?? EMPTY_ARRAY}
        cameraOffset={cameraOffset}
        viewport={viewport}
        cellSize={renderedCellSize}
      />,
      ...renderNonCollisionObjects,
      ...renderBuildings,
      ...renderMonsters,
      ...renderGreatPowers,
      ...renderItems,
      ...renderCombatMonsters,
      renderPlayer,
    ].filter((entity): entity is React.ReactElement => entity !== null)

    if (allEntities.length > 1) {
      allEntities.sort((a, b) => {
        const getZIndex = (element: React.ReactElement): number => {
          const props = element.props as any
          const style = props.style
          if (Array.isArray(style)) {
            for (const s of style) {
              if (s && typeof s === 'object' && 'zIndex' in s) return (s as any).zIndex || 0
            }
            return 0
          }
          return style?.zIndex || 0
        }
        return getZIndex(a) - getZIndex(b)
      })
    }

    return allEntities
  }, [
    state.level.terrainRegions,
    cameraOffset,
    viewport,
    renderedCellSize,
    renderNonCollisionObjects,
    renderBuildings,
    renderMonsters,
    renderGreatPowers,
    renderItems,
    renderCombatMonsters,
    renderPlayer,
    zoomMultiplier,
  ])

  // Tiled background
  const tiledBackground = useMemo(() => {
    const scaledBackgroundTileSize = BACKGROUND_TILE_SIZE * zoomMultiplier
    const cols = Math.ceil(viewport.width / scaledBackgroundTileSize) + 2
    const rows = Math.ceil(viewport.height / scaledBackgroundTileSize) + 2
    const rawX =
      (((cameraOffset.offsetX * renderedCellSize) % scaledBackgroundTileSize) +
        scaledBackgroundTileSize) %
      scaledBackgroundTileSize
    const rawY =
      (((cameraOffset.offsetY * renderedCellSize) % scaledBackgroundTileSize) +
        scaledBackgroundTileSize) %
      scaledBackgroundTileSize
    const offsetX = -rawX
    const offsetY = -rawY

    const tiles: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = offsetX + c * scaledBackgroundTileSize
        const top = offsetY + r * scaledBackgroundTileSize
        tiles.push(
          <Image
            key={`bg-${r}-${c}`}
            source={require('@assets/images/backgrounds/ui_screens/dark-blue-bg-320.webp')}
            style={{
              position: 'absolute',
              left,
              top,
              width: scaledBackgroundTileSize,
              height: scaledBackgroundTileSize,
            }}
            resizeMode="stretch"
          />
        )
      }
    }
    return tiles
  }, [
    cameraOffset.offsetX,
    cameraOffset.offsetY,
    viewport.height,
    viewport.width,
    renderedCellSize,
    zoomMultiplier,
  ])

  const safeEmptyBoard = useMemo(() => {
    // If level or objects are missing, render an empty board (but DO NOT early return before hooks)
    if (!level) return true
    if (!Array.isArray(levelObjects)) return true
    return false
  }, [level, levelObjects])

  return (
    <View
      style={[
        styles.gridContainer,
        {
          left: viewport.left,
          top: viewport.top,
          width: viewport.width,
          height: viewport.height,
        },
      ]}
    >
      {/* Tiled Background */}
      <View style={styles.fillContainer} pointerEvents="none">
        {tiledBackground}
      </View>

      {/* Game Content */}
      <View style={styles.fillContainer}>
        {safeEmptyBoard ? null : (
          <>
            <View style={styles.gridLayer} pointerEvents="none">
              {renderGridLines}
              {renderGridHighlights}
            </View>
            {renderBoardBorder}
            {renderGrid}
          </>
        )}
      </View>

      {/* Projectiles */}
      {renderProjectiles}

      {/* Teleport Flashes */}
      {renderTeleportFlashes}
      {renderVictoryPopups}

      <Animated.View
        pointerEvents="none"
        style={[styles.damageFlash, { opacity: damageFlashOpacity }]}
      />

      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        image={infoData.image}
        ctaLabel={infoData.ctaLabel}
        onCtaPress={infoData.onCtaPress}
        scrollableDescription={infoData.scrollableDescription}
        descriptionFontFamily={infoData.descriptionFontFamily}
        onClose={() => {
          const id = instanceId.current
          if (__DEV__) {
            console.log(`📦📦📦 [${id}] InfoBox onClose called; setting infoVisible=false`)
            console.log(`📦📦📦 [${id}] infoData.name = "${infoData.name}"`)
          }
          setInfoVisible(false)
          if (infoData.name === 'DEATH' && onDeathInfoBoxClose) {
            if (__DEV__) console.log(`📦📦📦 [${id}] DEATH InfoBox; calling onDeathInfoBoxClose()`)
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

export default React.memo(GameBoard)

// Utility functions
const getMonsterImage = (monster: Monster) => {
  return monster.image || require('@assets/images/sprites/monsters/abhuman.webp')
}

const getGreatPowerImage = (greatPower: GreatPower) => {
  return (
    greatPower.image ||
    require('@assets/images/sprites/great-powers/watcher-south-east-circle.webp')
  )
}

const getItemImage = (item: Item) => {
  if (item.image) return item.image
  const template = getItemTemplate(item.shortName)
  return template?.image || require('@assets/images/items/consumables/potion.webp')
}

const styles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  damageFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#8a0000',
    zIndex: 999,
  },
  fillContainer: {
    ...StyleSheet.absoluteFill,
  },
  gridLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 17, 17, 0.3)',
    zIndex: 0,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(17, 17, 17, 0.3)',
  },
  gridColumn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(17, 17, 17, 0.3)',
  },
  cellHighlight: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderWidth: 0.5,
  },
  monsterCellHighlight: {
    borderColor: 'rgba(255, 8, 8, 0.6)',
    backgroundColor: 'rgba(88, 57, 57, 0.4)',
  },
  playerCellHighlight: {
    borderColor: 'rgba(84, 124, 255, 0.7)',
    backgroundColor: 'rgba(45, 81, 105, 0.4)',
  },
  hiddenPlayerCellHighlight: {
    borderColor: '#00aa00',
    backgroundColor: 'rgba(45, 81, 105, 0.4)',
  },
  character: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: 'absolute',
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
  },
})
