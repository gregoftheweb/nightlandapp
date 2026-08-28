export type PlayerHealthBand = 'healthy' | 'wounded' | 'critical' | 'dire'

export interface PlayerHealthDisplay {
  band: PlayerHealthBand
  color: string
  glow: {
    minOpacity: number
    maxOpacity: number
    halfCycleMs: number
    thickness: number
  }
}

const PLAYER_HEALTH_DISPLAY: Record<PlayerHealthBand, PlayerHealthDisplay> = {
  healthy: {
    band: 'healthy',
    color: '#44ff44',
    glow: { minOpacity: 0.12, maxOpacity: 0.32, halfCycleMs: 450, thickness: 5 },
  },
  wounded: {
    band: 'wounded',
    color: '#ffdd00',
    glow: { minOpacity: 0.22, maxOpacity: 0.52, halfCycleMs: 300, thickness: 6 },
  },
  critical: {
    band: 'critical',
    color: '#ff8c00',
    glow: { minOpacity: 0.36, maxOpacity: 0.76, halfCycleMs: 170, thickness: 8 },
  },
  dire: {
    band: 'dire',
    color: '#ff4444',
    glow: { minOpacity: 0.55, maxOpacity: 1, halfCycleMs: 75, thickness: 10 },
  },
}

export function getPlayerHealthPercentage(currentHP: number, maxHP: number): number {
  if (!Number.isFinite(currentHP) || !Number.isFinite(maxHP) || maxHP <= 0) return 0
  return Math.max(0, Math.min(1, currentHP / maxHP))
}

/** Green >50%; yellow 25–50%; orange 10–<25%; red <10%. */
export function getPlayerHealthDisplay(currentHP: number, maxHP: number): PlayerHealthDisplay {
  const percentage = getPlayerHealthPercentage(currentHP, maxHP)
  if (percentage > 0.5) return PLAYER_HEALTH_DISPLAY.healthy
  if (percentage >= 0.25) return PLAYER_HEALTH_DISPLAY.wounded
  if (percentage >= 0.1) return PLAYER_HEALTH_DISPLAY.critical
  return PLAYER_HEALTH_DISPLAY.dire
}
