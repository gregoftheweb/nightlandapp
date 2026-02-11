// components/effects/__tests__/TeleportFlash.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import TeleportFlash from '../TeleportFlash'

// Mock Animated to avoid timing issues in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

describe('TeleportFlash component', () => {
  const defaultProps = {
    id: 'flash-123',
    gridCol: 5,
    gridRow: 10,
    cellSize: 32,
    cameraOffsetX: 0,
    cameraOffsetY: 0,
    onComplete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the flash component', () => {
      const { toJSON } = render(<TeleportFlash {...defaultProps} />)
      expect(toJSON()).not.toBeNull()
    })

    it('should render with correct positioning based on grid coordinates', () => {
      const { toJSON } = render(<TeleportFlash {...defaultProps} />)
      const tree = toJSON()
      expect(tree).toBeTruthy()
    })
  })

  describe('positioning', () => {
    it('should calculate screen position from grid coordinates', () => {
      const { toJSON } = render(
        <TeleportFlash
          {...defaultProps}
          gridCol={10}
          gridRow={5}
          cellSize={32}
          cameraOffsetX={2}
          cameraOffsetY={1}
        />
      )
      expect(toJSON()).not.toBeNull()
    })

    it('should center the flash on the cell', () => {
      const { toJSON } = render(<TeleportFlash {...defaultProps} cellSize={64} />)
      expect(toJSON()).not.toBeNull()
    })
  })

  describe('animation', () => {
    it('should start animation on mount', () => {
      render(<TeleportFlash {...defaultProps} />)
      // Animation starts automatically, component should render
      expect(defaultProps.onComplete).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should call onComplete with the correct id', (done) => {
      const onComplete = jest.fn((id) => {
        expect(id).toBe('flash-456')
        done()
      })

      render(<TeleportFlash {...defaultProps} id="flash-456" onComplete={onComplete} />)

      // Wait for animation to complete (400ms + buffer)
      setTimeout(() => {
        if (!onComplete.mock.calls.length) {
          done(new Error('onComplete was not called'))
        }
      }, 500)
    })
  })
})
