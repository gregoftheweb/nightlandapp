import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Image, StyleSheet } from 'react-native'
import { DEEP_SILO_APPROACH_IMAGES, DeepSiloApproachView } from '../screen1'
import {
  DeepSiloPanelView,
  EntranceLeverAnimation,
  EXTERIOR_LEVER_FRAME_MS,
  EXTERIOR_LEVER_FRAMES,
  LeverLights,
} from '../EntranceLeverPanel'
import {
  countCompletedCurrentLooms,
  DEEP_SILO_SWITCH_THROWN_FLAG,
  effectiveLoomCount,
  getDeepSiloDevState,
  incrementDevLoomOverride,
  isDeepSiloSwitchThrown,
  resetDeepSiloDevStateForTests,
  setDevSwitchThrown,
} from '../entranceState'
import {
  containedPortraitRect,
  EntranceLeverArt,
  LEVER_LIGHT_POSITIONS,
  LEVER_SWITCH_LIGHT_POSITION,
} from '../EntranceLeverArt'

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

const noop = () => undefined
function panel(overrides: Partial<React.ComponentProps<typeof DeepSiloPanelView>> = {}) {
  return (
    <DeepSiloPanelView
      loomCount={0}
      switchThrown={false}
      animating={false}
      onBack={noop}
      onEnter={noop}
      onThrow={noop}
      onAnimationComplete={noop}
      onDevIncrement={noop}
      {...overrides}
    />
  )
}

describe('Deep Silo entrance state', () => {
  beforeEach(resetDeepSiloDevStateForTests)

  test.each([0, 1, 2, 3, 4, 5])('renders %i real Loom lights bottom-to-top', (count) => {
    const view = render(<LeverLights count={count} unlocked={count === 5} />)
    for (let index = 0; index < 5; index += 1)
      expect(view.getByTestId(`loom-light-${index}`).props.accessibilityState.selected).toBe(
        index >= 5 - count
      )
  })

  test.each([0, 1, 2, 3, 4, 5])('uses dev override value %i when nonzero', (override) => {
    const count = effectiveLoomCount(3, override)
    expect(count).toBe(override === 0 ? 3 : override)
    const view = render(<LeverLights count={count} unlocked={count === 5} />)
    expect(
      Array.from({ length: 5 }, (_, index) =>
        Boolean(view.getByTestId(`loom-light-${index}`).props.accessibilityState.selected)
      ).filter(Boolean)
    ).toHaveLength(count)
  })

  test('switch indicator turns green and throw action appears exactly at five', () => {
    const view = render(panel({ loomCount: 4 }))
    expect(view.queryByText('Throw the switch')).toBeNull()
    view.rerender(panel({ loomCount: 5 }))
    expect(view.getByText('Throw the switch')).toBeTruthy()

    const indicator = render(<LeverLights count={4} unlocked={false} />)
    expect(indicator.getByTestId('switch-indicator-light').props.accessibilityState.selected).toBe(
      false
    )
    indicator.rerender(<LeverLights count={5} unlocked />)
    expect(indicator.getByTestId('switch-indicator-light').props.accessibilityState.selected).toBe(
      true
    )
  })

  test('reads fresh real completion data when returning later', () => {
    const completed: Record<string, boolean> = { 'current-loom-01': true, 'current-loom-02': true }
    expect(countCompletedCurrentLooms(completed)).toBe(2)
    completed['current-loom-03'] = true
    completed['current-loom-04'] = true
    expect(countCompletedCurrentLooms(completed)).toBe(4)
  })

  test('dev state never changes data that would be saved or reloaded', () => {
    const gameData = { subGamesCompleted: { 'current-loom-01': true } as Record<string, boolean> }
    const serializedBefore = JSON.stringify(gameData)
    for (let index = 0; index < 5; index += 1) incrementDevLoomOverride()
    setDevSwitchThrown()
    expect(getDeepSiloDevState()).toEqual({ loomOverrideCount: 5, switchThrown: true })
    expect(JSON.stringify(gameData)).toBe(serializedBefore)
    expect(gameData.subGamesCompleted[DEEP_SILO_SWITCH_THROWN_FLAG]).toBeUndefined()
  })

  test('devtool is absent and inert when production gating is false', () => {
    const onDevIncrement = jest.fn()
    const view = render(panel({ showDevtool: false, onDevIncrement }))
    expect(view.queryByTestId('deep-silo-dev-increment')).toBeNull()
    expect(onDevIncrement).not.toHaveBeenCalled()
  })

  test('dev state mutators are inert when __DEV__ is false', () => {
    const runtime = globalThis as typeof globalThis & { __DEV__: boolean }
    const previous = runtime.__DEV__
    runtime.__DEV__ = false
    try {
      incrementDevLoomOverride()
      setDevSwitchThrown()
      expect(getDeepSiloDevState()).toEqual({ loomOverrideCount: 0, switchThrown: false })
    } finally {
      runtime.__DEV__ = previous
    }
  })

  test('already-thrown state offers entry instead of throw', () => {
    const view = render(panel({ loomCount: 5, switchThrown: true }))
    expect(view.getByText('Enter the Deep Silo')).toBeTruthy()
    expect(view.queryByText('Throw the switch')).toBeNull()
    expect(isDeepSiloSwitchThrown({ [DEEP_SILO_SWITCH_THROWN_FLAG]: true })).toBe(true)
  })
})

describe('Deep Silo exterior lever animation', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())
  test('plays all five frames in order', () => {
    const onComplete = jest.fn()
    const view = render(<EntranceLeverAnimation onComplete={onComplete} />)
    expect(view.getByTestId('lever-animation-frame-1')).toBeTruthy()
    expect(view.getByTestId('lever-animation-frame-1').props.resizeMode).toBe('contain')
    for (let frame = 2; frame <= 5; frame += 1) {
      act(() => jest.advanceTimersByTime(EXTERIOR_LEVER_FRAME_MS[frame - 2]))
      expect(view.getByTestId(`lever-animation-frame-${frame}`)).toBeTruthy()
    }
    expect(onComplete).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(EXTERIOR_LEVER_FRAME_MS[4]))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('keeps every Loom light and the switch indicator on during playback', () => {
    const view = render(panel({ loomCount: 5, animating: true }))
    fireEvent(view.getByTestId('deep-silo-lever-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 600, height: 900 } },
    })

    for (let index = 0; index < 5; index += 1)
      expect(view.getByTestId(`loom-light-${index}`).props.accessibilityState.selected).toBe(true)
    expect(view.getByTestId('switch-indicator-light').props.accessibilityState.selected).toBe(true)
  })
})

describe('Deep Silo lever art containment', () => {
  test.each([
    [390, 700],
    [800, 1000],
    [1200, 700],
  ])('keeps the full panel and overlay inside a %ix%i viewport', (width, height) => {
    const view = render(
      <EntranceLeverArt source={EXTERIOR_LEVER_FRAMES[0]}>
        <LeverLights count={3} unlocked={false} />
      </EntranceLeverArt>
    )
    fireEvent(view.getByTestId('deep-silo-lever-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    })

    const expected = containedPortraitRect(width, height)
    const image = view.getByTestId('deep-silo-lever-image')
    const imageStyle = StyleSheet.flatten(image.props.style)
    const overlayStyle = StyleSheet.flatten(view.getByTestId('deep-silo-lever-art').props.style)

    expect(image.props.resizeMode).toBe('contain')
    expect(imageStyle).toMatchObject(expected)
    expect(overlayStyle).toMatchObject(expected)
    expect(expected.left).toBeGreaterThanOrEqual(0)
    expect(expected.top).toBeGreaterThanOrEqual(0)
    expect(expected.left + expected.width).toBeLessThanOrEqual(width)
    expect(expected.top + expected.height).toBeLessThanOrEqual(height)

    const overlayPoints = [...LEVER_LIGHT_POSITIONS, LEVER_SWITCH_LIGHT_POSITION]
    overlayPoints.forEach((point) => {
      const x = expected.left + point.x * expected.width
      const y = expected.top + point.y * expected.height
      expect(x).toBeGreaterThanOrEqual(expected.left)
      expect(x).toBeLessThanOrEqual(expected.left + expected.width)
      expect(y).toBeGreaterThanOrEqual(expected.top)
      expect(y).toBeLessThanOrEqual(expected.top + expected.height)
    })
  })

  test.each([1, 2, 3, 4, 5])('uses the same normalized display rectangle for frame %i', (frame) => {
    const view = render(<EntranceLeverArt source={EXTERIOR_LEVER_FRAMES[frame - 1]} />)
    fireEvent(view.getByTestId('deep-silo-lever-viewport'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 600, height: 900 } },
    })
    expect(view.getByTestId('deep-silo-lever-image').props.resizeMode).toBe('contain')
    expect(StyleSheet.flatten(view.getByTestId('deep-silo-lever-image').props.style)).toMatchObject(
      containedPortraitRect(600, 900)
    )
  })
})

describe('Deep Silo approach', () => {
  test('closed art state has look-closer and return actions only', () => {
    const view = render(
      <DeepSiloApproachView open={false} onEnter={noop} onLookCloser={noop} onReturn={noop} />
    )
    expect(view.queryByText('Enter')).toBeNull()
    expect(view.getByText('Look closer')).toBeTruthy()
    expect(view.getByText('Return to the Night Land')).toBeTruthy()
    expect(view.UNSAFE_getAllByType(Image)[1].props.source).toBe(DEEP_SILO_APPROACH_IMAGES.closed)
  })
  test('open art state adds entry', () => {
    const view = render(
      <DeepSiloApproachView open onEnter={noop} onLookCloser={noop} onReturn={noop} />
    )
    expect(view.getByText('Enter')).toBeTruthy()
    expect(view.getByText('Look closer')).toBeTruthy()
    expect(view.getByText('Return to the Night Land')).toBeTruthy()
    expect(view.UNSAFE_getAllByType(Image)[1].props.source).toBe(DEEP_SILO_APPROACH_IMAGES.open)
  })
})
