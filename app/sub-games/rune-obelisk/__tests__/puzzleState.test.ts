import { RandomSource } from '@modules/gameboardLayout'
import {
  createRuneObeliskPuzzle,
  getRuneObeliskEnglishInscription,
  isRuneObeliskSolved,
  RUNE_OBELISK_CATEGORY_ORDER,
  RUNE_OBELISK_CATEGORIES,
  RUNE_OBELISK_CATEGORY_POSITIONS,
  selectRuneObeliskCategory,
  setRuneObeliskPosition,
} from '../puzzleState'

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

describe('rune obelisk puzzle state', () => {
  test('creates exactly one correct and seven unique wrong stops per category', () => {
    const state = createRuneObeliskPuzzle(new RandomSource(seededRandom(41)))

    for (const category of RUNE_OBELISK_CATEGORY_ORDER) {
      const generated = state.categories[category]
      expect(generated.arrangements).toHaveLength(8)
      expect(new Set(generated.arrangements).size).toBe(8)
      expect(
        generated.arrangements.filter((value) => value === RUNE_OBELISK_CATEGORIES[category])
      ).toHaveLength(1)
    }
  })

  test('fresh encounter entries regenerate their wrong arrangements', () => {
    const first = createRuneObeliskPuzzle(new RandomSource(seededRandom(1)))
    const second = createRuneObeliskPuzzle(new RandomSource(seededRandom(2)))

    expect(second.categories).not.toEqual(first.categories)
  })

  test('preserves each category position while switching the active button', () => {
    let state = createRuneObeliskPuzzle(new RandomSource(seededRandom(7)))
    state = setRuneObeliskPosition(state, 'vowels', 5)
    state = selectRuneObeliskCategory(state, 'soft')
    state = setRuneObeliskPosition(state, 'soft', 3)
    state = selectRuneObeliskCategory(state, 'vowels')

    expect(state.activeCategory).toBe('vowels')
    expect(state.positions).toEqual(expect.objectContaining({ vowels: 5, soft: 3 }))
  })

  test('requires all three categories to be correct simultaneously', () => {
    let state = createRuneObeliskPuzzle(new RandomSource(seededRandom(11)))

    for (const category of RUNE_OBELISK_CATEGORY_ORDER.slice(0, 2)) {
      state = setRuneObeliskPosition(state, category, state.categories[category].correctPosition)
    }
    expect(isRuneObeliskSolved(state)).toBe(false)

    state = setRuneObeliskPosition(state, 'hard', state.categories.hard.correctPosition)
    expect(isRuneObeliskSolved(state)).toBe(true)

    state = setRuneObeliskPosition(
      state,
      'vowels',
      (state.categories.vowels.correctPosition + 1) % 8
    )
    expect(isRuneObeliskSolved(state)).toBe(false)
  })

  test('interleaves each selected category arrangement into true alphabetical positions', () => {
    const state = createRuneObeliskPuzzle(new RandomSource(seededRandom(19)))
    const vowels = state.categories.vowels.arrangements[state.positions.vowels]
    const inscription = getRuneObeliskEnglishInscription(state)

    expect(inscription).toHaveLength(26)
    RUNE_OBELISK_CATEGORY_POSITIONS.vowels.forEach((position, index) => {
      expect(inscription[position]).toBe(vowels[index])
    })
  })

  test('matches the worked vowel-permutation example', () => {
    const generated = createRuneObeliskPuzzle(new RandomSource(seededRandom(21)))
    const state = {
      ...generated,
      categories: {
        ...generated.categories,
        vowels: { arrangements: ['IOUAEY'], correctPosition: 1 },
      },
      positions: {
        vowels: 0,
        soft: generated.categories.soft.correctPosition,
        hard: generated.categories.hard.correctPosition,
      },
    }

    expect(getRuneObeliskEnglishInscription(state)).toBe('IBCDOFGHUJKLMNAPQRSTEVWXYZ')
  })

  test('changing one category changes only its owned positions', () => {
    const before = createRuneObeliskPuzzle(new RandomSource(seededRandom(23)))
    const after = setRuneObeliskPosition(before, 'vowels', (before.positions.vowels + 1) % 8)
    const beforeText = getRuneObeliskEnglishInscription(before)
    const afterText = getRuneObeliskEnglishInscription(after)

    for (let position = 0; position < 26; position += 1) {
      if (!RUNE_OBELISK_CATEGORY_POSITIONS.vowels.includes(position)) {
        expect(afterText[position]).toBe(beforeText[position])
      }
    }
  })

  test('the solved state displays the complete alphabet', () => {
    let state = createRuneObeliskPuzzle(new RandomSource(seededRandom(29)))
    for (const category of RUNE_OBELISK_CATEGORY_ORDER) {
      state = setRuneObeliskPosition(state, category, state.categories[category].correctPosition)
    }

    expect(getRuneObeliskEnglishInscription(state)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  })
})
