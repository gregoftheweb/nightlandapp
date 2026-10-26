import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { HouseInterior } from '../_components/HouseInterior'

const mockReplace = jest.fn()
const mockFail = jest.fn()
const mockComplete = jest.fn()
const mockGrant = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useIsFocused: () => true,
}))
jest.mock('../../_shared/lifecycle', () => ({
  useSubGameLifecycle: () => ({
    failSubGame: mockFail,
    completeSubGame: mockComplete,
    grantReward: mockGrant,
  }),
}))
jest.mock('@components/SafeAreaContent', () => ({
  SafeAreaContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../_config/loadTextures', () => ({
  loadTextures: () =>
    Promise.resolve({
      wall: 'wall',
      floor: 'floor',
      ceiling: 'ceiling',
      door: 'door',
      silentOne: 'silentOne',
    }),
}))
jest.mock('../_components/DungeonSurface', () => {
  const { Text } = jest.requireActual('react-native')
  return { __esModule: true, default: () => <Text>Dungeon viewport</Text> }
})

beforeEach(() => jest.clearAllMocks())

it('loads the viewport and exits a test to START without lifecycle mutations', async () => {
  const screen = await render(<HouseInterior testMode />)
  await waitFor(() => expect(screen.getByText('Dungeon viewport')).toBeTruthy())
  await fireEvent.press(screen.getByText('Exit test'))
  expect(mockReplace).toHaveBeenCalledWith('/')
  expect(mockFail).not.toHaveBeenCalled()
  expect(mockComplete).not.toHaveBeenCalled()
  expect(mockGrant).not.toHaveBeenCalled()
})

it('uses safe lifecycle abandonment for expedition entry', async () => {
  const screen = await render(<HouseInterior testMode={false} />)
  await waitFor(() => expect(screen.getByText('Dungeon viewport')).toBeTruthy())
  await fireEvent.press(screen.getByText('Leave'))
  expect(mockFail).toHaveBeenCalledTimes(1)
  expect(mockReplace).not.toHaveBeenCalled()
  expect(mockComplete).not.toHaveBeenCalled()
})
