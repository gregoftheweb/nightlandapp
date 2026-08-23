import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import { RuneDial } from '../RuneDial'

describe('RuneDial', () => {
  test('steps clockwise with wraparound across eight stops', () => {
    const onPositionChange = jest.fn()
    const screen = render(
      <RuneDial currentPosition={0} totalPositions={8} onPositionChange={onPositionChange} />
    )

    fireEvent.press(screen.getByLabelText('Rotate clockwise'))
    expect(onPositionChange).toHaveBeenCalledWith(7, 'CW')
  })

  test('steps counter-clockwise with wraparound across eight stops', () => {
    const onPositionChange = jest.fn()
    const screen = render(
      <RuneDial currentPosition={7} totalPositions={8} onPositionChange={onPositionChange} />
    )

    fireEvent.press(screen.getByLabelText('Rotate counter-clockwise'))
    expect(onPositionChange).toHaveBeenCalledWith(0, 'CCW')
  })

  test('renders actual arrow glyphs instead of literal unicode escape text', () => {
    const screen = render(
      <RuneDial currentPosition={0} totalPositions={8} onPositionChange={jest.fn()} />
    )

    expect(screen.getByText('↻')).toBeTruthy()
    expect(screen.getByText('↺')).toBeTruthy()
    expect(screen.queryByText(/\\u21B/)).toBeNull()
  })

  test('ignores both step controls when disabled', () => {
    const onPositionChange = jest.fn()
    const screen = render(
      <RuneDial
        currentPosition={0}
        totalPositions={8}
        disabled
        onPositionChange={onPositionChange}
      />
    )

    fireEvent.press(screen.getByLabelText('Rotate clockwise'))
    fireEvent.press(screen.getByLabelText('Rotate counter-clockwise'))
    expect(onPositionChange).not.toHaveBeenCalled()
  })
})
