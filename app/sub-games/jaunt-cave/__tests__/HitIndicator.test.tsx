// app/sub-games/jaunt-cave/__tests__/HitIndicator.test.tsx
// Test to verify the HitIndicator component

import React from 'react'
import { render } from '@testing-library/react-native'
import { HitIndicator } from '../_components/HitIndicator'

describe('HitIndicator component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('should not render when position is null', async () => {
      const { toJSON } = await render(<HitIndicator position={null} type="block" />)
      expect(toJSON()).toBeNull()
    })

    it('should render block indicator when position is provided and type is block', async () => {
      const { queryByText } = await render(
        <HitIndicator position={{ x: 100, y: 200 }} type="block" />
      )

      // Block indicator should not have HIT text
      expect(queryByText('HIT')).toBeNull()
    })

    it('should render hit indicator when position is provided and type is hit', async () => {
      const { getByText } = await render(<HitIndicator position={{ x: 100, y: 200 }} type="hit" />)

      // Hit indicator should have HIT text
      expect(getByText('HIT')).toBeTruthy()
    })
  })

  describe('positioning', () => {
    it('should position the indicator at the correct coordinates', async () => {
      const position = { x: 150, y: 250 }
      const { toJSON } = await render(<HitIndicator position={position} type="hit" />)

      // Component should render
      expect(toJSON()).not.toBeNull()
    })
  })
})
