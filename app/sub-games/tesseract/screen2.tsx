// app/sub-games/tesseract/screen2.tsx
// Screen 2: Puzzle board screen for the tesseract sub-game
import React, { useState, useCallback } from 'react'
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Pressable } from 'react-native'
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
  type Tile 
} from './tiles'

const puzzleBoard = require('@/assets/images/teseract-puzzle-board.png')

// Debug mode: Set to true to see grid overlay (dev only)
const DEBUG = true

export default function TesseractScreen2() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // Image and tile state
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [lastTappedTile, setLastTappedTile] = useState<Tile | null>(null)

  // Handle image layout to get actual rendered dimensions
  const handleImageLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout
    if (__DEV__) {
      console.log(`[Tesseract] Image layout: ${width}x${height}`)
    }
    setImageLayout({ width, height })
    
    // Generate tiles with normalized coordinates
    // Using a small gap (0.005 = 0.5%) to avoid overlapping the grout lines between tiles
    const normalizedTiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0.005)
    
    // Convert to pixel coordinates
    const pixelTiles = tilesToPixelCoords(normalizedTiles, width, height)
    setTiles(pixelTiles)
    
    if (__DEV__) {
      console.log(`[Tesseract] Generated ${pixelTiles.length} tiles`)
    }
  }, [])

  // Handle tap on the puzzle board
  const handlePress = useCallback((event: any) => {
    if (!imageLayout || tiles.length === 0) return

    const { locationX, locationY } = event.nativeEvent
    
    if (__DEV__) {
      console.log(`[Tesseract] Tap at: ${locationX.toFixed(1)}, ${locationY.toFixed(1)}`)
    }

    const tappedTile = getTileAtPoint(tiles, locationX, locationY)
    
    if (tappedTile) {
      if (__DEV__) {
        console.log(`[Tesseract] Tapped tile: row=${tappedTile.row}, col=${tappedTile.col}`)
      }
      setSelectedTile(tappedTile)
      setLastTappedTile(tappedTile)
    } else {
      if (__DEV__) {
        console.log('[Tesseract] Tap outside tile grid')
      }
      setSelectedTile(null)
    }
  }, [imageLayout, tiles])

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
            {imageLayout && (
              <Pressable
                style={[
                  styles.pressableOverlay,
                  { width: imageLayout.width, height: imageLayout.height }
                ]}
                onPress={handlePress}
              >
                {/* Green border on selected tile */}
                {selectedTile && selectedTile.leftPx !== undefined && (
                  <View
                    style={[
                      styles.tileBorder,
                      {
                        left: selectedTile.leftPx,
                        top: selectedTile.topPx,
                        width: selectedTile.widthPx,
                        height: selectedTile.heightPx,
                      }
                    ]}
                  />
                )}
                
                {/* Green circle on last tapped tile */}
                {lastTappedTile && lastTappedTile.leftPx !== undefined && (
                  <View
                    style={[
                      styles.tileCircle,
                      {
                        left: (lastTappedTile.leftPx || 0) + (lastTappedTile.widthPx || 0) / 2 - 15,
                        top: (lastTappedTile.topPx || 0) + (lastTappedTile.heightPx || 0) / 2 - 15,
                      }
                    ]}
                  />
                )}
                
                {/* Debug overlay: Grid visualization (dev only) */}
                {__DEV__ && DEBUG && (
                  <>
                    {/* Grid rect outline */}
                    <View
                      style={[
                        styles.debugGridRect,
                        {
                          left: GRID_RECT.left * imageLayout.width,
                          top: GRID_RECT.top * imageLayout.height,
                          width: (GRID_RECT.right - GRID_RECT.left) * imageLayout.width,
                          height: (GRID_RECT.bottom - GRID_RECT.top) * imageLayout.height,
                        }
                      ]}
                    />
                    
                    {/* Individual tile outlines */}
                    {tiles.map((tile) => (
                      <View
                        key={tile.id}
                        style={[
                          styles.debugTileOutline,
                          {
                            left: tile.leftPx,
                            top: tile.topPx,
                            width: tile.widthPx,
                            height: tile.heightPx,
                          }
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
  tileCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
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
