import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import { ObeliskCompletionButton } from '../ObeliskCompletionButton'

describe('ObeliskCompletionButton', () => {
  test.each(['playing', 'shaking'] as const)('is absent during the %s phase', (phase) => {
    const onComplete = jest.fn()
    const screen = render(<ObeliskCompletionButton phase={phase} onComplete={onComplete} />)

    expect(screen.queryByLabelText('Return to the Night Land')).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('appears after settling and only completes on an explicit press', () => {
    const onComplete = jest.fn()
    const screen = render(<ObeliskCompletionButton phase="settled" onComplete={onComplete} />)
    const button = screen.getByLabelText('Return to the Night Land')

    expect(button).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.press(button)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
