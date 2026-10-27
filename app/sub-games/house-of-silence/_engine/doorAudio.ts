/** Offline procedural wooden-door effects. Construct/resume only from a user gesture. */
export function createDoorAudio() {
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  let context: AudioContext | null = null
  let muted = false
  let disposed = false
  const buffers: Partial<Record<'door-open' | 'door-close', AudioBuffer>> = {}
  const playing = new Set<AudioBufferSourceNode>()

  function makeBuffer(type: 'door-open' | 'door-close') {
    const rate = context!.sampleRate
    const duration = type === 'door-open' ? 0.95 : 0.65
    const buffer = context!.createBuffer(1, Math.ceil(rate * duration), rate)
    const data = buffer.getChannelData(0)
    let seed = type === 'door-open' ? 9217 : 15101
    let phase = 0
    let lowNoise = 0
    for (let i = 0; i < data.length; i++) {
      const time = i / rate
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0
      const noise = (seed >>> 0) / 2147483648 - 1
      lowNoise = lowNoise * 0.94 + noise * 0.06
      const opening = type === 'door-open'
      const rubDuration = opening ? 0.84 : 0.38
      const rub = time < rubDuration ? Math.sin((Math.PI * time) / rubDuration) ** 2 : 0
      const pulses = 0.2 + 0.8 * Math.sin(time * (opening ? 16 : 22)) ** 4
      const frequency = (opening ? 145 : 110) + 45 * Math.sin(time * 8) + 12 * lowNoise
      phase += (Math.PI * 2 * frequency) / rate
      const creak =
        (Math.sin(phase) + 0.3 * Math.sin(phase * 2.03) + 0.16 * Math.sin(phase * 3.91)) *
        rub *
        pulses
      const impactAt = opening ? 0.015 : 0.39
      const age = time - impactAt
      const impact =
        age > 0
          ? (Math.sin(age * Math.PI * 2 * 73) * 0.85 + noise * 0.45) *
            Math.exp(-age * (opening ? 65 : 28))
          : 0
      const fade = Math.min(1, time / 0.008, (duration - time) / 0.02)
      data[i] = Math.max(
        -0.8,
        Math.min(
          0.8,
          (creak * 0.19 + lowNoise * rub * 0.35 + impact * (opening ? 0.2 : 0.6)) * fade
        )
      )
    }
    return buffer
  }

  function unlock() {
    if (!Context || muted || disposed) return
    try {
      context ??= new Context()
      if (context.state !== 'running' && context.state !== 'closed')
        void context.resume().catch(() => undefined)
    } catch {
      context = null
    }
  }

  function stop() {
    for (const source of playing) {
      try {
        source.stop()
      } catch {
        /* Already ended. */
      }
      source.disconnect()
    }
    playing.clear()
  }

  return {
    available: !!Context,
    unlock,
    play: (type: 'door-open' | 'door-close') => {
      if (!context || muted || disposed) return
      try {
        const source = context.createBufferSource()
        source.buffer = buffers[type] ??= makeBuffer(type)
        source.connect(context.destination)
        source.onended = () => {
          playing.delete(source)
          source.disconnect()
        }
        playing.add(source)
        source.start()
      } catch {
        /* Audio failure never interrupts the dungeon. */
      }
    },
    toggle: () => {
      muted = !muted
      if (muted) stop()
      else unlock()
      return !muted
    },
    stop,
    pause: () => {
      stop()
      if (context?.state === 'running') void context.suspend().catch(() => undefined)
    },
    dispose: () => {
      disposed = true
      stop()
      if (context && context.state !== 'closed') void context.close().catch(() => undefined)
      context = null
    },
  }
}
