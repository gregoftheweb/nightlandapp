export interface Camera {
  x: number
  y: number
  angle: number
}
export interface DungeonFixture {
  rows: string[]
  spawn: Camera
  sprites?: DungeonSprite[]
  columns?: DungeonColumn[]
  blocks?: DungeonBlock[]
  ceilingRegions?: { x: number; y: number; width: number; height: number; ceilingHeight: number }[]
}
export interface DungeonBlock {
  id: string
  x: number
  y: number
  width: number
  depth: number
  height: number
}
export interface BlockHit {
  block: DungeonBlock
  near: number
  far: number
  side: number
  u: number
}
export interface DungeonColumn {
  id: string
  x: number
  y: number
  radius: number
}
export interface DungeonSprite {
  id: string
  texture: 'silentOne'
  x: number
  y: number
  width: number
  height: number
  collisionRadius?: number
}
export interface DungeonEvent {
  type: 'door-open' | 'door-close'
  automatic: boolean
}
export interface RayHit {
  distance: number
  u: number
  material: 'wall' | 'door' | 'column'
  light?: number
  textureScale?: number
  side: number
  x: number
  y: number
}
export interface RaySpan {
  start: number
  end: number
  ceiling: number
  nextCeiling: number
  boundary: RayHit | null
  solid: boolean
}

export const TEST_DUNGEON: DungeonFixture = {
  rows: [
    '###############',
    '#.....#.......#',
    '#.....#.......#',
    '###.###.......#',
    '#...#.........#',
    '#...#.#.......#',
    '#.....D.......#',
    '###.###########',
    '#.....#.......#',
    '#.............#',
    '#.....#.......#',
    '###############',
  ],
  spawn: { x: 3.5, y: 9.5, angle: -Math.PI / 2 },
  ceilingRegions: [{ x: 7, y: 1, width: 7, height: 6, ceilingHeight: 2 }],
  columns: [
    { id: 'column-north-west', x: 8.5, y: 2.5, radius: 0.32 },
    { id: 'column-north-east', x: 11.5, y: 2.5, radius: 0.32 },
    { id: 'column-south-west', x: 8.5, y: 5.5, radius: 0.32 },
    { id: 'column-south-east', x: 11.5, y: 5.5, radius: 0.32 },
  ],
  blocks: [{ id: 'stone-altar', x: 9.3, y: 1.6, width: 1.4, depth: 0.6, height: 0.36 }],
  sprites: [
    {
      id: 'silent-one-room',
      texture: 'silentOne',
      x: 9.5,
      y: 6.5,
      width: 0.66,
      height: 0.98,
      collisionRadius: 0.26,
    },
  ],
}

/** Self-contained so the same tested engine can run inside a mobile WebView. */
export function createDungeon(fixture: DungeonFixture) {
  const rows = fixture.rows
  const radius = 0.19
  const spawnCamera = () => ({ x: fixture.spawn.x, y: fixture.spawn.y, angle: fixture.spawn.angle })
  let camera = spawnCamera()
  const doors: Record<string, boolean> = {}
  const crossings: Record<string, { x: number; y: number; side: string }> = {}
  const events: DungeonEvent[] = []
  const key = (x: number, y: number) => `${x},${y}`
  const tile = (x: number, y: number) => rows[y]?.[x] ?? '#'
  const ceilingAt = (x: number, y: number) => {
    const region = fixture.ceilingRegions?.find(
      (region) =>
        x >= region.x &&
        x < region.x + region.width &&
        y >= region.y &&
        y < region.y + region.height
    )
    return region?.ceilingHeight ?? 1
  }
  const solid = (x: number, y: number) => {
    const cell = tile(x, y)
    return cell === '#' || (cell === 'D' && !doors[key(x, y)])
  }

  function canStand(x: number, y: number) {
    for (const sprite of fixture.sprites ?? []) {
      if (
        sprite.collisionRadius &&
        (x - sprite.x) ** 2 + (y - sprite.y) ** 2 < (radius + sprite.collisionRadius) ** 2
      )
        return false
    }
    for (const block of fixture.blocks ?? []) {
      const dx = x - Math.max(block.x, Math.min(x, block.x + block.width))
      const dy = y - Math.max(block.y, Math.min(y, block.y + block.depth))
      if (dx * dx + dy * dy < radius * radius) return false
    }
    for (const column of fixture.columns ?? []) {
      const dx = x - column.x
      const dy = y - column.y
      if (dx * dx + dy * dy < (radius + column.radius) ** 2) return false
    }
    for (let cy = Math.floor(y - radius); cy <= Math.floor(y + radius); cy++) {
      for (let cx = Math.floor(x - radius); cx <= Math.floor(x + radius); cx++) {
        if (!solid(cx, cy)) continue
        const dx = x - Math.max(cx, Math.min(x, cx + 1))
        const dy = y - Math.max(cy, Math.min(y, cy + 1))
        if (dx * dx + dy * dy < radius * radius) return false
      }
    }
    return true
  }

  /** Low furniture has finite vertical faces, so it cannot terminate the whole wall ray. */
  function traceBlocks(dx: number, dy: number, maxDistance = 40): BlockHit[] {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (!dx && !dy) || maxDistance <= 0) return []
    const hits: BlockHit[] = []
    for (const block of fixture.blocks ?? []) {
      if (
        (!dx && (camera.x < block.x || camera.x > block.x + block.width)) ||
        (!dy && (camera.y < block.y || camera.y > block.y + block.depth))
      )
        continue
      const x1 = dx ? (block.x - camera.x) / dx : -Infinity
      const x2 = dx ? (block.x + block.width - camera.x) / dx : Infinity
      const y1 = dy ? (block.y - camera.y) / dy : -Infinity
      const y2 = dy ? (block.y + block.depth - camera.y) / dy : Infinity
      const enterX = Math.min(x1, x2)
      const enterY = Math.min(y1, y2)
      const near = Math.max(enterX, enterY, 0.001)
      const far = Math.min(Math.max(x1, x2), Math.max(y1, y2), maxDistance)
      if (near >= far) continue
      const side = enterX > enterY ? 0 : 1
      const u = side === 0 ? camera.y + near * dy - block.y : camera.x + near * dx - block.x
      hits.push({ block, near, far, side, u })
    }
    return hits.sort((a, b) => b.near - a.near)
  }

  function trace(dx: number, dy: number, maxDistance = 40): RaySpan[] {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (!dx && !dy) || maxDistance <= 0) return []
    // Cylinder intersections use the ray's original length, preserving camera-space depth.
    let columnHit: RayHit | null = null
    const rayLengthSquared = dx * dx + dy * dy
    for (const column of fixture.columns ?? []) {
      const offsetX = camera.x - column.x
      const offsetY = camera.y - column.y
      const dot = offsetX * dx + offsetY * dy
      const discriminant =
        dot * dot -
        rayLengthSquared * (offsetX * offsetX + offsetY * offsetY - column.radius * column.radius)
      if (discriminant < 0) continue
      const distance = (-dot - Math.sqrt(discriminant)) / rayLengthSquared
      if (
        distance <= 0.001 ||
        distance > maxDistance ||
        (columnHit && distance >= columnHit.distance)
      )
        continue
      const normalX = (camera.x + distance * dx - column.x) / column.radius
      const normalY = (camera.y + distance * dy - column.y) / column.radius
      columnHit = {
        distance,
        u: (Math.atan2(normalY, normalX) + Math.PI) / (Math.PI * 2),
        material: 'column',
        side: 0,
        x: column.x,
        y: column.y,
        light: 0.62 + 0.38 * Math.max(0, -0.6 * normalX - 0.8 * normalY),
        textureScale: Math.PI * 2 * column.radius,
      }
    }
    let x = Math.floor(camera.x)
    let y = Math.floor(camera.y)
    const spans: RaySpan[] = []
    let ceiling = ceilingAt(x, y)
    let start = 0
    const deltaX = Math.abs(1 / dx)
    const deltaY = Math.abs(1 / dy)
    const stepX = dx < 0 ? -1 : 1
    const stepY = dy < 0 ? -1 : 1
    let nextX = (dx < 0 ? camera.x - x : x + 1 - camera.x) * deltaX
    let nextY = (dy < 0 ? camera.y - y : y + 1 - camera.y) * deltaY
    for (let steps = 0; steps < 256; steps++) {
      let distance: number
      let side: number
      if (nextX < nextY) {
        distance = nextX
        nextX += deltaX
        x += stepX
        side = 0
      } else {
        distance = nextY
        nextY += deltaY
        y += stepY
        side = 1
      }
      if (columnHit && columnHit.distance <= Math.min(distance, maxDistance)) {
        spans.push({
          start,
          end: columnHit.distance,
          ceiling,
          nextCeiling: ceiling,
          boundary: columnHit,
          solid: true,
        })
        return spans
      }
      if (distance > maxDistance) {
        spans.push({
          start,
          end: maxDistance,
          ceiling,
          nextCeiling: ceiling,
          boundary: null,
          solid: false,
        })
        return spans
      }
      const blocked = solid(x, y)
      const nextCeiling = blocked ? ceiling : ceilingAt(x, y)
      if (blocked || nextCeiling !== ceiling) {
        const coordinate = side === 0 ? camera.y + distance * dy : camera.x + distance * dx
        let u = coordinate - Math.floor(coordinate)
        if ((side === 0 && dx > 0) || (side === 1 && dy < 0)) u = 1 - u
        const boundary: RayHit = {
          distance: Math.max(0.001, distance),
          u,
          material: tile(x, y) === 'D' ? 'door' : 'wall',
          side,
          x,
          y,
        }
        spans.push({ start, end: distance, ceiling, nextCeiling, boundary, solid: blocked })
        if (blocked) return spans
        start = distance
        ceiling = nextCeiling
      }
    }
    return spans
  }

  function cast(dx: number, dy: number, maxDistance = 40): RayHit | null {
    const spans = trace(dx, dy, maxDistance)
    const last = spans[spans.length - 1]
    return last?.solid ? last.boundary : null
  }

  function overlapsDoor(x: number, y: number) {
    return (
      camera.x + radius > x &&
      camera.x - radius < x + 1 &&
      camera.y + radius > y &&
      camera.y - radius < y + 1
    )
  }

  function sideOfDoor(x: number, y: number, px: number, py: number) {
    if (px < x) return 'west'
    if (px >= x + 1) return 'east'
    if (py < y) return 'north'
    if (py >= y + 1) return 'south'
    return ''
  }

  function updateCrossings(previousX: number, previousY: number) {
    const x = Math.floor(camera.x)
    const y = Math.floor(camera.y)
    const id = key(x, y)
    if (tile(x, y) === 'D' && doors[id] && !crossings[id]) {
      const side = sideOfDoor(x, y, previousX, previousY)
      if (side) crossings[id] = { x, y, side }
    }
    const opposite: Record<string, string> = {
      west: 'east',
      east: 'west',
      north: 'south',
      south: 'north',
    }
    for (const id of Object.keys(crossings)) {
      const passage = crossings[id]
      if (overlapsDoor(passage.x, passage.y)) continue
      if (
        sideOfDoor(passage.x, passage.y, camera.x, camera.y) === opposite[passage.side] &&
        doors[id]
      ) {
        doors[id] = false
        events.push({ type: 'door-close', automatic: true })
      }
      delete crossings[id]
    }
  }

  function move(forward: number, turn: number, seconds: number, strafe = 0) {
    const dt = Math.max(0, Math.min(seconds, 0.05))
    camera.angle = (camera.angle + turn * dt * 1.65) % (Math.PI * 2)
    const normalizer = Math.max(1, Math.hypot(forward, strafe))
    const travel = (dt * 1.65) / normalizer
    const totalX = (Math.cos(camera.angle) * forward - Math.sin(camera.angle) * strafe) * travel
    const totalY = (Math.sin(camera.angle) * forward + Math.cos(camera.angle) * strafe) * travel
    const steps = Math.max(1, Math.ceil(Math.hypot(totalX, totalY) / 0.06))
    const dx = totalX / steps
    const dy = totalY / steps
    for (let i = 0; i < steps; i++) {
      const previousX = camera.x
      const previousY = camera.y
      if (canStand(camera.x + dx, camera.y)) camera.x += dx
      if (canStand(camera.x, camera.y + dy)) camera.y += dy
      updateCrossings(previousX, previousY)
    }
  }

  function nearbyDoor() {
    // Inspect the first door along the facing ray, including an already-open one.
    for (let distance = 0; distance <= 1.65; distance += 0.025) {
      const x = Math.floor(camera.x + Math.cos(camera.angle) * distance)
      const y = Math.floor(camera.y + Math.sin(camera.angle) * distance)
      const pointX = camera.x + Math.cos(camera.angle) * distance
      const pointY = camera.y + Math.sin(camera.angle) * distance
      if (
        fixture.columns?.some(
          (column) => (pointX - column.x) ** 2 + (pointY - column.y) ** 2 <= column.radius ** 2
        )
      )
        break
      if (tile(x, y) === 'D') return { x, y, open: !!doors[key(x, y)] }
      if (tile(x, y) === '#') break
    }
    return null
  }

  function interact() {
    const door = nearbyDoor()
    if (!door) return 'No door within reach.'
    if (door.open && overlapsDoor(door.x, door.y)) return 'Christos is in the doorway.'
    doors[key(door.x, door.y)] = !door.open
    delete crossings[key(door.x, door.y)]
    events.push({ type: door.open ? 'door-close' : 'door-open', automatic: false })
    return door.open ? 'The door closes.' : 'The door opens.'
  }

  function projectSprite(sprite: DungeonSprite, width: number, height: number) {
    const forwardX = Math.cos(camera.angle)
    const forwardY = Math.sin(camera.angle)
    const relativeX = sprite.x - camera.x
    const relativeY = sprite.y - camera.y
    const depth = relativeX * forwardX + relativeY * forwardY
    if (depth <= 0.05) return null
    const sideways = -relativeX * forwardY + relativeY * forwardX
    const projection = width / (2 * Math.tan(Math.PI / 6))
    const center = width / 2 + (sideways * projection) / depth
    const projectedWidth = (sprite.width * projection) / depth
    const projectedHeight = (sprite.height * projection) / depth
    const bottom = height / 2 + (0.5 * projection) / depth
    return {
      depth,
      left: center - projectedWidth / 2,
      top: bottom - projectedHeight,
      width: projectedWidth,
      height: projectedHeight,
    }
  }

  return {
    getCamera: () => ({ x: camera.x, y: camera.y, angle: camera.angle }),
    cast,
    trace,
    traceBlocks,
    ceilingAt,
    move,
    canStand,
    nearbyDoor,
    interact,
    projectSprite,
    drainEvents: () => events.splice(0),
    reset: () => {
      camera = spawnCamera()
      Object.keys(doors).forEach((id) => delete doors[id])
      Object.keys(crossings).forEach((id) => delete crossings[id])
      events.length = 0
    },
  }
}
