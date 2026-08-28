import { getPlayerHealthDisplay, getPlayerHealthPercentage } from '../playerHealthDisplay'

describe('player health display thresholds', () => {
  it.each([
    [51, 'healthy', '#44ff44'],
    [50, 'wounded', '#ffdd00'],
    [25, 'wounded', '#ffdd00'],
    [24, 'critical', '#ff8c00'],
    [10, 'critical', '#ff8c00'],
    [9, 'dire', '#ff4444'],
    [0, 'dire', '#ff4444'],
  ] as const)('maps %i%% to the %s band', (currentHP, band, color) => {
    expect(getPlayerHealthDisplay(currentHP, 100)).toEqual(expect.objectContaining({ band, color }))
  })

  it('clamps invalid and out-of-range health percentages', () => {
    expect(getPlayerHealthPercentage(120, 100)).toBe(1)
    expect(getPlayerHealthPercentage(-5, 100)).toBe(0)
    expect(getPlayerHealthPercentage(10, 0)).toBe(0)
  })

  it('escalates glow through the exact same health-band lookup', () => {
    const displays = [51, 50, 24, 9].map((hp) => getPlayerHealthDisplay(hp, 100))
    expect(displays.map(({ band }) => band)).toEqual(['healthy', 'wounded', 'critical', 'dire'])
    expect(displays.map(({ glow }) => glow.minOpacity)).toEqual([0.12, 0.22, 0.36, 0.55])
    expect(displays.map(({ glow }) => glow.maxOpacity)).toEqual([0.32, 0.52, 0.76, 1])
    expect(displays.map(({ glow }) => glow.halfCycleMs)).toEqual([450, 300, 170, 75])
    expect(displays.map(({ glow }) => glow.thickness)).toEqual([5, 6, 8, 10])
  })
})
