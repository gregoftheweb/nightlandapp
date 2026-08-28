import AsyncStorage from '@react-native-async-storage/async-storage'
import { getInitialState } from '../gameState'
import {
  GAMEBOARD_ZOOM_MULTIPLIERS,
  getRenderedGameBoardTileSize,
  screenPointToTile,
  stepGameBoardZoom,
} from '../gameboardZoom'
import {
  GAMEBOARD_ZOOM_STORAGE_KEY,
  loadGameBoardZoomLevel,
  saveGameBoardZoomLevel,
} from '../gameboardZoomPreference'
import { calculateNewPosition } from '../movement'
import { buildSpatialGrid, checkOverlap } from '../spacialGrid'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn(),
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}))

const mockedStorage = jest.mocked(AsyncStorage)

describe('GameBoard discrete zoom', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    jest.clearAllMocks()
    storage.clear()
    mockedStorage.getItem.mockImplementation(async (key) => storage.get(key) ?? null)
    mockedStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value)
    })
  })

  it.each(['Near', 'Mid', 'Far'] as const)(
    'maps a screen point to the same logical tile at %s zoom',
    (level) => {
      const renderedTileSize = getRenderedGameBoardTileSize(32, GAMEBOARD_ZOOM_MULTIPLIERS[level])
      const viewportLeft = 3
      const viewportTop = 20
      const camera = { offsetX: 100, offsetY: 150 }
      const target = { col: 107, row: 159 }
      const pageX = viewportLeft + (target.col - camera.offsetX + 0.5) * renderedTileSize
      const pageY = viewportTop + (target.row - camera.offsetY + 0.5) * renderedTileSize

      expect(
        screenPointToTile(pageX, pageY, viewportLeft, viewportTop, camera, renderedTileSize)
      ).toEqual({ tapCol: target.col, tapRow: target.row })
    }
  )

  it('steps toward Near and Far without wrapping at either end', () => {
    expect(stepGameBoardZoom('Far', 'in')).toBe('Mid')
    expect(stepGameBoardZoom('Mid', 'in')).toBe('Near')
    expect(stepGameBoardZoom('Near', 'in')).toBe('Near')
    expect(stepGameBoardZoom('Near', 'out')).toBe('Mid')
    expect(stepGameBoardZoom('Mid', 'out')).toBe('Far')
    expect(stepGameBoardZoom('Far', 'out')).toBe('Far')
  })

  it('persists independently and reloads the preference after a simulated restart', async () => {
    expect(await loadGameBoardZoomLevel()).toBe('Mid')

    await saveGameBoardZoomLevel('Near')

    expect(mockedStorage.setItem).toHaveBeenCalledWith(GAMEBOARD_ZOOM_STORAGE_KEY, 'Near')
    expect(await loadGameBoardZoomLevel()).toBe('Near')
  })

  it('keeps movement, collision, and spatial-grid outcomes byte-identical at every zoom', () => {
    const state = getInitialState('1')
    const inputs = (['Near', 'Mid', 'Far'] as const).map(() => ({
      movement: calculateNewPosition({ row: 50, col: 50 }, 'right', state),
      collision: checkOverlap({ row: 10, col: 10 }, 2, 2, { row: 11, col: 11 }, 1, 1),
      nearby: buildSpatialGrid(state)
        .getNearby({ row: 50, col: 50 }, 2)
        .map(({ id, position, type, width, height }) => ({ id, position, type, width, height })),
    }))

    const serialized = inputs.map((result) => JSON.stringify(result))
    expect(new Set(serialized).size).toBe(1)
  })
})
