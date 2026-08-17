import { getGridLetter } from '../../_shared/word-grid/geometry'
import { appendWordGridLetter } from '../../_shared/word-grid/sequence'
import { tesseractWordGridConfig } from '../wordGridConfig'

describe('Tesseract spelling instance', () => {
  it('retains the exact TESSERACT target and valid no-reuse solution path', () => {
    const config = tesseractWordGridConfig
    expect(config.targetSequence.join('')).toBe('TESSERACT')

    const solutionPath = [
      [0, 1],
      [1, 3],
      [2, 2],
      [4, 4],
      [4, 0],
      [1, 2],
      [0, 3],
      [4, 1],
      [2, 3],
    ] as const
    const letters = solutionPath.map(([row, col]) => getGridLetter(config.letters, row, col))
    expect(letters).toEqual(config.targetSequence)
    expect(new Set(solutionPath.map(([row, col]) => `${row},${col}`)).size).toBe(
      solutionPath.length
    )
  })

  it('completes only on the final correct letter and fails immediately on a wrong letter', () => {
    const target = tesseractWordGridConfig.targetSequence
    let sequence: string[] = []

    target.forEach((letter, index) => {
      const result = appendWordGridLetter(sequence, letter, target)
      sequence = result.sequence
      expect(result.outcome).toBe(index === target.length - 1 ? 'success' : 'continue')
    })

    expect(appendWordGridLetter([], 'Z', target).outcome).toBe('failure')
  })
})
