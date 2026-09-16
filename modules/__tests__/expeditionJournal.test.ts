import { deriveExpeditionJournal } from '../expeditionJournal'
import { getInitialState } from '../gameState'

describe('deriveExpeditionJournal', () => {
  it('directs a fresh expedition to its first trace', () => {
    const model = deriveExpeditionJournal(getInitialState('1', { skipGameboardLayout: true }))

    expect(model.objective.title).toBe('Follow the green trace')
    expect(model.discoveries).toEqual([])
    expect(model.condition).toBe('STEADY')
  })

  it('turns completed encounters into knowledge and a new purpose', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    state.subGamesCompleted = {
      'word-tile-crypt-01': true,
      'hermit-hollow': true,
      'word-tile-crypt-02': true,
      'current-loom-01': true,
      'current-loom-03': true,
    }

    const model = deriveExpeditionJournal(state)

    expect(model.objective.title).toBe('Wake the Current Looms')
    expect(model.objective.progress).toBe('2 / 5 resonating')
    expect(model.discoveries.map((entry) => entry.id)).toEqual([
      'tesseract',
      'hermit',
      'salamander',
      'looms',
    ])
  })

  it('marks a badly wounded pilgrim as dire', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    state.player.currentHP = 20

    expect(deriveExpeditionJournal(state).condition).toBe('DIRE')
  })
})
