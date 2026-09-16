import type { GameState } from '@config/types'

export interface JournalObjective {
  title: string
  detail: string
  progress?: string
}

export interface JournalDiscovery {
  id: string
  title: string
  text: string
}

export interface ExpeditionJournalModel {
  objective: JournalObjective
  discoveries: JournalDiscovery[]
  condition: 'STEADY' | 'WOUNDED' | 'DIRE'
  completedEncounters: number
  loomCount: number
}

const LOOM_IDS = [
  'current-loom-01',
  'current-loom-02',
  'current-loom-03',
  'current-loom-04',
  'current-loom-05',
] as const

function isComplete(flags: Record<string, boolean> | undefined, id: string): boolean {
  return flags?.[id] === true
}

function getObjective(state: GameState, loomCount: number): JournalObjective {
  const flags = state.subGamesCompleted

  if (!isComplete(flags, 'word-tile-crypt-01')) {
    return {
      title: 'Follow the green trace',
      detail: 'A deliberate trail leaves the Redoubt. Find what made it and examine every mark.',
    }
  }
  if (!isComplete(flags, 'hermit-hollow')) {
    return {
      title: 'Seek a living witness',
      detail: 'The first tablet names impossible geometry. Someone in the Night may know why.',
    }
  }
  if (!isComplete(flags, 'word-tile-crypt-02')) {
    return {
      title: "Follow the Salamander's sign",
      detail:
        'The Hermit spoke of a maker who bent the Earth-Current. Search farther along the trail.',
    }
  }
  if (loomCount < LOOM_IDS.length) {
    return {
      title: 'Wake the Current Looms',
      detail:
        'Five stations regulate one buried machine. Branch paths may conceal what the main trail does not.',
      progress: `${loomCount} / ${LOOM_IDS.length} resonating`,
    }
  }
  if (!state.player.runeCipherLearned) {
    return {
      title: 'Learn the old hand',
      detail: 'The Night is full of writing that refuses to be read. Find the standing rune-stone.',
    }
  }
  if (!isComplete(flags, 'deep-silo')) {
    return {
      title: 'Descend into the Deep Silo',
      detail:
        'The five Looms answer one another. Return to the sealed station and follow their current below.',
    }
  }
  return {
    title: 'Find Persius before the silence does',
    detail: 'The Diskos carries the deep current now. Continue toward the House of Silence.',
  }
}

export function deriveExpeditionJournal(state: GameState): ExpeditionJournalModel {
  const flags = state.subGamesCompleted
  const loomCount = LOOM_IDS.filter((id) => isComplete(flags, id)).length
  const discoveries: JournalDiscovery[] = []

  if (isComplete(flags, 'word-tile-crypt-01')) {
    discoveries.push({
      id: 'tesseract',
      title: 'The Tesseract',
      text: 'Persius followed references to a shape that is also a passage. The earliest tablet was left to be found.',
    })
  }
  if (isComplete(flags, 'hermit-hollow')) {
    discoveries.push({
      id: 'hermit',
      title: "The Hermit's silence",
      text: 'Stillness can make the mind invisible to lesser things. The Hermit connected Persius to the Salamander.',
    })
  }
  if (isComplete(flags, 'word-tile-crypt-02')) {
    discoveries.push({
      id: 'salamander',
      title: 'The Salamander',
      text: 'A maker of weapons and Current-machines passed this way. The Diskos may be part of his unfinished design.',
    })
  }
  if (loomCount > 0) {
    discoveries.push({
      id: 'looms',
      title: 'The Earth-Current',
      text: `${loomCount} of 5 Current Looms resonate. Their pulses converge beneath the Deep Silo.`,
    })
  }
  if (state.player.jauntUnlocked) {
    discoveries.push({
      id: 'jaunt',
      title: 'The space between steps',
      text: 'Jaunt crystals fold a short distance at terrible speed. Their charge is finite; their destination must be chosen.',
    })
  }
  if (state.player.runeCipherLearned) {
    discoveries.push({
      id: 'runes',
      title: 'The old hand',
      text: 'The marks have not changed, yet they now carry meaning. Earlier inscriptions may reveal a second message.',
    })
  }

  const hpRatio = state.player.maxHP > 0 ? state.player.currentHP / state.player.maxHP : 0
  const condition = hpRatio <= 0.25 ? 'DIRE' : hpRatio <= 0.6 ? 'WOUNDED' : 'STEADY'
  const completedEncounters = new Set(
    state.encounterPlacements
      .map((placement) => placement.instanceId)
      .filter((instanceId) => isComplete(flags, instanceId))
  ).size

  return {
    objective: getObjective(state, loomCount),
    discoveries,
    condition,
    completedEncounters,
    loomCount,
  }
}
