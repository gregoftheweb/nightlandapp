import { createDungeon, TEST_DUNGEON } from '../_engine/dungeon'
import { HOUSE_ENGINE_SOURCE } from '../_engine/runtimeSource'

const room = {
  rows: ['#####', '#...#', '#...#', '#...#', '#####'],
  spawn: { x: 2.5, y: 2.5, angle: 0 },
}

describe('House of Silence raycaster and movement', () => {
  const altarFixture = {
    rows: ['#########', '#.......#', '#.......#', '#.......#', '#########'],
    spawn: { x: 1.5, y: 2.5, angle: 0 },
    blocks: [{ id: 'altar', x: 3, y: 2, width: 1, depth: 1, height: 0.36 }],
  }

  it('traces the near and far edges of low furniture without cutting off the wall above it', () => {
    const engine = createDungeon(altarFixture)
    expect(engine.traceBlocks(1, 0)[0]).toMatchObject({ near: 1.5, far: 2.5, side: 0, u: 0.5 })
    expect(engine.traceBlocks(2, 0)[0]).toMatchObject({ near: 0.75, far: 1.25 })
    expect(engine.cast(1, 0)).toMatchObject({ material: 'wall', distance: 6.5 })
    expect(engine.traceBlocks(-1, 0)).toEqual([])
    expect(engine.traceBlocks(0, 1)).toEqual([])
    expect(engine.traceBlocks(1, 0, 1)).toEqual([])
    expect(engine.traceBlocks(0, 0)).toEqual([])
    const fromNorth = createDungeon({
      ...altarFixture,
      spawn: { x: 3.5, y: 3.5, angle: -Math.PI / 2 },
    })
    expect(fromNorth.traceBlocks(0, -1)[0]).toMatchObject({ near: 0.5, far: 1.5, side: 1, u: 0.5 })
    const fromEast = createDungeon({ ...altarFixture, spawn: { x: 4.5, y: 2.5, angle: Math.PI } })
    expect(fromEast.traceBlocks(-1, 0)[0]).toMatchObject({ near: 0.5, far: 1.5, side: 0, u: 0.5 })
  })

  it('blocks walking through an altar with rounded player clearance at its corners', () => {
    const engine = createDungeon(altarFixture)
    expect(engine.canStand(3.5, 2.5)).toBe(false)
    expect(engine.canStand(2.9, 1.9)).toBe(false)
    expect(engine.canStand(2.84, 1.84)).toBe(true)
    for (let i = 0; i < 100; i++) engine.move(1, 0, 0.05)
    expect(engine.getCamera().x).toBeLessThanOrEqual(2.81)
    engine.reset()
    expect(engine.getCamera()).toEqual(altarFixture.spawn)
  })
  const columnFixture = {
    rows: ['#########', '#.......#', '#.......#', '#.......#', '#########'],
    spawn: { x: 1.5, y: 2.5, angle: 0 },
    columns: [{ id: 'test-column', x: 4.5, y: 2.5, radius: 0.32 }],
  }

  it('intersects a round column at its real surface, including non-unit projection rays', () => {
    const engine = createDungeon(columnFixture)
    const hit = engine.cast(1, 0)!
    expect(hit.material).toBe('column')
    expect(hit.distance).toBeCloseTo(2.68)
    expect(hit.light).toBeGreaterThan(0.6)
    expect(engine.cast(2, 0)?.distance).toBeCloseTo(1.34)
    expect(engine.cast(1, 0.2)?.material).toBe('wall')
    expect(engine.cast(1, 0, 2)).toBeNull()
  })

  it('blocks movement with a circular footprint and player clearance, allowing movement around it', () => {
    const engine = createDungeon(columnFixture)
    expect(engine.canStand(4.5, 2.5)).toBe(false)
    expect(engine.canStand(4, 2.5)).toBe(false)
    expect(engine.canStand(4.5, 3.1)).toBe(true)
    for (let i = 0; i < 100; i++) engine.move(1, 0, 0.05)
    expect(engine.getCamera().x).toBeLessThanOrEqual(3.99)
    expect(engine.canStand(engine.getCamera().x, engine.getCamera().y)).toBe(true)
  })

  it('respects nearer walls and prevents reaching a door through a column', () => {
    const engine = createDungeon({
      ...columnFixture,
      rows: ['#########', '#.......#', '#..#....#', '#.......#', '#########'],
    })
    expect(engine.cast(1, 0)?.material).toBe('wall')
    const blockedDoor = createDungeon({
      rows: ['########', '#..D...#', '########'],
      spawn: { x: 1.5, y: 1.5, angle: 0 },
      columns: [{ id: 'door-column', x: 2.5, y: 1.5, radius: 0.25 }],
    })
    expect(blockedDoor.cast(1, 0)?.material).toBe('column')
    expect(blockedDoor.nearbyDoor()).toBeNull()
    expect(blockedDoor.interact()).toBe('No door within reach.')
  })

  it('clips the Silent One behind a column and keeps the high-room ceiling on the column span', () => {
    const engine = createDungeon({
      ...columnFixture,
      ceilingRegions: [{ x: 3, y: 1, width: 5, height: 3, ceilingHeight: 2 }],
    })
    const spans = engine.trace(1, 0)
    expect(spans).toHaveLength(2)
    expect(spans[1]).toMatchObject({ ceiling: 2, solid: true })
    expect(spans[1].boundary?.material).toBe('column')
    const figure = {
      id: 'hidden',
      texture: 'silentOne' as const,
      x: 6.5,
      y: 2.5,
      width: 0.66,
      height: 0.98,
    }
    expect(engine.cast(1, 0)!.distance).toBeLessThan(engine.projectSprite(figure, 400, 700)!.depth)
  })

  it('leaves connected walking routes around all four encounter-room columns', () => {
    const engine = createDungeon(TEST_DUNGEON)
    expect(TEST_DUNGEON.columns).toHaveLength(4)
    const queue = [[2, 22]]
    const seen = new Set<string>()
    while (queue.length) {
      const [x, y] = queue.shift()!
      const id = `${x},${y}`
      if (
        seen.has(id) ||
        x < 0 ||
        x > 28 ||
        y < 0 ||
        y > 24 ||
        !engine.canStand(7 + x / 4, 1 + y / 4)
      )
        continue
      seen.add(id)
      queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1])
    }
    for (const column of TEST_DUNGEON.columns!) {
      for (const [dx, dy] of [
        [0.75, 0],
        [-0.75, 0],
        [0, 0.75],
        [0, -0.75],
      ]) {
        expect(seen.has(`${(column.x + dx - 7) * 4},${(column.y + dy - 1) * 4}`)).toBe(true)
      }
    }
    // The altar is reachable on every side, including the gap behind it.
    for (const [x, y] of [
      [9, 2],
      [11, 2],
      [10, 1.25],
      [10, 2.5],
    ]) {
      expect(seen.has(`${(x - 7) * 4},${(y - 1) * 4}`)).toBe(true)
    }
  })
  const heightFixture = {
    rows: ['########', '#..D...#', '########'],
    spawn: { x: 2.5, y: 1.5, angle: 0 },
    ceilingRegions: [{ x: 4, y: 1, width: 3, height: 1, ceilingHeight: 2 }],
  }

  it('keeps the corridor and door one unit high and makes only the encounter room double height', () => {
    const engine = createDungeon(TEST_DUNGEON)
    expect(engine.ceilingAt(3, 9)).toBe(1)
    expect(engine.ceilingAt(6, 6)).toBe(1)
    expect(engine.ceilingAt(7, 6)).toBe(2)
    expect(engine.ceilingAt(13, 1)).toBe(2)
    expect(engine.ceilingAt(7, 7)).toBe(1)
  })

  it('traces through the height transition after opening a normal-height door', () => {
    const engine = createDungeon(heightFixture)
    const closed = engine.trace(1, 0)
    expect(closed).toHaveLength(1)
    expect(closed[0].ceiling).toBe(1)
    expect(closed[0].boundary?.material).toBe('door')
    engine.interact()
    const opened = engine.trace(1, 0)
    expect(opened).toHaveLength(2)
    expect(opened[0]).toMatchObject({
      start: 0,
      end: 1.5,
      ceiling: 1,
      nextCeiling: 2,
      solid: false,
    })
    expect(opened[1]).toMatchObject({ start: 1.5, end: 4.5, ceiling: 2, solid: true })
    expect(engine.cast(1, 0)?.distance).toBeCloseTo(4.5)
  })

  it('exposes the lintel above a lower passage when looking out from the high room', () => {
    const engine = createDungeon({ ...heightFixture, spawn: { x: 5.5, y: 1.5, angle: Math.PI } })
    const closed = engine.trace(-1, 0)
    expect(closed[0]).toMatchObject({ ceiling: 2, solid: true })
    expect(closed[0].boundary?.material).toBe('door')
    engine.interact()
    const open = engine.trace(-1, 0)
    expect(open[0]).toMatchObject({ start: 0, end: 1.5, ceiling: 2, nextCeiling: 1, solid: false })
    expect(open[1]).toMatchObject({ ceiling: 1, solid: true })
  })

  it('bounds height tracing by distance and keeps room height independent of movement/reset', () => {
    const engine = createDungeon(heightFixture)
    engine.interact()
    expect(engine.trace(1, 0, 2)).toHaveLength(2)
    expect(engine.trace(1, 0, 2)[1]).toMatchObject({
      start: 1.5,
      end: 2,
      ceiling: 2,
      boundary: null,
    })
    for (let i = 0; i < 30; i++) engine.move(1, 0, 0.05)
    expect(engine.ceilingAt(engine.getCamera().x, engine.getCamera().y)).toBe(2)
    engine.reset()
    expect(engine.ceilingAt(engine.getCamera().x, engine.getCamera().y)).toBe(1)
  })
  it('projects a standing figure with its hem on the floor and rejects figures behind the camera', () => {
    const engine = createDungeon(room)
    const figure = {
      id: 'test-figure',
      texture: 'silentOne' as const,
      x: 3.5,
      y: 2.5,
      width: 0.5,
      height: 0.95,
    }
    const near = engine.projectSprite(figure, 400, 700)!
    const far = engine.projectSprite({ ...figure, x: 4.5 }, 400, 700)!
    expect(near.depth).toBeCloseTo(1)
    expect(near.left + near.width / 2).toBeCloseTo(200)
    expect(near.top + near.height).toBeCloseTo(350 + (0.5 * 400) / (2 * Math.tan(Math.PI / 6)))
    expect(near.height).toBeCloseTo(far.height * 2)
    expect(engine.projectSprite({ ...figure, x: 1.5 }, 400, 700)).toBeNull()
  })

  it('places exactly one stationary solid figure beyond the closed room door', () => {
    const fixture = { ...TEST_DUNGEON, spawn: { x: 5.5, y: 6.5, angle: 0 } }
    const engine = createDungeon(fixture)
    expect(fixture.sprites).toHaveLength(1)
    const figure = fixture.sprites![0]
    expect(fixture.rows[Math.floor(figure.y)][Math.floor(figure.x)]).toBe('.')
    const projected = engine.projectSprite(figure, 400, 700)!
    expect(engine.cast(1, 0)!.distance).toBeLessThan(projected.depth)
    engine.interact()
    expect(engine.cast(1, 0)!.distance).toBeGreaterThan(projected.depth)
    expect(engine.canStand(figure.x, figure.y)).toBe(false)
    engine.move(1, 0, 0.05)
    engine.reset()
    expect(fixture.sprites).toEqual(TEST_DUNGEON.sprites)
  })
  it('runs the static embedded engine independently of Hermes function source', () => {
    const factory = new Function(`return (${HOUSE_ENGINE_SOURCE})`)() as typeof createDungeon
    const engine = factory(room)
    expect(engine.cast(1, 0)?.distance).toBeCloseTo(1.5)
    engine.move(1, 0, 0.05)
    engine.reset()
    expect(engine.getCamera()).toEqual(room.spawn)
  })

  it('keeps the embedded runtime synchronized with the TypeScript sources', () => {
    const { checkRuntime } = jest.requireActual('../../../../scripts/build-house-runtime.cjs')
    expect(checkRuntime()).toBe(true)
  })
  it.each([
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])('finds cardinal walls without infinite distances (%s,%s)', (dx, dy) => {
    const hit = createDungeon(room).cast(dx, dy)!
    expect(hit.distance).toBeCloseTo(1.5)
    expect(hit.u).toBeCloseTo(0.5)
    expect(hit.material).toBe('wall')
  })

  it('preserves perpendicular depth across a flat wall and bounds texture coordinates', () => {
    const engine = createDungeon(room)
    for (const y of [-0.5, 0, 0.5]) {
      const hit = engine.cast(1, y)!
      expect(hit.distance).toBeCloseTo(1.5)
      expect(hit.u).toBeGreaterThanOrEqual(0)
      expect(hit.u).toBeLessThanOrEqual(1)
    }
    expect(engine.cast(0, 0)).toBeNull()
    expect(engine.cast(NaN, 1)).toBeNull()
    expect(engine.cast(1, 0, 0.1)).toBeNull()
  })

  it('treats outside the map as solid, including an unbounded fixture', () => {
    const engine = createDungeon({ rows: ['...'], spawn: { x: 1.5, y: 0.5, angle: 0 } })
    expect(engine.cast(1, 0)?.distance).toBeCloseTo(1.5)
    expect(engine.canStand(-0.1, 0.5)).toBe(false)
  })

  it('keeps a radius from walls and cannot tunnel on a long frame', () => {
    const engine = createDungeon(room)
    engine.move(1, 0, 50)
    expect(engine.getCamera().x).toBeLessThan(2.6)
    for (let i = 0; i < 500; i++) engine.move(1, 0, 0.05)
    expect(engine.getCamera().x).toBeLessThanOrEqual(3.81)
    expect(engine.canStand(3.9, 2.5)).toBe(false)
    expect(engine.canStand(3.85, 3.85)).toBe(false)
  })

  it('opens a door to reveal the real space beyond and refuses closing onto the camera', () => {
    const engine = createDungeon({
      rows: ['#######', '#..D..#', '#######'],
      spawn: { x: 2.5, y: 1.5, angle: 0 },
    })
    expect(engine.cast(1, 0)?.material).toBe('door')
    expect(engine.canStand(3.5, 1.5)).toBe(false)
    expect(engine.interact()).toBe('The door opens.')
    expect(engine.cast(1, 0)?.distance).toBeCloseTo(3.5)
    expect(engine.canStand(3.5, 1.5)).toBe(true)
    for (let i = 0; i < 12; i++) engine.move(1, 0, 0.05)
    expect(engine.interact()).toBe('Christos is in the doorway.')
    engine.reset()
    expect(engine.getCamera()).toEqual({ x: 2.5, y: 1.5, angle: 0 })
    expect(engine.cast(1, 0)?.material).toBe('door')
    engine.interact()
    expect(engine.interact()).toBe('The door closes.')
  })

  it('cannot interact through a wall or at a distance', () => {
    const engine = createDungeon({
      rows: ['########', '#.#D...#', '########'],
      spawn: { x: 1.5, y: 1.5, angle: 0 },
    })
    expect(engine.nearbyDoor()).toBeNull()
    expect(engine.interact()).toBe('No door within reach.')
  })

  it('has a reachable door and room in the fixture, with an immutable reset', () => {
    const engine = createDungeon(TEST_DUNGEON)
    const before = JSON.stringify(TEST_DUNGEON)
    const seen = new Set<string>()
    const queue = [[3, 9]]
    while (queue.length) {
      const [x, y] = queue.shift()!
      const key = `${x},${y}`
      if (seen.has(key) || !TEST_DUNGEON.rows[y]?.[x] || TEST_DUNGEON.rows[y][x] === '#') continue
      seen.add(key)
      queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1])
    }
    expect(seen.has('6,6')).toBe(true)
    expect(seen.has('10,2')).toBe(true)
    engine.move(1, 1, 0.05)
    engine.reset()
    expect(engine.getCamera()).toEqual(TEST_DUNGEON.spawn)
    expect(JSON.stringify(TEST_DUNGEON)).toBe(before)
  })
})
