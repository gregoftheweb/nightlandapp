import { createNonCollisionObject } from '@config/levelHelpers'
import type { GameState, NonCollisionObject } from '@config/types'
import type { FootstepDescriptor } from './trailGeometry'

export function generatedFootstepsToNonCollisionObjects(
  descriptors: readonly FootstepDescriptor[]
): NonCollisionObject[] {
  return descriptors.map((descriptor, index) =>
    createNonCollisionObject(
      `generated-footsteps-${descriptor.variant}`,
      descriptor.position,
      descriptor.rotationDegrees,
      {
        id: `generated-footsteps-${descriptor.variant}-${descriptor.onBranchId ?? 'trunk'}-${index}`,
      }
    )
  )
}

/** Runtime-only merge. Neither source array is mutated. */
export function getRuntimeNonCollisionObjects(
  state: Pick<GameState, 'nonCollisionObjects' | 'generatedFootsteps'>
): NonCollisionObject[] {
  return [
    ...(state.nonCollisionObjects ?? []),
    ...generatedFootstepsToNonCollisionObjects(state.generatedFootsteps),
  ]
}
