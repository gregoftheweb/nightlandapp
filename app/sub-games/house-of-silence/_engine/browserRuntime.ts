import type { createDungeon, DungeonFixture } from './dungeon'
import type { TextureSources } from '../_config/assets'
import type { createDoorAudio } from './doorAudio'

/** Runs in an isolated browser document on both web and native; no app state or storage. */
export function bootDungeon(
  factory: typeof createDungeon,
  fixture: DungeonFixture,
  sources: TextureSources,
  audioFactory?: typeof createDoorAudio
) {
  const dungeon = factory(fixture)
  const audio = audioFactory?.()
  const canvas = document.querySelector('canvas')!
  const ctx = canvas.getContext('2d', { alpha: false })!
  const status = document.getElementById('status')!
  const doorButton = document.getElementById('door') as HTMLButtonElement
  const held = new Set<string>()
  const pointers = new Map<number, string>()
  const textures: Record<string, ImageData> = {}
  let active = true
  let hostActive = true
  let ready = false
  let last = 0
  let frame = 0
  let image: ImageData
  let wallDepths: Float64Array
  let objectDepths: Float32Array
  let hintUntil = 0
  let fpsTime = 0
  let frames = 0
  const fps = document.getElementById('fps')!

  function resize() {
    const box = canvas.getBoundingClientRect()
    canvas.width = Math.max(160, Math.min(480, Math.round(box.width * 0.65)))
    canvas.height = Math.max(160, Math.round((canvas.width * box.height) / Math.max(1, box.width)))
    image = ctx.createImageData(canvas.width, canvas.height)
    wallDepths = new Float64Array(canvas.width)
    objectDepths = new Float32Array(canvas.width * canvas.height)
  }

  function clearInputs() {
    held.clear()
    pointers.clear()
    document.querySelectorAll('[data-held]').forEach((el) => el.removeAttribute('data-held'))
  }

  function setActive(value: boolean) {
    active = value
    clearInputs()
    last = 0
    cancelAnimationFrame(frame)
    if (active && ready) frame = requestAnimationFrame(tick)
    if (!active) audio?.pause()
  }

  function hint(message: string) {
    status.textContent = message
    hintUntil = performance.now() + 2200
  }

  function reset() {
    clearInputs()
    dungeon.reset()
    audio?.stop()
    hint('Christos stands at the threshold again.')
  }

  function interact() {
    if (!active || !ready) return
    audio?.unlock()
    hint(dungeon.interact())
    playDoorEvents()
  }

  function playDoorEvents() {
    for (const event of dungeon.drainEvents()) {
      audio?.play(event.type)
      if (event.automatic) hint('The door closes behind Christos.')
    }
  }

  function receive(event: MessageEvent) {
    let message = event.data
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message)
      } catch {
        return
      }
    }
    if (message?.channel !== 'house-of-silence') return
    if (message.action === 'pause' || message.action === 'resume') {
      hostActive = message.action === 'resume'
      setActive(hostActive && !document.hidden)
    }
    if (message.action === 'reset') reset()
  }

  function render() {
    const width = canvas.width
    const height = canvas.height
    const horizon = height / 2
    const camera = dungeon.getCamera()
    const dx = Math.cos(camera.angle)
    const dy = Math.sin(camera.angle)
    // Fixed horizontal field of view; projection adapts to the viewport aspect.
    const plane = Math.tan(Math.PI / 6)
    const px = -dy * plane
    const py = dx * plane
    const projection = width / (2 * plane)
    const data = image.data
    objectDepths.fill(Infinity)
    const size = 256
    function sample(texture: ImageData, u: number, v: number, at: number, shade: number) {
      const tx = ((Math.floor(u * size) % size) + size) % size
      const ty = ((Math.floor(v * size) % size) + size) % size
      const source = (ty * size + tx) * 4
      data[at] = texture.data[source] * shade
      data[at + 1] = texture.data[source + 1] * shade
      data[at + 2] = texture.data[source + 2] * shade
      data[at + 3] = 255
    }
    // Only the floor is shared by all rooms. Ceilings are drawn per ray span below.
    for (let y = 0; y < Math.ceil(horizon); y++) {
      for (let x = 0; x < width; x++) {
        const at = (y * width + x) * 4
        data[at] = 75
        data[at + 1] = 73
        data[at + 2] = 68
        data[at + 3] = 255
      }
    }
    for (let y = Math.ceil(horizon); y < height; y++) {
      const depth = Math.min(40, (projection * 0.5) / Math.max(0.5, Math.abs(y + 0.5 - horizon)))
      const shade = Math.max(0.22, 1 / (1 + depth * 0.095))
      for (let x = 0; x < width; x++) {
        const screen = (2 * (x + 0.5)) / width - 1
        sample(
          textures.floor,
          camera.x + depth * (dx + px * screen),
          camera.y + depth * (dy + py * screen),
          (y * width + x) * 4,
          shade
        )
      }
    }
    for (let x = 0; x < width; x++) {
      const screen = (2 * (x + 0.5)) / width - 1
      const rayX = dx + px * screen
      const rayY = dy + py * screen
      const spans = dungeon.trace(rayX, rayY)
      wallDepths[x] = Infinity
      // The nearer ceiling/lintel clips higher surfaces beyond this screen row.
      let clipTop = 0
      for (const span of spans) {
        const ceilingScale = (span.ceiling - 0.5) * projection
        const ceilingStart = span.start > 0 ? horizon - ceilingScale / span.start : -Infinity
        const ceilingEnd = horizon - ceilingScale / Math.max(0.001, span.end)
        const start = Math.max(clipTop, Math.ceil(ceilingStart - 0.5), 0)
        const end = Math.min(height, Math.ceil(ceilingEnd - 0.5))
        for (let y = start; y < end; y++) {
          const depth = ceilingScale / (horizon - y - 0.5)
          const shade = Math.max(0.22, 1 / (1 + depth * 0.095))
          sample(
            textures.ceiling,
            camera.x + depth * rayX,
            camera.y + depth * rayY,
            (y * width + x) * 4,
            shade
          )
        }
        clipTop = Math.max(clipTop, Math.ceil(ceilingEnd - 0.5))
        const hit = span.boundary
        if (!hit) continue
        const shade = Math.max(
          0.2,
          (hit.light ?? (hit.side ? 0.86 : 1)) / (1 + hit.distance * 0.095)
        )
        function drawWall(bottom: number, top: number, material: 'wall' | 'door' | 'column') {
          const isColumn = material === 'column'
          const u = isColumn ? hit!.u * (hit!.textureScale ?? 1) : Math.min(0.99999, hit!.u)
          const grooveShade = isColumn
            ? 1 - 0.16 * (0.5 + 0.5 * Math.cos(hit!.u * Math.PI * 24)) ** 8
            : 1
          const start = Math.max(
            0,
            clipTop,
            Math.ceil(horizon + ((0.5 - top) * projection) / hit!.distance - 0.5)
          )
          const end = Math.min(
            height,
            Math.ceil(horizon + ((0.5 - bottom) * projection) / hit!.distance - 0.5)
          )
          for (let y = start; y < end; y++) {
            const z = 0.5 + ((horizon - y - 0.5) * hit!.distance) / projection
            let faceShade = shade * grooveShade
            if (isColumn) {
              // Pencil grooves and narrow capital/base bands follow the actual cylinder.
              if (z < 0.14 || z > span.ceiling - 0.14) faceShade *= 0.86
              if (Math.abs(z - 0.14) < 0.012 || Math.abs(z - (span.ceiling - 0.14)) < 0.012)
                faceShade *= 0.65
            }
            sample(
              textures[material === 'column' ? 'wall' : material],
              u,
              1 - z,
              (y * width + x) * 4,
              faceShade
            )
          }
        }
        if (span.solid) {
          wallDepths[x] = hit.distance
          if (hit.material === 'door' && span.ceiling > 1) {
            drawWall(1, span.ceiling, 'wall')
            drawWall(0, 1, 'door')
          } else drawWall(0, span.ceiling, hit.material)
        } else if (span.nextCeiling < span.ceiling) {
          // A lower passage leaves an actual upper wall above the opening.
          drawWall(span.nextCeiling, span.ceiling, 'wall')
          clipTop = Math.max(
            clipTop,
            Math.ceil(horizon + ((0.5 - span.nextCeiling) * projection) / hit.distance - 0.5)
          )
        }
      }
    }
    // Low stone furniture leaves the upper part of the room visible. Keep depth per pixel
    // so figures behind an altar can remain visible above its slab.
    for (let x = 0; x < width; x++) {
      const screen = (2 * (x + 0.5)) / width - 1
      const rayX = dx + px * screen
      const rayY = dy + py * screen
      for (const hit of dungeon.traceBlocks(rayX, rayY)) {
        const block = hit.block
        function drawBlockPixel(y: number, depth: number, u: number, v: number, shade: number) {
          const index = y * width + x
          if (depth >= wallDepths[x] || depth >= objectDepths[index]) return
          sample(textures.wall, u, v, index * 4, shade)
          objectDepths[index] = depth
        }
        const frontTop = horizon + ((0.5 - block.height) * projection) / hit.near
        const frontBottom = horizon + (0.5 * projection) / hit.near
        for (
          let y = Math.max(0, Math.ceil(frontTop - 0.5));
          y < Math.min(height, Math.ceil(frontBottom - 0.5));
          y++
        ) {
          const z = 0.5 + ((horizon - y - 0.5) * hit.near) / projection
          let shade = (hit.side ? 0.78 : 0.86) / (1 + hit.near * 0.095)
          if (z > block.height - 0.05 || z < 0.04) shade *= 0.75
          drawBlockPixel(y, hit.near, hit.u, 1 - z, Math.max(0.16, shade))
        }
        if (block.height < 0.5) {
          const topScale = (0.5 - block.height) * projection
          const topFar = horizon + topScale / hit.far
          for (
            let y = Math.max(0, Math.ceil(topFar - 0.5));
            y < Math.min(height, Math.ceil(frontTop - 0.5));
            y++
          ) {
            const depth = topScale / (y + 0.5 - horizon)
            const wx = camera.x + depth * rayX
            const wy = camera.y + depth * rayY
            const edge = Math.min(
              wx - block.x,
              block.x + block.width - wx,
              wy - block.y,
              block.y + block.depth - wy
            )
            const shade = (edge < 0.035 ? 0.62 : 0.95) / (1 + depth * 0.095)
            drawBlockPixel(y, depth, wx, wy, shade)
          }
        }
      }
    }
    // Static camera-facing figures: floor anchored, alpha blended, and hidden by nearer surfaces.
    const sprites = (fixture.sprites ?? [])
      .map((sprite) => ({
        sprite,
        view: dungeon.projectSprite(sprite, width, height),
      }))
      .sort((a, b) => (b.view?.depth ?? 0) - (a.view?.depth ?? 0))
    for (const { sprite, view } of sprites) {
      if (!view) continue
      const texture = textures[sprite.texture]
      const startX = Math.max(0, Math.floor(view.left))
      const endX = Math.min(width, Math.ceil(view.left + view.width))
      const startY = Math.max(0, Math.floor(view.top))
      const endY = Math.min(height, Math.ceil(view.top + view.height))
      const shade = Math.max(0.2, 1 / (1 + view.depth * 0.095))
      for (let x = startX; x < endX; x++) {
        if (view.depth >= wallDepths[x]) continue
        const tx = Math.max(
          0,
          Math.min(
            texture.width - 1,
            Math.floor(((x + 0.5 - view.left) / view.width) * texture.width)
          )
        )
        for (let y = startY; y < endY; y++) {
          if (view.depth >= objectDepths[y * width + x]) continue
          const ty = Math.max(
            0,
            Math.min(
              texture.height - 1,
              Math.floor(((y + 0.5 - view.top) / view.height) * texture.height)
            )
          )
          const source = (ty * texture.width + tx) * 4
          const alpha = texture.data[source + 3] / 255
          if (!alpha) continue
          const target = (y * width + x) * 4
          for (let channel = 0; channel < 3; channel++) {
            data[target + channel] =
              texture.data[source + channel] * shade * alpha + data[target + channel] * (1 - alpha)
          }
        }
      }
    }
    ctx.putImageData(image, 0, 0)
    const door = dungeon.nearbyDoor()
    doorButton.disabled = !door
    doorButton.textContent = door?.open ? 'Close door' : 'Open door'
  }

  function tick(now: number) {
    if (!active || !ready) return
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0
    last = now
    dungeon.move(
      Number(held.has('forward')) - Number(held.has('back')),
      Number(held.has('right')) - Number(held.has('left')),
      delta,
      Number(held.has('strafeRight')) - Number(held.has('strafeLeft'))
    )
    playDoorEvents()
    render()
    if (now > hintUntil)
      status.textContent = dungeon.nearbyDoor()
        ? 'A door stands within reach.'
        : 'The House is still. Walk, turn, explore.'
    frames++
    if (now - fpsTime > 1000) {
      fps.textContent = `${Math.round((frames * 1000) / (now - fpsTime))} fps`
      frames = 0
      fpsTime = now
    }
    frame = requestAnimationFrame(tick)
  }

  const keyMap: Record<string, string> = {
    ArrowUp: 'forward',
    w: 'forward',
    W: 'forward',
    ArrowDown: 'back',
    s: 'back',
    S: 'back',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
    z: 'strafeLeft',
    Z: 'strafeLeft',
    c: 'strafeRight',
    C: 'strafeRight',
  }
  window.addEventListener('keydown', (event) => {
    if (!active || !ready) return
    audio?.unlock()
    if (keyMap[event.key]) {
      event.preventDefault()
      held.add(keyMap[event.key])
    }
    if (!event.repeat && (event.key === 'e' || event.key === 'E' || event.key === ' ')) {
      event.preventDefault()
      interact()
    }
    if (!event.repeat && (event.key === 'r' || event.key === 'R')) reset()
  })
  window.addEventListener('keyup', (event) => {
    const action = keyMap[event.key]
    if (action) {
      event.preventDefault()
      held.delete(action)
    }
  })
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      if (!active || !ready) return
      audio?.unlock()
      event.preventDefault()
      button.setPointerCapture(event.pointerId)
      const action = button.dataset.action!
      pointers.set(event.pointerId, action)
      held.add(action)
      button.setAttribute('data-held', 'true')
    })
    const release = (event: PointerEvent) => {
      const action = pointers.get(event.pointerId)
      pointers.delete(event.pointerId)
      if (action && !Array.from(pointers.values()).includes(action)) held.delete(action)
      button.removeAttribute('data-held')
    }
    button.addEventListener('pointerup', release)
    button.addEventListener('pointercancel', release)
    button.addEventListener('lostpointercapture', release)
  })
  doorButton.addEventListener('click', interact)
  document.getElementById('reset')!.addEventListener('click', reset)
  const soundButton = document.getElementById('sound') as HTMLButtonElement | null
  if (soundButton) {
    soundButton.disabled = !audio?.available
    if (!audio?.available) soundButton.textContent = 'Sound unavailable'
    soundButton.addEventListener('click', () => {
      const enabled = audio?.toggle()
      soundButton.textContent = enabled ? 'Sound on' : 'Sound off'
      soundButton.setAttribute('aria-pressed', String(!!enabled))
    })
  }
  window.addEventListener('blur', () => {
    clearInputs()
    audio?.pause()
  })
  document.addEventListener('visibilitychange', () => setActive(hostActive && !document.hidden))
  window.addEventListener('message', receive)
  document.addEventListener('message', receive as EventListener)
  window.addEventListener('resize', resize)
  window.addEventListener('pagehide', () => {
    ready = false
    setActive(false)
    audio?.dispose()
  })
  resize()

  Promise.all(
    Object.keys(sources).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const texture = new Image()
          texture.onload = () => {
            try {
              const surface = document.createElement('canvas')
              surface.height = name === 'silentOne' ? 512 : 256
              surface.width =
                name === 'silentOne' ? Math.round((512 * texture.width) / texture.height) : 256
              const context = surface.getContext('2d')!
              context.drawImage(texture, 0, 0, surface.width, surface.height)
              textures[name] = context.getImageData(0, 0, surface.width, surface.height)
              resolve()
            } catch (error) {
              reject(error)
            }
          }
          texture.onerror = () => reject(new Error(`Could not decode ${name} texture.`))
          texture.src = sources[name as keyof TextureSources]
        })
    )
  )
    .then(() => {
      ready = true
      document.getElementById('loading')!.hidden = true
      fpsTime = performance.now()
      if (active) frame = requestAnimationFrame(tick)
    })
    .catch(() => {
      document.getElementById('loading')!.textContent =
        'The corridor could not load. Exit the test and try again.'
    })
}
