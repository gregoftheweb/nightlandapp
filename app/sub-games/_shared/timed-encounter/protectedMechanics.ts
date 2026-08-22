import { calculateWeaponDamage } from '@modules/weaponStats'
import { BLOCK_SHIELD_CONFIG } from '../../jaunt-cave/_components/BlockShield'
import { DAEMON_SPRITE_TIMINGS } from '../../jaunt-cave/_components/DaemonSprite'
import { HIT_INDICATOR_CONFIG } from '../../jaunt-cave/_components/HitIndicator'
import { PROJECTILE_CONFIG } from '../../jaunt-cave/_components/ProjectileEffect'
import {
  BATTLE_TIMINGS,
  DAEMON_ATTACK_CHANCE,
  DAEMON_DAMAGE_MIN,
  DAEMON_DAMAGE_RANGE,
  DAEMON_HIT_CHANCE,
} from '../../jaunt-cave/_components/useBattleState'
import { timedEncounterHitGate } from '../../jaunt-cave/_components/useWeapon'

/** Immutable compatibility surface for the original Jaunt Cave battle. */
export const PROTECTED_TIMED_ENCOUNTER_MECHANICS = Object.freeze({
  stateSequence: [
    'RESTING',
    'PREP1',
    'PREP2',
    'teleport',
    'ATTACKING-or-LANDED',
    'crossfade',
  ] as const,
  attackChance: DAEMON_ATTACK_CHANCE,
  daemonHitChance: DAEMON_HIT_CHANCE,
  daemonDamageMin: DAEMON_DAMAGE_MIN,
  daemonDamageMax: DAEMON_DAMAGE_MIN + DAEMON_DAMAGE_RANGE - 1,
  preventsConsecutivePositionRepeat: true,
  blockWindow: 'PREP2-only',
  battleTimings: BATTLE_TIMINGS,
  projectileDuration: PROJECTILE_CONFIG.DEFAULT_DURATION,
  projectileFadeStartPercent: PROJECTILE_CONFIG.FADE_START_PERCENT,
  hitIndicatorDuration: HIT_INDICATOR_CONFIG.DURATION,
  hitIndicatorFadeOutDuration: HIT_INDICATOR_CONFIG.FADE_OUT_DURATION,
  shieldComponentDuration: BLOCK_SHIELD_CONFIG.DURATION,
  shieldFadeInDuration: BLOCK_SHIELD_CONFIG.FADE_IN_DURATION,
  shieldFadeOutDuration: BLOCK_SHIELD_CONFIG.FADE_OUT_DURATION,
  daemonSpriteTimings: DAEMON_SPRITE_TIMINGS,
  hitGate: timedEncounterHitGate,
  playerDamageFormula: calculateWeaponDamage,
  terminalArbitration: 'first-terminal-state-wins',
  lifecycleGuards: ['generation-token', 'mounted', 'focused', 'active-app-state'] as const,
})
