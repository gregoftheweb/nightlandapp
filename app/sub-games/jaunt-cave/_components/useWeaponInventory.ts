// app/sub-games/jaunt-cave/_components/useWeaponInventory.ts
// Custom hook for managing weapon inventory UI state and interactions

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Item } from '@config/types';
import { PositionKey } from './DaemonSprite';

const DEFAULT_BOLT_COLOR = '#990000'; // Fallback color when no weapon equipped

export interface UseWeaponInventoryProps {
  gameState: any; // from useGameContext
  dispatch: any;
  arenaSize: { width: number; height: number } | null;
  bgRect: any;
  getSpawnPosition: (positionKey: PositionKey) => { x: number; y: number };
  onSetFeedback: (message: string) => void;
  onFireProjectile: (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => void;
}

export interface UseWeaponInventoryReturn {
  showInventory: boolean;
  isZapMenuOpen: boolean;
  rangedWeapons: Item[];
  equippedWeaponName: string | null;
  boltColor: string;
  handleZapPress: () => void;
  handleZapTargetPress: (target: 'left' | 'center' | 'right') => void;
  handleOpenInventory: () => void;
  handleCloseInventory: () => void;
  handleSelectWeapon: (weapon: Item) => void;
}

export function useWeaponInventory(props: UseWeaponInventoryProps): UseWeaponInventoryReturn {
  const {
    gameState,
    dispatch,
    arenaSize,
    bgRect,
    getSpawnPosition,
    onSetFeedback,
    onFireProjectile,
  } = props;

  // Inventory modal state
  const [showInventory, setShowInventory] = useState(false);
  
  // Zap menu state
  const [isZapMenuOpen, setIsZapMenuOpen] = useState(false);
  const zapMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get ranged weapons from global weapons catalog based on player's ranged weapon inventory IDs
  const rangedWeapons = useMemo(() => {
    const rangedWeaponIds = gameState.player.rangedWeaponInventoryIds || [];
    return gameState.weapons.filter(
      (weapon: Item) =>
        weapon.weaponType === 'ranged' && 
        weapon.id !== null && 
        weapon.id !== undefined &&
        rangedWeaponIds.includes(weapon.id)
    );
  }, [gameState.player.rangedWeaponInventoryIds, gameState.weapons]);
  
  // Get equipped ranged weapon name for display
  const equippedWeaponName = useMemo(() => {
    if (!gameState.player.equippedRangedWeaponId) return null;
    const weapon = gameState.weapons.find((w: Item) => w.id === gameState.player.equippedRangedWeaponId);
    return weapon ? weapon.name : null;
  }, [gameState.player.equippedRangedWeaponId, gameState.weapons]);

  // Get bolt color from equipped weapon
  const boltColor = useMemo(() => {
    if (!gameState.player.equippedRangedWeaponId) return DEFAULT_BOLT_COLOR;
    const weapon = gameState.weapons.find((w: Item) => w.id === gameState.player.equippedRangedWeaponId);
    return weapon?.projectileColor || DEFAULT_BOLT_COLOR;
  }, [gameState.player.equippedRangedWeaponId, gameState.weapons]);

  // Zap menu toggle handler
  const handleZapPress = useCallback(() => {
    // Toggle zap menu open/close
    setIsZapMenuOpen((prev) => !prev);
    if (__DEV__) {
      console.log('[JauntCave] Zap menu toggled');
    }
  }, []);

  // Zap target selection handler
  const handleZapTargetPress = useCallback((target: 'left' | 'center' | 'right') => {
    const targetLabels = {
      left: 'Left',
      center: 'Center',
      right: 'Right',
    };
    
    // Show feedback
    onSetFeedback(`Zap - ${targetLabels[target]}`);
    
    // Clear any existing timer
    if (zapMenuTimerRef.current) {
      clearTimeout(zapMenuTimerRef.current);
    }
    
    // Auto-close zap menu after ~1s
    zapMenuTimerRef.current = setTimeout(() => {
      setIsZapMenuOpen(false);
      zapMenuTimerRef.current = null;
    }, 1000);
    
    // Trigger projectile VFX
    if (arenaSize && bgRect) {
      // Calculate start point (bottom center of arena)
      const startX = arenaSize.width / 2;
      const startY = arenaSize.height - 20;
      
      // Get end point (selected target spawn position)
      const endPosition = getSpawnPosition(target);
      
      // Fire projectile
      onFireProjectile({ x: startX, y: startY }, endPosition, boltColor);
    }
    
    if (__DEV__) {
      console.log('[JauntCave] Zap target selected:', target);
    }
  }, [arenaSize, bgRect, getSpawnPosition, onSetFeedback, onFireProjectile, boltColor]);

  // Inventory modal handlers
  const handleOpenInventory = useCallback(() => {
    setShowInventory(true);
    if (__DEV__) {
      console.log('[JauntCave] Inventory opened');
    }
  }, []);
  
  const handleCloseInventory = useCallback(() => {
    setShowInventory(false);
  }, []);
  
  // Weapon selection handler
  const handleSelectWeapon = useCallback((weapon: Item) => {
    if (__DEV__) {
      console.log('[JauntCave] Equip weapon:', weapon.id);
    }
    // Dispatch EQUIP_RANGED_WEAPON action
    if (weapon.id) {
      dispatch({
        type: 'EQUIP_RANGED_WEAPON',
        payload: { id: weapon.id },
      });
    }
    setShowInventory(false);
  }, [dispatch]);

  // Cleanup zap menu timer on unmount
  useEffect(() => {
    return () => {
      if (zapMenuTimerRef.current) {
        clearTimeout(zapMenuTimerRef.current);
        zapMenuTimerRef.current = null;
      }
    };
  }, []);

  return {
    showInventory,
    isZapMenuOpen,
    rangedWeapons,
    equippedWeaponName,
    boltColor,
    handleZapPress,
    handleZapTargetPress,
    handleOpenInventory,
    handleCloseInventory,
    handleSelectWeapon,
  };
}
