import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, StyleSheet, Dimensions, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { PositionDisplay } from '../../components/PositionDisplay'
import { useGameContext } from '../../context/GameContext'
import GameBoard, { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE } from '../../components/GameBoard'
import PlayerHUD from '../../components/PlayerHUD'
import Settings from '../../components/Settings'
import Inventory from '../../components/Inventory'
import { calculateCameraOffset, getObjectAtPoint } from '../../modules/utils'
import {
  handleMovePlayer,
  handleCombatAction,
  handlePassTurn,
  initializeStartingMonsters,
} from '../../modules/turnManager'
import { Monster, LevelObjectInstance, Item, GreatPower, NonCollisionObject } from '@/config/types'
import { audioManager } from '../../modules/audioManager'
import { UI_CONSTANTS, TIMING_CONSTANTS, COMBAT_CONSTANTS } from '../../constants/Game'
import { findNearestMonster } from '../../modules/monsterUtils'
import {
  executeRangedAttack,
  processRangedAttackImpact,
  checkCombatEnd,
} from '../../modules/combat'
import { enterSubGame } from '../../modules/subGames'

// Constants
const { width, height } = Dimensions.get('window')

type Direction = 'up' | 'down' | 'left' | 'right' | 'stay' | null

export default function Game() {
  const { state, dispatch, setOverlay } = useGameContext()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [inventoryVisible, setInventoryVisible] = useState(false)
  const [targetId, setTargetId] = useState<string | undefined>()
  const router = useRouter()

  // Generate unique instance ID for this component
  const instanceId = useRef(`Game-${Math.random().toString(36).substr(2, 9)}`)
  
  // Prevent multiple death navigations from the same instance
  const isNavigatingToDeath = useRef(false)

  // Log component lifecycle
  useEffect(() => {
    console.log(`🎯🎯🎯 [${instanceId.current}] Game component MOUNTED`)
    console.log(`🎯🎯🎯 [${instanceId.current}] Navigation stack depth check - this instance is mounting`)
    
    return () => {
      console.log(`🎯🎯🎯 [${instanceId.current}] Game component UNMOUNTED`)
      // Reset navigation guard on unmount
      isNavigatingToDeath.current = false
    }
  }, [])

  // Map to track projectile ID -> target monster ID for impact handling
  const projectileTargets = useRef<Map<string, string>>(new Map())

  // Ref to access GameBoard's showInfo function
  const showInfoRef = useRef<
    | ((
        name: string,
        description: string,
        image?: any,
        ctaLabel?: string,
        onCtaPress?: () => void
      ) => void)
    | null
  >(null)

  // Ref to access GameBoard's closeInfo function
  const closeInfoRef = useRef<(() => void) | null>(null)

  // Refs
  const stateRef = useRef(state)
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentDirection = useRef<Direction>(null)
  const lastZapPressTime = useRef<number>(0)
  const didLongPress = useRef<boolean>(false)

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Memoized camera offset calculation
  const cameraOffset = useMemo(
    () =>
      calculateCameraOffset(
        state.player.position,
        VIEWPORT_COLS,
        VIEWPORT_ROWS,
        state.gridWidth,
        state.gridHeight
      ),
    [state.player.position, state.gridWidth, state.gridHeight]
  )

  // Audio management
  useFocusEffect(
    useCallback(() => {
      audioManager.playBackgroundMusic()
      return () => audioManager.pauseBackgroundMusic()
    }, [])
  )

  // Game over handling
  useEffect(() => {
    if (!state.gameOver) return

    if (__DEV__) {
      console.log(`🔴🔴🔴 [${instanceId.current}] Game Over detected - gameOver state changed to true`)
    }
    audioManager.pauseBackgroundMusic()
  }, [state.gameOver])

  // Initialize starting monsters
  useEffect(() => {
    if (state.activeMonsters.length === 0 && state.moveCount === 0) {
      if (__DEV__) {
        console.log('Initializing starting monsters')
      }
      initializeStartingMonsters(state, dispatch)
    }
  }, [state.activeMonsters.length, state.moveCount, state, dispatch])

  // Tap position calculation
  const calculateTapPosition = useCallback(
    (pageX: number, pageY: number) => {
      const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2
      const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2
      const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX
      const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY

      return {
        tapCol: Math.floor(rawCol),
        tapRow: Math.floor(rawRow),
      }
    },
    [cameraOffset.offsetX, cameraOffset.offsetY]
  )

  // Movement direction calculation
  const getMovementDirectionFromTap = useCallback(
    (
      tapRow: number,
      tapCol: number,
      playerRow: number,
      playerCol: number,
      minDistance: number
    ): Direction => {
      const deltaRow = tapRow - playerRow
      const deltaCol = tapCol - playerCol
      const absRow = Math.abs(deltaRow)
      const absCol = Math.abs(deltaCol)

      if (absRow < minDistance && absCol < minDistance) return null

      // Determine primary direction based on larger delta
      if (absRow > absCol) {
        return deltaRow > 0 ? 'down' : 'up'
      } else if (absCol > absRow) {
        return deltaCol > 0 ? 'right' : 'left'
      } else {
        // Equal deltas - prioritize vertical movement
        return deltaRow !== 0 ? (deltaRow > 0 ? 'down' : 'up') : deltaCol > 0 ? 'right' : 'left'
      }
    },
    []
  )

  // Movement execution
  const performMove = useCallback(
    (direction: Direction) => {
      if (!direction || stateRef.current.inCombat) return
      handleMovePlayer(stateRef.current, dispatch, direction, setOverlay)
    },
    [dispatch, setOverlay]
  )

  // Long press interval management
  const startLongPressInterval = useCallback(
    (direction: Direction) => {
      currentDirection.current = direction
      if (longPressInterval.current) {
        clearInterval(longPressInterval.current)
      }

      longPressInterval.current = setInterval(() => {
        if (stateRef.current.inCombat || !currentDirection.current) {
          if (longPressInterval.current) {
            clearInterval(longPressInterval.current)
            longPressInterval.current = null
          }
          return
        }
        performMove(currentDirection.current)
      }, TIMING_CONSTANTS.MOVEMENT_INTERVAL)
    },
    [performMove]
  )

  const stopLongPressInterval = useCallback(() => {
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current)
      longPressInterval.current = null
      currentDirection.current = null
    }
  }, [])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopLongPressInterval()
  }, [stopLongPressInterval])

  // Check if overlay is blocking interaction
  const isOverlayVisible = useMemo(
    () => settingsVisible || inventoryVisible,
    [settingsVisible, inventoryVisible]
  )

  /**
   * GESTURE HANDLING RULES
   * ======================
   *
   * Single Tap (onPress):
   * - ALWAYS triggers navigation, regardless of what's tapped (empty cell, object, monster, etc.)
   * - Exception: If a long press was just completed, the release is suppressed (via didLongPress flag)
   *
   * Long Press (onLongPress):
   * - On EMPTY SPACE: Starts continuous movement in the tapped direction
   * - On OBJECT (monster, building, item, player, etc.): Opens InfoBox for that object
   * - Sets didLongPress flag to prevent the subsequent onPress from triggering navigation
   *
   * Long Press Suppression:
   * - React Native Pressable fires both onLongPress and onPress events
   * - We use a didLongPress ref flag to prevent double-firing
   * - When long press is detected, we set didLongPress.current = true
   * - The next onPress checks this flag and returns early if true
   * - The flag is reset after being checked to allow future taps
   *
   * Hit Testing Priority (highest to lowest):
   * 1. Player
   * 2. Monsters (active + combat slots)
   * 3. Great Powers
   * 4. Items
   * 5. Buildings
   * 6. Non-collision objects
   */

  // Helper functions to show InfoBox for different object types
  const showPlayerInfo = useCallback(() => {
    if (!showInfoRef.current) return
    const player = state.player
    const weaponInfo = player.weapons?.length ? ` | Weapon: ${player.weapons[0].id}` : ''
    showInfoRef.current(
      player.name || 'Christos',
      `${
        player.description || 'The brave hero of the Last Redoubt.'
      }\n\n Level: ${state.level.name}\n${state.level.description}\n${
        player.position.row
      }- ${player.position.col}`,
      player.image || require('../../assets/images/christos.png')
    )
  }, [state.player, state.level])

  const showMonsterInfo = useCallback(
    (monster: Monster) => {
      if (!showInfoRef.current) return
      // Don't show info dialog if in ranged attack mode (player is targeting/retargeting)
      if (state.rangedAttackMode) {
        // In ranged mode, retarget instead
        dispatch({
          type: 'SET_TARGET_MONSTER',
          payload: { monsterId: monster.id },
        })
        return
      }

      const monsterImage = monster.image || require('../../assets/images/abhuman.png')
      showInfoRef.current(
        monster.name || monster.shortName || 'Monster',
        monster.description || `A dangerous creature. HP: ${monster.hp || 'Unknown'}`,
        monsterImage
      )
    },
    [state.rangedAttackMode, dispatch]
  )

  const showGreatPowerInfo = useCallback((greatPower: GreatPower) => {
    if (!showInfoRef.current) return
    const statusInfo = greatPower.awakened ? 'AWAKENED' : 'Sleeping'
    const greatPowerImage = greatPower.image || require('../../assets/images/watcherse.png')
    showInfoRef.current(
      greatPower.name || greatPower.shortName || 'Great Power',
      `${
        greatPower.description || 'An ancient entity of immense power.'
      }\n\nStatus: ${statusInfo}\nHP: ${greatPower.hp}/${
        greatPower.maxHP
      }\nAC: ${greatPower.ac}\nAttack: ${greatPower.attack}`,
      greatPowerImage
    )
  }, [])

  const showItemInfo = useCallback((item: Item) => {
    if (!showInfoRef.current) return
    const itemImage = item.image || require('../../assets/images/potion.png')
    showInfoRef.current(
      item.name || item.shortName || 'Item',
      item.description || 'An object of interest.',
      itemImage
    )
  }, [])

  const showBuildingInfo = useCallback(
    (building: LevelObjectInstance) => {
      if (!showInfoRef.current) return

      // Check if building has sub-game launch config
      const launch = building.subGame
      const buildingWidth = building.size?.width || building.width || 1
      const buildingHeight = building.size?.height || building.height || 1

      const playerOnObject =
        launch && building.position
          ? state.player.position.row >= building.position.row &&
            state.player.position.row < building.position.row + buildingHeight &&
            state.player.position.col >= building.position.col &&
            state.player.position.col < building.position.col + buildingWidth
          : false

      const canLaunch = launch && (!launch.requiresPlayerOnObject || playerOnObject)

      if (canLaunch && launch) {
        const handleCtaPress = () => {
          // Close InfoBox before entering sub-game
          if (closeInfoRef.current) {
            closeInfoRef.current()
          }
          enterSubGame(launch.subGameName, { objectId: building.id })
        }

        showInfoRef.current(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image,
          launch.ctaLabel,
          handleCtaPress
        )
      } else {
        showInfoRef.current(
          building.name || building.shortName || 'Building',
          building.description || 'An interesting structure in the world.',
          building.image
        )
      }
    },
    [state.player.position]
  )

  const showNonCollisionObjectInfo = useCallback((obj: NonCollisionObject) => {
    if (!showInfoRef.current) return
    showInfoRef.current(
      obj.name || obj.shortName || 'Object',
      obj.description || 'A decorative object in the world.',
      obj.image
    )
  }, [])

  // Press handlers
  const handlePress = useCallback(
    (event: any) => {
      // If long press was triggered, suppress this tap to prevent navigation
      if (didLongPress.current) {
        didLongPress.current = false
        return
      }

      if (isOverlayVisible) return

      const { pageX, pageY } = event.nativeEvent
      if (pageY > height - UI_CONSTANTS.HUD_HEIGHT) return

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY)

      // If in ranged attack mode, check if tapping on a monster to retarget
      if (state.rangedAttackMode) {
        const objectAtPoint = getObjectAtPoint(tapRow, tapCol, state)

        // If tapping on a monster, retarget to it (don't clear mode, don't navigate)
        if (objectAtPoint && objectAtPoint.type === 'monster') {
          if (__DEV__) {
            console.log(
              'Retargeting to monster:',
              objectAtPoint.data.name,
              'ID:',
              objectAtPoint.data.id
            )
          }
          dispatch({
            type: 'SET_TARGET_MONSTER',
            payload: { monsterId: objectAtPoint.data.id },
          })
          return // Don't proceed with navigation
        }

        // If tapping on empty space or non-monster, clear ranged mode and proceed with navigation
        dispatch({ type: 'CLEAR_RANGED_MODE' })
      }

      // Don't allow movement during combat
      if (state.inCombat) return

      const { row: playerRow, col: playerCol } = state.player.position

      const direction = getMovementDirectionFromTap(
        tapRow,
        tapCol,
        playerRow,
        playerCol,
        UI_CONSTANTS.MIN_MOVE_DISTANCE
      )

      if (direction) performMove(direction)
    },
    [
      state.inCombat,
      state.player.position,
      state.rangedAttackMode,
      state,
      isOverlayVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      performMove,
      dispatch,
    ]
  )

  // -------------------- tap handlers --------------------

  const handlePlayerTap = useCallback(() => {}, [])

  const handleBuildingTap = useCallback((building: LevelObjectInstance) => {
    // optional logic later
  }, [])

  const handleItemTap = useCallback((item: Item) => {
    // optional logic later
  }, [])

  const handleNonCollisionObjectTap = useCallback((obj: NonCollisionObject) => {
    if (__DEV__) {
      console.log('Non-collision object tapped:', obj.name, 'Type:', obj.type)
    }
  }, [])

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      // If in ranged attack mode, retarget to the tapped monster
      if (state.rangedAttackMode) {
        if (__DEV__) {
          console.log('Retargeting to:', monster.name, 'ID:', monster.id)
        }
        dispatch({
          type: 'SET_TARGET_MONSTER',
          payload: { monsterId: monster.id },
        })
        return
      }

      // If in combat (not ranged mode), set as combat target
      if (state.inCombat) {
        if (__DEV__) {
          console.log('Monster tapped during combat:', monster.name, 'ID:', monster.id)
        }
        setTargetId(monster.id)
      }
    },
    [state.inCombat, state.rangedAttackMode, dispatch]
  )

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      if (__DEV__) {
        console.log('Great Power tapped:', greatPower.name, 'awakened:', greatPower.awakened)
      }

      if (greatPower.awakened) return

      const playerPos = state.player.position
      const powerPos = greatPower.position
      const distance =
        Math.abs(playerPos.row - powerPos.row) + Math.abs(playerPos.col - powerPos.col)

      if (
        distance <= COMBAT_CONSTANTS.GREAT_POWER_AWAKEN_DISTANCE &&
        greatPower.awakenCondition === 'player_within_range'
      ) {
        if (__DEV__) {
          console.log('Awakening Great Power:', greatPower.name)
        }
        dispatch({
          type: 'AWAKEN_GREAT_POWER',
          payload: { greatPowerId: greatPower.id },
        })
      }
    },
    [state.player.position, dispatch]
  )

  const handleLongPress = useCallback(
    (event: any) => {
      if (state.inCombat || isOverlayVisible) return

      const { pageX, pageY } = event.nativeEvent
      if (pageY > height - UI_CONSTANTS.HUD_HEIGHT) return

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY)

      // Check if there's an object at this position
      const objectAtPoint = getObjectAtPoint(tapRow, tapCol, state)

      if (objectAtPoint) {
        // Long press on object - set flag and show InfoBox
        didLongPress.current = true

        // Call the appropriate info display function based on object type
        switch (objectAtPoint.type) {
          case 'player':
            showPlayerInfo()
            // Also call the callback for any game logic
            handlePlayerTap()
            break
          case 'monster':
            showMonsterInfo(objectAtPoint.data)
            // Also call the callback for targeting logic
            handleMonsterTap(objectAtPoint.data)
            break
          case 'greatPower':
            showGreatPowerInfo(objectAtPoint.data)
            // Also call the callback for awakening logic
            handleGreatPowerTap(objectAtPoint.data)
            break
          case 'item':
            showItemInfo(objectAtPoint.data)
            handleItemTap(objectAtPoint.data)
            break
          case 'building':
            showBuildingInfo(objectAtPoint.data)
            handleBuildingTap(objectAtPoint.data)
            break
          case 'nonCollisionObject':
            showNonCollisionObjectInfo(objectAtPoint.data)
            handleNonCollisionObjectTap(objectAtPoint.data)
            break
        }
      } else {
        // Long press on empty space - start continuous movement
        const { row: playerRow, col: playerCol } = state.player.position

        const direction = getMovementDirectionFromTap(
          tapRow,
          tapCol,
          playerRow,
          playerCol,
          UI_CONSTANTS.MIN_MOVE_DISTANCE
        )

        if (direction) {
          didLongPress.current = true
          startLongPressInterval(direction)
        }
      }
    },
    [
      state,
      isOverlayVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      startLongPressInterval,
      showPlayerInfo,
      showMonsterInfo,
      showGreatPowerInfo,
      showItemInfo,
      showBuildingInfo,
      showNonCollisionObjectInfo,
      handlePlayerTap,
      handleMonsterTap,
      handleGreatPowerTap,
      handleItemTap,
      handleBuildingTap,
      handleNonCollisionObjectTap,
    ]
  )

  // UI interaction handlers
  const handleGearPress = useCallback(() => {
    if (!state.inCombat) setSettingsVisible(true)
  }, [state.inCombat])

  const handleCloseSettings = useCallback(() => {
    setSettingsVisible(false)
  }, [])

  const handleInventoryPress = useCallback(() => {
    // Exit ranged attack mode before opening inventory
    if (state.rangedAttackMode) {
      dispatch({ type: 'CLEAR_RANGED_MODE' })
    }
    if (!state.inCombat) setInventoryVisible(true)
  }, [state.inCombat, state.rangedAttackMode, dispatch])

  const handleCloseInventory = useCallback(() => {
    setInventoryVisible(false)
  }, [])

  // Handler for when a projectile animation completes
  const handleProjectileComplete = useCallback(
    (projectileId: string) => {
      // Get the target monster ID for this projectile
      const targetMonsterId = projectileTargets.current.get(projectileId)

      if (__DEV__) {
        console.log('🎯 Projectile complete:', projectileId, 'target:', targetMonsterId)
      }

      // Remove projectile from state
      dispatch({
        type: 'REMOVE_PROJECTILE',
        payload: { id: projectileId },
      })

      // Remove from tracking map
      projectileTargets.current.delete(projectileId)

      // Process the impact if we have a target
      if (targetMonsterId) {
        const targetDied = processRangedAttackImpact(stateRef.current, dispatch, targetMonsterId)

        // Check if combat should end (if in combat and all monsters defeated)
        if (stateRef.current.inCombat) {
          checkCombatEnd(stateRef.current, dispatch)
        }

        // If not in combat AND target didn't die, trigger enemy turn
        if (!stateRef.current.inCombat && !targetDied) {
          handlePassTurn(stateRef.current, dispatch)
        }
      }
    },
    [dispatch]
  )

  const handleZapPress = useCallback(() => {
    // Throttle rapid button presses to prevent overwhelming the system
    const now = Date.now()
    const timeSinceLastPress = now - lastZapPressTime.current

    if (timeSinceLastPress < TIMING_CONSTANTS.ZAP_BUTTON_THROTTLE) {
      if (__DEV__) {
        console.log(
          '🎯 handleZapPress throttled - too soon since last press:',
          timeSinceLastPress,
          'ms'
        )
      }
      return
    }

    lastZapPressTime.current = now

    if (__DEV__) {
      console.log(
        '🎯 handleZapPress - rangedAttackMode:',
        state.rangedAttackMode,
        'targetedMonsterId:',
        state.targetedMonsterId,
        'inCombat:',
        state.inCombat
      )
    }

    // Hard-stop: Don't allow ranged attack mode when in melee combat
    if (state.inCombat) {
      if (__DEV__) {
        console.log('🎯 Cannot use ranged attack in melee combat')
      }
      dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: 'Cannot use ranged attacks in melee combat!' },
      })
      return
    }

    // If ranged attack mode is OFF, turn it ON and target nearest enemy
    if (!state.rangedAttackMode) {
      // Get all living monsters (both active and in attack slots)
      const allMonsters = [...state.activeMonsters, ...state.attackSlots]
      const nearestMonster = findNearestMonster(state.player.position, allMonsters)

      if (!nearestMonster) {
        // No enemies available
        if (__DEV__) {
          console.log('🎯 No enemies found to target')
        }
        dispatch({
          type: 'ADD_COMBAT_LOG',
          payload: { message: 'No enemies in range' },
        })
        return
      }

      if (__DEV__) {
        console.log('🎯 Entering ranged mode, targeting:', nearestMonster.name)
      }

      // Enter ranged attack mode and target the nearest enemy
      dispatch({
        type: 'TOGGLE_RANGED_MODE',
        payload: { active: true, targetId: nearestMonster.id },
      })

      // Add targeting message to combat log
      const monsterName = nearestMonster.name || nearestMonster.shortName || 'enemy'
      dispatch({
        type: 'ADD_COMBAT_LOG',
        payload: { message: `Christos has the ${monsterName} in his sight!` },
      })

      if (__DEV__) {
        console.log('🎯 Entered ranged attack mode, targeting:', nearestMonster.name)
      }
    } else {
      // If ranged attack mode is ON, execute the ranged attack
      if (!state.targetedMonsterId) {
        if (__DEV__) {
          console.log('🎯 No target, attempting auto-retarget')
        }

        // No target selected (maybe previous target died)
        // Try to auto-target the nearest monster
        const allMonsters = [...state.activeMonsters, ...state.attackSlots]
        const nearestMonster = findNearestMonster(state.player.position, allMonsters)

        if (!nearestMonster) {
          // No enemies available at all
          if (__DEV__) {
            console.log('🎯 No enemies for auto-retarget, clearing ranged mode')
          }
          dispatch({
            type: 'ADD_COMBAT_LOG',
            payload: { message: 'No enemies in range' },
          })
          dispatch({ type: 'CLEAR_RANGED_MODE' })
          return
        }

        if (__DEV__) {
          console.log('🎯 Auto-targeting nearest:', nearestMonster.name)
        }

        // Auto-target the nearest monster
        dispatch({
          type: 'SET_TARGET_MONSTER',
          payload: { monsterId: nearestMonster.id },
        })

        // Add targeting message
        const monsterName = nearestMonster.name || nearestMonster.shortName || 'enemy'
        dispatch({
          type: 'ADD_COMBAT_LOG',
          payload: { message: `Christos has the ${monsterName} in his sight!` },
        })

        if (__DEV__) {
          console.log('🎯 Auto-targeted nearest monster:', nearestMonster.name)
        }
        return
      }

      if (__DEV__) {
        console.log('🎯 Executing ranged attack on target:', state.targetedMonsterId)
      }

      // Find the target monster to get its position
      let targetMonster = state.activeMonsters.find(
        (m) => m.id === state.targetedMonsterId && m.hp > 0
      )
      if (!targetMonster) {
        targetMonster = state.attackSlots.find((m) => m.id === state.targetedMonsterId && m.hp > 0)
      }

      if (!targetMonster) {
        if (__DEV__) {
          console.log('🎯 Target not found, clearing ranged mode')
        }
        dispatch({ type: 'CLEAR_RANGED_MODE' })
        return
      }

      // Calculate screen positions for player and monster
      const playerScreenX =
        (state.player.position.col - cameraOffset.offsetX) * CELL_SIZE + CELL_SIZE / 2
      const playerScreenY =
        (state.player.position.row - cameraOffset.offsetY) * CELL_SIZE + CELL_SIZE / 2
      const monsterScreenX =
        (targetMonster.position.col - cameraOffset.offsetX) * CELL_SIZE + CELL_SIZE / 2
      const monsterScreenY =
        (targetMonster.position.row - cameraOffset.offsetY) * CELL_SIZE + CELL_SIZE / 2

      // Execute the ranged attack (spawns projectile)
      const projectileId = executeRangedAttack(
        state,
        dispatch,
        state.targetedMonsterId,
        playerScreenX,
        playerScreenY,
        monsterScreenX,
        monsterScreenY
      )

      if (projectileId) {
        // Track the projectile -> target mapping for impact processing
        projectileTargets.current.set(projectileId, state.targetedMonsterId)

        if (__DEV__) {
          console.log('🎯 Projectile spawned:', projectileId)
        }
      }

      if (__DEV__) {
        console.log('🎯 handleZapPress complete')
      }
    }
  }, [state, dispatch, cameraOffset])

  const handleTurnPress = useCallback(() => {
    if (state.inCombat) return
    handlePassTurn(state, dispatch)
  }, [state, dispatch])

  const handleAttackPress = useCallback(() => {
    if (!state.inCombat || !state.attackSlots) return

    const targetMonster = targetId
      ? state.attackSlots.find((m) => m.id === targetId)
      : state.attackSlots[0]

    if (!targetMonster) {
      console.warn('No target monster in attack slots')
      return
    }

    handleCombatAction(state, dispatch, 'attack', targetMonster.id)
  }, [state, dispatch, targetId])

  const handleDeathInfoBoxClose = useCallback(() => {
    // Guard against multiple navigation calls
    if (isNavigatingToDeath.current) {
      if (__DEV__) {
        console.log(`💀💀💀 [${instanceId.current}] Death navigation already in progress, ignoring duplicate call`)
      }
      return
    }
    
    isNavigatingToDeath.current = true
    
    if (__DEV__) {
      console.log(`💀💀💀 [${instanceId.current}] Death InfoBox closed, navigating to death screen immediately`)
    }
    router.replace('/death')
  }, [router])

  // Create showDialog wrapper for inventory items
  const showDialog = useCallback((message: string, duration?: number) => {
    if (showInfoRef.current) {
      // Use showInfo to display the message
      showInfoRef.current('Message', message)
    } else {
      // Fallback: just log if showInfo not available
      console.log('[showDialog]', message)
    }
  }, [])

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={stopLongPressInterval}
    >
      <View style={styles.gameContainer}>
        <GameBoard
          state={state}
          cameraOffset={cameraOffset}
          onPlayerTap={handlePlayerTap}
          onMonsterTap={handleMonsterTap}
          onBuildingTap={handleBuildingTap}
          onItemTap={handleItemTap}
          onGreatPowerTap={handleGreatPowerTap}
          onNonCollisionObjectTap={handleNonCollisionObjectTap}
          onDeathInfoBoxClose={handleDeathInfoBoxClose}
          onProjectileComplete={handleProjectileComplete}
          onShowInfoRef={showInfoRef}
          onCloseInfoRef={closeInfoRef}
        />
        <PositionDisplay position={state.player.position} level={state.level} />
        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
          onTurnPress={handleTurnPress}
          onAttackPress={handleAttackPress}
          onInventoryPress={handleInventoryPress}
          onZapPress={handleZapPress}
          inCombat={state.inCombat}
        />
        <Settings visible={settingsVisible} onClose={handleCloseSettings} />
        <Inventory
          visible={inventoryVisible}
          onClose={handleCloseInventory}
          inventory={state.player.inventory}
          showDialog={showDialog}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
