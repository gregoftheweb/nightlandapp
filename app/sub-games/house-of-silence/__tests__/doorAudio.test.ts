/** @jest-environment jsdom */
import { HOUSE_AUDIO_SOURCE } from '../_engine/runtimeSource'
import type { createDoorAudio } from '../_engine/doorAudio'

const original = window.AudioContext
const sources: {
  buffer: AudioBuffer | null
  start: jest.Mock
  stop: jest.Mock
  disconnect: jest.Mock
}[] = []
let context: MockContext
class MockContext {
  sampleRate = 8000
  state = 'suspended'
  destination = {}
  resume = jest.fn(() => {
    this.state = 'running'
    return Promise.resolve()
  })
  suspend = jest.fn(() => {
    this.state = 'suspended'
    return Promise.resolve()
  })
  close = jest.fn(() => {
    this.state = 'closed'
    return Promise.resolve()
  })
  constructor() {
    context = this
  }
  createBuffer(_channels: number, length: number, rate: number) {
    const samples = new Float32Array(length)
    return { duration: length / rate, getChannelData: () => samples }
  }
  createBufferSource() {
    const source = {
      buffer: null as AudioBuffer | null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
      onended: null,
    }
    sources.push(source)
    return source
  }
}
beforeEach(() => {
  sources.length = 0
  window.AudioContext = MockContext as unknown as typeof AudioContext
})
afterEach(() => {
  window.AudioContext = original
})
const factory = () =>
  new Function(`return (${HOUSE_AUDIO_SOURCE})`)()() as ReturnType<typeof createDoorAudio>

it('waits for a gesture, then produces different bounded non-silent open and close buffers', () => {
  const audio = factory()
  audio.play('door-open')
  expect(sources).toHaveLength(0)
  audio.unlock()
  audio.play('door-open')
  audio.play('door-close')
  expect(context.resume).toHaveBeenCalledTimes(1)
  expect(sources[0].buffer!.duration).toBeCloseTo(0.95)
  expect(sources[1].buffer!.duration).toBeCloseTo(0.65)
  for (const source of sources) {
    const samples = source.buffer!.getChannelData(0)
    expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(0.80001)
    expect(samples.reduce((sum, value) => sum + value * value, 0)).toBeGreaterThan(1)
    expect(source.start).toHaveBeenCalledTimes(1)
  }
})

it('mutes, stops on pause/reset, resumes on a new gesture, and disposes without playing again', () => {
  const audio = factory()
  audio.unlock()
  audio.play('door-open')
  expect(audio.toggle()).toBe(false)
  expect(sources[0].stop).toHaveBeenCalledTimes(1)
  audio.play('door-close')
  expect(sources).toHaveLength(1)
  expect(audio.toggle()).toBe(true)
  audio.play('door-close')
  audio.pause()
  expect(context.suspend).toHaveBeenCalledTimes(1)
  audio.unlock()
  expect(context.resume).toHaveBeenCalledTimes(2)
  audio.play('door-open')
  audio.stop()
  audio.dispose()
  expect(context.close).toHaveBeenCalledTimes(1)
  audio.unlock()
  audio.play('door-close')
  expect(sources).toHaveLength(3)
})

it('degrades to silent operation when Web Audio is unavailable', () => {
  window.AudioContext = undefined as unknown as typeof AudioContext
  const audio = factory()
  expect(audio.available).toBe(false)
  expect(() => {
    audio.unlock()
    audio.play('door-open')
    audio.pause()
    audio.dispose()
  }).not.toThrow()
})
