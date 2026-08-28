import type { GameDispatch } from '@context/GameContext'
import { RandomSource } from '@modules/gameboardLayout'

export const CURRENT_LOOM_CHANNEL_COUNT = 5
export const CURRENT_LOOM_TOTAL = 25
export const CURRENT_LOOM_SAFE_VALUE = 5
export const CURRENT_LOOM_MIN = 0
export const CURRENT_LOOM_MAX = 10
export const CURRENT_LOOM_HOLD_TICK_MS = 150
export const CURRENT_LOOM_TICK_DAMAGE = 1
export const CURRENT_LOOM_HAZARD_DAMAGE = 5
export const CURRENT_LOOM_HAZARD_OVERLAY_MS = 500
export const CURRENT_LOOM_DEATH_MESSAGE =
  'The Current-Loom discharges through Christos and stills his heart.'
export const CURRENT_LOOM_KILLER_NAME = 'The Unbound Earth Current'
export const CURRENT_LOOM_DRAIN_DEATH_MESSAGE =
  'The Current-Loom drinks the last of Christos\u2019s life and leaves him still.'
export const CURRENT_LOOM_DRAIN_KILLER_NAME = 'The Draining Earth Current'

export type CurrentLoomChannels = readonly [number, number, number, number, number]

export interface CurrentLoomPuzzleState {
  channels: CurrentLoomChannels
  tickCount: number
}

export interface CurrentLoomTickResult {
  state: CurrentLoomPuzzleState
  hazardChannel: number | null
}

const sumChannels = (channels: readonly number[]) =>
  channels.reduce((total, value) => total + value, 0)

export function isCurrentLoomSolved(state: CurrentLoomPuzzleState): boolean {
  return state.channels.every((value) => value === CURRENT_LOOM_SAFE_VALUE)
}

function donorsFor(channelIndex: number, tickCount: number): number[] {
  if (channelIndex === 0) return [1]
  if (channelIndex === CURRENT_LOOM_CHANNEL_COUNT - 1) return [CURRENT_LOOM_CHANNEL_COUNT - 2]
  // Alternating the odd unit makes identical states deterministic without permanently favoring a side.
  return [tickCount % 2 === 0 ? channelIndex - 1 : channelIndex + 1]
}

function redistributionOrder(channelIndex: number, values: readonly number[], delta: number) {
  // Spill outward only when immediate conduits lack room; an end conduit has one immediate
  // neighbor, so preserving all 25 units can otherwise be mathematically impossible.
  return values
    .map((value, index) => ({
      index,
      distance: Math.abs(index - channelIndex),
      room: delta > 0 ? CURRENT_LOOM_MAX - value : value - CURRENT_LOOM_MIN,
    }))
    .filter(({ index, room }) => index !== channelIndex && room > 0)
    .sort((a, b) => a.distance - b.distance || b.room - a.room || a.index - b.index)
}

function correctBoundary(
  projected: number[],
  channelIndex: number,
  projectedBoundaryValue: number
): CurrentLoomChannels {
  projected[channelIndex] = CURRENT_LOOM_SAFE_VALUE
  let delta = projectedBoundaryValue - CURRENT_LOOM_SAFE_VALUE

  for (const candidate of redistributionOrder(channelIndex, projected, delta)) {
    if (delta === 0) break
    const amount = Math.min(Math.abs(delta), candidate.room)
    projected[candidate.index] += delta > 0 ? amount : -amount
    delta += delta > 0 ? -amount : amount
  }

  if (delta !== 0) throw new Error('Current-Loom boundary correction could not preserve its total')
  return projected as unknown as CurrentLoomChannels
}

export function tickCurrentLoom(
  state: CurrentLoomPuzzleState,
  channelIndex: number
): CurrentLoomTickResult {
  if (
    !Number.isInteger(channelIndex) ||
    channelIndex < 0 ||
    channelIndex >= CURRENT_LOOM_CHANNEL_COUNT
  ) {
    throw new Error('Current-Loom channel index must be between 0 and 4')
  }
  if (isCurrentLoomSolved(state)) return { state, hazardChannel: null }

  const projected = [...state.channels]
  projected[channelIndex] += 1
  const donors = donorsFor(channelIndex, state.tickCount)
  donors.forEach((index) => {
    projected[index] -= 1
  })

  const changed = [channelIndex, ...donors]
  const hazardChannel = changed.find(
    (index) => projected[index] <= CURRENT_LOOM_MIN || projected[index] >= CURRENT_LOOM_MAX
  )
  const channels =
    hazardChannel === undefined
      ? (projected as unknown as CurrentLoomChannels)
      : correctBoundary(projected, hazardChannel, projected[hazardChannel])

  if (sumChannels(channels) !== CURRENT_LOOM_TOTAL) {
    throw new Error('Current-Loom invariant violated: channel total must remain 25')
  }

  return {
    state: { channels, tickCount: state.tickCount + 1 },
    hazardChannel: hazardChannel ?? null,
  }
}

export function createCurrentLoomPuzzle(
  random: RandomSource = new RandomSource()
): CurrentLoomPuzzleState {
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const channels = Array.from(
      { length: CURRENT_LOOM_CHANNEL_COUNT },
      () => Math.floor(random.next() * 9) + 1
    )
    const total = sumChannels(channels)
    let difference = CURRENT_LOOM_TOTAL - total

    for (let index = 0; index < channels.length && difference !== 0; index += 1) {
      const room = difference > 0 ? 9 - channels[index] : channels[index] - 1
      const amount = Math.min(Math.abs(difference), room)
      channels[index] += difference > 0 ? amount : -amount
      difference += difference > 0 ? -amount : amount
    }

    if (
      difference === 0 &&
      channels.every((value) => value > CURRENT_LOOM_MIN && value < CURRENT_LOOM_MAX) &&
      !channels.every((value) => value === CURRENT_LOOM_SAFE_VALUE)
    ) {
      return { channels: channels as unknown as CurrentLoomChannels, tickCount: 0 }
    }
  }

  return { channels: [4, 6, 4, 6, 5], tickCount: 0 }
}

function applyCurrentLoomDamage(
  currentHP: number,
  damage: number,
  deathMessage: string,
  killerName: string,
  dispatch: GameDispatch,
  navigateToDeath: (route: string) => void
): number {
  const nextHP = Math.max(0, currentHP - damage)
  dispatch({ type: 'UPDATE_PLAYER', payload: { updates: { currentHP: nextHP } } })
  if (nextHP <= 0) {
    dispatch({
      type: 'GAME_OVER',
      payload: {
        message: deathMessage,
        killerName,
        suppressDeathDialog: true,
      },
    })
    navigateToDeath('/death')
  }
  return nextHP
}

export function applyCurrentLoomTickDrain(
  currentHP: number,
  dispatch: GameDispatch,
  navigateToDeath: (route: string) => void
): number {
  return applyCurrentLoomDamage(
    currentHP,
    CURRENT_LOOM_TICK_DAMAGE,
    CURRENT_LOOM_DRAIN_DEATH_MESSAGE,
    CURRENT_LOOM_DRAIN_KILLER_NAME,
    dispatch,
    navigateToDeath
  )
}

export function applyCurrentLoomHazard(
  currentHP: number,
  dispatch: GameDispatch,
  navigateToDeath: (route: string) => void
): number {
  return applyCurrentLoomDamage(
    currentHP,
    CURRENT_LOOM_HAZARD_DAMAGE,
    CURRENT_LOOM_DEATH_MESSAGE,
    CURRENT_LOOM_KILLER_NAME,
    dispatch,
    navigateToDeath
  )
}
