import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { useLocalSearchParams } from 'expo-router'

import { WordGridRouteScreen, type WordGridRouteScreenKind } from '../routeScreen'

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }))

jest.mock('../screens', () => {
  const React = require('react')
  const { Text } = require('react-native')
  const screen = (name: string) =>
    function MockWordGridScreen({ config, definition }: any) {
      return React.createElement(
        Text,
        { testID: 'resolved-word-grid-screen' },
        `${name}:${config.instanceId}:${definition.instanceId}`
      )
    }
  return {
    WordGridIntroScreen: screen('intro'),
    WordGridPuzzleScreen: screen('puzzle'),
    WordGridFailureScreen: screen('failure'),
    WordGridSuccessScreen: screen('success'),
  }
})

const mockedParams = useLocalSearchParams as jest.Mock

describe('dynamic word-grid routes', () => {
  it.each(['word-tile-crypt-01', 'word-tile-crypt-02'])(
    'resolves every screen for %s through the same parsed-catalog route component',
    (instanceId) => {
      mockedParams.mockReturnValue({ instanceId })
      const screens: WordGridRouteScreenKind[] = [
        'intro',
        'puzzle',
        'failure',
        'success',
        'aftermath',
      ]

      screens.forEach((screen) => {
        const view = render(<WordGridRouteScreen screen={screen} />)
        const renderedKind = screen === 'aftermath' ? 'success' : screen
        expect(view.getByTestId('resolved-word-grid-screen').props.children).toBe(
          `${renderedKind}:${instanceId}:${instanceId}`
        )
        view.unmount()
      })
    }
  )

  it('rejects an unknown dynamic instance instead of falling back to hardcoded content', () => {
    mockedParams.mockReturnValue({ instanceId: 'missing-grid' })
    expect(() => render(<WordGridRouteScreen screen="intro" />)).toThrow(
      "Unknown word-grid encounter 'missing-grid'"
    )
  })
})
