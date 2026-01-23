// app/sub-games/tesseract/__tests__/spelling.test.ts
import { getLetterForTile } from '../tiles'

describe('Tesseract Spelling', () => {
  describe('Letter Mapping', () => {
    it('should return correct letters for grid positions', () => {
      // Row 0: Z T V A N
      expect(getLetterForTile(0, 0)).toBe('Z')
      expect(getLetterForTile(0, 1)).toBe('T')
      expect(getLetterForTile(0, 2)).toBe('V')
      expect(getLetterForTile(0, 3)).toBe('A')
      expect(getLetterForTile(0, 4)).toBe('N')
      
      // Row 1: L G R E Y
      expect(getLetterForTile(1, 0)).toBe('L')
      expect(getLetterForTile(1, 1)).toBe('G')
      expect(getLetterForTile(1, 2)).toBe('R')
      expect(getLetterForTile(1, 3)).toBe('E')
      expect(getLetterForTile(1, 4)).toBe('Y')
      
      // Row 2: W P S T H
      expect(getLetterForTile(2, 0)).toBe('W')
      expect(getLetterForTile(2, 1)).toBe('P')
      expect(getLetterForTile(2, 2)).toBe('S')
      expect(getLetterForTile(2, 3)).toBe('T')
      expect(getLetterForTile(2, 4)).toBe('H')
      
      // Row 3: D < T O M
      expect(getLetterForTile(3, 0)).toBe('D')
      expect(getLetterForTile(3, 1)).toBe('<')
      expect(getLetterForTile(3, 2)).toBe('T')
      expect(getLetterForTile(3, 3)).toBe('O')
      expect(getLetterForTile(3, 4)).toBe('M')
      
      // Row 4: E C H R Z
      expect(getLetterForTile(4, 0)).toBe('E')
      expect(getLetterForTile(4, 1)).toBe('C')
      expect(getLetterForTile(4, 2)).toBe('H')
      expect(getLetterForTile(4, 3)).toBe('R')
      expect(getLetterForTile(4, 4)).toBe('Z')
    })
    
    it('should return empty string for out of bounds positions', () => {
      expect(getLetterForTile(-1, 0)).toBe('')
      expect(getLetterForTile(0, -1)).toBe('')
      expect(getLetterForTile(5, 0)).toBe('')
      expect(getLetterForTile(0, 5)).toBe('')
    })
  })
  
  describe('TESERACT Solution Path', () => {
    it('should verify that TESERACT is solvable with the grid', () => {
      // One valid solution path for T-E-S-E-R-A-C-T
      const targetWord = ['T', 'E', 'S', 'E', 'R', 'A', 'C', 'T']
      
      // One possible solution:
      // T(0,1) -> E(1,3) -> S(2,2) -> E(4,0) -> R(1,2) -> A(0,3) -> C(4,1) -> T(2,3)
      const solutionPath = [
        { row: 0, col: 1 }, // T
        { row: 1, col: 3 }, // E
        { row: 2, col: 2 }, // S
        { row: 4, col: 0 }, // E (second E)
        { row: 1, col: 2 }, // R
        { row: 0, col: 3 }, // A
        { row: 4, col: 1 }, // C
        { row: 2, col: 3 }, // T
      ]
      
      // Verify each step matches the target word
      solutionPath.forEach((pos, index) => {
        const letter = getLetterForTile(pos.row, pos.col)
        expect(letter).toBe(targetWord[index])
      })
      
      // Verify no duplicate positions (each tile used only once)
      const positions = solutionPath.map(p => `${p.row},${p.col}`)
      const uniquePositions = new Set(positions)
      expect(uniquePositions.size).toBe(solutionPath.length)
    })
  })
})
