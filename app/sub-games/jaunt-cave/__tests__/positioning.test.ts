// app/sub-games/jaunt-cave/__tests__/positioning.test.ts
// Test to verify daemon positioning calculations for resizeMode="cover"

describe('Jaunt Cave Daemon Positioning', () => {
  // Simulate the positioning logic from screen2.tsx
  const computeBgRect = (
    arenaWidth: number,
    arenaHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const scale = Math.max(arenaWidth / imageWidth, arenaHeight / imageHeight);
    const drawW = imageWidth * scale;
    const drawH = imageHeight * scale;
    const offsetX = (arenaWidth - drawW) / 2;
    const offsetY = (arenaHeight - drawH) / 2;
    
    return { offsetX, offsetY, drawW, drawH };
  };

  const computeDaemonPosition = (
    bgRect: { offsetX: number; offsetY: number; drawW: number; drawH: number },
    positionX: number,
    positionY: number
  ) => {
    const daemonX = bgRect.offsetX + positionX * bgRect.drawW;
    const daemonY = bgRect.offsetY + positionY * bgRect.drawH;
    return { x: daemonX, y: daemonY };
  };

  describe('Background rect calculation for resizeMode="cover"', () => {
    it('should calculate correct scale and offsets for a square arena', () => {
      // Square arena, wider image
      const bgRect = computeBgRect(500, 500, 1000, 800);
      
      // Scale should be max(500/1000, 500/800) = max(0.5, 0.625) = 0.625
      const expectedScale = 0.625;
      expect(bgRect.drawW).toBe(1000 * expectedScale); // 625
      expect(bgRect.drawH).toBe(800 * expectedScale); // 500
      expect(bgRect.offsetX).toBe((500 - 625) / 2); // -62.5
      expect(bgRect.offsetY).toBe(0); // Centered vertically
    });

    it('should calculate correct scale and offsets for a tall portrait arena', () => {
      // Tall portrait arena (phone)
      const bgRect = computeBgRect(400, 800, 1000, 800);
      
      // Scale should be max(400/1000, 800/800) = max(0.4, 1.0) = 1.0
      const expectedScale = 1.0;
      expect(bgRect.drawW).toBe(1000 * expectedScale); // 1000
      expect(bgRect.drawH).toBe(800 * expectedScale); // 800
      expect(bgRect.offsetX).toBe((400 - 1000) / 2); // -300 (image overflows horizontally)
      expect(bgRect.offsetY).toBe(0); // No vertical offset
    });

    it('should calculate correct scale and offsets for a wide landscape arena', () => {
      // Wide landscape arena
      const bgRect = computeBgRect(1000, 500, 800, 600);
      
      // Scale should be max(1000/800, 500/600) = max(1.25, 0.833) = 1.25
      const expectedScale = 1.25;
      expect(bgRect.drawW).toBe(800 * expectedScale); // 1000
      expect(bgRect.drawH).toBe(600 * expectedScale); // 750
      expect(bgRect.offsetX).toBe(0); // No horizontal offset
      expect(bgRect.offsetY).toBe((500 - 750) / 2); // -125 (image overflows vertically)
    });
  });

  describe('Daemon position calculation from percentages', () => {
    it('should correctly convert percentage positions to absolute coordinates', () => {
      // Example: Square arena with image that fits exactly
      const bgRect = computeBgRect(500, 500, 500, 500);
      
      // Center position (50%, 25%)
      const centerPos = computeDaemonPosition(bgRect, 0.5, 0.25);
      expect(centerPos.x).toBe(250); // 50% of 500
      expect(centerPos.y).toBe(125); // 25% of 500
      
      // Left position (20%, 25%)
      const leftPos = computeDaemonPosition(bgRect, 0.2, 0.25);
      expect(leftPos.x).toBe(100); // 20% of 500
      expect(leftPos.y).toBe(125); // 25% of 500
      
      // Right position (80%, 25%)
      const rightPos = computeDaemonPosition(bgRect, 0.8, 0.25);
      expect(rightPos.x).toBe(400); // 80% of 500
      expect(rightPos.y).toBe(125); // 25% of 500
    });

    it('should account for background offsets in tall portrait mode', () => {
      // Tall portrait: arena is narrower than scaled image
      const bgRect = computeBgRect(400, 800, 1000, 800);
      
      // Background is scaled to 1000x800, centered at offsetX=-300, offsetY=0
      // Center position (50%, 25%) should be at the CENTER of the scaled image
      const centerPos = computeDaemonPosition(bgRect, 0.5, 0.25);
      expect(centerPos.x).toBe(-300 + 0.5 * 1000); // -300 + 500 = 200
      expect(centerPos.y).toBe(0 + 0.25 * 800); // 0 + 200 = 200
      
      // Verify the daemon center lands in the visible arena
      expect(centerPos.x).toBeGreaterThanOrEqual(0);
      expect(centerPos.x).toBeLessThanOrEqual(400);
    });
  });

  describe('Positioning consistency across aspect ratios', () => {
    it('should maintain relative position on background across different aspect ratios', () => {
      // For a given position percentage (e.g., center at 50%, 25%),
      // the daemon should appear at the same VISUAL spot on the background
      // regardless of arena aspect ratio
      
      const imageWidth = 1000;
      const imageHeight = 800;
      const posX = 0.5; // Center
      const posY = 0.25;
      
      // Test in different aspect ratios
      const square = computeBgRect(500, 500, imageWidth, imageHeight);
      const tall = computeBgRect(400, 800, imageWidth, imageHeight);
      const wide = computeBgRect(800, 400, imageWidth, imageHeight);
      
      const squarePos = computeDaemonPosition(square, posX, posY);
      const tallPos = computeDaemonPosition(tall, posX, posY);
      const widePos = computeDaemonPosition(wide, posX, posY);
      
      // The positions will differ in absolute pixel coordinates,
      // but they should all represent the same point on the scaled image
      
      // For square arena: scale = 0.625, daemon at (312.5, 125) relative to image top-left
      const squareRelX = squarePos.x - square.offsetX;
      const squareRelY = squarePos.y - square.offsetY;
      
      // For tall arena: scale = 1.0, daemon at (500, 200) relative to image top-left
      const tallRelX = tallPos.x - tall.offsetX;
      const tallRelY = tallPos.y - tall.offsetY;
      
      // For wide arena: scale = 1.0, daemon at (400, 200) relative to image top-left
      const wideRelX = widePos.x - wide.offsetX;
      const wideRelY = widePos.y - wide.offsetY;
      
      // All should be at 50% and 25% of their respective scaled dimensions
      expect(squareRelX / square.drawW).toBeCloseTo(0.5);
      expect(squareRelY / square.drawH).toBeCloseTo(0.25);
      
      expect(tallRelX / tall.drawW).toBeCloseTo(0.5);
      expect(tallRelY / tall.drawH).toBeCloseTo(0.25);
      
      expect(wideRelX / wide.drawW).toBeCloseTo(0.5);
      expect(wideRelY / wide.drawH).toBeCloseTo(0.25);
    });
  });
});
