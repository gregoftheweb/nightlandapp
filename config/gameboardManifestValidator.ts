import { parsedWordGridContentResult } from '@/app/sub-games/_shared/word-grid/contentCatalog'
import { getSubGameDefinition, isRegisteredSubGameInstance, SUB_GAME_SHAPES } from './subGames'
import type { GameboardManifest } from './types/gameboard'
import type { SubGameInstanceDefinition } from './subGames'
import type { ValidationError, ValidationResult } from './types/encounters'

type UnknownRecord = Record<string, unknown>

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function addError(errors: ValidationError[], code: string, path: string, message: string): void {
  errors.push({ code, path, message })
}

function resolveContent(
  shapeId: string,
  contentRef: string
): SubGameInstanceDefinition | undefined {
  if (shapeId === 'word-grid') {
    if (!parsedWordGridContentResult.success) return undefined
    return parsedWordGridContentResult.value[contentRef]?.definition
  }
  if (!isRegisteredSubGameInstance(contentRef)) return undefined
  return getSubGameDefinition(contentRef)
}

function regionKey(region: unknown): string | undefined {
  if (region === 'start' || region === 'end') return region
  if (!isRecord(region)) return undefined
  return `near:${String(region.nearSlotId)}:${String(region.bufferPct)}`
}

export function validateGameboardManifest(manifest: unknown): ValidationResult<GameboardManifest> {
  const errors: ValidationError[] = []
  if (!isRecord(manifest)) {
    return {
      success: false,
      errors: [
        { code: 'invalid-gameboard-manifest', path: '', message: 'Manifest must be an object' },
      ],
    }
  }

  if (!Number.isInteger(manifest.version) || (manifest.version as number) <= 0) {
    addError(errors, 'invalid-manifest-version', 'version', 'version must be a positive integer')
  }
  if (!Array.isArray(manifest.slots) || manifest.slots.length === 0) {
    addError(errors, 'empty-manifest-slots', 'slots', 'slots must be a non-empty array')
    return { success: false, errors }
  }

  const slotRecords = manifest.slots.map((slot) => (isRecord(slot) ? slot : undefined))
  const slotsById = new Map<string, UnknownRecord>()
  const seenSlotIds = new Set<string>()

  slotRecords.forEach((slot, index) => {
    if (!slot) {
      addError(errors, 'invalid-slot', `slots[${index}]`, 'slot must be an object')
      return
    }
    const slotId = typeof slot.slotId === 'string' ? slot.slotId : ''
    if (!KEBAB_CASE_PATTERN.test(slotId)) {
      addError(
        errors,
        'invalid-slot-id',
        `slots[${index}].slotId`,
        'slotId must be stable lowercase kebab-case'
      )
    }
    if (seenSlotIds.has(slotId)) {
      addError(
        errors,
        'duplicate-slot-id',
        `slots[${index}].slotId`,
        `Duplicate slotId '${slotId}'`
      )
    } else if (slotId) {
      seenSlotIds.add(slotId)
      slotsById.set(slotId, slot)
    }
  })

  const seenInstanceIds = new Map<string, string>()

  const validateReference = (
    shapeId: string,
    contentRef: unknown,
    path: string,
    slotId: string
  ): void => {
    if (typeof contentRef !== 'string' || contentRef.length === 0) {
      addError(errors, 'invalid-content-ref', path, 'contentRef must be a non-empty string')
      return
    }

    const previousSlot = seenInstanceIds.get(contentRef)
    if (previousSlot !== undefined) {
      addError(
        errors,
        'duplicate-global-instance-id',
        path,
        `instanceId '${contentRef}' is already referenced by slot '${previousSlot}'`
      )
    } else {
      seenInstanceIds.set(contentRef, slotId)
    }

    const definition = resolveContent(shapeId, contentRef)
    if (!definition) {
      addError(
        errors,
        'unknown-content-ref',
        path,
        `Content '${contentRef}' does not resolve for shape '${shapeId}'`
      )
      return
    }
    if (definition.shapeId !== shapeId) {
      addError(
        errors,
        'shape-id-mismatch',
        path,
        `Content '${contentRef}' has shapeId '${definition.shapeId}', not '${shapeId}'`
      )
    }
  }

  slotRecords.forEach((slot, index) => {
    if (!slot) return
    const basePath = `slots[${index}]`
    const slotId = typeof slot.slotId === 'string' ? slot.slotId : ''
    const shapeId = typeof slot.shapeId === 'string' ? slot.shapeId : ''
    const shapeRegistered = SUB_GAME_SHAPES.has(shapeId as never)
    if (!shapeRegistered) {
      addError(
        errors,
        'unregistered-shape-id',
        `${basePath}.shapeId`,
        `shapeId '${shapeId}' is not registered`
      )
    }

    if (slot.kind === 'range') {
      if ('instances' in slot) {
        addError(
          errors,
          'invalid-slot-fields',
          `${basePath}.instances`,
          'range slots cannot contain instances'
        )
      }
      const placement = isRecord(slot.placement) ? slot.placement : undefined
      if (
        !placement ||
        !isFiniteNumber(placement.minPct) ||
        !isFiniteNumber(placement.maxPct) ||
        placement.minPct < 0 ||
        placement.minPct > placement.maxPct ||
        placement.maxPct > 1
      ) {
        addError(
          errors,
          'invalid-range-bounds',
          `${basePath}.placement`,
          'range bounds must satisfy 0 <= minPct <= maxPct <= 1'
        )
      }
      if (placement && ('exclude' in placement || 'minSpacingPct' in placement)) {
        addError(
          errors,
          'invalid-slot-fields',
          `${basePath}.placement`,
          'range placement cannot contain scattered-group fields'
        )
      }
      if (shapeRegistered) {
        validateReference(shapeId, slot.contentRef, `${basePath}.contentRef`, slotId)
      }
      return
    }

    if (slot.kind === 'end') {
      if ('instances' in slot || 'placement' in slot) {
        addError(
          errors,
          'invalid-slot-fields',
          basePath,
          'end slots cannot contain placement or instances'
        )
      }
      if (shapeRegistered) {
        validateReference(shapeId, slot.contentRef, `${basePath}.contentRef`, slotId)
      }
      return
    }

    if (slot.kind !== 'scattered-group') {
      addError(errors, 'invalid-slot-kind', `${basePath}.kind`, 'Unsupported slot kind')
      return
    }

    if ('contentRef' in slot) {
      addError(
        errors,
        'invalid-slot-fields',
        `${basePath}.contentRef`,
        'scattered-group slots cannot contain contentRef'
      )
    }
    const placement = isRecord(slot.placement) ? slot.placement : undefined
    if (placement && ('minPct' in placement || 'maxPct' in placement)) {
      addError(
        errors,
        'invalid-slot-fields',
        `${basePath}.placement`,
        'scattered-group placement cannot contain range fields'
      )
    }
    if (
      placement?.minSpacingPct !== undefined &&
      (!isFiniteNumber(placement.minSpacingPct) ||
        placement.minSpacingPct < 0 ||
        placement.minSpacingPct > 1)
    ) {
      addError(
        errors,
        'invalid-min-spacing',
        `${basePath}.placement.minSpacingPct`,
        'minSpacingPct must be within [0, 1]'
      )
    }

    if (!Array.isArray(slot.instances) || slot.instances.length === 0) {
      addError(
        errors,
        'empty-scattered-instances',
        `${basePath}.instances`,
        'scattered-group instances must be non-empty'
      )
    } else {
      const localInstances = new Set<string>()
      slot.instances.forEach((contentRef, instanceIndex) => {
        const path = `${basePath}.instances[${instanceIndex}]`
        if (typeof contentRef === 'string' && localInstances.has(contentRef)) {
          addError(
            errors,
            'duplicate-scattered-instance',
            path,
            `Duplicate scattered contentRef '${contentRef}'`
          )
        }
        if (typeof contentRef === 'string') localInstances.add(contentRef)
        if (shapeRegistered) validateReference(shapeId, contentRef, path, slotId)
      })
    }

    if (!placement || !Array.isArray(placement.exclude)) {
      addError(
        errors,
        'invalid-exclusions',
        `${basePath}.placement.exclude`,
        'exclude must be an array'
      )
      return
    }

    const seenRegions = new Set<string>()
    const simpleRegions = new Set<string>()
    placement.exclude.forEach((region, regionIndex) => {
      const path = `${basePath}.placement.exclude[${regionIndex}]`
      const key = regionKey(region)
      if (key !== undefined && seenRegions.has(key)) {
        addError(errors, 'duplicate-exclusion', path, 'Duplicate exclusion')
      } else if (key !== undefined) {
        seenRegions.add(key)
      }

      if (region === 'start' || region === 'end') {
        simpleRegions.add(region)
        return
      }
      if (!isRecord(region) || typeof region.nearSlotId !== 'string') {
        addError(errors, 'invalid-region', path, 'Region must be start, end, or nearSlotId')
        return
      }
      if (!isFiniteNumber(region.bufferPct) || region.bufferPct < 0 || region.bufferPct > 1) {
        addError(
          errors,
          'invalid-region-buffer',
          `${path}.bufferPct`,
          'bufferPct must be within [0, 1]'
        )
      }
      if (region.nearSlotId === slotId) {
        addError(
          errors,
          'self-referencing-region',
          `${path}.nearSlotId`,
          'Region cannot reference its own slot'
        )
        return
      }
      const referencedSlot = slotsById.get(region.nearSlotId)
      if (!referencedSlot) {
        addError(
          errors,
          'unknown-region-slot',
          `${path}.nearSlotId`,
          `Unknown nearSlotId '${region.nearSlotId}'`
        )
      } else if (referencedSlot.kind === 'scattered-group') {
        addError(
          errors,
          'invalid-region-slot-kind',
          `${path}.nearSlotId`,
          'nearSlotId must reference a non-scattered-group slot'
        )
      }
    })

    if (simpleRegions.has('start') && simpleRegions.has('end')) {
      addError(
        errors,
        'unsatisfiable-exclusions',
        `${basePath}.placement.exclude`,
        'Excluding both start and end is treated as excluding the available path'
      )
    }
  })

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, value: manifest as unknown as GameboardManifest }
}
