import { getRotationDirection, stepDialNumber } from '../utils'

describe('safe dial direction mapping', () => {
  test('clockwise rotation selects the previous number under a fixed pointer', () => {
    expect(stepDialNumber(15, 'CW')).toBe(14)
    expect(stepDialNumber(0, 'CW')).toBe(39)
  })

  test('counter-clockwise rotation selects the next number under a fixed pointer', () => {
    expect(stepDialNumber(15, 'CCW')).toBe(16)
    expect(stepDialNumber(39, 'CCW')).toBe(0)
  })

  test('logical number deltas map back to physical dial direction across zero', () => {
    const step = (2 * Math.PI) / 40

    expect(getRotationDirection(-step)).toBe('CW')
    expect(getRotationDirection(step)).toBe('CCW')
    expect(getRotationDirection(39 * step)).toBe('CW')
    expect(getRotationDirection(-39 * step)).toBe('CCW')
  })
})
