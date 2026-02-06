/**
 * Sub-game Registry
 * 
 * Central registry for all sub-game metadata including titles, descriptions,
 * routes, and intro background images. This standardizes sub-game configuration
 * without changing their unique puzzle mechanics.
 */

import { ImageSourcePropType } from 'react-native'

/**
 * Valid sub-game IDs (string slugs)
 * These match the directory names under /app/sub-games/
 */
export type SubGameId = 'aerowreckage-puzzle' | 'hermit-hollow' | 'jaunt-cave' | 'tesseract'

/**
 * Sub-game definition containing metadata and routing information
 */
export interface SubGameDefinition {
  /** Unique identifier matching the sub-game directory name */
  id: SubGameId
  
  /** Full route path to the intro screen */
  introRoute: string
  
  /** Display title for the sub-game */
  title: string
  
  /** Descriptive text about the sub-game */
  description: string
  
  /** Background image for the intro screen */
  introBackgroundImage: ImageSourcePropType
  
  // Optional future fields (typed for forward compatibility)
  /** Rewards granted upon completion */
  rewards?: unknown
  
  /** Flag name in state.subGamesCompleted */
  completionFlag?: string
  
  /** Whether the sub-game can only be played once */
  isOneShot?: boolean
}

/**
 * Central registry of all sub-games
 * Uses SubGameId as keys to ensure type safety
 */
export const SUB_GAMES: Record<SubGameId, SubGameDefinition> = {
  'aerowreckage-puzzle': {
    id: 'aerowreckage-puzzle',
    introRoute: '/sub-games/aerowreckage-puzzle/entry',
    title: 'Aero-Wreckage',
    description:
      'The twisted remnants of a long-lost crashed aerocraft from a forgotten age of the Redoubt. Ancient metal and strange devices lie scattered among the wreckage, relics of a time when humanity soared above the Night Land.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/aerowreck-safe4.webp'),
  },
  
  'hermit-hollow': {
    id: 'hermit-hollow',
    introRoute: '/sub-games/hermit-hollow/main',
    title: 'Hermit',
    description:
      'A lonely hermit sits next to small campfire, safety and peace eminate from him and the small copse of woods around him.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/hermit-screen1.webp'),
  },
  
  'jaunt-cave': {
    id: 'jaunt-cave',
    introRoute: '/sub-games/jaunt-cave/main',
    title: 'Cave of the daemon of the walking shadows',
    description:
      'A sulfur smelling wallow in the Night Lands plains lead to a cave shining with the light from lava. Christos is drawn to it, an aegis of foreboding and necessity upon him. He knows he MUST confront what is inside. Doom and Destiny collide within.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/jaunt-cave-screen1.png'),
  },
  
  'tesseract': {
    id: 'tesseract',
    introRoute: '/sub-games/tesseract/main',
    title: 'Tesseract',
    description:
      'An ancient circle of black stone, steeped in a will that is not its own. Those who seek to command its power gain forbidden knowledge… or vanish without even the mercy of death.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/tesseract-screen1.webp'),
  },
}

/**
 * Get a sub-game definition by ID
 * @param id - The sub-game identifier
 * @returns The sub-game definition
 * @throws Error if the sub-game ID is not found in the registry
 */
export function getSubGameDefinition(id: SubGameId): SubGameDefinition {
  const definition = SUB_GAMES[id]
  if (!definition) {
    throw new Error(
      `Sub-game '${id}' not found in registry. Valid IDs: ${Object.keys(SUB_GAMES).join(', ')}`
    )
  }
  return definition
}
