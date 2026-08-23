import type { GameState } from '@config/types'
import { collectible } from '@config/objects'
import type { SubGameInstanceDefinition } from '@config/subGames'
import {
  resolveMessageEffectDisplay,
  type MessageEffectDisplay,
} from '@modules/messageEffectDisplay'

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

export function resolveWordGridRewardMessageDisplay(
  state: GameState,
  definition: SubGameInstanceDefinition | undefined,
  fallbackText: string
): MessageEffectDisplay {
  const reward = definition?.lifecycle.reward
  if (!reward || reward.kind !== 'item') return { text: fallbackText }

  const item = Object.entries(collectible).find(
    ([key, candidate]) =>
      candidate.id === reward.id ||
      candidate.shortName === reward.id ||
      toKebabCase(key) === reward.id ||
      (candidate.shortName ? toKebabCase(candidate.shortName) === reward.id : false)
  )?.[1]
  const effect = item?.effects?.find((candidate) => candidate.type === 'showMessage')
  return effect ? resolveMessageEffectDisplay(state, effect, reward.id) : { text: fallbackText }
}
