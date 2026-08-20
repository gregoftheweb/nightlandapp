import { encounterPlacementToMinimapPoint, positionToMinimapPoint } from '../DebugMinimap'
import DebugMinimap from '../DebugMinimap'
import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

const placement = {
  instanceId: 'test-encounter',
  shapeId: 'one-off' as const,
  slotId: 'test-slot',
  position: { row: 100, col: 120 },
  progressPct: 0.5,
  footprint: { width: 6, height: 4 },
  occupancyId: 'test-occupancy',
}

describe('DebugMinimap coordinate mapping', () => {
  it('maps level 1 outer tile centers to the 250px edges', () => {
    expect(positionToMinimapPoint({ row: 0, col: 0 }, { width: 400, height: 400 })).toEqual({
      x: 0,
      y: 0,
    })
    expect(positionToMinimapPoint({ row: 399, col: 399 }, { width: 400, height: 400 })).toEqual({
      x: 250,
      y: 250,
    })
  })

  it('uses the supplied per-level dimensions for a 600x500 board', () => {
    expect(
      positionToMinimapPoint({ row: 499, col: 599 }, { width: 600, height: 500 }, 200)
    ).toEqual({ x: 200, y: 200 })
    expect(
      positionToMinimapPoint({ row: 249.5, col: 299.5 }, { width: 600, height: 500 }, 200)
    ).toEqual({ x: 100, y: 100 })
  })

  it('maps an encounter by the center of its footprint', () => {
    const point = encounterPlacementToMinimapPoint(placement, { width: 201, height: 201 }, 200)

    expect(point).toEqual({ x: 123, y: 102 })
  })

  it('shows a tapped encounter name and closes from the X button', () => {
    const onClose = jest.fn()
    const view = render(
      React.createElement(DebugMinimap, {
        visible: true,
        onClose,
        boardSize: { width: 400, height: 400 },
        encounterPlacements: [placement],
        nonCollisionObjects: [],
        playerPosition: { row: 395, col: 200 },
        mapSize: 250,
      })
    )

    fireEvent.press(view.getByLabelText('Encounter test-encounter'))
    expect(view.getByText('test-encounter')).toBeTruthy()

    fireEvent.press(view.getByLabelText('Close minimap'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
