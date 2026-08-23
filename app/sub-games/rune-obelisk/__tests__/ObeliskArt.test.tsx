import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'

import { getContainedObeliskRect, ObeliskArt } from '../ObeliskArt'

describe('ObeliskArt', () => {
  test.each(['plain', 'electric'] as const)('renders one whole %s background image', (state) => {
    const screen = render(<ObeliskArt state={state} />)
    fireEvent(screen.getByTestId('obelisk-art-viewport'), 'layout', {
      nativeEvent: { layout: { width: 400, height: 700 } },
    })

    const background = screen.getByTestId(`obelisk-background-${state}`)
    expect(background.props.resizeMode).toBe('contain')
    expect(StyleSheet.flatten(background.props.style)).toEqual(
      expect.objectContaining({ left: 0, top: 150, width: 400, height: 400 })
    )
    expect(StyleSheet.flatten(screen.getByTestId('obelisk-overlay-rect').props.style)).toEqual(
      expect.objectContaining({ left: 0, top: 150, width: 400, height: 400 })
    )
    expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1)
  })

  test('computes centered contain rectangles for portrait and landscape viewports', () => {
    expect(getContainedObeliskRect(400, 700)).toEqual({
      actualWidth: 400,
      actualHeight: 400,
      offsetX: 0,
      offsetY: 150,
    })
    expect(getContainedObeliskRect(900, 500)).toEqual({
      actualWidth: 500,
      actualHeight: 500,
      offsetX: 200,
      offsetY: 0,
    })
  })
})
