import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SafeAreaContent } from '@components/SafeAreaContent'

import { BackgroundImage } from '../BackgroundImage'
import { BottomActionBar } from '../BottomActionBar'
import { useSubGameLifecycle } from '../lifecycle'
import { subGameTheme } from '../subGameTheme'
import {
  generateWordGridTiles,
  getWordGridTileAtPoint,
  validateWordGridConfig,
  wordGridTilesToPixels,
} from './geometry'
import { appendWordGridLetter } from './sequence'
import type { WordGridConfig, WordGridTile } from './types'

const DEBUG_WORD_GRID = false
const HORIZONTAL_PADDING = 10

export function WordGridEntry({ config }: { config: WordGridConfig }) {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle(config)

  useEffect(() => {
    const route = lifecycle.resolveEntryRoute()
    if (route) router.replace(route as never)
  }, [lifecycle, router])

  return null
}

export function WordGridIntroScreen({ config }: { config: WordGridConfig }) {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle(config)

  useEffect(() => {
    if (!lifecycle.isCompleted()) return
    const revisitRoute = lifecycle.resolveEntryRoute()
    if (revisitRoute && revisitRoute !== config.entryRoute) {
      router.replace(revisitRoute as never)
    }
  }, [config.entryRoute, lifecycle, router])

  if (lifecycle.isCompleted()) return null

  return (
    <BackgroundImage source={config.presentation.intro.backgroundAsset}>
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <View style={styles.introButtonRow}>
            <TouchableOpacity
              style={styles.introButton}
              onPress={() => void lifecycle.failSubGame()}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.presentation.intro.leaveLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.introButton}
              onPress={() => router.push(config.puzzleRoute as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.presentation.intro.startLabel}</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

interface RenderedImage {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export function WordGridPuzzleScreen({ config }: { config: WordGridConfig }) {
  validateWordGridConfig(config)
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const imageAspectRatio = config.intrinsicSize.width / config.intrinsicSize.height
  const boardWidth = screenWidth - insets.left - insets.right - HORIZONTAL_PADDING * 2
  const boardHeight = boardWidth / imageAspectRatio
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null)
  const [actualImageSize, setActualImageSize] = useState<RenderedImage | null>(null)
  const [tiles, setTiles] = useState<WordGridTile[]>([])
  const [selectedTiles, setSelectedTiles] = useState<WordGridTile[]>([])
  const [lastTappedTile, setLastTappedTile] = useState<WordGridTile | null>(null)
  const [currentSequence, setCurrentSequence] = useState<string[]>([])
  const [inactiveTiles, setInactiveTiles] = useState<Set<string>>(new Set())
  const circleOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!lastTappedTile) return
    circleOpacity.setValue(1)
    Animated.timing(circleOpacity, {
      toValue: 0,
      duration: config.tapFeedback.selectionFadeMs,
      useNativeDriver: true,
    }).start()
  }, [circleOpacity, config.tapFeedback.selectionFadeMs, lastTappedTile])

  const handleImageLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout
      setImageLayout({ width, height })
      const containerAspectRatio = width / height
      const actualHeight =
        containerAspectRatio > imageAspectRatio ? height : width / imageAspectRatio
      const actualWidth =
        containerAspectRatio > imageAspectRatio ? height * imageAspectRatio : width
      const rendered = {
        width: actualWidth,
        height: actualHeight,
        offsetX: (width - actualWidth) / 2,
        offsetY: (height - actualHeight) / 2,
      }
      setActualImageSize(rendered)
      setTiles(
        wordGridTilesToPixels(
          generateWordGridTiles(
            config.gridRect,
            config.rows,
            config.columns,
            config.gap,
            config.letters
          ),
          actualWidth,
          actualHeight
        )
      )
    },
    [config.columns, config.gap, config.gridRect, config.letters, config.rows, imageAspectRatio]
  )

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!imageLayout || !actualImageSize || tiles.length === 0) return
      const adjustedX = event.nativeEvent.locationX - actualImageSize.offsetX
      const adjustedY = event.nativeEvent.locationY - actualImageSize.offsetY
      if (
        adjustedX < 0 ||
        adjustedX > actualImageSize.width ||
        adjustedY < 0 ||
        adjustedY > actualImageSize.height
      ) {
        return
      }

      const tappedTile = getWordGridTileAtPoint(tiles, adjustedX, adjustedY)
      if (!tappedTile || inactiveTiles.has(tappedTile.id)) return

      setSelectedTiles((previous) => [...previous, tappedTile])
      setLastTappedTile(tappedTile)
      setInactiveTiles((previous) => new Set(previous).add(tappedTile.id))

      const result = appendWordGridLetter(currentSequence, tappedTile.letter, config.targetSequence)
      setCurrentSequence(result.sequence)

      if (result.outcome === 'failure') {
        setTimeout(
          () => router.push(config.wrongInputOutcome.route as never),
          config.wrongInputOutcome.delayMs
        )
      } else if (result.outcome === 'success') {
        setTimeout(
          () => router.push(config.successOutcome.route as never),
          config.successOutcome.delayMs
        )
      }
    },
    [
      actualImageSize,
      config.successOutcome,
      config.targetSequence,
      config.wrongInputOutcome,
      currentSequence,
      imageLayout,
      inactiveTiles,
      router,
      tiles,
    ]
  )

  const circleSize = config.tapFeedback.circleSize

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <View style={styles.puzzleContentArea}>
          <View style={styles.boardContainer}>
            <Image
              source={config.boardAsset}
              style={{ width: boardWidth, height: boardHeight }}
              resizeMode="contain"
              onLayout={handleImageLayout}
            />

            {imageLayout && actualImageSize && (
              <Pressable
                style={[
                  styles.pressableOverlay,
                  { width: imageLayout.width, height: imageLayout.height },
                ]}
                onPress={handlePress}
              >
                {selectedTiles.map((tile) => (
                  <View
                    key={tile.id}
                    pointerEvents="none"
                    style={[
                      styles.absoluteTile,
                      {
                        left: (tile.leftPx ?? 0) + actualImageSize.offsetX,
                        top: (tile.topPx ?? 0) + actualImageSize.offsetY,
                        width: tile.widthPx,
                        height: tile.heightPx,
                        borderWidth: config.tapFeedback.selectedBorderWidth,
                        borderColor: config.tapFeedback.selectedBorderColor,
                      },
                    ]}
                  />
                ))}

                {tiles.map((tile) =>
                  inactiveTiles.has(tile.id) ? (
                    <View
                      key={`inactive-${tile.id}`}
                      pointerEvents="none"
                      style={[
                        styles.absoluteTile,
                        {
                          left: (tile.leftPx ?? 0) + actualImageSize.offsetX,
                          top: (tile.topPx ?? 0) + actualImageSize.offsetY,
                          width: tile.widthPx,
                          height: tile.heightPx,
                          backgroundColor: config.tapFeedback.inactiveOverlayColor,
                        },
                      ]}
                    />
                  ) : null
                )}

                {lastTappedTile && (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left:
                        (lastTappedTile.leftPx ?? 0) +
                        (lastTappedTile.widthPx ?? 0) / 2 -
                        circleSize / 2 +
                        actualImageSize.offsetX,
                      top:
                        (lastTappedTile.topPx ?? 0) +
                        (lastTappedTile.heightPx ?? 0) / 2 -
                        circleSize / 2 +
                        actualImageSize.offsetY,
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      backgroundColor: config.tapFeedback.circleColor,
                      opacity: circleOpacity,
                    }}
                  />
                )}

                {__DEV__ && DEBUG_WORD_GRID && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: config.gridRect.left * actualImageSize.width + actualImageSize.offsetX,
                      top: config.gridRect.top * actualImageSize.height + actualImageSize.offsetY,
                      width: (config.gridRect.right - config.gridRect.left) * actualImageSize.width,
                      height:
                        (config.gridRect.bottom - config.gridRect.top) * actualImageSize.height,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 0, 0.8)',
                    }}
                  />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={styles.puzzleButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{config.presentation.puzzle.leaveLabel}</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

export function WordGridFailureScreen({ config }: { config: WordGridConfig }) {
  const lifecycle = useSubGameLifecycle(config)

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'none', gestureEnabled: false }} />
      <BackgroundImage
        source={config.presentation.failure.backgroundAsset}
        foregroundFit={config.presentation.failure.foregroundFit}
      >
        <View style={styles.container}>
          <View style={styles.failureContentArea}>
            <Text style={styles.failureText}>{config.presentation.failure.text}</Text>
          </View>
          <View style={styles.failureBottomBar}>
            <TouchableOpacity
              style={styles.failureButton}
              onPress={() => void lifecycle.failSubGame()}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.presentation.failure.actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BackgroundImage>
    </>
  )
}

export function WordGridSuccessScreen({ config }: { config: WordGridConfig }) {
  const lifecycle = useSubGameLifecycle(config)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const isReturnVisit = lifecycle.isCompleted()

  useEffect(() => {
    if (!isReturnVisit) void lifecycle.grantReward()
  }, [isReturnVisit, lifecycle])

  return (
    <BackgroundImage source={config.presentation.success.backgroundAsset}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.successText}>
            {isReturnVisit
              ? config.presentation.success.revisitText
              : config.presentation.success.firstVisitText}
          </Text>
        </View>
        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.successButton, styles.buttonHalf]}
              onPress={() => setShowRewardModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.presentation.success.readRewardLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.successButton, styles.buttonHalf]}
              onPress={() => void lifecycle.completeSubGame()}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{config.presentation.success.returnLabel}</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>

        {showRewardModal && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setShowRewardModal(false)}
          >
            <SafeAreaContent style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {config.presentation.success.rewardModalTitle}
                </Text>
                <Text style={styles.modalText}>{config.presentation.success.rewardModalText}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowRewardModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>
                    {config.presentation.success.rewardModalCloseLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaContent>
          </Modal>
        )}
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  contentArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  puzzleContentArea: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  boardContainer: { position: 'relative' },
  pressableOverlay: { position: 'absolute', top: 0, left: 0 },
  absoluteTile: { position: 'absolute', borderRadius: 4, backgroundColor: 'transparent' },
  introButtonRow: { flexDirection: 'row', gap: 14 },
  introButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  puzzleButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  failureButton: {
    paddingVertical: 16,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    alignItems: 'center',
  },
  buttonRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  successButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonHalf: { flex: 1 },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
  failureContentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 160,
  },
  failureText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 26,
  },
  failureBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
    lineHeight: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: subGameTheme.blue,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: subGameTheme.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: { fontSize: 16, color: '#fff', textAlign: 'left', marginBottom: 20, lineHeight: 22 },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    alignSelf: 'center',
    minWidth: 100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
