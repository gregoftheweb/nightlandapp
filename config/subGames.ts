/** Extensible registry for placed sub-game instances. */
import type { ImageSourcePropType } from 'react-native'
import type {
  SubGameEntranceDefinition,
  SubGameLifecycleConfig,
  SubGameShapeId,
} from './types/subGames'
import type { ImagePreloadAsset } from './types/imagePreload'

import aeroWreckageIMG from '@assets/images/sprites/buildings/aero-wreckage.webp'
import hermitIMG from '@assets/images/backgrounds/subgames/hermit/hermit-save2.webp'
import deepSiloIMG from '@assets/images/sprites/buildings/silo.webp'
import { parsedTimedEncounterContentResult } from '@/app/sub-games/_shared/timed-encounter/contentCatalog'

export type SubGameInstanceId = string

export const SUB_GAME_SHAPES: ReadonlySet<SubGameShapeId> = new Set([
  'dialogue',
  'word-grid',
  'timed-encounter',
  'current-loom',
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
  /** Complete set of images rendered after entering legacy registry-authored encounters. */
  preloadAssets?: readonly ImagePreloadAsset[]
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
    preloadAssets: [
      {
        id: 'aerowreck-safe1',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe1.webp'),
        width: 256,
        height: 384,
      },
      {
        id: 'aerowreck-safe2',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe2.webp'),
        width: 256,
        height: 384,
      },
      {
        id: 'aerowreck-safe3',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe3.webp'),
        width: 256,
        height: 384,
      },
      {
        id: 'aerowreck-safe4',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe4.webp'),
        width: 256,
        height: 256,
      },
      {
        id: 'aerowreck-safe5',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe5.webp'),
        width: 256,
        height: 256,
      },
      {
        id: 'aerowreck-safe6',
        source: require('@assets/images/backgrounds/subgames/aerowreckage/aerowreck-safe6.webp'),
        width: 256,
        height: 384,
      },
      {
        id: 'safe-dial-cc',
        source: require('@assets/images/ui/icons/safe-dial-CC.webp'),
        width: 394,
        height: 334,
      },
      {
        id: 'safe-dial-clockwise',
        source: require('@assets/images/ui/icons/safe-dial-Clockwise.webp'),
        width: 394,
        height: 334,
      },
    ],
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
      completion: {
        event: 'Charged Discos has been retrieved and Return to the Redoubt is confirmed',
        idempotent: true,
      },
      failure: { exit: 'safe' },
      waypoint: {
        createsWaypoint: true,
        waypointName: 'Deep Silo Restored',
        snapshot:
          'Deep Silo completion, Discos weapon upgrade, and persius-note-2 inventory possession',
        idempotent: true,
      },
      revisit: 'aftermath-screen',
      aftermathRoute: '/sub-games/deep-silo/screen8',
      progress: {
        mode: 'async-storage',
        saveKey: 'deep-silo-power-puzzle',
        version: 1,
        clearOnCompletion: false,
      },
      reward: {
        kind: 'weapon-upgrade',
        weaponId: 'weapon-discos-001',
        damageMultiplier: 2,
        hitBonusAdd: 2,
        grantEvent: 'Return to the Redoubt after retrieving the charged Discos',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Deep Silo',
    description:
      'A massive silo rises from the Night Land, its dark interior an unknown descent into the deep.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/deep-silo/silo-entrance-approach.webp'),
    preloadAssets: [
      {
        id: 'silo-entrance-approach',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-entrance-approach.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-entrance-open',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-entrance-open.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-lever-1',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-1.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-lever-2',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-2.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-lever-3',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-3.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-lever-4',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-4.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-lever-5',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-lever-5.webp'),
        width: 896,
        height: 1200,
      },
      {
        id: 'silo-screen2',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen2.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-screen3',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen3.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-screen4',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen4.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-screen5',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen5.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-screen6-table-empty',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen6-table-empty.webp'),
        width: 843,
        height: 1264,
      },
      {
        id: 'silo-screen6-table-charging',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen6-table-charging.webp'),
        width: 843,
        height: 1264,
      },
      {
        id: 'silo-screen6-spark',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen6-spark.webp'),
        width: 1024,
        height: 1535,
      },
      {
        id: 'silo-screen7',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen7.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-screen8',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-screen8.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-power-switch1',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch1.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-power-switch2',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch2.webp'),
        width: 1024,
        height: 1536,
      },
      {
        id: 'silo-power-switch3',
        source: require('@assets/images/backgrounds/subgames/deep-silo/silo-power-switch3.webp'),
        width: 1024,
        height: 1536,
      },
    ],
    entrance: {
      shortName: 'deepSilo',
      category: 'building',
      width: 4,
      height: 4,
      image: deepSiloIMG,
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Approach the silo',
      requiresPlayerOnObject: true,
    },
  },
  {
    instanceId: 'rune-obelisk',
    shapeId: 'one-off',
    entryRoute: '/sub-games/rune-obelisk/entrance',
    lifecycle: {
      completion: {
        event: 'All three rune categories align and Return to the Night Land is confirmed',
        idempotent: true,
      },
      failure: { exit: 'safe' },
      waypoint: {
        createsWaypoint: true,
        waypointName: 'Rune Obelisk Awakened',
        snapshot: 'Rune Obelisk completion, runeCipherLearned, and unlock reward grant',
        idempotent: true,
      },
      revisit: 'aftermath-screen',
      aftermathRoute: '/sub-games/rune-obelisk/aftermath',
      progress: { mode: 'local-only' },
      reward: {
        kind: 'ability',
        id: 'unlock_rune_cipher',
        grantEvent: 'All three rune categories align simultaneously',
        idempotent: true,
      },
      returnToRpg: returnsNormally,
    },
    title: 'Rune-Inscribed Obelisk',
    description:
      'A weathered stone obelisk bears paired tablets of runes and letters above an ancient dial.',
    introBackgroundImage: require('@assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp'),
    preloadAssets: [
      {
        id: 'obelisk-entrance',
        source: require('@assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp'),
        width: 1408,
        height: 768,
      },
      {
        id: 'obelisk-plain',
        source: require('@assets/images/backgrounds/subgames/rosseta/obelisk-plain.webp'),
        width: 1024,
        height: 1024,
      },
      {
        id: 'obelisk-electric',
        source: require('@assets/images/backgrounds/subgames/rosseta/obelisk-electric.webp'),
        width: 1024,
        height: 1024,
      },
    ],
    entrance: {
      shortName: 'runeObelisk',
      category: 'building',
      width: 4,
      height: 4,
      image: require('@assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp'),
      active: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Study the runes',
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
    preloadAssets: [
      {
        id: 'hermit-screen1',
        source: require('@assets/images/backgrounds/subgames/hermit/hermit-screen1.webp'),
        width: 256,
        height: 384,
      },
    ],
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
]

if (!parsedTimedEncounterContentResult.success) {
  throw new Error('Parsed timed-encounter catalog is invalid')
}
const registeredDefinitions = [
  ...definitions,
  ...Object.values(parsedTimedEncounterContentResult.value).map(({ definition }) => definition),
]

export const SUB_GAMES = createSubGameRegistry(registeredDefinitions, SUB_GAME_SHAPES, {
  completion: registeredDefinitions.map(({ instanceId }) => instanceId),
  reward: registeredDefinitions.map(({ instanceId }) => instanceId),
  waypoint: registeredDefinitions.map(({ instanceId }) => instanceId),
})

export function getSubGameDefinition(instanceId: string): SubGameInstanceDefinition {
  const definition = SUB_GAMES[instanceId]
  if (!definition) throw new Error(`Sub-game instance '${instanceId}' is not registered`)
  return definition
}

export function isRegisteredSubGameInstance(instanceId: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUB_GAMES, instanceId)
}
