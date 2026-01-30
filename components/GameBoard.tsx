// components/GameBoard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native'
import type {
  Monster,
  LevelObjectInstance,
  GameState,
  Item,
  GreatPower,
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
  }>({
    name: '',
    description: '',
    image: undefined,
    ctaLabel: undefined,
    onCtaPress: undefined,
  })

  const [combatInfoVisible, setCombatInfoVisible] = useState(false)
  const [combatMessages, setCombatMessages] = useState<string[]>([])

  // Use refs for “previous” values so the main combat effect can have correct deps
  const prevInCombatRef = useRef<boolean>(false)
  const prevCombatLogLenRef = useRef<number>(0)
  const prevRangedModeRef = useRef<boolean>(false)

  // Track gameOver transition so the death dialog does not stack
  const previousGameOver = useRef(false)

  // ---- Defensive fallbacks (NO early returns before hooks) ----
  const level = state.level
  const levelObjects = level?.objects ?? []
  const levelMonsters = level?.monsters ?? []
  const activeMonsters = state.activeMonsters ?? []
  const levelGreatPowers = level?.greatPowers ?? []
  const items = state.items ?? []
  const combatLog = state.combatLog ?? []
  const attackSlots = state.attackSlots ?? []
  const nonCollisionObjects = state.nonCollisionObjects ?? []
  const activeProjectiles = state.activeProjectiles ?? []

  // Memoized entity position maps for O(1) lookups (perf: replaces linear scans)
  const monsterPositionMap = useMemo(() => {
    const map = new Map<string, Monster>()
    ;[...activeMonsters, ...levelMonsters].forEach((m) => {
      if (m.position && !m.inCombatSlot && m.active !== false) {
        map.set(`${m.position.row}-${m.position.col}`, m)
      }
    })
    return map
  }, [activeMonsters, levelMonsters])

  const greatPowerPositionMap = useMemo(() => {
    const map = new Map<string, GreatPower>()
    levelGreatPowers.forEach((gp) => {
      if (gp.position && gp.active !== false) {
        map.set(`${gp.position.row}-${gp.position.col}`, gp)
      }
    })
    return map
  }, [levelGreatPowers])

  const itemPositionMap = useMemo(() => {
    const map = new Map<string, Item>()
    items.forEach((item) => {
      if (item.active && item.position) {
        map.set(`${item.position.row}-${item.position.col}`, item)
      }
    })
    return map
  }, [items])

  // Fast position finders using maps (perf: O(1) vs O(n))
  const findMonsterAtPosition = useCallback(
    (worldRow: number, worldCol: number): Monster | undefined =>
      monsterPositionMap.get(`${worldRow}-${worldCol}`),
    [monsterPositionMap]
  )

  const findGreatPowerAtPosition = useCallback(
    (worldRow: number, worldCol: number): GreatPower | undefined =>
      greatPowerPositionMap.get(`${worldRow}-${worldCol}`),
    [greatPowerPositionMap]
  )

  const findItemAtPosition = useCallback(
    (worldRow: number, worldCol: number): Item | undefined =>
      itemPositionMap.get(`${worldRow}-${worldCol}`),
    [itemPositionMap]
  )

  // Memoized showInfo
  const showInfo = useCallback(
    (
      name: string,
      description: string,
      image?: ImageSourcePropType,
      ctaLabel?: string,
      onCtaPress?: () => void
    ) => {
      if (__DEV__) {
        console.log('showInfo called:', { name, ctaLabel, infoVisible })
      }
      setInfoData({ name, description, image, ctaLabel, onCtaPress })
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
      player.image || require('../assets/images/christos.png')
    )
    onPlayerTap?.()
  }, [state.player, level?.name, level?.description, onPlayerTap, showInfo])

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      if (__DEV__) console.log('handleMonsterTap called, monster:', monster)

      if (!state.rangedAttackMode) {
        showInfo(
          monster.name || monster.shortName || 'Monster',
          monster.description || `A dangerous creature. HP: ${monster.hp ?? 'Unknown'}`,
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
      const statusInfo = greatPower.awakened ? 'AWAKENED' : 'Sleeping'
      showInfo(
        greatPower.name || greatPower.shortName || 'Great Power',
        `${
          greatPower.description || 'An ancient entity of immense power.'
        }\n\nStatus: ${statusInfo}\nHP: ${greatPower.hp}/${greatPower.maxHP}\nAC: ${
          greatPower.ac
        }\nAttack: ${greatPower.attack}`,
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

  // ---- Memoized grid cells (always computed; returns [] if level missing) ----
  const renderGridCells = useMemo(() => {
    if (!level) return []

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
                  !!state.inCombat
                ),
                backgroundColor: getCellBackgroundColor(
                  isPlayer,
                  monsterAtPosition,
                  greatPowerAtPosition,
                  !!state.inCombat
                ),
              },
            ]}
          />
        )
      }
    }
    return tiles
  }, [
    level,
    cameraOffset.offsetY,
    cameraOffset.offsetX,
    state.player?.position,
    state.inCombat,
    findMonsterAtPosition,
    findGreatPowerAtPosition,
  ])

  const renderCombatMonsters = useMemo(() => {
    if (!state.inCombat || attackSlots.length === 0) return []

    return attackSlots
      .map((monster: Monster, index) => {
        if (!monster.position || !monster.uiSlot) return null

        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX

        const inView =
          screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
        if (!inView) return null

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
  }, [state.inCombat, attackSlots, state.targetedMonsterId, cameraOffset.offsetY, cameraOffset.offsetX])

  const renderPlayer = useMemo(() => {
    const pos = state.player?.position
    if (!pos) return null

    const screenRow = pos.row - cameraOffset.offsetY
    const screenCol = pos.col - cameraOffset.offsetX

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
  }, [state.player?.position, cameraOffset.offsetY, cameraOffset.offsetX])

  const renderMonsters = useMemo(() => {
    if (activeMonsters.length === 0) return []

    return activeMonsters
      .map((monster, index) => {
        if (!monster.position || monster.inCombatSlot) return null

        const screenRow = monster.position.row - cameraOffset.offsetY
        const screenCol = monster.position.col - cameraOffset.offsetX

        const inView =
          screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS
        if (!inView) return null

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
  }, [activeMonsters, state.targetedMonsterId, cameraOffset.offsetY, cameraOffset.offsetX])

  const renderGreatPowers = useMemo(() => {
    if (levelGreatPowers.length === 0) return []

    return levelGreatPowers
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
  }, [levelGreatPowers, cameraOffset.offsetY, cameraOffset.offsetX])

  const renderItems = useMemo(() => {
    if (items.length === 0) return []

    return items
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
  }, [items, cameraOffset.offsetY, cameraOffset.offsetX])

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
          screenRow < VIEWPORT_ROWS &&
          screenCol + objWidth > 0 &&
          screenCol < VIEWPORT_COLS
        if (!inView) return null

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
  }, [level, levelObjects, cameraOffset.offsetY, cameraOffset.offsetX])

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
        screenRow < VIEWPORT_ROWS &&
        screenCol + objWidth > 0 &&
        screenCol < VIEWPORT_COLS
      if (!inView) return

      const hasCollisionMask = !!(obj.collisionMask && obj.collisionMask.length > 0)

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
              }}
              pointerEvents="none"
            />
          )
        })
      }
    })

    return elements
  }, [nonCollisionObjects, cameraOffset.offsetY, cameraOffset.offsetX])

  // Render active projectiles
  const renderProjectiles = useMemo(() => {
    if (activeProjectiles.length === 0) return []

    return activeProjectiles.map((projectile) => (
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
  }, [activeProjectiles, onProjectileComplete])

  // Memoized grid render
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

  // Tiled background
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
  }, [cameraOffset.offsetX, cameraOffset.offsetY])

  const safeEmptyBoard = useMemo(() => {
    // If level or objects are missing, render an empty board (but DO NOT early return before hooks)
    if (!level) return true
    if (!Array.isArray(levelObjects)) return true
    return false
  }, [level, levelObjects])

  return (
    <View style={styles.gridContainer}>
      {/* Tiled Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {tiledBackground}
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>{safeEmptyBoard ? null : renderGrid}</View>

      {/* Projectiles */}
      {renderProjectiles}

      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        image={infoData.image}
        ctaLabel={infoData.ctaLabel}
        onCtaPress={infoData.onCtaPress}
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

      <CombatDialog visible={combatInfoVisible} messages={combatMessages} onClose={handleCombatDialogClose} />
    </View>
  )
}

// Utility functions
const getCellBackgroundColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  _hasGreatPower: GreatPower | undefined,
  _inCombat: boolean
) => {
  if (isPlayer) return 'rgba(45, 81, 105, 0.4)'
  if (hasMonster) return 'rgba(88, 57, 57, 0.4)'
  return 'rgba(17, 17, 17, 0.3)'
}

const getCellBorderColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  _hasGreatPower: GreatPower | undefined,
  _inCombat: boolean
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
