import type {
  EncounterInstanceRoutes,
  EncounterShapeAdapter,
  ParsedEncounter,
  RewardKind,
  ValidationError,
  ValidationResult,
} from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'
import { validateWordGridRewardId } from '../word-grid/manifestAdapter'

import { CURRENT_LOOM_ASSETS, type CurrentLoomAssetCatalog } from './assetCatalog'
import type { CurrentLoomEncounterContent } from './content'
import type { CurrentLoomConfig } from './types'

type UnknownRecord = Record<string, unknown>
const INSTANCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REWARD_KINDS = new Set<RewardKind>(['item', 'weapon', 'effect', 'ability'])
const ENTRANCE_EFFECT_TYPES = new Set([
  'heal',
  'recuperate',
  'hide',
  'cloaking',
  'swarm',
  'soulsuck',
  'poison',
  'showMessage',
  'unlock_hide_ability',
  'unlock_rune_cipher',
  'stun',
  'teleport',
  'spawn',
])

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const add = (errors: ValidationError[], code: string, path: string, message: string) =>
  errors.push({ code, path, message })

function requiredText(value: unknown, path: string, errors: ValidationError[]) {
  if (!isText(value)) add(errors, 'invalid-required-text', path, `${path} must be non-empty`)
}

export function validateCurrentLoomRewardId(id: string, kind: RewardKind): boolean {
  return REWARD_KINDS.has(kind) && validateWordGridRewardId(id, kind)
}

function validateEntrance(value: unknown, errors: ValidationError[]) {
  if (!isRecord(value)) {
    add(errors, 'invalid-entrance', 'metadata.entrance', 'entrance must be an object')
    return
  }
  requiredText(value.shortName, 'metadata.entrance.shortName', errors)
  requiredText(value.category, 'metadata.entrance.category', errors)
  requiredText(value.assetId, 'metadata.entrance.assetId', errors)
  requiredText(value.ctaLabel, 'metadata.entrance.ctaLabel', errors)
  if (typeof value.initialActive !== 'boolean')
    add(
      errors,
      'invalid-entrance-active',
      'metadata.entrance.initialActive',
      'initialActive must be boolean'
    )
  if (!isNumber(value.zIndex))
    add(errors, 'invalid-entrance-z-index', 'metadata.entrance.zIndex', 'zIndex must be finite')
  if (typeof value.requiresPlayerOnObject !== 'boolean')
    add(
      errors,
      'invalid-entrance-launch-policy',
      'metadata.entrance.requiresPlayerOnObject',
      'requiresPlayerOnObject must be boolean'
    )
  const footprint = value.footprint
  if (
    !isRecord(footprint) ||
    !isNumber(footprint.width) ||
    !isNumber(footprint.height) ||
    footprint.width <= 0 ||
    footprint.height <= 0
  ) {
    add(
      errors,
      'invalid-entrance-footprint',
      'metadata.entrance.footprint',
      'footprint dimensions must be positive'
    )
  }
  if (value.effects !== undefined) {
    if (!Array.isArray(value.effects)) {
      add(
        errors,
        'invalid-entrance-effects',
        'metadata.entrance.effects',
        'effects must be an array'
      )
    } else {
      value.effects.forEach((effect, index) => {
        if (
          !isRecord(effect) ||
          typeof effect.type !== 'string' ||
          !ENTRANCE_EFFECT_TYPES.has(effect.type)
        ) {
          add(
            errors,
            'invalid-entrance-effect',
            `metadata.entrance.effects[${index}]`,
            'unsupported entrance effect'
          )
        }
      })
    }
  }
}

function validateLifecycle(
  value: unknown,
  rewardValidator: (id: string, kind: RewardKind) => boolean,
  errors: ValidationError[]
) {
  if (!isRecord(value)) {
    add(errors, 'invalid-lifecycle', 'lifecycle', 'lifecycle must be an object')
    return
  }
  const completion = value.completion
  if (!isRecord(completion))
    add(errors, 'missing-lifecycle-field', 'lifecycle.completion', 'completion is required')
  else {
    if (completion.event !== 'success-confirmed')
      add(
        errors,
        'invalid-completion-trigger',
        'lifecycle.completion.event',
        "event must be 'success-confirmed'"
      )
    if (completion.idempotent !== true)
      add(
        errors,
        'invalid-idempotency',
        'lifecycle.completion.idempotent',
        'completion must be idempotent'
      )
  }
  const failure = value.failure
  if (!isRecord(failure) || failure.exit !== 'safe')
    add(errors, 'invalid-failure-policy', 'lifecycle.failure', 'Current-Loom failure must be safe')
  const waypoint = value.waypoint
  if (!isRecord(waypoint) || waypoint.createsWaypoint !== false)
    add(
      errors,
      'invalid-waypoint-policy',
      'lifecycle.waypoint',
      'Current-Loom must not create a waypoint'
    )
  if (value.revisit !== 'success-screen')
    add(
      errors,
      'invalid-revisit-policy',
      'lifecycle.revisit',
      'Current-Loom revisit must use success-screen'
    )
  const progress = value.progress
  if (!isRecord(progress) || progress.mode !== 'local-only')
    add(
      errors,
      'invalid-progress-policy',
      'lifecycle.progress',
      'Current-Loom progress must be local-only'
    )
  const reward = value.reward
  if (!isRecord(reward) || typeof reward.kind !== 'string') {
    add(errors, 'missing-lifecycle-field', 'lifecycle.reward', 'reward is required')
  } else if (reward.kind !== 'none') {
    const kind = reward.kind as RewardKind
    if (!REWARD_KINDS.has(kind))
      add(errors, 'unsupported-reward-kind', 'lifecycle.reward.kind', 'unsupported reward kind')
    else if (!isText(reward.id) || !rewardValidator(reward.id, kind))
      add(errors, 'unknown-reward-id', 'lifecycle.reward.id', 'reward id is not registered')
    if (reward.grantEvent !== 'success-screen-entered' && reward.grantEvent !== 'success-confirmed')
      add(
        errors,
        'invalid-reward-trigger',
        'lifecycle.reward.grantEvent',
        'unsupported reward trigger'
      )
    if (reward.idempotent !== true)
      add(errors, 'invalid-idempotency', 'lifecycle.reward.idempotent', 'reward must be idempotent')
  }
  const returns = value.returnToRpg
  if (!isRecord(returns) || returns.signalRpgResume !== true || returns.exitSubGame !== true) {
    add(
      errors,
      'missing-lifecycle-field',
      'lifecycle.returnToRpg',
      'normal return must signal and exit'
    )
  }
}

function validatePresentation(value: unknown, errors: ValidationError[]) {
  if (!isRecord(value)) {
    add(errors, 'invalid-presentation', 'presentation', 'presentation must be an object')
    return
  }
  const required: Record<string, readonly string[]> = {
    intro: ['assetId', 'text', 'leaveLabel', 'startLabel'],
    puzzle: ['assetId', 'instructionText', 'leaveLabel', 'holdLabel'],
    hazard: ['assetId', 'text'],
    success: ['assetId', 'firstVisitText', 'revisitText', 'returnLabel'],
  }
  Object.entries(required).forEach(([section, keys]) => {
    const target = value[section]
    if (!isRecord(target)) {
      add(errors, 'missing-presentation-field', `presentation.${section}`, `${section} is required`)
      return
    }
    keys.forEach((key) => requiredText(target[key], `presentation.${section}.${key}`, errors))
  })
}

function assetReferences(entry: UnknownRecord): { path: string; value: unknown }[] {
  const metadata = isRecord(entry.metadata) ? entry.metadata : {}
  const entrance = isRecord(metadata.entrance) ? metadata.entrance : {}
  const presentation = isRecord(entry.presentation) ? entry.presentation : {}
  const intro = isRecord(presentation.intro) ? presentation.intro : {}
  const puzzle = isRecord(presentation.puzzle) ? presentation.puzzle : {}
  const hazard = isRecord(presentation.hazard) ? presentation.hazard : {}
  const success = isRecord(presentation.success) ? presentation.success : {}
  return [
    { path: 'metadata.entrance.assetId', value: entrance.assetId },
    { path: 'presentation.intro.assetId', value: intro.assetId },
    { path: 'presentation.puzzle.assetId', value: puzzle.assetId },
    { path: 'presentation.hazard.assetId', value: hazard.assetId },
    { path: 'presentation.success.assetId', value: success.assetId },
  ]
}

export interface CurrentLoomAdapterOptions {
  assets?: CurrentLoomAssetCatalog
  validateReward?: (id: string, kind: RewardKind) => boolean
}

export function createCurrentLoomShapeAdapter(
  options: CurrentLoomAdapterOptions = {}
): EncounterShapeAdapter<unknown, CurrentLoomConfig> {
  const assets = options.assets ?? CURRENT_LOOM_ASSETS
  const rewardValidator = options.validateReward ?? validateCurrentLoomRewardId
  const adapter: EncounterShapeAdapter<unknown, CurrentLoomConfig> = {
    shapeId: 'current-loom',
    routes(instanceId): EncounterInstanceRoutes {
      const base = `/sub-games/current-loom/${instanceId}`
      return { entry: base, success: `${base}/success` }
    },
    validateRewardId: rewardValidator,
    parse(entry): ValidationResult<ParsedEncounter<CurrentLoomConfig>> {
      const errors: ValidationError[] = []
      if (!isRecord(entry))
        return {
          success: false,
          errors: [
            { code: 'invalid-entry', path: '', message: 'Encounter entry must be an object' },
          ],
        }
      const instanceId = typeof entry.instanceId === 'string' ? entry.instanceId : ''
      if (!INSTANCE_ID_PATTERN.test(instanceId))
        add(errors, 'invalid-instance-id', 'instanceId', 'instanceId must be lowercase kebab-case')
      if (entry.shapeId !== 'current-loom')
        add(errors, 'unknown-shape-id', 'shapeId', "shapeId must be 'current-loom'")
      const metadata = isRecord(entry.metadata) ? entry.metadata : null
      if (!metadata) add(errors, 'invalid-metadata', 'metadata', 'metadata must be an object')
      else {
        requiredText(metadata.title, 'metadata.title', errors)
        requiredText(metadata.description, 'metadata.description', errors)
        validateEntrance(metadata.entrance, errors)
      }
      const content = isRecord(entry.content) ? entry.content : null
      if (!content || !Array.isArray(content.channelLabels) || content.channelLabels.length !== 5) {
        add(
          errors,
          'invalid-channel-labels',
          'content.channelLabels',
          'exactly five channel labels are required'
        )
      } else {
        content.channelLabels.forEach((label, index) =>
          requiredText(label, `content.channelLabels[${index}]`, errors)
        )
      }
      validateLifecycle(entry.lifecycle, rewardValidator, errors)
      validatePresentation(entry.presentation, errors)
      assetReferences(entry).forEach((reference) => {
        if (isText(reference.value) && !assets[reference.value])
          add(
            errors,
            'unknown-asset-id',
            reference.path,
            `Unknown Current-Loom assetId '${reference.value}'`
          )
      })
      if (errors.length) return { success: false, errors }

      const value = entry as unknown as CurrentLoomEncounterContent
      const routes = adapter.routes(value.instanceId)
      const entranceAsset = assets[value.metadata.entrance.assetId]
      const introAsset = assets[value.presentation.intro.assetId]
      const puzzleAsset = assets[value.presentation.puzzle.assetId]
      const hazardAsset = assets[value.presentation.hazard.assetId]
      const successAsset = assets[value.presentation.success.assetId]
      return {
        success: true,
        value: {
          definition: {
            instanceId: value.instanceId,
            shapeId: 'current-loom',
            entryRoute: routes.entry,
            lifecycle: value.lifecycle as SubGameLifecycleConfig,
            title: value.metadata.title,
            description: value.metadata.description,
            introBackgroundImage: introAsset.image,
            entrance: {
              shortName: value.metadata.entrance.shortName,
              category: value.metadata.entrance.category,
              width: value.metadata.entrance.footprint.width,
              height: value.metadata.entrance.footprint.height,
              image: entranceAsset.image,
              active: value.metadata.entrance.initialActive,
              zIndex: value.metadata.entrance.zIndex,
              effects: value.metadata.entrance.effects,
              ctaLabel: value.metadata.entrance.ctaLabel,
              requiresPlayerOnObject: value.metadata.entrance.requiresPlayerOnObject,
            },
          },
          shapeConfig: {
            instanceId: value.instanceId,
            channelLabels: value.content.channelLabels,
            puzzleRoute: `${routes.entry}/puzzle`,
            successRoute: routes.success!,
            presentation: {
              intro: { backgroundAsset: introAsset.image, ...value.presentation.intro },
              puzzle: {
                boardAsset: puzzleAsset.image,
                instructionText: value.presentation.puzzle.instructionText,
                leaveLabel: value.presentation.puzzle.leaveLabel,
                holdLabel: value.presentation.puzzle.holdLabel,
              },
              hazard: { overlayAsset: hazardAsset.image, text: value.presentation.hazard.text },
              success: {
                backgroundAsset: successAsset.image,
                firstVisitText: value.presentation.success.firstVisitText,
                revisitText: value.presentation.success.revisitText,
                returnLabel: value.presentation.success.returnLabel,
              },
            },
          },
        },
      }
    },
  }
  return adapter
}

export function validateCurrentLoomContent(
  content: unknown,
  options: CurrentLoomAdapterOptions = {}
): ValidationResult<ParsedEncounter<CurrentLoomConfig>> {
  return createCurrentLoomShapeAdapter(options).parse(content)
}

export const currentLoomShapeAdapter = createCurrentLoomShapeAdapter()
