import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Dial } from '../components/Dial'
import { numberToAngle } from '../utils'

describe('safe dial controls', () => {
  test('clockwise control rotates physically clockwise and selects the previous number', () => {
    const onAngleChange = jest.fn()
    const screen = render(
      <Dial currentNumber={0} onAngleChange={onAngleChange} onCenterTap={jest.fn()} />
    )

    fireEvent.press(screen.getByLabelText('Rotate dial clockwise'))

    expect(onAngleChange).toHaveBeenCalledWith(numberToAngle(39), 'CW')
  })

  test('counter-clockwise control selects the next number', () => {
    const onAngleChange = jest.fn()
    const screen = render(
      <Dial currentNumber={0} onAngleChange={onAngleChange} onCenterTap={jest.fn()} />
    )

    fireEvent.press(screen.getByLabelText('Rotate dial counter-clockwise'))

    expect(onAngleChange).toHaveBeenCalledWith(numberToAngle(1), 'CCW')
  })
})
