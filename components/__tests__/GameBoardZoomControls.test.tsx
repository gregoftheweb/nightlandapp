import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import GameBoardZoomControls from '../GameBoardZoomControls'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

describe('GameBoardZoomControls', () => {
  it('shows the current level and dispatches both step directions', () => {
    const onZoomIn = jest.fn()
    const onZoomOut = jest.fn()
    const screen = render(
      <GameBoardZoomControls zoomLevel="Mid" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )

    expect(screen.getByTestId('gameboard-zoom-level')).toHaveTextContent('Mid')
    fireEvent.press(screen.getByTestId('gameboard-zoom-in'), { stopPropagation: jest.fn() })
    fireEvent.press(screen.getByTestId('gameboard-zoom-out'), { stopPropagation: jest.fn() })

    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
  })

  it('keeps both controls interactive at the visual endpoints', () => {
    const onZoomIn = jest.fn()
    const onZoomOut = jest.fn()
    const screen = render(
      <GameBoardZoomControls zoomLevel="Near" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )

    fireEvent.press(screen.getByTestId('gameboard-zoom-in'), { stopPropagation: jest.fn() })
    expect(onZoomIn).toHaveBeenCalledTimes(1)

    screen.rerender(
      <GameBoardZoomControls zoomLevel="Far" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )
    fireEvent.press(screen.getByTestId('gameboard-zoom-out'), { stopPropagation: jest.fn() })
    expect(onZoomOut).toHaveBeenCalledTimes(1)
  })
})
