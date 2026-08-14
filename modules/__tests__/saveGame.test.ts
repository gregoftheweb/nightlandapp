import AsyncStorage from '@react-native-async-storage/async-storage'
import { getInitialState } from '../gameState'
import { listWaypointSaves, saveWaypoint } from '../saveGame'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

const INDEX_KEY = 'nightland:save:waypoints:index:v1'
const ITEM_PREFIX = 'nightland:save:waypoint:v1:'
const mockedStorage = jest.mocked(AsyncStorage)

describe('waypoint save transactions', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    mockedStorage.getItem.mockReset()
    mockedStorage.setItem.mockReset()
    mockedStorage.removeItem.mockReset()
    mockedStorage.getItem.mockImplementation(async (key) => storage.get(key) ?? null)
    mockedStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value)
    })
    mockedStorage.removeItem.mockImplementation(async (key) => {
      storage.delete(key)
    })
  })

  test('serializes concurrent saves and retains one waypoint per name', async () => {
    const state = getInitialState('1')

    const [firstId, secondId] = await Promise.all([
      saveWaypoint(state, 'shared waypoint'),
      saveWaypoint({ ...state, moveCount: 2 }, 'shared waypoint'),
    ])

    const index = await listWaypointSaves()
    expect(firstId).not.toBe(secondId)
    expect(index).toHaveLength(1)
    expect(index[0]).toEqual(expect.objectContaining({ id: secondId, name: 'shared waypoint' }))
    expect(storage.has(ITEM_PREFIX + firstId)).toBe(false)
    expect(storage.has(ITEM_PREFIX + secondId)).toBe(true)
  })

  test('commits the replacement before deleting the previous record', async () => {
    const operations: string[] = []
    const oldMetadata = {
      id: 'old-id',
      name: 'hermit waypoint',
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    storage.set(INDEX_KEY, JSON.stringify([oldMetadata]))
    storage.set(ITEM_PREFIX + oldMetadata.id, 'old record')
    mockedStorage.setItem.mockImplementation(async (key, value) => {
      operations.push(key === INDEX_KEY ? 'index committed' : 'new record written')
      storage.set(key, value)
    })
    mockedStorage.removeItem.mockImplementation(async (key) => {
      operations.push(key === ITEM_PREFIX + oldMetadata.id ? 'old record deleted' : 'cleanup')
      storage.delete(key)
    })

    await saveWaypoint(getInitialState('1'), oldMetadata.name)

    expect(operations.slice(0, 3)).toEqual([
      'new record written',
      'index committed',
      'old record deleted',
    ])
  })

  test('preserves the previous waypoint when the index commit fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const oldMetadata = {
      id: 'old-id',
      name: 'jaunt waypoint',
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    storage.set(INDEX_KEY, JSON.stringify([oldMetadata]))
    storage.set(ITEM_PREFIX + oldMetadata.id, 'old record')
    mockedStorage.setItem.mockImplementation(async (key, value) => {
      if (key === INDEX_KEY) throw new Error('index unavailable')
      storage.set(key, value)
    })

    await expect(saveWaypoint(getInitialState('1'), oldMetadata.name)).rejects.toThrow(
      'index unavailable'
    )

    expect(JSON.parse(storage.get(INDEX_KEY)!)).toEqual([oldMetadata])
    expect(storage.get(ITEM_PREFIX + oldMetadata.id)).toBe('old record')
    expect([...storage.keys()].filter((key) => key.startsWith(ITEM_PREFIX))).toEqual([
      ITEM_PREFIX + oldMetadata.id,
    ])
    consoleError.mockRestore()
  })

  test('does not replace the index when its transaction read fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockedStorage.getItem.mockRejectedValueOnce(new Error('index unreadable'))

    await expect(saveWaypoint(getInitialState('1'), 'new waypoint')).rejects.toThrow(
      'index unreadable'
    )

    expect(mockedStorage.setItem).not.toHaveBeenCalled()
    expect(mockedStorage.removeItem).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
