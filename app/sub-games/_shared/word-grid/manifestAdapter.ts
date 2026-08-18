import { collectible } from '@config/objects'
import type {
  EncounterInstanceRoutes,
  EncounterShapeAdapter,
  ParsedEncounter,
  RewardKind,
  ValidationError,
  ValidationResult,
} from '@config/types/encounters'
import type { SubGameLifecycleConfig } from '@config/types/subGames'
import { weaponsCatalog } from '@config/weapons'

import type { WordGridConfig } from './types'
import type { WordGridEncounterContent } from './content'
import { WORD_GRID_ASSETS, type WordGridAssetCatalog } from './assetCatalog'

const INSTANCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UPPERCASE_ASCII_PATTERN = /^[A-Z]+$/
const REVISIT_POLICIES = new Set([
  'restart',
  'resume',
  'success-screen',
  'aftermath-screen',
  'unavailable',
])
const REWARD_KINDS = new Set<RewardKind>(['item', 'weapon', 'effect', 'ability'])
const WORD_GRID_EFFECT_REWARDS = new Set(['hide', 'soulsuck'])
const WORD_GRID_ABILITY_REWARDS = new Set(['unlock_hide_ability', 'jaunt'])
type UnknownRecord = Record<string, unknown>

export interface WordGridAdapterOptions {
  assets?: WordGridAssetCatalog
  validateReward?: (id: string, kind: RewardKind) => boolean
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function addError(errors: ValidationError[], code: string, path: string, message: string): void {
  errors.push({ code, path, message })
}

function validateRequiredText(
  value: unknown,
  path: string,
  errors: ValidationError[],
  code = 'invalid-required-text'
): value is string {
  if (isNonEmptyString(value)) return true
  addError(errors, code, path, `${path} must be a non-empty string`)
  return false
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

export function validateWordGridRewardId(id: string, kind: RewardKind): boolean {
  if (kind === 'weapon') return weaponsCatalog.some((weapon) => weapon.id === id)
  if (kind === 'effect') return WORD_GRID_EFFECT_REWARDS.has(id)
  if (kind === 'ability') return WORD_GRID_ABILITY_REWARDS.has(id)

  return Object.entries(collectible).some(
    ([key, candidate]) =>
      candidate.id === id ||
      candidate.shortName === id ||
      toKebabCase(key) === id ||
      (candidate.shortName ? toKebabCase(candidate.shortName) === id : false)
  )
}

function validateLifecycle(
  value: unknown,
  instanceId: string,
  validateReward: (id: string, kind: RewardKind) => boolean,
  errors: ValidationError[]
): void {
  if (!isRecord(value)) {
    addError(errors, 'invalid-lifecycle', 'lifecycle', 'lifecycle must be an object')
    return
  }

  const completion = value.completion
  if (!isRecord(completion)) {
    addError(errors, 'missing-lifecycle-field', 'lifecycle.completion', 'completion is required')
  } else {
    if (completion.event !== 'success-confirmed') {
      addError(
        errors,
        'invalid-completion-trigger',
        'lifecycle.completion.event',
        "Word-grid completion event must be 'success-confirmed'"
      )
    }
    if (completion.idempotent !== true) {
      addError(
        errors,
        'invalid-idempotency',
        'lifecycle.completion.idempotent',
        'Completion must declare idempotent: true'
      )
    }
  }

  const failure = value.failure
  if (!isRecord(failure)) {
    addError(errors, 'missing-lifecycle-field', 'lifecycle.failure', 'failure is required')
  } else if (failure.exit !== 'safe' && failure.exit !== 'death') {
    addError(errors, 'invalid-failure-policy', 'lifecycle.failure.exit', 'Invalid failure exit')
  } else if (failure.exit === 'death') {
    validateRequiredText(failure.message, 'lifecycle.failure.message', errors)
    validateRequiredText(failure.killerName, 'lifecycle.failure.killerName', errors)
    if (typeof failure.suppressDeathDialog !== 'boolean') {
      addError(
        errors,
        'missing-lifecycle-field',
        'lifecycle.failure.suppressDeathDialog',
        'Death failure requires suppressDeathDialog'
      )
    }
    validateRequiredText(failure.deathRoute, 'lifecycle.failure.deathRoute', errors)
  }

  const waypoint = value.waypoint
  if (!isRecord(waypoint) || typeof waypoint.createsWaypoint !== 'boolean') {
    addError(errors, 'missing-lifecycle-field', 'lifecycle.waypoint', 'Valid waypoint is required')
  } else if (waypoint.createsWaypoint) {
    validateRequiredText(waypoint.waypointName, 'lifecycle.waypoint.waypointName', errors)
    validateRequiredText(waypoint.snapshot, 'lifecycle.waypoint.snapshot', errors)
    if (waypoint.idempotent !== true) {
      addError(
        errors,
        'invalid-idempotency',
        'lifecycle.waypoint.idempotent',
        'Waypoint must declare idempotent: true'
      )
    }
  }

  if (typeof value.revisit !== 'string' || !REVISIT_POLICIES.has(value.revisit)) {
    addError(errors, 'invalid-revisit-policy', 'lifecycle.revisit', 'Invalid revisit policy')
  }

  const progress = value.progress
  if (
    !isRecord(progress) ||
    (progress.mode !== 'local-only' && progress.mode !== 'async-storage')
  ) {
    addError(errors, 'missing-lifecycle-field', 'lifecycle.progress', 'Valid progress is required')
  } else if (progress.mode === 'async-storage') {
    const canonicalSaveKey = `sub-game:${instanceId}:progress`
    if (progress.saveKey !== canonicalSaveKey) {
      addError(
        errors,
        'invalid-save-key',
        'lifecycle.progress.saveKey',
        `saveKey must be '${canonicalSaveKey}'`
      )
    }
    if (!Number.isInteger(progress.version) || (progress.version as number) <= 0) {
      addError(
        errors,
        'invalid-progress-version',
        'lifecycle.progress.version',
        'Progress version must be a positive integer'
      )
    }
    if (typeof progress.clearOnCompletion !== 'boolean') {
      addError(
        errors,
        'missing-lifecycle-field',
        'lifecycle.progress.clearOnCompletion',
        'Async progress requires clearOnCompletion'
      )
    }
  }

  const reward = value.reward
  if (!isRecord(reward) || typeof reward.kind !== 'string') {
    addError(errors, 'missing-lifecycle-field', 'lifecycle.reward', 'Valid reward is required')
  } else if (reward.kind !== 'none') {
    if (!REWARD_KINDS.has(reward.kind as RewardKind)) {
      addError(
        errors,
        'unsupported-reward-kind',
        'lifecycle.reward.kind',
        `Unsupported word-grid reward kind '${reward.kind}'`
      )
    } else {
      const kind = reward.kind as RewardKind
      if (!isNonEmptyString(reward.id) || !validateReward(reward.id, kind)) {
        addError(
          errors,
          'unknown-reward-id',
          'lifecycle.reward.id',
          `Reward '${String(reward.id)}' is not registered for kind '${kind}'`
        )
      }
    }
    if (
      reward.grantEvent !== 'success-screen-entered' &&
      reward.grantEvent !== 'success-confirmed'
    ) {
      addError(
        errors,
        'invalid-reward-trigger',
        'lifecycle.reward.grantEvent',
        'Unsupported word-grid reward trigger'
      )
    }
    if (reward.idempotent !== true) {
      addError(
        errors,
        'invalid-idempotency',
        'lifecycle.reward.idempotent',
        'Reward must declare idempotent: true'
      )
    }
  }

  const returnToRpg = value.returnToRpg
  if (
    !isRecord(returnToRpg) ||
    returnToRpg.signalRpgResume !== true ||
    returnToRpg.exitSubGame !== true
  ) {
    addError(
      errors,
      'missing-lifecycle-field',
      'lifecycle.returnToRpg',
      'returnToRpg must enable signalRpgResume and exitSubGame'
    )
  }
}

function validatePresentation(value: unknown, errors: ValidationError[]): void {
  if (!isRecord(value)) {
    addError(errors, 'invalid-presentation', 'presentation', 'presentation must be an object')
    return
  }

  const intro = value.intro
  if (!isRecord(intro)) {
    addError(errors, 'missing-presentation-field', 'presentation.intro', 'intro is required')
  } else {
    validateRequiredText(intro.assetId, 'presentation.intro.assetId', errors)
    validateRequiredText(intro.leaveLabel, 'presentation.intro.leaveLabel', errors)
    validateRequiredText(intro.startLabel, 'presentation.intro.startLabel', errors)
  }

  const puzzle = value.puzzle
  if (!isRecord(puzzle)) {
    addError(errors, 'missing-presentation-field', 'presentation.puzzle', 'puzzle is required')
  } else {
    validateRequiredText(puzzle.leaveLabel, 'presentation.puzzle.leaveLabel', errors)
    const feedback = puzzle.tapFeedback
    if (!isRecord(feedback)) {
      addError(
        errors,
        'missing-presentation-field',
        'presentation.puzzle.tapFeedback',
        'tapFeedback is required'
      )
    } else {
      for (const key of ['selectionFadeMs', 'selectedBorderWidth', 'circleSize'] as const) {
        if (!isFiniteNumber(feedback[key]) || (feedback[key] as number) < 0) {
          addError(
            errors,
            'invalid-presentation-number',
            `presentation.puzzle.tapFeedback.${key}`,
            `${key} must be a non-negative finite number`
          )
        }
      }
      for (const key of ['selectedBorderColor', 'inactiveOverlayColor', 'circleColor'] as const) {
        validateRequiredText(feedback[key], `presentation.puzzle.tapFeedback.${key}`, errors)
      }
    }
  }

  const failure = value.failure
  if (!isRecord(failure)) {
    addError(errors, 'missing-presentation-field', 'presentation.failure', 'failure is required')
  } else {
    validateRequiredText(failure.assetId, 'presentation.failure.assetId', errors)
    validateRequiredText(failure.text, 'presentation.failure.text', errors)
    validateRequiredText(failure.actionLabel, 'presentation.failure.actionLabel', errors)
    if (failure.foregroundFit !== 'full-width' && failure.foregroundFit !== 'cover') {
      addError(
        errors,
        'invalid-foreground-fit',
        'presentation.failure.foregroundFit',
        'foregroundFit must be full-width or cover'
      )
    }
  }

  const success = value.success
  if (!isRecord(success)) {
    addError(errors, 'missing-presentation-field', 'presentation.success', 'success is required')
  } else {
    for (const key of [
      'assetId',
      'firstVisitText',
      'revisitText',
      'readRewardLabel',
      'returnLabel',
      'rewardModalTitle',
      'rewardModalText',
      'rewardModalCloseLabel',
    ] as const) {
      validateRequiredText(success[key], `presentation.success.${key}`, errors)
    }
  }
}

function referencedAssetIds(entry: UnknownRecord): { path: string; value: unknown }[] {
  const metadata = isRecord(entry.metadata) ? entry.metadata : {}
  const content = isRecord(entry.content) ? entry.content : {}
  const presentation = isRecord(entry.presentation) ? entry.presentation : {}
  const intro = isRecord(presentation.intro) ? presentation.intro : {}
  const failure = isRecord(presentation.failure) ? presentation.failure : {}
  const success = isRecord(presentation.success) ? presentation.success : {}
  return [
    { path: 'content.assetId', value: content.assetId },
    { path: 'metadata.entranceAssetId', value: metadata.entranceAssetId },
    { path: 'presentation.intro.assetId', value: intro.assetId },
    { path: 'presentation.failure.assetId', value: failure.assetId },
    { path: 'presentation.success.assetId', value: success.assetId },
  ]
}

export function createWordGridShapeAdapter(
  options: WordGridAdapterOptions = {}
): EncounterShapeAdapter<unknown, WordGridConfig> {
  const assets = options.assets ?? WORD_GRID_ASSETS
  const rewardValidator = options.validateReward ?? validateWordGridRewardId

  const adapter: EncounterShapeAdapter<unknown, WordGridConfig> = {
    shapeId: 'word-grid',

    routes(instanceId): EncounterInstanceRoutes {
      const base = `/sub-games/word-grid/${instanceId}`
      return { entry: base, success: `${base}/success`, aftermath: `${base}/aftermath` }
    },

    validateRewardId: rewardValidator,

    parse(entry): ValidationResult<ParsedEncounter<WordGridConfig>> {
      const errors: ValidationError[] = []
      if (!isRecord(entry)) {
        return {
          success: false,
          errors: [
            { code: 'invalid-entry', path: '', message: 'Encounter entry must be an object' },
          ],
        }
      }

      const instanceId = typeof entry.instanceId === 'string' ? entry.instanceId : ''
      if (!INSTANCE_ID_PATTERN.test(instanceId)) {
        addError(
          errors,
          'invalid-instance-id',
          'instanceId',
          'instanceId must be non-empty lowercase kebab-case'
        )
      }
      if (entry.shapeId !== 'word-grid') {
        addError(errors, 'unknown-shape-id', 'shapeId', "shapeId must be 'word-grid'")
      }
      const metadata = isRecord(entry.metadata) ? entry.metadata : null
      if (!metadata) {
        addError(errors, 'invalid-metadata', 'metadata', 'metadata must be an object')
      } else {
        validateRequiredText(metadata.title, 'metadata.title', errors, 'invalid-metadata-title')
        validateRequiredText(
          metadata.description,
          'metadata.description',
          errors,
          'invalid-metadata-description'
        )
        validateRequiredText(metadata.entranceAssetId, 'metadata.entranceAssetId', errors)
        const entranceFootprint = metadata.entranceFootprint
        if (
          !isRecord(entranceFootprint) ||
          !isFiniteNumber(entranceFootprint.width) ||
          !isFiniteNumber(entranceFootprint.height) ||
          entranceFootprint.width <= 0 ||
          entranceFootprint.height <= 0
        ) {
          addError(
            errors,
            'invalid-entrance-footprint',
            'metadata.entranceFootprint',
            'entranceFootprint must have positive finite width and height'
          )
        }
        validateRequiredText(metadata.ctaLabel, 'metadata.ctaLabel', errors)
      }

      const content = isRecord(entry.content) ? entry.content : null
      if (!content) {
        addError(errors, 'invalid-content', 'content', 'content must be an object')
      } else {
        if (!Number.isInteger(content.rows) || (content.rows as number) <= 0) {
          addError(errors, 'invalid-grid-size', 'content.rows', 'rows must be a positive integer')
        }
        if (!Number.isInteger(content.columns) || (content.columns as number) <= 0) {
          addError(
            errors,
            'invalid-grid-size',
            'content.columns',
            'columns must be a positive integer'
          )
        }
        if (!isFiniteNumber(content.gapPct) || content.gapPct < 0) {
          addError(errors, 'invalid-gap', 'content.gapPct', 'gapPct must be non-negative')
        }

        const rect = content.gridRect
        if (!isRecord(rect)) {
          addError(errors, 'invalid-grid-rect', 'content.gridRect', 'gridRect must be an object')
        } else {
          const x = rect.xPct
          const y = rect.yPct
          const width = rect.widthPct
          const height = rect.heightPct
          if (
            !isFiniteNumber(x) ||
            !isFiniteNumber(y) ||
            !isFiniteNumber(width) ||
            !isFiniteNumber(height) ||
            x < 0 ||
            y < 0 ||
            width <= 0 ||
            height <= 0 ||
            x + width > 1 ||
            y + height > 1
          ) {
            addError(
              errors,
              'invalid-grid-rect',
              'content.gridRect',
              'gridRect must be positive normalized bounds contained within [0, 1]'
            )
          }
        }

        const letters = content.letters
        const rows = content.rows
        const columns = content.columns
        if (!Array.isArray(letters)) {
          addError(errors, 'invalid-grid-dimensions', 'content.letters', 'letters must be an array')
        } else {
          if (Number.isInteger(rows) && letters.length !== rows) {
            addError(
              errors,
              'invalid-grid-dimensions',
              'content.letters',
              `letters must contain exactly ${rows} rows`
            )
          }
          letters.forEach((row, rowIndex) => {
            if (!Array.isArray(row) || (Number.isInteger(columns) && row.length !== columns)) {
              addError(
                errors,
                'invalid-grid-dimensions',
                `content.letters[${rowIndex}]`,
                `row must contain exactly ${String(columns)} columns`
              )
              return
            }
            row.forEach((letter, colIndex) => {
              if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) {
                addError(
                  errors,
                  'invalid-grid-letter',
                  `content.letters[${rowIndex}][${colIndex}]`,
                  'Grid cells must be exactly one uppercase ASCII letter'
                )
              }
            })
          })
        }

        const target = content.targetSequence
        if (typeof target !== 'string' || target.length === 0) {
          addError(
            errors,
            'empty-target-sequence',
            'content.targetSequence',
            'targetSequence must not be empty'
          )
        } else if (!UPPERCASE_ASCII_PATTERN.test(target)) {
          addError(
            errors,
            'invalid-target-sequence',
            'content.targetSequence',
            'targetSequence must contain uppercase ASCII letters only'
          )
        } else if (Array.isArray(letters)) {
          const available = new Map<string, number>()
          for (const row of letters) {
            if (!Array.isArray(row)) continue
            for (const letter of row) {
              if (typeof letter === 'string')
                available.set(letter, (available.get(letter) ?? 0) + 1)
            }
          }
          const required = new Map<string, number>()
          for (const letter of target) required.set(letter, (required.get(letter) ?? 0) + 1)
          const missing = [...required].filter(
            ([letter, count]) => (available.get(letter) ?? 0) < count
          )
          if (missing.length > 0) {
            addError(
              errors,
              'unsolvable-target',
              'content.targetSequence',
              `Target requires unavailable distinct cells: ${missing
                .map(([letter, count]) => `${letter} ${count}/${available.get(letter) ?? 0}`)
                .join(', ')}`
            )
          }
        }
      }

      validatePresentation(entry.presentation, errors)
      validateLifecycle(entry.lifecycle, instanceId, rewardValidator, errors)

      for (const reference of referencedAssetIds(entry)) {
        if (isNonEmptyString(reference.value) && !assets[reference.value]) {
          addError(
            errors,
            'unknown-asset-id',
            reference.path,
            `Unknown word-grid assetId '${reference.value}'`
          )
        }
      }

      if (errors.length > 0) return { success: false, errors }

      const typedEntry = entry as unknown as WordGridEncounterContent
      const boardAsset = assets[typedEntry.content.assetId]
      const introAsset = assets[typedEntry.presentation.intro.assetId]
      const failureAsset = assets[typedEntry.presentation.failure.assetId]
      const successAsset = assets[typedEntry.presentation.success.assetId]
      const routes = adapter.routes(typedEntry.instanceId)
      const shapeConfig: WordGridConfig = {
        instanceId: typedEntry.instanceId,
        boardAsset: boardAsset.image,
        intrinsicSize: boardAsset.intrinsicSize,
        gridRect: {
          left: typedEntry.content.gridRect.xPct,
          top: typedEntry.content.gridRect.yPct,
          right: typedEntry.content.gridRect.xPct + typedEntry.content.gridRect.widthPct,
          bottom: typedEntry.content.gridRect.yPct + typedEntry.content.gridRect.heightPct,
        },
        rows: typedEntry.content.rows,
        columns: typedEntry.content.columns,
        gap: typedEntry.content.gapPct,
        letters: typedEntry.content.letters,
        targetSequence: [...typedEntry.content.targetSequence],
        puzzleRoute: `${routes.entry}/puzzle`,
        tapFeedback: typedEntry.presentation.puzzle.tapFeedback,
        wrongInputOutcome: { route: `${routes.entry}/failure`, delayMs: 500 },
        successOutcome: { route: routes.success!, delayMs: 500 },
        presentation: {
          intro: {
            backgroundAsset: introAsset.image,
            leaveLabel: typedEntry.presentation.intro.leaveLabel,
            startLabel: typedEntry.presentation.intro.startLabel,
          },
          puzzle: { leaveLabel: typedEntry.presentation.puzzle.leaveLabel },
          failure: {
            backgroundAsset: failureAsset.image,
            text: typedEntry.presentation.failure.text,
            actionLabel: typedEntry.presentation.failure.actionLabel,
            foregroundFit: typedEntry.presentation.failure.foregroundFit,
          },
          success: {
            backgroundAsset: successAsset.image,
            firstVisitText: typedEntry.presentation.success.firstVisitText,
            revisitText: typedEntry.presentation.success.revisitText,
            readRewardLabel: typedEntry.presentation.success.readRewardLabel,
            returnLabel: typedEntry.presentation.success.returnLabel,
            rewardModalTitle: typedEntry.presentation.success.rewardModalTitle,
            rewardModalText: typedEntry.presentation.success.rewardModalText,
            rewardModalCloseLabel: typedEntry.presentation.success.rewardModalCloseLabel,
          },
        },
      }

      return {
        success: true,
        value: {
          definition: {
            instanceId: typedEntry.instanceId,
            shapeId: 'word-grid',
            entryRoute: routes.entry,
            lifecycle: typedEntry.lifecycle as SubGameLifecycleConfig,
            title: typedEntry.metadata.title,
            description: typedEntry.metadata.description,
            introBackgroundImage: introAsset.image,
          },
          shapeConfig,
        },
      }
    },
  }

  return adapter
}

export function validateWordGridContent(
  content: unknown,
  options: WordGridAdapterOptions = {}
): ValidationResult<ParsedEncounter<WordGridConfig>> {
  return createWordGridShapeAdapter(options).parse(content)
}

export const wordGridShapeAdapter = createWordGridShapeAdapter()
