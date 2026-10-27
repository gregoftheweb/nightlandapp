import { createDungeon } from '../_engine/dungeon'

const room = {
  rows: ['##########', '#........#', '#........#', '#........#', '##########'],
  spawn: { x: 2.5, y: 2.5, angle: 0 },
}
const passage = { rows: ['########', '#..D...#', '########'], spawn: { x: 2.5, y: 1.5, angle: 0 } }
function frames(
  engine: ReturnType<typeof createDungeon>,
  count: number,
  forward = 0,
  turn = 0,
  strafe = 0
) {
  for (let i = 0; i < count; i++) engine.move(forward, turn, 0.05, strafe)
}

it('strafes relative to the camera without turning or increasing diagonal speed', () => {
  const left = createDungeon(room)
  left.move(0, 0, 0.05, -1)
  expect(left.getCamera().x).toBe(2.5)
  expect(left.getCamera().y).toBeCloseTo(2.4175)
  expect(left.getCamera().angle).toBe(0)
  const north = createDungeon({ ...room, spawn: { x: 2.5, y: 2.5, angle: -Math.PI / 2 } })
  north.move(0, 0, 0.05, 1)
  expect(north.getCamera().x).toBeCloseTo(2.5825)
  expect(north.getCamera().y).toBeCloseTo(2.5)
  const diagonal = createDungeon(room)
  diagonal.move(1, 0, 0.05, 1)
  const p = diagonal.getCamera()
  expect(Math.hypot(p.x - 2.5, p.y - 2.5)).toBeCloseTo(0.0825)
})

it('cannot strafe through walls, columns, or the altar', () => {
  const wall = createDungeon(room)
  frames(wall, 100, 0, 0, -1)
  expect(wall.getCamera().y).toBeGreaterThanOrEqual(1.19)
  for (const obstacle of [
    { columns: [{ id: 'column', x: 2.5, y: 1.5, radius: 0.32 }] },
    { blocks: [{ id: 'altar', x: 2, y: 1, width: 1, depth: 1, height: 0.36 }] },
  ]) {
    const engine = createDungeon({ ...room, ...obstacle })
    frames(engine, 100, 0, 0, -1)
    expect(engine.getCamera().y).toBeGreaterThanOrEqual(2.01)
    expect(engine.canStand(engine.getCamera().x, engine.getCamera().y)).toBe(true)
  }
})

it('makes the Silent One solid but allows walking around it without triggering combat', () => {
  const sprite = {
    id: 'silent',
    x: 4.5,
    y: 2.5,
    width: 0.66,
    height: 0.98,
    texture: 'silentOne' as const,
    collisionRadius: 0.26,
  }
  const engine = createDungeon({ ...room, sprites: [sprite] })
  frames(engine, 80, 1)
  expect(engine.getCamera().x).toBeLessThanOrEqual(4.05)
  expect(engine.canStand(4.5, 2.5)).toBe(false)
  frames(engine, 10, 0, 0, 1)
  frames(engine, 30, 1)
  expect(engine.getCamera().x).toBeGreaterThan(5)
  expect(engine.drainEvents()).toEqual([])
  expect(sprite.x).toBe(4.5)
})

it('closes once after crossing, only when the entire player clears the doorway', () => {
  const engine = createDungeon(passage)
  engine.interact()
  expect(engine.drainEvents()).toEqual([{ type: 'door-open', automatic: false }])
  frames(engine, 19, 1)
  expect(engine.getCamera().x).toBeGreaterThan(4)
  expect(engine.cast(-1, 0)?.material).toBe('wall')
  expect(engine.drainEvents()).toEqual([])
  frames(engine, 3, 1)
  expect(engine.cast(-1, 0)?.material).toBe('door')
  expect(engine.drainEvents()).toEqual([{ type: 'door-close', automatic: true }])
  frames(engine, 5, 1)
  expect(engine.drainEvents()).toEqual([])
})

it('can reopen and cross back from inside, then closes again behind the player', () => {
  const engine = createDungeon(passage)
  engine.interact()
  frames(engine, 22, 1)
  frames(engine, 38, 0, 1)
  expect(engine.interact()).toBe('The door opens.')
  engine.drainEvents()
  frames(engine, 30, 1)
  expect(engine.getCamera().x).toBeLessThan(3)
  expect(engine.cast(1, 0)?.material).toBe('door')
  expect(engine.drainEvents()).toEqual([{ type: 'door-close', automatic: true }])
})

it('keeps a door open when peeking and retreating, and emits nothing for invalid interactions or reset', () => {
  const engine = createDungeon(passage)
  engine.interact()
  engine.drainEvents()
  frames(engine, 10, 1)
  expect(engine.interact()).toBe('Christos is in the doorway.')
  expect(engine.drainEvents()).toEqual([])
  frames(engine, 20, -1)
  expect(engine.cast(1, 0)?.material).toBe('wall')
  expect(engine.drainEvents()).toEqual([])
  engine.reset()
  expect(engine.drainEvents()).toEqual([])
  expect(engine.cast(1, 0)?.material).toBe('door')
  const empty = createDungeon(room)
  empty.interact()
  expect(empty.drainEvents()).toEqual([])
})
