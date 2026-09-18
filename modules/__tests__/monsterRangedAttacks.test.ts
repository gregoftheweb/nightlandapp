import { getInitialState } from '../gameState'
import { createMonsterFromTemplate } from '../monsterUtils'
import {
  buildBileBeamAttack,
  distanceFromMonsterFootprint,
  doesBeamTouchPosition,
  executeMonsterRangedAttack,
} from '../monsterRangedAttacks'
import { moveMonsters } from '../movement'
import { reducer } from '../../state/reducer'

const slugAt = (row: number, col: number) => {
  const slug = createMonsterFromTemplate('giant_slug', { row, col })
  if (!slug) throw new Error('Giant Slug template is missing')
  return slug
}

describe('giant slug acid stomach bile', () => {
  it('measures range from the full three-by-two footprint', () => {
    const slug = slugAt(10, 10)

    expect(distanceFromMonsterFootprint(slug, { row: 10, col: 13 })).toBe(0.5)
    expect(buildBileBeamAttack(slug, { row: 10, col: 21 }, () => 0)).not.toBeNull()
    expect(buildBileBeamAttack(slug, { row: 10, col: 23 }, () => 0)).toBeNull()
  })

  it('recognizes when any part of a bile line crosses Christos’s cell', () => {
    expect(
      doesBeamTouchPosition({ row: 5.5, col: 2 }, { row: 5.5, col: 12 }, { row: 5, col: 8 })
    ).toBe(true)
    expect(
      doesBeamTouchPosition({ row: 3.5, col: 2 }, { row: 3.5, col: 12 }, { row: 5, col: 8 })
    ).toBe(false)
  })

  it('deals 15–35 damage and creates a two-second full-line beam', () => {
    const slug = slugAt(10, 10)
    const minimum = buildBileBeamAttack(
      slug,
      { row: 10, col: 18 },
      () => 0,
      () => 100
    )!
    const maximum = buildBileBeamAttack(
      slug,
      { row: 10, col: 18 },
      () => 0.999999,
      () => 100
    )!

    expect(minimum.damage).toBe(15)
    expect(maximum.damage).toBe(35)
    expect(minimum.projectile).toMatchObject({
      kind: 'bile-beam',
      color: '#5dff28',
      durationMs: 2000,
      stationaryFade: true,
    })
  })

  it('damages Christos immediately when the beam crosses him', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    state.player.position = { row: 10, col: 18 }
    const slug = slugAt(10, 10)
    const dispatch = jest.fn()

    expect(executeMonsterRangedAttack(state, slug, state.player.position, dispatch, () => 0)).toBe(
      true
    )
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_PROJECTILE',
        payload: expect.objectContaining({ kind: 'bile-beam', durationMs: 2000 }),
      })
    )
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PLAYER',
      payload: { updates: { currentHP: 85 } },
    })
  })

  it('moves only every other turn so Christos can outrun it', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    state.player.position = { row: 100, col: 100 }
    state.activeMonsters = [slugAt(80, 80)]
    const dispatch = jest.fn()

    state.moveCount = 1
    moveMonsters(state, dispatch)
    expect(dispatch).not.toHaveBeenCalled()

    state.moveCount = 2
    moveMonsters(state, dispatch)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'MOVE_MONSTER',
      payload: { id: state.activeMonsters[0].id, position: { row: 81, col: 81 } },
    })
  })

  it('faces the horizontal direction it last moved', () => {
    const state = getInitialState('1', { skipGameboardLayout: true })
    const slug = slugAt(80, 80)
    state.activeMonsters = [slug]

    const movedLeft = reducer(state, {
      type: 'MOVE_MONSTER',
      payload: { id: slug.id, position: { row: 80, col: 79 } },
    })
    expect(movedLeft.activeMonsters[0].facingLeft).toBe(true)

    const movedVertically = reducer(movedLeft, {
      type: 'MOVE_MONSTER',
      payload: { id: slug.id, position: { row: 79, col: 79 } },
    })
    expect(movedVertically.activeMonsters[0].facingLeft).toBe(true)

    const movedRight = reducer(movedVertically, {
      type: 'MOVE_MONSTER',
      payload: { id: slug.id, position: { row: 79, col: 80 } },
    })
    expect(movedRight.activeMonsters[0].facingLeft).toBe(false)
  })
})
