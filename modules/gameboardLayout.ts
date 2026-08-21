import { parsedWordGridContentResult } from '@/app/sub-games/_shared/word-grid/contentCatalog'
import { GAMEBOARD_MANIFEST } from '@config/gameboardManifest'
import { createSubGameEntranceInstance } from '@config/levelHelpers'
import { getSubGameDefinition } from '@config/subGames'
import type {
  EncounterPlacement,
  GameboardManifest,
  GameboardRegion,
  Level,
  LevelObjectInstance,
  Position,
  SubGameShapeId,
  ValidationError,
  ValidationResult,
} from '@config/types'

export interface OccupancyFootprint {
  id: string
  position: Position
  width: number
  height: number
}

export interface FreeSpaceResult {
  free: boolean
  overlappingIds: string[]
}

/** Owns every fixed and generated footprint used while laying out a board. */
export class BoardOccupancyRegistry {
  private readonly entries: OccupancyFootprint[] = []
  private readonly ids = new Set<string>()
  private nextId = 1

  constructor(seed: readonly OccupancyFootprint[] = []) {
    seed.forEach((entry) => this.add(entry))
  }

  private add(entry: OccupancyFootprint): void {
    let id = entry.id
    while (this.ids.has(id)) id = `${entry.id}#${this.nextId++}`
    this.ids.add(id)
    this.entries.push({ ...entry, id })
  }

  isFree(position: Position, footprint: { width: number; height: number }): FreeSpaceResult {
    const overlappingIds = this.entries
      .filter((entry) => rectanglesOverlap(position, footprint, entry.position, entry))
      .map(({ id }) => id)
    return { free: overlappingIds.length === 0, overlappingIds }
  }

  reserve(label: string, position: Position, footprint: { width: number; height: number }): string {
    const availability = this.isFree(position, footprint)
    if (!availability.free) {
      throw new Error(`would overlap existing object ${availability.overlappingIds.join(', ')}`)
    }
    const id = `generated:${label}:${this.nextId++}`
    this.add({ id, position, ...footprint })
    return id
  }

  snapshot(): readonly OccupancyFootprint[] {
    return this.entries.map((entry) => ({ ...entry, position: { ...entry.position } }))
  }
}

function rectanglesOverlap(
  a: Position,
  aSize: { width: number; height: number },
  b: Position,
  bSize: { width: number; height: number }
): boolean {
  return (
    a.row < b.row + bSize.height &&
    a.row + aSize.height > b.row &&
    a.col < b.col + bSize.width &&
    a.col + aSize.width > b.col
  )
}

export function buildBoardOccupancyRegistry(level: Level): BoardOccupancyRegistry {
  const seed: OccupancyFootprint[] = []
  level.objects.forEach((object) => {
    if (!object.position) return
    seed.push({
      id: object.id,
      position: object.position,
      width: object.size?.width ?? object.width ?? 1,
      height: object.size?.height ?? object.height ?? 1,
    })
  })
  level.nonCollisionObjects?.forEach((object) => {
    if (object.collisionMask?.length) {
      object.collisionMask.forEach((segment, index) => {
        seed.push({
          id: `${object.id}-mask-${index}`,
          position: {
            row: object.position.row + segment.row,
            col: object.position.col + segment.col,
          },
          width: segment.width ?? 1,
          height: segment.height ?? 1,
        })
      })
      return
    }
    seed.push({
      id: object.id,
      position: object.position,
      width: object.width || 1,
      height: object.height || 1,
    })
  })
  level.greatPowers?.forEach((greatPower) => {
    seed.push({
      id: greatPower.id,
      position: greatPower.position,
      width: greatPower.width ?? 1,
      height: greatPower.height ?? 1,
    })
  })
  seed.push({ id: 'player-spawn', position: level.playerSpawn, width: 1, height: 1 })
  return new BoardOccupancyRegistry(seed)
}

export interface PathPositionResolver {
  positionAt(progressPct: number): Position
  distanceBetween(aPct: number, bPct: number): number
}

export class LinearPathPositionResolver implements PathPositionResolver {
  constructor(
    private readonly start: Position = { row: 395, col: 180 },
    private readonly end: Position = { row: 10, col: 180 }
  ) {}

  positionAt(progressPct: number): Position {
    return {
      row: Math.round(this.start.row + (this.end.row - this.start.row) * progressPct),
      col: Math.round(this.start.col + (this.end.col - this.start.col) * progressPct),
    }
  }

  distanceBetween(aPct: number, bPct: number): number {
    return Math.abs(aPct - bPct)
  }
}

export class RandomSource {
  constructor(private readonly source: () => number = Math.random) {}

  next(): number {
    const value = this.source()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new Error('RandomSource must produce a finite value in [0, 1)')
    }
    return value
  }
}

export interface ParsedContentCatalogsByShape {
  resolve(shapeId: SubGameShapeId, instanceId: string): ReturnType<typeof getSubGameDefinition>
}

export const REAL_PARSED_CONTENT_CATALOGS: ParsedContentCatalogsByShape = {
  resolve(shapeId, instanceId) {
    if (shapeId === 'word-grid') {
      if (!parsedWordGridContentResult.success) {
        throw new Error('Parsed word-grid catalog is invalid')
      }
      const parsed = parsedWordGridContentResult.value[instanceId]
      if (!parsed) throw new Error(`Unknown word-grid encounter '${instanceId}'`)
      return parsed.definition
    }
    const definition = getSubGameDefinition(instanceId)
    if (definition.shapeId !== shapeId) {
      throw new Error(`Encounter '${instanceId}' is not shape '${shapeId}'`)
    }
    return definition
  },
}

export interface LevelLayoutConstraints {
  width: number
  height: number
  occupancy: BoardOccupancyRegistry
}

const MAX_ATTEMPTS_PER_INSTANCE = 500
const START_END_REGION_SIZE = 0.1

function excluded(
  progress: number,
  regions: readonly GameboardRegion[],
  placed: EncounterPlacement[]
): boolean {
  return regions.some((region) => {
    if (region === 'start') return progress <= START_END_REGION_SIZE
    if (region === 'end') return progress >= 1 - START_END_REGION_SIZE
    const neighbor = placed.find((placement) => placement.slotId === region.nearSlotId)
    return neighbor?.location.type === 'trunk'
      ? Math.abs(progress - neighbor.location.progressPct) <= region.bufferPct
      : false
  })
}

function withinBounds(
  position: Position,
  footprint: { width: number; height: number },
  level: LevelLayoutConstraints
): boolean {
  return (
    position.row >= 0 &&
    position.col >= 0 &&
    position.row + footprint.height <= level.height &&
    position.col + footprint.width <= level.width
  )
}

export function generateLayout(
  manifest: GameboardManifest,
  catalogs: ParsedContentCatalogsByShape,
  level: LevelLayoutConstraints,
  path: PathPositionResolver,
  random: RandomSource
): ValidationResult<EncounterPlacement[]> {
  const placements: EncounterPlacement[] = []
  const errors: ValidationError[] = []

  for (const slot of manifest.slots) {
    const instanceIds = slot.kind === 'scattered-group' ? slot.instances : [slot.contentRef]
    for (const instanceId of instanceIds) {
      let definition: ReturnType<typeof getSubGameDefinition>
      try {
        definition = catalogs.resolve(slot.shapeId, instanceId)
      } catch (error) {
        errors.push({
          code: 'unresolved-layout-content',
          path: slot.slotId,
          message: String(error),
        })
        continue
      }
      if (!definition.entrance) {
        errors.push({
          code: 'missing-entrance-contract',
          path: slot.slotId,
          message: `Encounter '${instanceId}' has no entrance contract`,
        })
        continue
      }
      const footprint = { width: definition.entrance.width, height: definition.entrance.height }
      let lastReason = 'no candidate was attempted'
      let accepted: EncounterPlacement | undefined
      const attempts = slot.kind === 'end' ? 1 : MAX_ATTEMPTS_PER_INSTANCE

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          let progressPct: number
          if (slot.kind === 'end') progressPct = 1
          else if (slot.kind === 'range') {
            progressPct =
              slot.placement.minPct +
              random.next() * (slot.placement.maxPct - slot.placement.minPct)
          } else {
            progressPct = random.next()
            if (excluded(progressPct, slot.placement.exclude, placements)) {
              lastReason = 'candidate is inside an excluded region'
              continue
            }
            const minSpacing = slot.placement.minSpacingPct ?? 0
            if (
              placements.some(
                (placement) =>
                  placement.location.type === 'trunk' &&
                  path.distanceBetween(progressPct, placement.location.progressPct) < minSpacing
              )
            ) {
              lastReason = `candidate violates minSpacingPct ${minSpacing}`
              continue
            }
          }
          const position = path.positionAt(progressPct)
          if (!withinBounds(position, footprint, level)) {
            lastReason = `candidate at (${position.row}, ${position.col}) is outside level bounds`
            continue
          }
          const free = level.occupancy.isFree(position, footprint)
          if (!free.free) {
            lastReason = `would overlap existing object ${free.overlappingIds.join(', ')}`
            continue
          }
          const occupancyId = level.occupancy.reserve(instanceId, position, footprint)
          accepted = {
            instanceId,
            shapeId: slot.shapeId,
            slotId: slot.slotId,
            location: { type: 'trunk', progressPct },
            position,
            footprint,
            occupancyId,
          }
          placements.push(accepted)
          break
        } catch (error) {
          lastReason = error instanceof Error ? error.message : String(error)
          break
        }
      }
      if (!accepted) {
        errors.push({
          code: 'layout-slot-unplaceable',
          path: slot.slotId,
          message: `Could not place '${instanceId}' after ${attempts} attempts: ${lastReason}`,
        })
      }
    }
  }

  if (errors.length > 0) return { success: false, errors }
  return { success: true, value: placements }
}

export function placementsToLevelObjects(
  placements: readonly EncounterPlacement[]
): LevelObjectInstance[] {
  return placements.map((placement) => {
    const slot = GAMEBOARD_MANIFEST.slots.find((candidate) =>
      candidate.kind === 'scattered-group'
        ? candidate.instances.includes(placement.instanceId)
        : candidate.contentRef === placement.instanceId
    )
    if (!slot) throw new Error(`No manifest slot found for '${placement.instanceId}'`)
    const definition = REAL_PARSED_CONTENT_CATALOGS.resolve(slot.shapeId, placement.instanceId)
    return createSubGameEntranceInstance(
      placement.instanceId,
      placement.position,
      { id: placement.occupancyId },
      definition
    )
  })
}
