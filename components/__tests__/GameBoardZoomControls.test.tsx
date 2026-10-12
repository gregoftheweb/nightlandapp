import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import GameBoardZoomControls from '../GameBoardZoomControls'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

describe('GameBoardZoomControls', () => {
  it('shows the current level and dispatches both step directions', async () => {
    const onZoomIn = jest.fn()
    const onZoomOut = jest.fn()
    const screen = await render(
      <GameBoardZoomControls zoomLevel="Mid" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )

    expect(screen.getByTestId('gameboard-zoom-level')).toHaveTextContent('Mid')
    await fireEvent.press(screen.getByTestId('gameboard-zoom-in'), { stopPropagation: jest.fn() })
    await fireEvent.press(screen.getByTestId('gameboard-zoom-out'), { stopPropagation: jest.fn() })

    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
  })

  it('keeps both controls interactive at the visual endpoints', async () => {
    const onZoomIn = jest.fn()
    const onZoomOut = jest.fn()
    const screen = await render(
      <GameBoardZoomControls zoomLevel="Nearest" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )

    await fireEvent.press(screen.getByTestId('gameboard-zoom-in'), { stopPropagation: jest.fn() })
    expect(onZoomIn).toHaveBeenCalledTimes(1)

    await await screen.rerender(
      <GameBoardZoomControls zoomLevel="Far" onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
    )
    await fireEvent.press(screen.getByTestId('gameboard-zoom-out'), { stopPropagation: jest.fn() })
    expect(onZoomOut).toHaveBeenCalledTimes(1)
  })
})
