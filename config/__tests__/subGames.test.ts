import {
  SUB_GAMES,
  createSubGameRegistry,
  getSubGameDefinition,
  type SubGameInstanceDefinition,
} from '../subGames'

const lifecycle: SubGameInstanceDefinition['lifecycle'] = {
  completion: { event: 'test', idempotent: true },
  failure: { exit: 'safe' },
  waypoint: { createsWaypoint: false },
  revisit: 'restart',
  progress: { mode: 'local-only' },
  reward: { kind: 'none' },
  returnToRpg: { signalRpgResume: true, exitSubGame: true },
}

const definition = (instanceId: string): SubGameInstanceDefinition => ({
  instanceId,
  shapeId: 'one-off',
  entryRoute: `/sub-games/${instanceId}/main`,
  lifecycle,
  title: instanceId,
  description: instanceId,
  introBackgroundImage: 0,
})

describe('sub-game instance registry', () => {
  it('rejects duplicate instanceId registration', () => {
    expect(() => createSubGameRegistry([definition('same'), definition('same')])).toThrow(
      "Duplicate sub-game instanceId 'same'"
    )
  })

  it('rejects an unregistered shapeId', () => {
    expect(() =>
      createSubGameRegistry([
        { ...definition('bad-shape'), shapeId: 'not-registered' as 'one-off' },
      ])
    ).toThrow("references unregistered shapeId 'not-registered'")
  })

  it('rejects unknown completion, reward, and waypoint instance keys', () => {
    for (const kind of ['completion', 'reward', 'waypoint'] as const) {
      expect(() =>
        createSubGameRegistry([definition('known')], undefined, { [kind]: ['missing'] })
      ).toThrow(`${kind} key 'missing' does not match a registered instanceId`)
    }
  })

  it('fails validation for an unregistered instanceId', () => {
    expect(() => getSubGameDefinition('not-placed')).toThrow(
      "Sub-game instance 'not-placed' is not registered"
    )
  })

  it.each([
    ['aerowreckage-puzzle', '/sub-games/aerowreckage-puzzle/entry', 'one-off'],
    ['deep-silo', '/sub-games/deep-silo/screen1', 'one-off'],
    ['hermit-hollow', '/sub-games/hermit-hollow/main', 'dialogue'],
    ['jaunt-cave', '/sub-games/jaunt-cave/jaunt-cave', 'timed-encounter'],
  ] as const)(
    'resolves %s with route, shape, and lifecycle config',
    (instanceId, route, shapeId) => {
      const resolved = getSubGameDefinition(instanceId)
      expect(resolved).toBe(SUB_GAMES[instanceId])
      expect(resolved.entryRoute).toBe(route)
      expect(resolved.shapeId).toBe(shapeId)
      expect(resolved.lifecycle).toEqual(
        expect.objectContaining({
          completion: expect.objectContaining({ idempotent: true }),
          returnToRpg: { signalRpgResume: true, exitSubGame: true },
        })
      )
    }
  )
})
