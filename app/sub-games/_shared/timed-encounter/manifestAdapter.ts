import type {
  EncounterInstanceRoutes,
  EncounterShapeAdapter,
  RewardKind,
  ValidationError,
} from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'
import { TIMED_ENCOUNTER_ASSETS } from './assetCatalog'
import type { JauntCaveEncounterContent, TimedEncounterConfig } from './types'

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const text = (value: unknown) => typeof value === 'string' && value.length > 0

export function validateTimedEncounterRewardId(_id: string, kind: RewardKind): boolean {
  return kind === 'jaunt-crystal-grant'
}

export function createTimedEncounterShapeAdapter(
  assets: Readonly<
    Record<string, import('react-native').ImageSourcePropType>
  > = TIMED_ENCOUNTER_ASSETS
): EncounterShapeAdapter<unknown, TimedEncounterConfig> {
  const adapter: EncounterShapeAdapter<unknown, TimedEncounterConfig> = {
    shapeId: 'timed-encounter',
    routes(instanceId): EncounterInstanceRoutes {
      const base = `/sub-games/jaunt-cave/${instanceId}`
      return { entry: base, success: `${base}/victory`, aftermath: `${base}/aftermath` }
    },
    validateRewardId: validateTimedEncounterRewardId,
    parse(raw) {
      const errors: ValidationError[] = []
      const entry = raw as Partial<JauntCaveEncounterContent>
      const add = (code: string, path: string, message: string) =>
        errors.push({ code, path, message })
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return {
          success: false as const,
          errors: [
            { code: 'invalid-entry', path: '', message: 'Encounter entry must be an object' },
          ],
        }
      }
      if (!text(entry.instanceId) || !ID.test(entry.instanceId!))
        add('invalid-instance-id', 'instanceId', 'instanceId must be lowercase kebab-case')
      if (entry.shapeId !== 'timed-encounter')
        add('unknown-shape-id', 'shapeId', "shapeId must be 'timed-encounter'")
      if (!entry.metadata || !text(entry.metadata.title) || !text(entry.metadata.description))
        add('invalid-metadata', 'metadata', 'title and description are required')
      if (
        !entry.daemon ||
        !text(entry.daemon.name) ||
        !text(entry.daemon.deathMessage) ||
        !text(entry.daemon.killerName)
      )
        add('invalid-daemon-content', 'daemon', 'daemon name and death copy are required')
      if (!entry.narrative || Object.values(entry.narrative).some((value) => !text(value)))
        add('invalid-narrative', 'narrative', 'all narrative strings are required')
      const entrance = entry.metadata?.entrance
      if (
        !entrance ||
        !text(entrance.shortName) ||
        !text(entrance.assetId) ||
        entrance.footprint.width <= 0 ||
        entrance.footprint.height <= 0
      )
        add('invalid-entrance', 'metadata.entrance', 'a valid entrance contract is required')
      const presentation = entry.presentation
      const assetIds = presentation
        ? [
            presentation.introAssetId,
            presentation.battleAssetId,
            presentation.victoryAssetId,
            presentation.defeatAssetId,
            presentation.aftermathAssetId,
            ...Object.values(presentation.daemonSpriteAssetIds),
          ]
        : []
      if (!presentation) add('invalid-presentation', 'presentation', 'presentation is required')
      assetIds.forEach((id, index) => {
        if (!assets[id])
          add(
            'unknown-asset-id',
            `presentation.assets[${index}]`,
            `Unknown timed-encounter assetId '${id}'`
          )
      })
      const lifecycle = entry.lifecycle
      if (
        !lifecycle ||
        lifecycle.reward.kind !== 'jaunt-crystal-grant' ||
        lifecycle.waypoint.createsWaypoint !== false ||
        lifecycle.failure.exit !== 'death'
      )
        add(
          'invalid-lifecycle',
          'lifecycle',
          'timed encounter requires death failure, no waypoint, and jaunt-crystal-grant'
        )
      if (errors.length) return { success: false as const, errors }

      const value = entry as JauntCaveEncounterContent
      const routes = adapter.routes(value.instanceId)
      const sprites = value.presentation.daemonSpriteAssetIds
      return {
        success: true as const,
        value: {
          definition: {
            instanceId: value.instanceId,
            shapeId: 'timed-encounter',
            entryRoute: routes.entry,
            lifecycle: {
              ...(value.lifecycle as SubGameLifecycleConfig),
              aftermathRoute: routes.aftermath,
            },
            title: value.metadata.title,
            description: value.metadata.description,
            introBackgroundImage: assets[value.presentation.introAssetId],
            entrance: {
              shortName: entrance!.shortName,
              category: entrance!.category,
              width: entrance!.footprint.width,
              height: entrance!.footprint.height,
              image: assets[entrance!.assetId],
              active: entrance!.initialActive,
              zIndex: entrance!.zIndex,
              effects: entrance!.effects,
              ctaLabel: entrance!.ctaLabel,
              requiresPlayerOnObject: entrance!.requiresPlayerOnObject,
            },
          },
          shapeConfig: {
            instanceId: value.instanceId,
            title: value.metadata.title,
            description: value.metadata.description,
            daemon: value.daemon,
            narrative: value.narrative,
            presentation: {
              introBackground: assets[value.presentation.introAssetId],
              battleBackground: assets[value.presentation.battleAssetId],
              victoryBackground: assets[value.presentation.victoryAssetId],
              defeatBackground: assets[value.presentation.defeatAssetId],
              aftermathBackground: assets[value.presentation.aftermathAssetId],
              daemonSprites: {
                resting: assets[sprites.resting],
                prep1: assets[sprites.prep1],
                prep2: assets[sprites.prep2],
                landed: assets[sprites.landed],
                attackLeft: assets[sprites.attackLeft],
                attackRight: assets[sprites.attackRight],
              },
              prep1FizzleColor: value.presentation.prep1FizzleColor,
              prep2FizzleColor: value.presentation.prep2FizzleColor,
              vulnerableGlowColor: value.presentation.vulnerableGlowColor,
            },
          },
        },
      }
    },
  }
  return adapter
}
