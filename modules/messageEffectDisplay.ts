import type { Effect, GameState } from '@config/types'
import { RUNE_ALPHABET } from '@config/runeAlphabet'
import { RandomSource } from './gameboardLayout'

export type ShowMessageEffect = Extract<Effect, { type: 'showMessage' }>

export interface MessageEffectDisplay {
  text: string
  fontFamily?: string
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 0x100000000
  }
}

export function resolveMessageEffectDisplay(
  state: GameState,
  effect: ShowMessageEffect,
  itemId?: string
): MessageEffectDisplay {
  if (!effect.lockedUntilFlag || state.player[effect.lockedUntilFlag] === true) {
    return { text: effect.message }
  }

  const seed = effect.lockedSeed ?? itemId ?? effect.message
  const random = new RandomSource(seededRandom(hashString(seed)))
  const runes = Object.values(RUNE_ALPHABET)
  const text = [...effect.message]
    .map((character) => {
      if (/\s/u.test(character)) return character
      return runes[Math.floor(random.next() * runes.length)]
    })
    .join('')

  return { text, fontFamily: 'NotoSansRunic' }
}
