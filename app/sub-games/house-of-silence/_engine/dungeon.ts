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
  ceilingRegions?: { x: number; y: number; width: number; height: number; ceilingHeight: number }[]
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
  sprites: [
    { id: 'silent-one-room', texture: 'silentOne', x: 9.5, y: 6.5, width: 0.66, height: 0.98 },
  ],
}

/** Self-contained so the same tested engine can run inside a mobile WebView. */
export function createDungeon(fixture: DungeonFixture) {
  const rows = fixture.rows
  const radius = 0.19
  const spawnCamera = () => ({ x: fixture.spawn.x, y: fixture.spawn.y, angle: fixture.spawn.angle })
  let camera = spawnCamera()
  const doors: Record<string, boolean> = {}
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

  function move(forward: number, turn: number, seconds: number) {
    const dt = Math.max(0, Math.min(seconds, 0.05))
    camera.angle = (camera.angle + turn * dt * 1.65) % (Math.PI * 2)
    const travel = forward * dt * 1.65
    const steps = Math.max(1, Math.ceil(Math.abs(travel) / 0.06))
    const dx = (Math.cos(camera.angle) * travel) / steps
    const dy = (Math.sin(camera.angle) * travel) / steps
    for (let i = 0; i < steps; i++) {
      if (canStand(camera.x + dx, camera.y)) camera.x += dx
      if (canStand(camera.x, camera.y + dy)) camera.y += dy
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
    if (
      door.open &&
      camera.x + radius > door.x &&
      camera.x - radius < door.x + 1 &&
      camera.y + radius > door.y &&
      camera.y - radius < door.y + 1
    )
      return 'Christos is in the doorway.'
    doors[key(door.x, door.y)] = !door.open
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
    ceilingAt,
    move,
    canStand,
    nearbyDoor,
    interact,
    projectSprite,
    reset: () => {
      camera = spawnCamera()
      Object.keys(doors).forEach((id) => delete doors[id])
    },
  }
}
