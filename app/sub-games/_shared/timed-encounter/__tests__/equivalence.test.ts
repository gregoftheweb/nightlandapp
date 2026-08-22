import { calculateWeaponDamage } from '@modules/weaponStats'
import { DaemonState } from '../../../jaunt-cave/_components/useBattleState'
import { resolveParsedTimedEncounter, TIMED_ENCOUNTER_SHAPE_ADAPTER } from '../contentCatalog'
import { PROTECTED_TIMED_ENCOUNTER_MECHANICS as mechanics } from '../protectedMechanics'
import { normalizeTimedEncounterInstanceId } from '../routing'
import { jauntCaveContent } from '../content/jauntCave'
import { jauntCave02Content } from '../content/jauntCave02'

describe('timed-encounter extraction equivalence', () => {
  it('preserves every protected Jaunt Cave mechanical value', () => {
    expect({ ...mechanics, hitGate: undefined, playerDamageFormula: undefined }).toEqual({
      stateSequence: ['RESTING', 'PREP1', 'PREP2', 'teleport', 'ATTACKING-or-LANDED', 'crossfade'],
      attackChance: 0.6,
      daemonHitChance: 0.8,
      daemonDamageMin: 9,
      daemonDamageMax: 23,
      preventsConsecutivePositionRepeat: true,
      blockWindow: 'PREP2-only',
      battleTimings: {
        RESTING_MIN: 3000,
        RESTING_MAX: 7000,
        PREP1: 500,
        PREP2: 200,
        LANDED: 800,
        ATTACK: 750,
        TRANSITION_TO_RESTING: 400,
        BLOCK_SHIELD_VISUAL_DURATION: 900,
        DAEMON_DEATH_NAVIGATION_DELAY: 400,
      },
      projectileDuration: 250,
      projectileFadeStartPercent: 0.9,
      hitIndicatorDuration: 600,
      hitIndicatorFadeOutDuration: 200,
      shieldComponentDuration: 1000,
      shieldFadeInDuration: 150,
      shieldFadeOutDuration: 200,
      daemonSpriteTimings: {
        GLOW_HALF_CYCLE: 300,
        FIZZLE: 300,
        BRIGHTNESS_BURST: 400,
        CROSSFADE: 400,
      },
      hitGate: undefined,
      playerDamageFormula: undefined,
      terminalArbitration: 'first-terminal-state-wins',
      lifecycleGuards: ['generation-token', 'mounted', 'focused', 'active-app-state'],
    })
    expect(mechanics.playerDamageFormula).toBe(calculateWeaponDamage)
    expect(mechanics.hitGate(DaemonState.LANDED, 'left', 'left')).toBe(true)
    expect(mechanics.hitGate(DaemonState.LANDED, 'left', 'right')).toBe(false)
    expect(mechanics.hitGate(DaemonState.PREP2, 'left', 'left')).toBe(false)
  })

  it('parses the original instance content and lifecycle exactly', () => {
    const parsed = resolveParsedTimedEncounter('jaunt-cave')
    expect(parsed.definition).toEqual(
      expect.objectContaining({
        instanceId: 'jaunt-cave',
        shapeId: 'timed-encounter',
        entryRoute: '/sub-games/jaunt-cave/jaunt-cave',
        title: 'Cave of the daemon of the walking shadows',
        lifecycle: expect.objectContaining({
          waypoint: { createsWaypoint: false },
          revisit: 'aftermath-screen',
          reward: {
            kind: 'jaunt-crystal-grant',
            grantEvent: 'Player confirms victory',
            idempotent: true,
          },
        }),
      })
    )
    expect(parsed.definition.lifecycle.failure).toEqual({
      exit: 'death',
      message: 'The Jaunt Daemon has slain Christos.',
      killerName: 'Jaunt Daemon',
      suppressDeathDialog: false,
      deathRoute: '/death',
    })
    expect(parsed.definition.lifecycle.aftermathRoute).toBe(
      '/sub-games/jaunt-cave/jaunt-cave/aftermath'
    )
    expect(jauntCaveContent.lifecycle).not.toHaveProperty('aftermathRoute')
    expect(TIMED_ENCOUNTER_SHAPE_ADAPTER.routes('another-cave')).toEqual({
      entry: '/sub-games/jaunt-cave/another-cave',
      success: '/sub-games/jaunt-cave/another-cave/victory',
      aftermath: '/sub-games/jaunt-cave/another-cave/aftermath',
    })
    expect(normalizeTimedEncounterInstanceId(['another-cave'])).toBe('another-cave')
  })

  it('derives distinct aftermath routes for distinct instanceIds', () => {
    const first = TIMED_ENCOUNTER_SHAPE_ADAPTER.parse(jauntCaveContent)
    const second = TIMED_ENCOUNTER_SHAPE_ADAPTER.parse({
      ...jauntCaveContent,
      instanceId: 'jaunt-cave-02',
    })
    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    if (!first.success || !second.success) return
    expect(first.value.definition.lifecycle.aftermathRoute).toBe(
      '/sub-games/jaunt-cave/jaunt-cave/aftermath'
    )
    expect(second.value.definition.lifecycle.aftermathRoute).toBe(
      '/sub-games/jaunt-cave/jaunt-cave-02/aftermath'
    )
    expect(first.value.definition.lifecycle.aftermathRoute).not.toBe(
      second.value.definition.lifecycle.aftermathRoute
    )
  })

  it('resolves jaunt-cave-02 with identical content and its own derived routes', () => {
    const { instanceId: firstId, ...firstContent } = jauntCaveContent
    const { instanceId: secondId, ...secondContent } = jauntCave02Content
    expect(firstId).toBe('jaunt-cave')
    expect(secondId).toBe('jaunt-cave-02')
    expect(secondContent).toEqual(firstContent)
    expect(jauntCave02Content.lifecycle).not.toHaveProperty('aftermathRoute')

    const first = resolveParsedTimedEncounter('jaunt-cave')
    const second = resolveParsedTimedEncounter('jaunt-cave-02')
    const { instanceId: _firstConfigId, ...firstConfig } = first.shapeConfig
    const { instanceId: _secondConfigId, ...secondConfig } = second.shapeConfig
    expect(secondConfig).toEqual(firstConfig)
    expect(second.definition.entryRoute).toBe('/sub-games/jaunt-cave/jaunt-cave-02')
    expect(second.definition.lifecycle.aftermathRoute).toBe(
      '/sub-games/jaunt-cave/jaunt-cave-02/aftermath'
    )
    expect(second.definition.lifecycle.aftermathRoute).not.toBe(
      first.definition.lifecycle.aftermathRoute
    )
  })
})
