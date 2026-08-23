import { RUNE_ALPHABET } from '../runeAlphabet'

describe('RUNE_ALPHABET', () => {
  test('permanently maps A-Z one-to-one into the Unicode Runic block', () => {
    expect(Object.keys(RUNE_ALPHABET)).toEqual('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))

    const runes = Object.values(RUNE_ALPHABET)
    expect(new Set(runes).size).toBe(26)
    expect(
      runes.every((rune) => {
        const codePoint = rune.codePointAt(0)
        return codePoint !== undefined && codePoint >= 0x16a0 && codePoint <= 0x16ff
      })
    ).toBe(true)
  })
})
