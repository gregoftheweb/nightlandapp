import { RUNE_ALPHABET, type RuneAlphabetLetter } from '@config/runeAlphabet'
import { RandomSource } from '@modules/gameboardLayout'

export const RUNE_OBELISK_CATEGORIES = {
  vowels: 'AEIOUY',
  soft: 'FHLMNRSVWZ',
  hard: 'BCDGJKPQTX',
} as const

export type RuneObeliskCategory = keyof typeof RUNE_OBELISK_CATEGORIES

export const RUNE_OBELISK_CATEGORY_ORDER: readonly RuneObeliskCategory[] = [
  'vowels',
  'soft',
  'hard',
]

export const RUNE_OBELISK_CATEGORY_POSITIONS: Record<RuneObeliskCategory, readonly number[]> = {
  vowels: [0, 4, 8, 14, 20, 24],
  soft: [5, 7, 11, 12, 13, 17, 18, 21, 22, 25],
  hard: [1, 2, 3, 6, 9, 10, 15, 16, 19, 23],
}

export const RUNE_OBELISK_CATEGORY_RUNES: Record<RuneObeliskCategory, string> = {
  vowels: RUNE_ALPHABET.V,
  soft: RUNE_ALPHABET.S,
  hard: RUNE_ALPHABET.H,
}

export const RUNE_OBELISK_STOP_RUNES = 'ABCDEFGH'
  .split('')
  .map((letter) => RUNE_ALPHABET[letter as RuneAlphabetLetter])

export interface RuneObeliskCategoryState {
  arrangements: readonly string[]
  correctPosition: number
}

export interface RuneObeliskPuzzleState {
  activeCategory: RuneObeliskCategory
  categories: Record<RuneObeliskCategory, RuneObeliskCategoryState>
  positions: Record<RuneObeliskCategory, number>
}

function shuffle(value: string, random: RandomSource): string {
  const letters = value.split('')
  for (let index = letters.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1))
    ;[letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]]
  }
  return letters.join('')
}

function wrongArrangements(correct: string, random: RandomSource): string[] {
  const wrong = new Set<string>()
  for (let attempt = 0; attempt < 128 && wrong.size < 7; attempt += 1) {
    const candidate = shuffle(correct, random)
    if (candidate !== correct) wrong.add(candidate)
  }

  for (let left = 0; left < correct.length && wrong.size < 7; left += 1) {
    for (let right = left + 1; right < correct.length && wrong.size < 7; right += 1) {
      const letters = correct.split('')
      ;[letters[left], letters[right]] = [letters[right], letters[left]]
      wrong.add(letters.join(''))
    }
  }
  return [...wrong].slice(0, 7)
}

function createCategoryState(
  category: RuneObeliskCategory,
  random: RandomSource
): RuneObeliskCategoryState {
  const correct = RUNE_OBELISK_CATEGORIES[category]
  const arrangements = [correct, ...wrongArrangements(correct, random)]

  for (let index = arrangements.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1))
    ;[arrangements[index], arrangements[swapIndex]] = [arrangements[swapIndex], arrangements[index]]
  }

  return { arrangements, correctPosition: arrangements.indexOf(correct) }
}

export function createRuneObeliskPuzzle(
  random: RandomSource = new RandomSource()
): RuneObeliskPuzzleState {
  const categories = {
    vowels: createCategoryState('vowels', random),
    soft: createCategoryState('soft', random),
    hard: createCategoryState('hard', random),
  }

  return {
    activeCategory: 'vowels',
    categories,
    positions: {
      vowels: (categories.vowels.correctPosition + 1) % 8,
      soft: (categories.soft.correctPosition + 1) % 8,
      hard: (categories.hard.correctPosition + 1) % 8,
    },
  }
}

export function selectRuneObeliskCategory(
  state: RuneObeliskPuzzleState,
  activeCategory: RuneObeliskCategory
): RuneObeliskPuzzleState {
  return { ...state, activeCategory }
}

export function setRuneObeliskPosition(
  state: RuneObeliskPuzzleState,
  category: RuneObeliskCategory,
  position: number
): RuneObeliskPuzzleState {
  return { ...state, positions: { ...state.positions, [category]: position } }
}

export function isRuneObeliskSolved(state: RuneObeliskPuzzleState): boolean {
  return RUNE_OBELISK_CATEGORY_ORDER.every(
    (category) => state.positions[category] === state.categories[category].correctPosition
  )
}

export function getRuneObeliskEnglishInscription(state: RuneObeliskPuzzleState): string {
  const inscription = Array<string>(26)
  for (const category of RUNE_OBELISK_CATEGORY_ORDER) {
    const arrangement = state.categories[category].arrangements[state.positions[category]]
    RUNE_OBELISK_CATEGORY_POSITIONS[category].forEach((alphabetPosition, categoryPosition) => {
      inscription[alphabetPosition] = arrangement[categoryPosition]
    })
  }
  return inscription.join('')
}

export function toRunicInscription(english: string): string {
  return [...english]
    .map((letter) =>
      letter === '\n' ? letter : (RUNE_ALPHABET[letter as RuneAlphabetLetter] ?? letter)
    )
    .join('')
}
