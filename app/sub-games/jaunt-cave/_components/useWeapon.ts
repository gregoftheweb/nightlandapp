// app/sub-games/jaunt-cave/_components/useWeapon.ts
// Custom hook for managing weapon actions and interactions

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Item, GameState } from '@config/types';
import { DaemonState } from './useBattleState';
import { HIT_INDICATOR_CONFIG } from './HitIndicator';

const DEFAULT_BOLT_COLOR = '#990000'; // Fallback color when no weapon equipped

// Zap target positions (percentage of arena dimensions)
// These are independent of daemon spawn positions and can be tweaked independently
// Values are percentages (0.0 to 1.0) of arena width/height
// Adjust these values to fine-tune where projectiles hit
// They are initially set to match daemon spawn positions but can be adjusted as needed
export const ZAP_TARGETS = {
  left: { x: 0.2, y: 0.37 },    // Left target position
  center: { x: 0.5, y: 0.38 },   // Center target position  
  right: { x: 0.8, y: 0.38 },    // Right target position
} as const;

export interface UseWeaponProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>; // GameAction type not exported from context
  arenaSize: { width: number; height: number } | null;
  onSetFeedback: (message: string) => void;
  onFireProjectile: (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => void;
  getDaemonState: () => DaemonState;
  getCurrentDaemonPosition: () => 'left' | 'center' | 'right';
  projectileDuration: number; // Duration of projectile flight
}

export interface UseWeaponReturn {
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
  closeZapMenu: () => void;
  hitIndicator: { position: { x: number; y: number }; type: 'hit' | 'block' } | null;
}

export function useWeapon(props: UseWeaponProps): UseWeaponReturn {
  const {
    gameState,
    dispatch,
    arenaSize,
    onSetFeedback,
    onFireProjectile,
    getDaemonState,
    getCurrentDaemonPosition,
    projectileDuration,
  } = props;

  // Inventory modal state
  const [showInventory, setShowInventory] = useState(false);
  
  // Zap menu state
  const [isZapMenuOpen, setIsZapMenuOpen] = useState(false);
  const zapMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hit indicator state
  const [hitIndicator, setHitIndicator] = useState<{ position: { x: number; y: number }; type: 'hit' | 'block' } | null>(null);

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
    if (arenaSize) {
      // Calculate start point (bottom center of arena)
      const startX = arenaSize.width / 2;
      const startY = arenaSize.height - 20;
      
      // Calculate target position directly from arena size
      const targetPos = ZAP_TARGETS[target];
      const endX = arenaSize.width * targetPos.x;
      const endY = arenaSize.height * targetPos.y;
      
      // Fire projectile first
      onFireProjectile({ x: startX, y: startY }, { x: endX, y: endY }, boltColor);

      // After projectile flight completes, show hit indicator
      setTimeout(() => {
        // Determine if this is a hit or block
        const daemonState = getDaemonState();
        const daemonPosition = getCurrentDaemonPosition();
        const isHit = daemonState === DaemonState.LANDED && daemonPosition === target;

        // Show indicator at target location
        setHitIndicator({
          position: { x: endX, y: endY },
          type: isHit ? 'hit' : 'block',
        });

        // Clear indicator after its animation finishes
        setTimeout(() => {
          setHitIndicator(null);
        }, HIT_INDICATOR_CONFIG.DURATION + HIT_INDICATOR_CONFIG.FADE_OUT_DURATION);
      }, projectileDuration);
    }
    
    if (__DEV__) {
      console.log('[JauntCave] Zap target selected:', target);
    }
  }, [arenaSize, onSetFeedback, onFireProjectile, boltColor, getDaemonState, getCurrentDaemonPosition, projectileDuration]);

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

  // Close zap menu method (for external control, e.g., when blocking)
  const closeZapMenu = useCallback(() => {
    setIsZapMenuOpen(false);
  }, []);

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
    closeZapMenu,
    hitIndicator,
  };
}
