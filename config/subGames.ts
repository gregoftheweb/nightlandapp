/** Extensible registry for placed sub-game instances. */
import type { ImageSourcePropType } from 'react-native'
import type {
  SubGameEntranceDefinition,
  SubGameLifecycleConfig,
  SubGameShapeId,
} from './types/subGames'

import aeroWreckageIMG from '@assets/images/sprites/buildings/aero-wreckage.webp'
import tesseractIMG from '@assets/images/sprites/buildings/tesseract-puzzle1.webp'
import hermitIMG from '@assets/images/backgrounds/subgames/hermit/hermit-save2.webp'
import jauntCaveIMG from '@assets/images/sprites/buildings/jaunt-cave.webp'
import deepSiloIMG from '@assets/images/sprites/buildings/silo.webp'

export type SubGameInstanceId = string

export const SUB_GAME_SHAPES: ReadonlySet<SubGameShapeId> = new Set([
  'dialogue',
  'word-grid',
  'one-off',
])

export interface SubGameInstanceDefinition {
  instanceId: SubGameInstanceId
  shapeId: SubGameShapeId
  entryRoute: string
  lifecycle: SubGameLifecycleConfig
  title: string
  description: string
  introBackgroundImage: ImageSourcePropType
  entrance?: SubGameEntranceDefinition
}

export interface SubGameRegistryReferences {
  completion?: readonly string[]
  reward?: readonly string[]
  waypoint?: readonly string[]
}

export function createSubGameRegistry(
  definitions: readonly SubGameInstanceDefinition[],
  registeredShapes: ReadonlySet<string> = SUB_GAME_SHAPES,
  references: SubGameRegistryReferences = {}
): Record<string, SubGameInstanceDefinition> {
  const registry: Record<string, SubGameInstanceDefinition> = {}

  for (const definition of definitions) {
    if (registry[definition.instanceId]) {
      throw new Error(`Duplicate sub-game instanceId '${definition.instanceId}'`)
    }
    if (!registeredShapes.has(definition.shapeId)) {
      throw new Error(
        `Sub-game instance '${definition.instanceId}' references unregistered shapeId '${definition.shapeId}'`
      )
    }
    registry[definition.instanceId] = definition
  }

  for (const [kind, keys] of Object.entries(references)) {
    for (const instanceId of keys ?? []) {
      if (!registry[instanceId]) {
        throw new Error(`${kind} key '${instanceId}' does not match a registered instanceId`)
      }
    }
  }
  return registry
}

const returnsNormally = { signalRpgResume: true, exitSubGame: true } as const

const definitions: SubGameInstanceDefinition[] = [
  {
    instanceId: 'aerowreckage-puzzle',
    shapeId: 'one-off',
    entryRoute: '/sub-games/aerowreckage-puzzle/entry',
    lifecycle: {
      completion: {
        event: 'Player confirms Return to Quest on the success screen',
        idempotent: true,
      },
      failure: { exit: 'safe' },
      waypoint: { createsWaypoint: false },
      revisit: 'resume',
      progress: {
        mode: 'async-storage',
        saveKey: 'aerowreckage-puzzle',
        version: 1,
        clearOnCompletion: false,
      },
      reward: {
        kind: 'weapon',
        id: 'weapon-lazer-pistol-001',
        grantEvent: 'First success-screen entry',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Aero-Wreckage',
    description:
      'The twisted remnants of a long-lost crashed aerocraft from a forgotten age of the Redoubt. Ancient metal and strange devices lie scattered among the wreckage, relics of a time when humanity soared above the Night Land.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe4.webp'),
    entrance: {
      shortName: 'aeroWreckage',
      category: 'building',
      width: 4,
      height: 4,
      image: aeroWreckageIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Investigate',
      requiresPlayerOnObject: true,
    },
  },
  {
    instanceId: 'deep-silo',
    shapeId: 'one-off',
    entryRoute: '/sub-games/deep-silo/screen1',
    lifecycle: {
      completion: { event: 'Not yet implemented; Deep Silo is unfinished', idempotent: true },
      failure: { exit: 'safe' },
      waypoint: { createsWaypoint: false },
      revisit: 'restart',
      progress: { mode: 'local-only' },
      reward: { kind: 'none' },
      returnToRpg: returnsNormally,
    },
    title: 'Deep Silo',
    description:
      'A massive silo rises from the Night Land, its dark interior an unknown descent into the deep.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen1.webp'),
    entrance: {
      shortName: 'deepSilo',
      category: 'building',
      width: 4,
      height: 4,
      image: deepSiloIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Enter the silo',
      requiresPlayerOnObject: true,
    },
  },
  {
    instanceId: 'hermit-hollow',
    shapeId: 'dialogue',
    entryRoute: '/sub-games/hermit-hollow/main',
    lifecycle: {
      completion: { event: 'Entering silence_end applies hermit_enters_trance', idempotent: true },
      failure: { exit: 'safe' },
      waypoint: {
        createsWaypoint: true,
        waypointName: 'hermit-hollow waypoint',
        snapshot: 'All dialogue flags and the hide unlock',
        idempotent: true,
      },
      revisit: 'resume',
      progress: { mode: 'local-only' },
      reward: {
        kind: 'ability',
        id: 'unlock_hide_ability',
        grantEvent: 'Entering silence_end',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Hermit',
    description:
      'A lonely hermit sits next to small campfire, safety and peace emanate from him and the small copse of woods around him.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/hermit/hermit-screen1.webp'),
    entrance: {
      shortName: 'hermit',
      category: 'building',
      width: 4,
      height: 4,
      image: hermitIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'recuperate', value: 10 }, { type: 'hide' }],
      ctaLabel: 'Rest awhile',
      requiresPlayerOnObject: true,
    },
  },
  {
    instanceId: 'jaunt-cave',
    shapeId: 'one-off',
    entryRoute: '/sub-games/jaunt-cave/main',
    lifecycle: {
      completion: { event: 'Player confirms return from the victory screen', idempotent: true },
      failure: {
        exit: 'death',
        message: 'The Jaunt Daemon has slain Christos.',
        killerName: 'Jaunt Daemon',
        suppressDeathDialog: false,
        deathRoute: '/death',
      },
      waypoint: {
        createsWaypoint: true,
        waypointName: 'jaunt-cave',
        snapshot: 'Completion, Jaunt unlock, charges, and related player state',
        idempotent: true,
      },
      revisit: 'aftermath-screen',
      progress: { mode: 'local-only' },
      reward: {
        kind: 'ability',
        id: 'jaunt',
        grantEvent: 'Player confirms victory',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Cave of the daemon of the walking shadows',
    description:
      'A sulfur smelling wallow in the Night Lands plains lead to a cave shining with the light from lava. Christos is drawn to it, an aegis of foreboding and necessity upon him. He knows he MUST confront what is inside. Doom and Destiny collide within.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen1.webp'),
    entrance: {
      shortName: 'jauntCave',
      category: 'building',
      width: 4,
      height: 4,
      image: jauntCaveIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Enter the cave',
      requiresPlayerOnObject: true,
    },
  },
  {
    instanceId: 'tesseract-crypt-01',
    shapeId: 'word-grid',
    entryRoute: '/sub-games/tesseract/main',
    lifecycle: {
      completion: {
        event: 'Player presses return to the Night Land on the success screen',
        idempotent: true,
      },
      failure: {
        exit: 'death',
        message: 'Christos failed to guess the right word.',
        killerName: 'Ancient Evil',
        suppressDeathDialog: true,
        deathRoute: '/death',
      },
      waypoint: { createsWaypoint: false },
      revisit: 'success-screen',
      progress: { mode: 'local-only' },
      reward: {
        kind: 'item',
        id: 'persius-scroll',
        grantEvent: 'First entry to the success screen',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Tesseract',
    description:
      'An ancient circle of black stone, steeped in a will that is not its own. Those who seek to command its power gain forbidden knowledge… or vanish without even the mercy of death.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/tesseract/tesseract-screen1.webp'),
    entrance: {
      shortName: 'tesseract',
      category: 'building',
      width: 6,
      height: 6,
      image: tesseractIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Investigate',
      requiresPlayerOnObject: true,
    },
  },
]

export const SUB_GAMES = createSubGameRegistry(definitions, SUB_GAME_SHAPES, {
  completion: definitions.map(({ instanceId }) => instanceId),
  reward: definitions.map(({ instanceId }) => instanceId),
  waypoint: definitions.map(({ instanceId }) => instanceId),
})

export function getSubGameDefinition(instanceId: string): SubGameInstanceDefinition {
  const definition = SUB_GAMES[instanceId]
  if (!definition) throw new Error(`Sub-game instance '${instanceId}' is not registered`)
  return definition
}

export function isRegisteredSubGameInstance(instanceId: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUB_GAMES, instanceId)
}
