// app/sub-games/tesseract/screen2.tsx
// Screen 2: Puzzle board screen for the tesseract sub-game
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  useWindowDimensions,
  Pressable,
  Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  GRID_RECT,
  generateTilesFromGridRect,
  tilesToPixelCoords,
  getTileAtPoint,
  type Tile,
} from './tiles'

const puzzleBoard = require('@/assets/images/teseract-puzzle-board.png')

// Target word to spell
const TARGET = ['T', 'E', 'S', 'E', 'R', 'A', 'C', 'T']

// Debug mode: Set to true to see grid overlay (dev only)
// When enabled, shows yellow grid rect outline and magenta tile outlines with row,col labels
// IMPORTANT: Set to false before production deployment to hide debug visualizations
// TODO: Set DEBUG = false once grid alignment is verified
const DEBUG = true

// CODE VERSION MARKER - If you see this log, the latest code is running
if (__DEV__) {
  console.log('[Tesseract] *** CODE VERSION: 8706ec9+ with enhanced logging ***')
}

export default function TesseractScreen2() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // Image and tile state
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null)
  const [actualImageSize, setActualImageSize] = useState<{
    width: number
    height: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]) // Array to track all tapped tiles
  const [lastTappedTile, setLastTappedTile] = useState<Tile | null>(null)

  // Spelling logic state
  const [currentSequence, setCurrentSequence] = useState<string[]>([])
  const [inactiveTiles, setInactiveTiles] = useState<Set<string>>(new Set())

  // Animation for the green circle fade-out
  const circleOpacity = useRef(new Animated.Value(0)).current

  // Reset function to clear puzzle state
  const resetPuzzle = useCallback(() => {
    setSelectedTiles([])
    setLastTappedTile(null)
    setCurrentSequence([])
    setInactiveTiles(new Set())
    if (__DEV__) {
      console.log('[Tesseract] Puzzle state reset')
    }
  }, [])

  // Expose reset function globally for dev button on screen 1
  useEffect(() => {
    if (__DEV__) {
      // @ts-ignore - global for dev only
      global.resetTesseractTiles = resetPuzzle
    }
    return () => {
      if (__DEV__) {
        // @ts-ignore
        delete global.resetTesseractTiles
      }
    }
  }, [resetPuzzle])

  // Trigger fade-out animation when a tile is tapped
  useEffect(() => {
    if (lastTappedTile) {
      // Reset and start fade-out animation
      circleOpacity.setValue(1)
      Animated.timing(circleOpacity, {
        toValue: 0,
        duration: 2000, // 2 seconds
        useNativeDriver: true,
      }).start()
    }
  }, [lastTappedTile, circleOpacity])

  // Handle image layout to get actual rendered dimensions
  const handleImageLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout
    if (__DEV__) {
      console.log(`[Tesseract] Image layout: ${width}x${height}`)
    }
    setImageLayout({ width, height })

    // Calculate actual rendered image size and position within container
    // The actual puzzle board image is 1024x972 pixels
    const imageAspectRatio = 1024 / 972
    const containerAspectRatio = width / height

    if (__DEV__) {
      console.log(
        `[Tesseract] Image aspect ratio: ${imageAspectRatio.toFixed(3)}, Container aspect ratio: ${containerAspectRatio.toFixed(3)}`
      )
    }

    let actualWidth: number
    let actualHeight: number
    let offsetX: number
    let offsetY: number

    if (containerAspectRatio > imageAspectRatio) {
      // Container is wider - image will be constrained by height
      actualHeight = height
      actualWidth = height * imageAspectRatio
      offsetX = (width - actualWidth) / 2
      offsetY = 0
      if (__DEV__) {
        console.log(`[Tesseract] Layout: Container wider, image constrained by height`)
      }
    } else {
      // Container is taller - image will be constrained by width
      actualWidth = width
      actualHeight = width / imageAspectRatio
      offsetX = 0
      offsetY = (height - actualHeight) / 2
      if (__DEV__) {
        console.log(`[Tesseract] Layout: Container taller, image constrained by width`)
      }
    }

    if (__DEV__) {
      console.log(
        `[Tesseract] Actual image size: ${actualWidth.toFixed(1)}x${actualHeight.toFixed(1)}, offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`
      )
    }

    setActualImageSize({ width: actualWidth, height: actualHeight, offsetX, offsetY })

    // Generate tiles with normalized coordinates
    // Using a small gap (0.005 = 0.5%) to avoid overlapping the grout lines between tiles
    const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0.005)

    if (__DEV__) {
      console.log(
        `[Tesseract] GRID_RECT: left=${GRID_RECT.left}, top=${GRID_RECT.top}, right=${GRID_RECT.right}, bottom=${GRID_RECT.bottom}`
      )
    }

    // Convert to pixel coordinates using ACTUAL image dimensions
    const pixelTiles = tilesToPixelCoords(normalizedTiles, actualWidth, actualHeight)
    setTiles(pixelTiles)

    if (__DEV__) {
      console.log(`[Tesseract] Generated ${pixelTiles.length} tiles`)
      if (pixelTiles.length > 0) {
        const firstTile = pixelTiles[0]
        const lastTile = pixelTiles[pixelTiles.length - 1]
        console.log(
          `[Tesseract] First tile (0,0): left=${firstTile.leftPx?.toFixed(1)}, top=${firstTile.topPx?.toFixed(1)}, right=${firstTile.rightPx?.toFixed(1)}, bottom=${firstTile.bottomPx?.toFixed(1)}`
        )
        console.log(
          `[Tesseract] Last tile (4,4): left=${lastTile.leftPx?.toFixed(1)}, top=${lastTile.topPx?.toFixed(1)}, right=${lastTile.rightPx?.toFixed(1)}, bottom=${lastTile.bottomPx?.toFixed(1)}`
        )
      }
    }
  }, [])

  // Handle tap on the puzzle board
  const handlePress = useCallback(
    (event: any) => {
      if (__DEV__) {
        console.log(
          `[Tesseract] handlePress called - imageLayout: ${!!imageLayout}, actualImageSize: ${!!actualImageSize}, tiles: ${tiles.length}`
        )
      }

      if (!imageLayout || !actualImageSize || tiles.length === 0) {
        if (__DEV__) {
          console.log(`[Tesseract] Early return - missing data`)
        }
        return
      }

      const { locationX, locationY } = event.nativeEvent

      if (__DEV__) {
        console.log(
          `[Tesseract] actualImageSize: width=${actualImageSize.width.toFixed(1)}, height=${actualImageSize.height.toFixed(1)}, offsetX=${actualImageSize.offsetX.toFixed(1)}, offsetY=${actualImageSize.offsetY.toFixed(1)}`
        )
      }

      // Adjust coordinates for image offset within container
      const adjustedX = locationX - actualImageSize.offsetX
      const adjustedY = locationY - actualImageSize.offsetY

      if (__DEV__) {
        console.log(
          `[Tesseract] Tap at: ${locationX.toFixed(1)}, ${locationY.toFixed(1)} -> adjusted: ${adjustedX.toFixed(1)}, ${adjustedY.toFixed(1)}`
        )
        console.log(
          `[Tesseract] Image bounds check: X in [0, ${actualImageSize.width.toFixed(1)}], Y in [0, ${actualImageSize.height.toFixed(1)}]`
        )
      }

      // Check if tap is within actual image bounds
      if (
        adjustedX < 0 ||
        adjustedX > actualImageSize.width ||
        adjustedY < 0 ||
        adjustedY > actualImageSize.height
      ) {
        if (__DEV__) {
          console.log(
            `[Tesseract] Tap outside image bounds: adjustedX=${adjustedX.toFixed(1)}, adjustedY=${adjustedY.toFixed(1)}`
          )
        }
        return
      }

      if (__DEV__) {
        console.log(`[Tesseract] Tap within image bounds, checking tiles...`)
      }

      const tappedTile = getTileAtPoint(tiles, adjustedX, adjustedY)

      if (tappedTile) {
        // Check if tile is already inactive
        if (inactiveTiles.has(tappedTile.id)) {
          if (__DEV__) {
            console.log(
              `[Tesseract] Tile already tapped: row=${tappedTile.row}, col=${tappedTile.col}, letter=${tappedTile.letter}`
            )
          }
          return
        }

        if (__DEV__) {
          console.log(
            `[Tesseract] Tapped tile: row=${tappedTile.row}, col=${tappedTile.col}, letter=${tappedTile.letter}`
          )
        }

        // Add tile to selected tiles
        setSelectedTiles((prev) => [...prev, tappedTile])
        setLastTappedTile(tappedTile)

        // Mark tile as inactive
        setInactiveTiles((prev) => new Set(prev).add(tappedTile.id))

        // Update sequence and validate
        const newSequence = [...currentSequence, tappedTile.letter]
        setCurrentSequence(newSequence)

        // Validation logic
        const index = newSequence.length - 1

        if (__DEV__) {
          console.log(
            `[Tesseract] Sequence: ${newSequence.join('')}, expected: ${TARGET.slice(0, index + 1).join('')}`
          )
        }

        // Check if this letter is wrong
        if (newSequence[index] !== TARGET[index]) {
          if (__DEV__) {
            console.log(
              `[Tesseract] FAILURE - Wrong letter at position ${index}: got '${newSequence[index]}', expected '${TARGET[index]}'`
            )
          }
          // Navigate to failure screen after a short delay
          setTimeout(() => {
            router.push('/sub-games/tesseract/screen3' as any)
          }, 500)
          return
        }

        // Check if word is complete
        if (newSequence.length === TARGET.length) {
          if (__DEV__) {
            console.log(`[Tesseract] SUCCESS - Word completed correctly: ${newSequence.join('')}`)
          }
          // Navigate to success screen after a short delay
          setTimeout(() => {
            router.push('/sub-games/tesseract/screen4' as any)
          }, 500)
          return
        }

        if (__DEV__) {
          console.log(`[Tesseract] Correct so far - continue...`)
        }
      } else {
        if (__DEV__) {
          console.log('[Tesseract] Tap outside tile grid (within image but not on any tile)')
        }
      }
    },
    [imageLayout, actualImageSize, tiles, inactiveTiles, currentSequence, router]
  )

  const handleLeaveCourtyard = () => {
    if (__DEV__) {
      console.log('[Tesseract] Leaving the courtyard')
    }
    router.back()
  }

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <View style={[styles.contentArea, { paddingTop: insets.top + 20 }]}>
          <View style={styles.boardContainer}>
            <Image
              source={puzzleBoard}
              style={[styles.puzzleBoard, { width: screenWidth * 0.95 }]}
              resizeMode="contain"
              onLayout={handleImageLayout}
            />

            {/* Interactive overlay for tap handling */}
            {imageLayout && actualImageSize && (
              <Pressable
                style={[
                  styles.pressableOverlay,
                  { width: imageLayout.width, height: imageLayout.height },
                ]}
                onPress={handlePress}
              >
                {/* Green borders on all selected tiles */}
                {selectedTiles.map(
                  (tile) =>
                    tile.leftPx !== undefined && (
                      <View
                        key={tile.id}
                        pointerEvents="none"
                        style={[
                          styles.tileBorder,
                          {
                            left: (tile.leftPx || 0) + actualImageSize.offsetX,
                            top: (tile.topPx || 0) + actualImageSize.offsetY,
                            width: tile.widthPx,
                            height: tile.heightPx,
                          },
                        ]}
                      />
                    )
                )}

                {/* Muted overlay on inactive tiles */}
                {tiles.map(
                  (tile) =>
                    tile.leftPx !== undefined &&
                    inactiveTiles.has(tile.id) && (
                      <View
                        key={`inactive-${tile.id}`}
                        pointerEvents="none"
                        style={[
                          styles.inactiveTileOverlay,
                          {
                            left: (tile.leftPx || 0) + actualImageSize.offsetX,
                            top: (tile.topPx || 0) + actualImageSize.offsetY,
                            width: tile.widthPx,
                            height: tile.heightPx,
                          },
                        ]}
                      />
                    )
                )}

                {/* Green circle on last tapped tile */}
                {lastTappedTile && lastTappedTile.leftPx !== undefined && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.tileCircle,
                      {
                        left:
                          (lastTappedTile.leftPx || 0) +
                          (lastTappedTile.widthPx || 0) / 2 -
                          18 +
                          actualImageSize.offsetX,
                        top:
                          (lastTappedTile.topPx || 0) +
                          (lastTappedTile.heightPx || 0) / 2 -
                          18 +
                          actualImageSize.offsetY,
                        opacity: circleOpacity,
                      },
                    ]}
                  />
                )}

                {/* Debug overlay: Grid visualization (dev only) */}
                {__DEV__ && DEBUG && (
                  <>
                    {/* Grid rect outline */}
                    <View
                      pointerEvents="none"
                      style={[
                        styles.debugGridRect,
                        {
                          left: GRID_RECT.left * actualImageSize.width + actualImageSize.offsetX,
                          top: GRID_RECT.top * actualImageSize.height + actualImageSize.offsetY,
                          width: (GRID_RECT.right - GRID_RECT.left) * actualImageSize.width,
                          height: (GRID_RECT.bottom - GRID_RECT.top) * actualImageSize.height,
                        },
                      ]}
                    />

                    {/* Individual tile outlines */}
                    {tiles.map((tile) => (
                      <View
                        key={tile.id}
                        pointerEvents="none"
                        style={[
                          styles.debugTileOutline,
                          {
                            left: (tile.leftPx || 0) + actualImageSize.offsetX,
                            top: (tile.topPx || 0) + actualImageSize.offsetY,
                            width: tile.widthPx,
                            height: tile.heightPx,
                          },
                        ]}
                      >
                        <Text style={styles.debugTileText}>
                          {tile.row},{tile.col}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLeaveCourtyard}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>leave the courtyard</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  boardContainer: {
    position: 'relative',
  },
  puzzleBoard: {
    maxWidth: '100%',
    aspectRatio: 1, // This will be overridden by the actual image aspect ratio when using contain
  },
  pressableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tileBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#00ff00',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  inactiveTileOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
  },
  tileCircle: {
    position: 'absolute',
    width: 36, // 20% bigger than original 30px
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },
  // Debug styles (dev only)
  debugGridRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 0, 0.8)',
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
  },
  debugTileOutline: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.5)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugTileText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 2,
  },
  button: {
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
