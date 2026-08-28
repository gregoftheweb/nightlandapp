import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  DEFAULT_GAMEBOARD_ZOOM_LEVEL,
  isGameBoardZoomLevel,
  type GameBoardZoomLevel,
} from './gameboardZoom'

export const GAMEBOARD_ZOOM_STORAGE_KEY = 'nightland:ui:zoomLevel'

export async function loadGameBoardZoomLevel(): Promise<GameBoardZoomLevel> {
  try {
    const stored = await AsyncStorage.getItem(GAMEBOARD_ZOOM_STORAGE_KEY)
    return isGameBoardZoomLevel(stored) ? stored : DEFAULT_GAMEBOARD_ZOOM_LEVEL
  } catch (error) {
    console.error('Failed to load GameBoard zoom preference:', error)
    return DEFAULT_GAMEBOARD_ZOOM_LEVEL
  }
}

export async function saveGameBoardZoomLevel(level: GameBoardZoomLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(GAMEBOARD_ZOOM_STORAGE_KEY, level)
  } catch (error) {
    console.error('Failed to save GameBoard zoom preference:', error)
  }
}
