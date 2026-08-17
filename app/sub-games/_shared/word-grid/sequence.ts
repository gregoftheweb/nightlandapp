export type WordGridSequenceOutcome = 'continue' | 'failure' | 'success'

export interface WordGridSequenceResult {
  sequence: string[]
  outcome: WordGridSequenceOutcome
}

export function appendWordGridLetter(
  currentSequence: readonly string[],
  letter: string,
  targetSequence: readonly string[]
): WordGridSequenceResult {
  const sequence = [...currentSequence, letter]
  const index = sequence.length - 1

  if (sequence[index] !== targetSequence[index]) return { sequence, outcome: 'failure' }
  if (sequence.length === targetSequence.length) return { sequence, outcome: 'success' }
  return { sequence, outcome: 'continue' }
}
