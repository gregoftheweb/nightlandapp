import { createDungeon, DungeonFixture } from '../_engine/dungeon'

const fixture: DungeonFixture = {
  rows: [
    '###########',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '###########',
  ],
  spawn: { x: 2.5, y: 3.5, angle: 0 },
  sprites: [
    {
      id: 'silent',
      texture: 'silentOne',
      x: 8.5,
      y: 3.5,
      width: 0.66,
      height: 0.98,
      collisionRadius: 0.26,
      approach: { x: 1, y: 1, width: 9, height: 5 },
    },
  ],
}
function run(engine: ReturnType<typeof createDungeon>, frames = 600) {
  for (let i = 0; i < frames; i++) engine.updateActors(0.05)
}
function distance(engine: ReturnType<typeof createDungeon>) {
  const actor = engine.getSprites()[0]
  const camera = engine.getCamera()
  return Math.hypot(actor.x - camera.x, actor.y - camera.y)
}

it('approaches slowly, stops short, stays solid, and never mutates the fixture', () => {
  const engine = createDungeon(fixture)
  const before = engine.getSprites()[0]
  engine.updateActors(0.05)
  const after = engine.getSprites()[0]
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeCloseTo(0.0275)
  run(engine)
  expect(distance(engine)).toBeGreaterThanOrEqual(0.7)
  expect(distance(engine)).toBeLessThanOrEqual(0.75)
  expect(engine.canStand(engine.getSprites()[0].x, engine.getSprites()[0].y)).toBe(false)
  expect(engine.drainEvents()).toEqual([])
  expect(fixture.sprites![0].x).toBe(8.5)
  expect(createDungeon(fixture).getSprites()[0].x).toBe(8.5)
})

it.each(['column', 'altar', 'wall'] as const)(
  'routes around a %s without passing through it',
  (obstacle) => {
    const scene: DungeonFixture = { ...fixture }
    if (obstacle === 'column') scene.columns = [{ id: 'column', x: 5.5, y: 3.5, radius: 0.65 }]
    if (obstacle === 'altar')
      scene.blocks = [{ id: 'altar', x: 5, y: 2.5, width: 1, depth: 2, height: 0.36 }]
    if (obstacle === 'wall')
      scene.rows = [
        '###########',
        '#.........#',
        '#....#....#',
        '#....#....#',
        '#....#....#',
        '#.........#',
        '###########',
      ]
    const engine = createDungeon(scene)
    let detour = false
    for (let i = 0; i < 800; i++) {
      engine.updateActors(0.05)
      const actor = engine.getSprites()[0]
      if (Math.abs(actor.y - 3.5) > 0.5) detour = true
      if (obstacle === 'column')
        expect(Math.hypot(actor.x - 5.5, actor.y - 3.5)).toBeGreaterThanOrEqual(0.91 - 1e-8)
      else {
        const dx = actor.x - Math.max(5, Math.min(actor.x, 6))
        const dy =
          actor.y -
          Math.max(obstacle === 'wall' ? 2 : 2.5, Math.min(actor.y, obstacle === 'wall' ? 5 : 4.5))
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(0.26 - 1e-8)
      }
    }
    expect(detour).toBe(true)
    expect(distance(engine)).toBeLessThanOrEqual(0.75)
  }
)

it('waits outside the chamber, resumes on entry, and stops on exit', () => {
  const engine = createDungeon({
    ...fixture,
    spawn: { x: 2.5, y: 3.5, angle: 0 },
    sprites: [{ ...fixture.sprites![0], approach: { x: 4, y: 1, width: 6, height: 5 } }],
  })
  run(engine, 100)
  expect(engine.getSprites()[0].x).toBe(8.5)
  for (let i = 0; i < 25; i++) engine.move(1, 0, 0.05)
  run(engine, 30)
  expect(engine.getSprites()[0].x).toBeLessThan(8.5)
  for (let i = 0; i < 25; i++) engine.move(-1, 0, 0.05)
  const stopped = engine.getSprites()
  run(engine, 100)
  expect(engine.getSprites()).toEqual(stopped)
})

it('cannot cross a closed door or leave its chamber to chase the player', () => {
  const engine = createDungeon({
    ...fixture,
    rows: [
      '###########',
      '#....#....#',
      '#....#....#',
      '#....D....#',
      '#....#....#',
      '#....#....#',
      '###########',
    ],
  })
  run(engine)
  expect(engine.getSprites()[0].x).toBeGreaterThanOrEqual(6.26)
  expect(distance(engine)).toBeGreaterThan(3)
})

it('retargets a moving player and resets position and pursuit state', () => {
  const engine = createDungeon(fixture)
  run(engine, 100)
  for (let i = 0; i < 20; i++) engine.move(0, 0, 0.05, -1)
  run(engine, 600)
  expect(distance(engine)).toBeLessThanOrEqual(0.75)
  const position = engine.getSprites()
  engine.updateActors(0)
  engine.updateActors(Number.NaN)
  engine.updateActors(-1)
  expect(engine.getSprites()).toEqual(position)
  engine.reset()
  expect(engine.getSprites()).toEqual(fixture.sprites)
  expect(engine.getCamera()).toEqual(fixture.spawn)
  expect(engine.drainEvents()).toEqual([])
})

it('clamps a long frame and leaves sprites without approach behavior stationary', () => {
  const engine = createDungeon(fixture)
  engine.updateActors(50)
  expect(engine.getSprites()[0].x).toBeCloseTo(8.4725)
  const still = createDungeon({
    ...fixture,
    sprites: [{ ...fixture.sprites![0], approach: undefined }],
  })
  run(still)
  expect(still.getSprites()[0].x).toBe(8.5)
})
