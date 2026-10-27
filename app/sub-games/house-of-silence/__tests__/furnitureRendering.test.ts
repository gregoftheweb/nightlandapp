/** @jest-environment jsdom */
import { HOUSE_ENGINE_SOURCE, HOUSE_RUNTIME_SOURCE } from '../_engine/runtimeSource'
import type { DungeonFixture, createDungeon } from '../_engine/dungeon'

const contextDescriptor = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  'getContext'
)!
const originalImage = window.Image
const originalRaf = window.requestAnimationFrame
const originalCancel = window.cancelAnimationFrame

afterEach(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', contextDescriptor)
  window.Image = originalImage
  window.requestAnimationFrame = originalRaf
  window.cancelAnimationFrame = originalCancel
})

function pixels(width: number, height: number, green = false): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = green ? 0 : 100
    data[i + 1] = green ? 255 : 100
    data[i + 2] = green ? 0 : 100
    data[i + 3] = 255
  }
  return { width, height, data } as ImageData
}

async function frame(withAltar: boolean, spriteX = 5.5, withWall = false) {
  document.body.innerHTML =
    '<canvas id="viewport"></canvas><div id="status"></div><button id="door"></button><button id="reset"></button><div id="fps"></div><div id="loading"></div>'
  const canvas = document.getElementById('viewport') as HTMLCanvasElement
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ width: 400, height: 400 }),
  })
  let result: ImageData | undefined
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: function (this: HTMLCanvasElement) {
      if (this.id === 'viewport')
        return {
          createImageData: (width: number, height: number) => pixels(width, height),
          putImageData: (image: ImageData) => {
            result = image
          },
        }
      let source = ''
      return {
        drawImage: (image: { name: string }) => {
          source = image.name
        },
        getImageData: (_x: number, _y: number, width: number, height: number) =>
          pixels(width, height, source === 'silentOne'),
      }
    },
  })
  const callbacks: FrameRequestCallback[] = []
  window.requestAnimationFrame = (callback) => {
    callbacks.push(callback)
    return callbacks.length
  }
  window.cancelAnimationFrame = () => undefined
  class TextureImage {
    width = 32
    height = 32
    name = ''
    onload?: () => void
    set src(value: string) {
      this.name = value
      this.onload?.()
    }
  }
  window.Image = TextureImage as unknown as typeof Image
  const fixture: DungeonFixture = {
    rows: [
      '#########',
      '#.......#',
      withWall ? '#.#.....#' : '#.......#',
      '#.......#',
      '#########',
    ],
    spawn: { x: 1.5, y: 2.5, angle: 0 },
    blocks: withAltar ? [{ id: 'altar', x: 3, y: 2, width: 1, depth: 1, height: 0.36 }] : [],
    sprites: [
      { id: 'figure', x: spriteX, y: 2.5, width: 0.66, height: 0.98, texture: 'silentOne' },
    ],
  }
  const factory = new Function(`return (${HOUSE_ENGINE_SOURCE})`)() as typeof createDungeon
  const boot = new Function(`return (${HOUSE_RUNTIME_SOURCE})`)()
  boot(factory, fixture, {
    wall: 'wall',
    floor: 'floor',
    ceiling: 'ceiling',
    door: 'door',
    silentOne: 'silentOne',
  })
  for (let i = 0; i < 5; i++) await Promise.resolve()
  expect(callbacks.length).toBeGreaterThan(0)
  callbacks.shift()!(1000)
  expect(result).toBeDefined()
  return (x: number, y: number) =>
    Array.from(result!.data.slice((y * result!.width + x) * 4, (y * result!.width + x) * 4 + 3))
}

it('hides a figure’s feet behind the altar while preserving its upper body', async () => {
  const without = await frame(false)
  const withAltar = await frame(true)
  expect(without(130, 155)[1]).toBeGreaterThan(150)
  expect(withAltar(130, 120)[1]).toBeGreaterThan(150)
  const feet = withAltar(130, 155)
  expect(feet[0]).toBe(feet[1])
  expect(feet[1]).toBe(feet[2])
})

it('draws a nearer figure in front of the altar instead of clipping it', async () => {
  const image = await frame(true, 2.5)
  expect(image(130, 155)[0]).toBe(0)
  expect(image(130, 155)[1]).toBeGreaterThan(200)
})

it('keeps the altar and figure hidden behind a nearer wall', async () => {
  const image = await frame(true, 5.5, true)
  for (const y of [120, 148, 155]) {
    const pixel = image(130, y)
    expect(pixel[0]).toBe(pixel[1])
    expect(pixel[1]).toBe(pixel[2])
  }
})
