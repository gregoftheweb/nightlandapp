import {
  default as DebugMinimap,
  describeEncounterLocation,
  encounterPlacementToMinimapPoint,
  positionToMinimapPoint,
} from '../DebugMinimap'
import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

const placement = {
  instanceId: 'test-encounter',
  shapeId: 'one-off' as const,
  slotId: 'test-slot',
  position: { row: 100, col: 120 },
  location: { type: 'trunk' as const, progressPct: 0.5 },
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

  it('safely describes both trunk and branch placement locations', () => {
    expect(describeEncounterLocation(placement)).toBe('Trunk: 50.0%')
    expect(
      describeEncounterLocation({
        ...placement,
        location: { type: 'branch', branchId: 'branch-2', branchProgressPct: 0.75 },
      })
    ).toBe('Branch branch-2: 75.0%')
  })

  it('shows a tapped encounter name and closes from the X button', () => {
    const onClose = jest.fn()
    const view = render(
      React.createElement(DebugMinimap, {
        visible: true,
        onClose,
        boardSize: { width: 400, height: 400 },
        encounterPlacements: [placement],
        greatPowers: [],
        levelObjects: [],
        nonCollisionObjects: [],
        playerPosition: { row: 395, col: 200 },
        mapSize: 250,
      })
    )

    fireEvent.press(view.getByLabelText('Encounter test-encounter'))
    expect(view.getByText('test-encounter\nTrunk: 50.0%')).toBeTruthy()

    fireEvent.press(view.getByLabelText('Close minimap'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders canonical Great Powers, static buildings, and every river mask segment', () => {
    const view = render(
      React.createElement(DebugMinimap, {
        visible: true,
        onClose: jest.fn(),
        boardSize: { width: 400, height: 400 },
        encounterPlacements: [],
        greatPowers: [
          {
            id: 'watcher',
            name: 'Watcher',
            position: { row: 380, col: 180 },
            width: 6,
            height: 6,
          } as any,
        ],
        levelObjects: [
          {
            id: 'redoubt',
            templateId: 'redoubt',
            shortName: 'redoubt',
            name: 'Last Redoubt',
            position: { row: 390, col: 198 },
            size: { width: 8, height: 8 },
          } as any,
          {
            id: 'generated-encounter',
            templateId: 'word-tile-crypt-01',
            shortName: 'tesseract',
            name: 'Tesseract',
            position: { row: 100, col: 100 },
            size: { width: 6, height: 6 },
          } as any,
        ],
        nonCollisionObjects: [
          {
            id: 'generated-footstep',
            shortName: 'generated-footsteps',
            type: 'footstep',
            position: { row: 75, col: 80 },
            rotation: 90,
          } as any,
          {
            id: 'river',
            type: 'river',
            position: { row: 370, col: 195 },
            collisionMask: [
              { row: 0, col: 2, width: 1, height: 2 },
              { row: 2, col: 3, width: 2, height: 1 },
            ],
          } as any,
        ],
        playerPosition: { row: 395, col: 200 },
        mapSize: 250,
      })
    )

    expect(view.getByLabelText('Great Power Watcher')).toBeTruthy()
    expect(view.getByLabelText('Building Last Redoubt')).toBeTruthy()
    expect(view.queryByLabelText('Building Tesseract')).toBeNull()
    expect(view.getAllByLabelText(/River segment/)).toHaveLength(2)
    expect(view.getByLabelText('Minimap legend')).toBeTruthy()
    expect(view.getByText('Generated trail')).toBeTruthy()
    expect(view.getByLabelText('Generated footstep at row 75, column 80')).toBeTruthy()
  })

  it('inspects every marker type and reports overlapping Watcher and encounter together', () => {
    const overlappingEncounter = {
      ...placement,
      instanceId: 'overlap-encounter',
      position: { row: 380, col: 180 },
      footprint: { width: 6, height: 6 },
    }
    const view = render(
      React.createElement(DebugMinimap, {
        visible: true,
        onClose: jest.fn(),
        boardSize: { width: 400, height: 400 },
        encounterPlacements: [overlappingEncounter],
        greatPowers: [
          {
            id: 'watcher',
            shortName: 'watcher_se',
            name: 'Watcher',
            position: { row: 380, col: 180 },
            width: 6,
            height: 6,
          } as any,
        ],
        levelObjects: [
          {
            id: 'redoubt',
            templateId: 'redoubt',
            shortName: 'redoubt',
            name: 'Last Redoubt',
            position: { row: 300, col: 300 },
            size: { width: 8, height: 8 },
          } as any,
        ],
        nonCollisionObjects: [
          {
            id: 'footstep',
            shortName: 'footsteps',
            type: 'footstep',
            position: { row: 50, col: 50 },
            rotation: 290,
          } as any,
          {
            id: 'river',
            shortName: 'river',
            type: 'river',
            position: { row: 200, col: 200 },
            width: 22,
            height: 15,
            collisionMask: [{ row: 0, col: 2, width: 1, height: 2 }],
          } as any,
        ],
        playerPosition: { row: 395, col: 200 },
        mapSize: 250,
      })
    )

    fireEvent.press(view.getByLabelText('Footstep at row 50, column 50'))
    expect(view.getByText(/Rotation: 290°/)).toBeTruthy()

    fireEvent.press(view.getByLabelText('Building Last Redoubt'))
    expect(view.getByText(/Footprint: 8×8/)).toBeTruthy()

    fireEvent.press(view.getByLabelText('River river'))
    expect(view.getByText(/Anchor: \(200, 200\)/)).toBeTruthy()
    expect(view.getByText(/Footprint: 22×15/)).toBeTruthy()

    fireEvent.press(view.getByLabelText('Player position'))
    expect(view.getByText('Player\nPosition: (395, 200)')).toBeTruthy()

    fireEvent.press(view.getByLabelText('Great Power Watcher'))
    expect(view.getByText(/Watcher/)).toBeTruthy()
    expect(view.queryByText(/Awakened:/)).toBeNull()
    expect(view.getByText('overlap-encounter\nTrunk: 50.0%')).toBeTruthy()
  })
})
