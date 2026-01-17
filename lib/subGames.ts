// lib/subGames.ts
// Sub-game navigation and coordination helper

import { router } from 'expo-router';
import { SubGameResult } from '@/config/types';

/**
 * Enter a sub-game by navigating to its route
 * @param subGameName - The name of the sub-game directory under /sub-games/
 * @param context - Optional context data (e.g., objectId)
 */
export function enterSubGame(subGameName: string, context?: { objectId?: string }) {
  if (__DEV__) {
    console.log(`[SubGames] Entering sub-game: ${subGameName}`, context);
  }
  
  // Navigate to the sub-game route
  router.push(`/sub-games/${subGameName}` as any);
}

/**
 * Exit a sub-game and return to the RPG
 * @param result - Optional result data from the sub-game
 */
export function exitSubGame(result?: SubGameResult) {
  if (__DEV__) {
    console.log('[SubGames] Exiting sub-game', result);
  }
  
  // Navigate back to the game
  router.back();
}

/**
 * Signal the RPG to refresh/resume after returning from a sub-game
 * This is handled via the resume nonce in GameContext
 */
export function signalRpgResume() {
  if (__DEV__) {
    console.log('[SubGames] Signaling RPG resume');
  }
  // The resume signal is managed by incrementing resumeNonce in GameContext
  // This will be triggered by the sub-game when it exits
}
