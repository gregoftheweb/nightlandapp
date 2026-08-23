import type { Effect, Item } from '@config/types'
import { collectible, SALAMANDER_LETTER_TEXT } from '@config/objects'
import { createInitialGameState } from '@modules/gameState'
import { applyItem } from '@modules/effects'
import { resolveMessageEffectDisplay } from '@modules/messageEffectDisplay'
import { resolveParsedWordGridEncounter } from '../../app/sub-games/_shared/word-grid/contentCatalog'
import { resolveWordGridRewardMessageDisplay } from '../../app/sub-games/_shared/word-grid/rewardMessageDisplay'

const persiusEffect = collectible.persiusScroll.effects?.[0] as Extract<
  Effect,
  { type: 'showMessage' }
>
const salamanderEffect = collectible.salamanderLetter.effects?.[0] as Extract<
  Effect,
  { type: 'showMessage' }
>

describe('rune-locked message display', () => {
  test('returns real text unchanged when no gate is configured', () => {
    const state = createInitialGameState()
    expect(resolveMessageEffectDisplay(state, persiusEffect, 'persius-scroll')).toEqual({
      text: persiusEffect.message,
    })
  })

  test('returns real text unchanged when the configured player flag is true', () => {
    const state = createInitialGameState()
    state.player.runeCipherLearned = true
    expect(resolveMessageEffectDisplay(state, salamanderEffect, 'salamander-letter')).toEqual({
      text: SALAMANDER_LETTER_TEXT,
    })
  })

  test('returns deterministic runic gibberish with preserved whitespace while locked', () => {
    const state = createInitialGameState()
    const first = resolveMessageEffectDisplay(state, salamanderEffect, 'salamander-letter')
    const second = resolveMessageEffectDisplay(state, salamanderEffect, 'salamander-letter')

    expect(first).toEqual(second)
    expect(first.fontFamily).toBe('NotoSansRunic')
    expect(first.text).not.toBe(SALAMANDER_LETTER_TEXT)
    expect(first.text.replace(/\S/gu, '')).toBe(SALAMANDER_LETTER_TEXT.replace(/\S/gu, ''))
  })

  test('leaves Persius scroll output byte-for-byte unchanged', () => {
    const state = createInitialGameState()
    const display = resolveMessageEffectDisplay(state, persiusEffect, 'persius-scroll')
    expect(display.text).toBe(persiusEffect.message)
    expect(display.fontFamily).toBeUndefined()
  })

  test.each([false, true])(
    'inventory and word-grid success paths resolve identical output when learned=%s',
    (runeCipherLearned) => {
      const state = createInitialGameState()
      state.player.runeCipherLearned = runeCipherLearned
      const item = { ...collectible.salamanderLetter, id: 'salamander-letter' } as Item
      const showDialog = jest.fn()
      applyItem(item, state, jest.fn(), showDialog)

      const parsed = resolveParsedWordGridEncounter('word-tile-crypt-02')
      const modalDisplay = resolveWordGridRewardMessageDisplay(
        state,
        parsed.definition,
        SALAMANDER_LETTER_TEXT
      )

      expect(showDialog).toHaveBeenCalledWith(modalDisplay.text, 5000, modalDisplay.fontFamily)
    }
  )
})
