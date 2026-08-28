import React from 'react'
import { Animated, StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'

import { getPlayerHealthDisplay } from '@modules/playerHealthDisplay'
import {
  CURRENT_LOOM_COMPLETION_FADE_MS,
  CurrentLoomCompletionGlow,
  CurrentLoomEdgeGlow,
  CurrentLoomHealthBar,
} from '../feedback'

describe('Current-Loom danger feedback', () => {
  it.each([
    [51, 'healthy', '#44ff44'],
    [50, 'wounded', '#ffdd00'],
    [25, 'wounded', '#ffdd00'],
    [24, 'critical', '#ff8c00'],
    [10, 'critical', '#ff8c00'],
    [9, 'dire', '#ff4444'],
  ] as const)('renders %i HP using the shared %s color', (currentHP, band, color) => {
    const view = render(<CurrentLoomHealthBar currentHP={currentHP} maxHP={100} />)
    const fillStyle = StyleSheet.flatten(view.getByTestId('current-loom-health-fill').props.style)
    expect(fillStyle.backgroundColor).toBe(color)
    expect(view.getByLabelText(`Health: ${band}`)).toBeTruthy()
  })

  it('uses the shared dire band for the low-HP bar and edge frame simultaneously', () => {
    const display = getPlayerHealthDisplay(9, 100)
    const view = render(
      <>
        <CurrentLoomHealthBar currentHP={9} maxHP={100} />
        <CurrentLoomEdgeGlow display={display} />
      </>
    )

    expect(view.getByLabelText('Health: dire')).toBeTruthy()
    expect(view.getByLabelText('Current danger: dire')).toBeTruthy()
    expect(display.color).toBe('#ff4444')
    expect(display.glow.maxOpacity).toBe(1)
  })

  it('fades the completion glow from half opacity before completing', () => {
    const onComplete = jest.fn()
    let finish: ((result: Animated.EndResult) => void) | undefined
    const stop = jest.fn()
    const timing = jest.spyOn(Animated, 'timing').mockImplementation((_value, config) => {
      expect(config).toEqual(
        expect.objectContaining({
          toValue: 0,
          duration: CURRENT_LOOM_COMPLETION_FADE_MS,
          useNativeDriver: true,
        })
      )
      return {
        start: (callback?: Animated.EndCallback) => {
          finish = callback
        },
        stop,
        reset: jest.fn(),
      }
    })

    const view = render(<CurrentLoomCompletionGlow onComplete={onComplete} />)
    expect(view.getByTestId('current-loom-completion-glow')).toBeTruthy()
    expect(timing).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()

    finish?.({ finished: true })
    expect(onComplete).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(stop).toHaveBeenCalledTimes(1)
  })
})
