/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react'
import { render } from '@testing-library/react-native'
import { useLocalSearchParams } from 'expo-router'

import { CurrentLoomRouteScreen, type CurrentLoomRouteScreenKind } from '../routeScreen'

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }))
jest.mock('../screens', () => {
  const React = require('react')
  const { Text } = require('react-native')
  const screen = (name: string) =>
    function MockScreen({ config, definition }: any) {
      return React.createElement(
        Text,
        { testID: 'resolved-current-loom-screen' },
        `${name}:${config.instanceId}:${definition.instanceId}`
      )
    }
  return {
    CurrentLoomIntroScreen: screen('intro'),
    CurrentLoomPuzzleScreen: screen('puzzle'),
    CurrentLoomSuccessScreen: screen('success'),
  }
})

const mockedParams = useLocalSearchParams as jest.Mock

describe('dynamic Current-Loom routes', () => {
  it.each(['current-loom-01', 'current-loom-02'])(
    'resolves every screen for %s from the parsed catalog',
    (instanceId) => {
      mockedParams.mockReturnValue({ instanceId })
      const screens: CurrentLoomRouteScreenKind[] = ['intro', 'puzzle', 'success']
      screens.forEach((screen) => {
        const view = render(<CurrentLoomRouteScreen screen={screen} />)
        expect(view.getByTestId('resolved-current-loom-screen').props.children).toBe(
          `${screen}:${instanceId}:${instanceId}`
        )
        view.unmount()
      })
    }
  )

  it('rejects unknown instances rather than falling back to hardcoded content', () => {
    mockedParams.mockReturnValue({ instanceId: 'missing-loom' })
    expect(() => render(<CurrentLoomRouteScreen screen="intro" />)).toThrow(
      "Unknown Current-Loom encounter 'missing-loom'"
    )
  })
})
