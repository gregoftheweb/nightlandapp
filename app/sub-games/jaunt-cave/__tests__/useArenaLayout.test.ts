// app/sub-games/jaunt-cave/__tests__/useArenaLayout.test.ts
// Test to verify the useArenaLayout hook

import { renderHook, act } from '@testing-library/react-hooks';
import { useArenaLayout } from '../_components/useArenaLayout';

// Mock the background image
const mockBackgroundImage = require('@assets/images/backgrounds/subgames/jaunt-cave-screen2.png');

// Mock Image.resolveAssetSource
jest.mock('react-native', () => ({
  Image: {
    resolveAssetSource: jest.fn((source) => ({
      width: 1000,
      height: 800,
    })),
  },
}));

describe('useArenaLayout hook', () => {
  describe('initialization', () => {
    it('should initialize with null arenaSize and bgRect', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      expect(result.current.arenaSize).toBeNull();
      expect(result.current.bgRect).toBeNull();
      expect(result.current.daemonPosition).toEqual({ x: 0, y: 0 });
      expect(result.current.daemonX).toBe(0);
      expect(result.current.daemonY).toBe(0);
    });

    it('should provide handleArenaLayout function', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      expect(typeof result.current.handleArenaLayout).toBe('function');
    });

    it('should provide getSpawnPosition function', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      expect(typeof result.current.getSpawnPosition).toBe('function');
    });
  });

  describe('arena layout handling', () => {
    it('should update arenaSize when handleArenaLayout is called', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      expect(result.current.arenaSize).toEqual({ width: 500, height: 500 });
    });

    it('should not update arenaSize with invalid dimensions', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 0, height: 0, x: 0, y: 0 },
          },
        } as any);
      });

      expect(result.current.arenaSize).toBeNull();
    });
  });

  describe('background rect calculation', () => {
    it('should calculate bgRect for square arena', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      // Scale should be max(500/1000, 500/800) = max(0.5, 0.625) = 0.625
      const expectedScale = 0.625;
      expect(result.current.bgRect?.drawW).toBe(1000 * expectedScale); // 625
      expect(result.current.bgRect?.drawH).toBe(800 * expectedScale); // 500
      expect(result.current.bgRect?.offsetX).toBe((500 - 625) / 2); // -62.5
      expect(result.current.bgRect?.offsetY).toBe(0); // Centered vertically
    });

    it('should calculate bgRect for tall portrait arena', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 400, height: 800, x: 0, y: 0 },
          },
        } as any);
      });

      // Scale should be max(400/1000, 800/800) = max(0.4, 1.0) = 1.0
      const expectedScale = 1.0;
      expect(result.current.bgRect?.drawW).toBe(1000 * expectedScale); // 1000
      expect(result.current.bgRect?.drawH).toBe(800 * expectedScale); // 800
      expect(result.current.bgRect?.offsetX).toBe((400 - 1000) / 2); // -300 (image overflows horizontally)
      expect(result.current.bgRect?.offsetY).toBe(0); // No vertical offset
    });

    it('should calculate bgRect for wide landscape arena', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 1000, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      // Scale should be max(1000/1000, 500/800) = max(1.0, 0.625) = 1.0
      const expectedScale = 1.0;
      expect(result.current.bgRect?.drawW).toBe(1000 * expectedScale); // 1000
      expect(result.current.bgRect?.drawH).toBe(800 * expectedScale); // 800
      expect(result.current.bgRect?.offsetX).toBe(0); // No horizontal offset
      expect(result.current.bgRect?.offsetY).toBe((500 - 800) / 2); // -150 (image overflows vertically)
    });
  });

  describe('daemon positioning', () => {
    it('should calculate center position correctly', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      // Center position should be at 50% of drawW, 38% of drawH
      const bgRect = result.current.bgRect!;
      const expectedX = bgRect.offsetX + 0.5 * bgRect.drawW;
      const expectedY = bgRect.offsetY + 0.38 * bgRect.drawH;

      expect(result.current.daemonX).toBeCloseTo(expectedX);
      expect(result.current.daemonY).toBeCloseTo(expectedY);
      expect(result.current.daemonPosition.x).toBeCloseTo(expectedX);
      expect(result.current.daemonPosition.y).toBeCloseTo(expectedY);
    });

    it('should calculate left position correctly', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'left',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      // Left position should be at 20% of drawW, 37% of drawH
      const bgRect = result.current.bgRect!;
      const expectedX = bgRect.offsetX + 0.2 * bgRect.drawW;
      const expectedY = bgRect.offsetY + 0.37 * bgRect.drawH;

      expect(result.current.daemonX).toBeCloseTo(expectedX);
      expect(result.current.daemonY).toBeCloseTo(expectedY);
    });

    it('should calculate right position correctly', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'right',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      // Right position should be at 80% of drawW, 38% of drawH
      const bgRect = result.current.bgRect!;
      const expectedX = bgRect.offsetX + 0.8 * bgRect.drawW;
      const expectedY = bgRect.offsetY + 0.38 * bgRect.drawH;

      expect(result.current.daemonX).toBeCloseTo(expectedX);
      expect(result.current.daemonY).toBeCloseTo(expectedY);
    });

    it('should update position when currentPosition changes', () => {
      const { result, rerender } = renderHook(
        ({ currentPosition }) =>
          useArenaLayout({
            backgroundImage: mockBackgroundImage,
            currentPosition,
          }),
        {
          initialProps: { currentPosition: 'left' as const },
        }
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      const leftX = result.current.daemonX;

      // Change position to center
      rerender({ currentPosition: 'center' });

      const centerX = result.current.daemonX;

      // Center should be more to the right than left
      expect(centerX).toBeGreaterThan(leftX);
    });
  });

  describe('getSpawnPosition function', () => {
    it('should return position for any given spawn point', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      act(() => {
        result.current.handleArenaLayout({
          nativeEvent: {
            layout: { width: 500, height: 500, x: 0, y: 0 },
          },
        } as any);
      });

      const leftPos = result.current.getSpawnPosition('left');
      const centerPos = result.current.getSpawnPosition('center');
      const rightPos = result.current.getSpawnPosition('right');

      // Left should be leftmost
      expect(leftPos.x).toBeLessThan(centerPos.x);
      expect(centerPos.x).toBeLessThan(rightPos.x);

      // Y positions should be similar (within a small tolerance)
      expect(Math.abs(leftPos.y - centerPos.y)).toBeLessThan(10);
      expect(Math.abs(centerPos.y - rightPos.y)).toBeLessThan(10);
    });

    it('should return {x: 0, y: 0} when bgRect is null', () => {
      const { result } = renderHook(() =>
        useArenaLayout({
          backgroundImage: mockBackgroundImage,
          currentPosition: 'center',
        })
      );

      // Don't set arena size, so bgRect remains null
      const pos = result.current.getSpawnPosition('center');

      expect(pos).toEqual({ x: 0, y: 0 });
    });
  });
});
