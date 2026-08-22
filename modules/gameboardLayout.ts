import { parsedWordGridContentResult } from '@/app/sub-games/_shared/word-grid/contentCatalog'
import { parsedTimedEncounterContentResult } from '@/app/sub-games/_shared/timed-encounter/contentCatalog'
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
import {
  buildTraversalObstacles,
  generateFootstepDescriptors,
  generateTrailNetwork,
  type FootstepDescriptor,
  type TrailLocation,
  type TrailNetwork,
} from './trailGeometry'

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
    if (shapeId === 'timed-encounter') {
      if (!parsedTimedEncounterContentResult.success) {
        throw new Error('Parsed timed-encounter catalog is invalid')
      }
      const parsed = parsedTimedEncounterContentResult.value[instanceId]
      if (!parsed) throw new Error(`Unknown timed encounter '${instanceId}'`)
      return parsed.definition
    }
    const definition = getSubGameDefinition(instanceId)
    if (definition.shapeId !== shapeId) {
      throw new Error(`Encounter '${instanceId}' is not shape '${shapeId}'`)
    }
    return definition
  },
}

const MAX_ATTEMPTS_PER_INSTANCE = 500
const START_END_REGION_SIZE = 0.1

function excluded(
  location: TrailLocation,
  regions: readonly GameboardRegion[],
  placed: EncounterPlacement[],
  trailNetwork: TrailNetwork,
  straightLineReference: number
): boolean {
  return regions.some((region) => {
    if (region === 'start') {
      return location.type === 'trunk' && location.progressPct <= START_END_REGION_SIZE
    }
    if (region === 'end') {
      return location.type === 'trunk' && location.progressPct >= 1 - START_END_REGION_SIZE
    }
    const neighbor = placed.find((placement) => placement.slotId === region.nearSlotId)
    return neighbor
      ? trailNetwork.distanceBetween(location, neighbor.location) <=
          region.bufferPct * straightLineReference
      : false
  })
}

function withinBounds(
  position: Position,
  footprint: { width: number; height: number },
  level: Level
): boolean {
  return (
    position.row >= 0 &&
    position.col >= 0 &&
    position.row + footprint.height <= level.boardSize.height &&
    position.col + footprint.width <= level.boardSize.width
  )
}

function countEligibleScatteredInstances(
  manifest: GameboardManifest,
  catalogs: ParsedContentCatalogsByShape
): number {
  let count = 0
  for (const slot of manifest.slots) {
    if (slot.kind !== 'scattered-group') continue
    for (const instanceId of slot.instances) {
      try {
        if (catalogs.resolve(slot.shapeId, instanceId).entrance) count += 1
      } catch {
        // The placement pass reports the existing detailed validation error.
      }
    }
  }
  return count
}

function randomScatteredLocation(trailNetwork: TrailNetwork, random: RandomSource): TrailLocation {
  if (
    trailNetwork.branches.length === 0 ||
    random.next() < 1 / (trailNetwork.branches.length + 1)
  ) {
    return { type: 'trunk', progressPct: random.next() }
  }
  const branch = trailNetwork.branches[Math.floor(random.next() * trailNetwork.branches.length)]
  return { type: 'branch', branchId: branch.branchId, branchProgressPct: random.next() }
}

function branchTerminusLocation(trailNetwork: TrailNetwork, random: RandomSource): TrailLocation {
  const branch = trailNetwork.branches[Math.floor(random.next() * trailNetwork.branches.length)]
  return {
    type: 'branch',
    branchId: branch.branchId,
    branchProgressPct: 0.8 + random.next() * 0.2,
  }
}

export function generateLayout(
  manifest: GameboardManifest,
  catalogs: ParsedContentCatalogsByShape,
  level: Level,
  random: RandomSource
): ValidationResult<{
  placements: EncounterPlacement[]
  trailNetwork: TrailNetwork
  generatedFootsteps: FootstepDescriptor[]
}> {
  const placements: EncounterPlacement[] = []
  const errors: ValidationError[] = []
  const eligibleScatteredCount = countEligibleScatteredInstances(manifest, catalogs)
  const branchCount = Math.min(2 + Math.floor(random.next() * 3), eligibleScatteredCount)
  const occupancy = buildBoardOccupancyRegistry(level)
  const trailResult = generateTrailNetwork(
    buildTraversalObstacles(level),
    occupancy,
    random,
    branchCount,
    level.playerSpawn
  )
  if (!trailResult.success) return trailResult
  const trailNetwork = trailResult.value
  const trailEnd = trailNetwork.resolve({ type: 'trunk', progressPct: 1 })
  const straightLineReference = Math.hypot(
    level.playerSpawn.row - trailEnd.row,
    level.playerSpawn.col - trailEnd.col
  )
  let mustAllocateBranchTerminus = eligibleScatteredCount > 0 && trailNetwork.branches.length > 0

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
          let location: TrailLocation
          if (slot.kind === 'end') location = { type: 'trunk', progressPct: 1 }
          else if (slot.kind === 'range') {
            location = {
              type: 'trunk',
              progressPct:
                slot.placement.minPct +
                random.next() * (slot.placement.maxPct - slot.placement.minPct),
            }
          } else {
            location = mustAllocateBranchTerminus
              ? branchTerminusLocation(trailNetwork, random)
              : randomScatteredLocation(trailNetwork, random)
            if (
              excluded(
                location,
                slot.placement.exclude,
                placements,
                trailNetwork,
                straightLineReference
              )
            ) {
              lastReason = 'candidate is inside an excluded region'
              continue
            }
            const minSpacing = (slot.placement.minSpacingPct ?? 0) * straightLineReference
            if (
              placements.some(
                (placement) =>
                  trailNetwork.distanceBetween(location, placement.location) < minSpacing
              )
            ) {
              lastReason = `candidate violates minSpacingPct ${slot.placement.minSpacingPct ?? 0}`
              continue
            }
          }
          const position = trailNetwork.resolve(location)
          if (!withinBounds(position, footprint, level)) {
            lastReason = `candidate at (${position.row}, ${position.col}) is outside level bounds`
            continue
          }
          const free = occupancy.isFree(position, footprint)
          if (!free.free) {
            lastReason = `would overlap existing object ${free.overlappingIds.join(', ')}`
            continue
          }
          const occupancyId = occupancy.reserve(instanceId, position, footprint)
          accepted = {
            instanceId,
            shapeId: slot.shapeId,
            slotId: slot.slotId,
            location,
            position,
            footprint,
            occupancyId,
          }
          placements.push(accepted)
          if (location.type === 'branch' && location.branchProgressPct >= 0.8) {
            mustAllocateBranchTerminus = false
          }
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
  return {
    success: true,
    value: {
      placements,
      trailNetwork,
      generatedFootsteps: generateFootstepDescriptors(trailNetwork, random, {
        occupancy,
        placements,
      }),
    },
  }
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
