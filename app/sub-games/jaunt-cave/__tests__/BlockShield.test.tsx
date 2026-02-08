// app/sub-games/jaunt-cave/__tests__/BlockShield.test.tsx
// Test to verify the BlockShield component

import React from 'react';
import { render } from '@testing-library/react-native';
import { BlockShield, BLOCK_SHIELD_CONFIG } from '../_components/BlockShield';

describe('BlockShield component', () => {
  describe('rendering', () => {
    it('should not render when active is false', () => {
      const { toJSON } = render(
        <BlockShield active={false} centerX={200} centerY={300} />
      );
      expect(toJSON()).toBeNull();
    });

    it('should render when active is true', () => {
      const { toJSON } = render(
        <BlockShield active={true} centerX={200} centerY={300} />
      );
      expect(toJSON()).not.toBeNull();
    });

    it('should render correct number of rings', () => {
      const { toJSON } = render(
        <BlockShield active={true} centerX={200} centerY={300} />
      );
      const tree = toJSON();
      
      // Should render container with RING_COUNT children (rings)
      expect(tree).not.toBeNull();
      if (tree && !Array.isArray(tree)) {
        expect(tree.children).toHaveLength(BLOCK_SHIELD_CONFIG.RING_COUNT);
      }
    });
  });

  describe('configuration', () => {
    it('should have correct BLOCK_SHIELD_CONFIG values', () => {
      expect(BLOCK_SHIELD_CONFIG.CIRCLE_SIZE).toBe(200);
      expect(BLOCK_SHIELD_CONFIG.DURATION).toBe(1000);
      expect(BLOCK_SHIELD_CONFIG.FADE_IN_DURATION).toBe(150);
      expect(BLOCK_SHIELD_CONFIG.FADE_OUT_DURATION).toBe(200);
      expect(BLOCK_SHIELD_CONFIG.SHIELD_COLOR).toBe('#00BFFF');
      expect(BLOCK_SHIELD_CONFIG.RING_COUNT).toBe(4);
      expect(BLOCK_SHIELD_CONFIG.RING_SPACING).toBe(12);
      expect(BLOCK_SHIELD_CONFIG.RING_OPACITY).toBe(0.7);
    });
  });
});
