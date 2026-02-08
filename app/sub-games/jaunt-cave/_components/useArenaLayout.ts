// app/sub-games/jaunt-cave/_components/useArenaLayout.ts
// Custom hook for arena layout calculations and positioning logic

import { useState, useCallback, useMemo } from 'react';
import { Image, LayoutChangeEvent } from 'react-native';
import { PositionKey } from './DaemonSprite';

// Landing positions (configurable percentages)
const POSITIONS = {
  left: { x: 0.2, y: 0.37 },
  center: { x: 0.5, y: 0.38 },
  right: { x: 0.8, y: 0.38 },
} as const;

export interface UseArenaLayoutProps {
  backgroundImage: any; // require() asset
  currentPosition: PositionKey;
}

export interface UseArenaLayoutReturn {
  arenaSize: { width: number; height: number } | null;
  bgRect: { offsetX: number; offsetY: number; drawW: number; drawH: number } | null;
  daemonPosition: { x: number; y: number };
  daemonX: number;
  daemonY: number;
  handleArenaLayout: (event: LayoutChangeEvent) => void;
  getSpawnPosition: (positionKey: PositionKey) => { x: number; y: number };
}

export function useArenaLayout(props: UseArenaLayoutProps): UseArenaLayoutReturn {
  const { backgroundImage, currentPosition } = props;
  
  const [arenaSize, setArenaSize] = useState<{ width: number; height: number } | null>(null);

  // Handle arena layout
  const handleArenaLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setArenaSize({ width, height });
    }
  }, []);

  // Compute background image rect for resizeMode="cover"
  const bgRect = useMemo(() => {
    if (!arenaSize) return null;

    // Get intrinsic dimensions of background image
    const bgSource = Image.resolveAssetSource(backgroundImage);
    if (!bgSource) return null;

    const imageW = bgSource.width;
    const imageH = bgSource.height;
    const containerW = arenaSize.width;
    const containerH = arenaSize.height;

    // Compute scale for resizeMode="cover" (fills container, may crop)
    const scale = Math.max(containerW / imageW, containerH / imageH);

    const drawW = imageW * scale;
    const drawH = imageH * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;

    return { offsetX, offsetY, drawW, drawH };
  }, [arenaSize, backgroundImage]);

  // Helper to compute absolute position for any spawn point
  const getSpawnPosition = useCallback((positionKey: PositionKey) => {
    if (!bgRect) return { x: 0, y: 0 };

    const position = POSITIONS[positionKey];
    const x = bgRect.offsetX + position.x * bgRect.drawW;
    const y = bgRect.offsetY + position.y * bgRect.drawH;

    return { x, y };
  }, [bgRect]);

  // Compute daemon absolute position from percentage
  const daemonPosition = useMemo(() => {
    return getSpawnPosition(currentPosition);
  }, [getSpawnPosition, currentPosition]);

  // Position for daemon
  const daemonX = daemonPosition.x;
  const daemonY = daemonPosition.y;

  return {
    arenaSize,
    bgRect,
    daemonPosition,
    daemonX,
    daemonY,
    handleArenaLayout,
    getSpawnPosition,
  };
}
