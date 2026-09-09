import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'

import { BackgroundImage } from '../BackgroundImage'
import { BottomActionBar } from '../BottomActionBar'
import { subGameTheme } from '../subGameTheme'
import { useSubGameLifecycle } from '../lifecycle'
import type { SubGameInstanceDefinition } from '@config/subGames'
import { useGameContext } from '@context/GameContext'
import {
  applyCurrentLoomHazard,
  applyCurrentLoomTickDrain,
  createCurrentLoomPuzzle,
  CURRENT_LOOM_HAZARD_OVERLAY_MS,
  CURRENT_LOOM_HOLD_TICK_MS,
  CURRENT_LOOM_MAX,
  isCurrentLoomSolved,
  tickCurrentLoom,
  type CurrentLoomPuzzleState,
} from './puzzleState'
import type { CurrentLoomConfig } from './types'
import { getPlayerHealthDisplay } from '@modules/playerHealthDisplay'
import {
  CurrentLoomCompletionGlow,
  CurrentLoomEdgeGlow,
  CurrentLoomHealthBar,
  useCurrentLoomBuzz,
} from './feedback'

type CurrentLoomScreenProps = {
  config: CurrentLoomConfig
  definition: SubGameInstanceDefinition
}

const lifecycleResolver = (definition: SubGameInstanceDefinition) => () => definition

export function CurrentLoomIntroScreen({ config, definition }: CurrentLoomScreenProps) {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle(config.instanceId, lifecycleResolver(definition))

  useEffect(() => {
    if (!lifecycle.isCompleted()) return
    const route = lifecycle.resolveEntryRoute()
    if (route) router.replace(route as never)
  }, [lifecycle, router])

  if (lifecycle.isCompleted()) return null
  return (
    <BackgroundImage source={config.presentation.intro.backgroundAsset}>
      <View style={styles.screen}>
        <View style={styles.copyPanel}>
          <Text style={styles.title}>{definition.title}</Text>
          <Text style={styles.copy}>{config.presentation.intro.text}</Text>
        </View>
        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => void lifecycle.failSubGame()}>
              <Text style={styles.buttonText}>{config.presentation.intro.leaveLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push(config.puzzleRoute as never)}
            >
              <Text style={styles.buttonText}>{config.presentation.intro.startLabel}</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

export function CurrentLoomPuzzleScreen({ config }: CurrentLoomScreenProps) {
  const router = useRouter()
  const { state: gameState, dispatch } = useGameContext()
  const [puzzle, setPuzzle] = useState<CurrentLoomPuzzleState>(() => createCurrentLoomPuzzle())
  const [hazardVisible, setHazardVisible] = useState(false)
  const [completionVisible, setCompletionVisible] = useState(false)
  const [heldChannelCount, setHeldChannelCount] = useState(0)
  const puzzleRef = useRef(puzzle)
  const hpRef = useRef(gameState.player.currentHP)
  const heldChannelsRef = useRef(new Set<number>())
  const intervalsRef = useRef<(ReturnType<typeof setInterval> | null)[]>(
    Array.from({ length: 5 }, () => null)
  )
  const hazardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completionStartedRef = useRef(false)
  const shakeX = useCurrentLoomBuzz(heldChannelCount > 0)
  const healthDisplay = getPlayerHealthDisplay(gameState.player.currentHP, gameState.player.maxHP)
  puzzleRef.current = puzzle

  useEffect(() => {
    hpRef.current = gameState.player.currentHP
  }, [gameState.player.currentHP])

  const stopChannel = useCallback((channelIndex: number) => {
    const interval = intervalsRef.current[channelIndex]
    if (interval) clearInterval(interval)
    intervalsRef.current[channelIndex] = null
    if (heldChannelsRef.current.delete(channelIndex)) {
      setHeldChannelCount(heldChannelsRef.current.size)
    }
  }, [])

  const stopAllChannels = useCallback(() => {
    intervalsRef.current.forEach((_, index) => stopChannel(index))
  }, [stopChannel])

  useEffect(
    () => () => {
      stopAllChannels()
      if (hazardTimerRef.current) clearTimeout(hazardTimerRef.current)
    },
    [stopAllChannels]
  )

  useEffect(() => {
    if (gameState.gameOver || hazardVisible || isCurrentLoomSolved(puzzle)) stopAllChannels()
  }, [gameState.gameOver, hazardVisible, puzzle, stopAllChannels])

  const showHazard = useCallback(() => {
    setHazardVisible(true)
    if (hazardTimerRef.current) clearTimeout(hazardTimerRef.current)
    hazardTimerRef.current = setTimeout(() => {
      hazardTimerRef.current = null
      setHazardVisible(false)
    }, CURRENT_LOOM_HAZARD_OVERLAY_MS)
  }, [])

  const showCompletion = useCallback(() => {
    if (completionStartedRef.current) return
    completionStartedRef.current = true
    stopAllChannels()
    setCompletionVisible(true)
  }, [stopAllChannels])

  const finishCompletion = useCallback(() => {
    router.replace(config.successRoute as never)
  }, [config.successRoute, router])

  const tickChannel = useCallback(
    (channelIndex: number) => {
      if (gameState.gameOver || hpRef.current <= 0 || isCurrentLoomSolved(puzzleRef.current)) {
        stopAllChannels()
        return
      }
      const result = tickCurrentLoom(puzzleRef.current, channelIndex)
      puzzleRef.current = result.state
      setPuzzle(result.state)

      hpRef.current = applyCurrentLoomTickDrain(hpRef.current, dispatch, (route) =>
        router.replace(route as never)
      )
      if (hpRef.current <= 0) {
        stopAllChannels()
        return
      }

      if (result.hazardChannel !== null) {
        stopAllChannels()
        showHazard()
        hpRef.current = applyCurrentLoomHazard(hpRef.current, dispatch, (route) =>
          router.replace(route as never)
        )
        if (hpRef.current <= 0) {
          stopAllChannels()
          return
        }
      }

      if (isCurrentLoomSolved(result.state)) {
        showCompletion()
      }
    },
    [dispatch, gameState.gameOver, router, showCompletion, showHazard, stopAllChannels]
  )

  const startChannel = useCallback(
    (channelIndex: number) => {
      if (
        gameState.gameOver ||
        hazardVisible ||
        completionStartedRef.current ||
        isCurrentLoomSolved(puzzleRef.current)
      )
        return
      stopChannel(channelIndex)
      heldChannelsRef.current.add(channelIndex)
      setHeldChannelCount(heldChannelsRef.current.size)
      tickChannel(channelIndex)
      if (gameState.gameOver || hpRef.current <= 0 || isCurrentLoomSolved(puzzleRef.current)) return
      intervalsRef.current[channelIndex] = setInterval(
        () => tickChannel(channelIndex),
        CURRENT_LOOM_HOLD_TICK_MS
      )
    },
    [gameState.gameOver, hazardVisible, stopChannel, tickChannel]
  )

  return (
    <View style={styles.puzzleViewport}>
      <Animated.View
        testID="current-loom-buzz-view"
        style={[styles.animatedScreen, { transform: [{ translateX: shakeX }] }]}
      >
        <BackgroundImage source={config.presentation.puzzle.boardAsset}>
          <View style={styles.screen}>
            <View style={styles.instructionPanel}>
              <Text style={styles.instruction}>{config.presentation.puzzle.instructionText}</Text>
            </View>
            <View style={styles.channels}>
              {puzzle.channels.map((value, index) => (
                <View key={config.channelLabels[index]} style={styles.channelColumn}>
                  <Text style={styles.channelLabel}>{config.channelLabels[index]}</Text>
                  <View style={styles.channelTrack}>
                    <View
                      style={[
                        styles.channelFill,
                        { height: `${(value / CURRENT_LOOM_MAX) * 100}%` },
                      ]}
                    />
                    <Text testID={`current-loom-value-${index}`} style={styles.channelValue}>
                      {value}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Raise ${config.channelLabels[index]} channel`}
                    testID={`current-loom-hold-${index}`}
                    disabled={gameState.gameOver || hazardVisible || isCurrentLoomSolved(puzzle)}
                    onPressIn={() => startChannel(index)}
                    onPressOut={() => stopChannel(index)}
                    style={({ pressed }) => [
                      styles.holdButton,
                      pressed && styles.holdButtonPressed,
                    ]}
                  >
                    <Text style={styles.holdButtonText}>
                      {config.presentation.puzzle.holdLabel}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <CurrentLoomHealthBar
              currentHP={gameState.player.currentHP}
              maxHP={gameState.player.maxHP}
            />
            <BottomActionBar>
              <TouchableOpacity style={styles.leaveButton} onPress={() => router.back()}>
                <Text style={styles.buttonText}>{config.presentation.puzzle.leaveLabel}</Text>
              </TouchableOpacity>
            </BottomActionBar>
            <CurrentLoomEdgeGlow display={healthDisplay} />
            {hazardVisible ? (
              <View pointerEvents="none" style={styles.hazardOverlay} testID="current-loom-hazard">
                <Image
                  source={config.presentation.hazard.overlayAsset}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <Text style={styles.hazardText}>{config.presentation.hazard.text}</Text>
              </View>
            ) : null}
            {completionVisible ? <CurrentLoomCompletionGlow onComplete={finishCompletion} /> : null}
          </View>
        </BackgroundImage>
      </Animated.View>
    </View>
  )
}

export function CurrentLoomSuccessScreen({ config, definition }: CurrentLoomScreenProps) {
  const lifecycle = useSubGameLifecycle(config.instanceId, lifecycleResolver(definition))
  const isReturnVisit = lifecycle.isCompleted()

  useEffect(() => {
    if (!isReturnVisit) void lifecycle.grantReward()
  }, [isReturnVisit, lifecycle])

  return (
    <BackgroundImage source={config.presentation.success.backgroundAsset}>
      <View style={styles.screen}>
        <View style={styles.copyPanel}>
          <Text style={styles.title}>{definition.title}</Text>
          <Text style={styles.copy}>
            {isReturnVisit
              ? config.presentation.success.revisitText
              : config.presentation.success.firstVisitText}
          </Text>
        </View>
        <BottomActionBar>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => void lifecycle.completeSubGame()}
          >
            <Text style={styles.buttonText}>{config.presentation.success.returnLabel}</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  puzzleViewport: { flex: 1, overflow: 'hidden', backgroundColor: '#01080f' },
  animatedScreen: { flex: 1 },
  screen: { flex: 1, backgroundColor: 'transparent' },
  copyPanel: {
    margin: 24,
    marginTop: 'auto',
    marginBottom: 120,
    padding: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 10, 18, 0.86)',
  },
  title: {
    color: '#dffcff',
    fontFamily: 'Gabrielle',
    fontSize: 25,
    textAlign: 'center',
    marginBottom: 12,
  },
  copy: { color: '#fff', fontFamily: 'Sofia', fontSize: 17, lineHeight: 24, textAlign: 'center' },
  instructionPanel: {
    marginHorizontal: 18,
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 10, 18, 0.84)',
  },
  instruction: { color: '#e9feff', fontFamily: 'Sofia', fontSize: 16, textAlign: 'center' },
  channels: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: 6,
    paddingHorizontal: 10,
  },
  channelColumn: { flex: 1, alignItems: 'center', gap: 7 },
  channelLabel: { color: '#e9feff', fontFamily: 'Sofia', fontSize: 13, textAlign: 'center' },
  channelTrack: {
    width: '72%',
    height: 230,
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#76d7e8',
    backgroundColor: 'rgba(1, 8, 15, 0.88)',
    overflow: 'hidden',
  },
  channelFill: { width: '100%', backgroundColor: '#178da9' },
  channelValue: {
    position: 'absolute',
    alignSelf: 'center',
    top: '44%',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  holdButton: {
    minHeight: 52,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8eefff',
    backgroundColor: '#153c49',
  },
  holdButtonPressed: { backgroundColor: '#26758b' },
  holdButtonText: { color: '#fff', fontFamily: 'Sofia', fontSize: 12, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: subGameTheme.red,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  leaveButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: subGameTheme.red,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
  },
  buttonText: { color: '#fff', fontFamily: 'Sofia', fontSize: 16, textAlign: 'center' },
  hazardOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 20,
  },
  hazardText: {
    margin: 24,
    padding: 16,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(80, 0, 0, 0.82)',
  },
})
