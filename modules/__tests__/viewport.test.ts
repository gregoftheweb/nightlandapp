import { calculateGameViewport } from '../viewport'

describe('calculateGameViewport', () => {
  it('fits whole cells inside the safe area and centers the board', () => {
    expect(calculateGameViewport(390, 844, { top: 47, right: 0, bottom: 34, left: 0 })).toEqual({
      rows: 23,
      cols: 12,
      width: 384,
      height: 736,
      left: 3,
      top: 60.5,
    })
  })

  it('recalculates rows and columns for a landscape safe area', () => {
    expect(calculateGameViewport(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })).toEqual({
      rows: 11,
      cols: 23,
      width: 736,
      height: 352,
      left: 54,
      top: 8.5,
    })
  })
})
