import { RAW_WORD_GRID_CONTENT } from '@/app/sub-games/_shared/word-grid/contentCatalog'
import { RAW_TIMED_ENCOUNTER_CONTENT } from '@/app/sub-games/_shared/timed-encounter/contentCatalog'
import { GAMEBOARD_MANIFEST } from '@config/gameboardManifest'
import { getSubGameDefinition } from '@config/subGames'
import type { ContentFingerprintInput, GameboardCatalogIdentity } from '@config/types'

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
    .join(',')}}`
}

// Small synchronous SHA-256 implementation so identity creation also works during RN state initialization.
export function sha256(input: string): string {
  const words: number[] = []
  const bytes = unescape(encodeURIComponent(input))
  const bitLength = bytes.length * 8
  for (let i = 0; i < bytes.length; i += 1)
    words[i >> 2] = (words[i >> 2] || 0) | (bytes.charCodeAt(i) << (24 - (i % 4) * 8))
  words[bitLength >> 5] = (words[bitLength >> 5] || 0) | (0x80 << (24 - (bitLength % 32)))
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let offset = 0; offset < words.length; offset += 16) {
    const w = new Array<number>(64)
    for (let i = 0; i < 16; i += 1) w[i] = words[offset + i] || 0
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (hh + s1 + ch + k[i] + w[i]) | 0
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (s0 + maj) | 0
      hh = g
      g = f
      f = e
      e = (d + t1) | 0
      d = c
      c = b
      b = a
      a = (t1 + t2) | 0
    }
    const next = [a, b, c, d, e, f, g, hh]
    for (let i = 0; i < 8; i += 1) h[i] = (h[i] + next[i]) | 0
  }
  return h.map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('')
}

function serializableRegistryContent(instanceId: string): unknown {
  const { introBackgroundImage: _intro, entrance, ...definition } = getSubGameDefinition(instanceId)
  const { image: _image, ...serializableEntrance } =
    entrance ?? ({} as NonNullable<typeof entrance>)
  return { ...definition, entrance: serializableEntrance }
}

export function buildContentFingerprintInput(): ContentFingerprintInput[] {
  return GAMEBOARD_MANIFEST.slots
    .flatMap((slot) =>
      (slot.kind === 'scattered-group' ? slot.instances : [slot.contentRef]).map((instanceId) => ({
        shapeId: slot.shapeId,
        instanceId,
      }))
    )
    .map(({ shapeId, instanceId }) => ({
      shapeId,
      instanceId,
      content:
        shapeId === 'word-grid'
          ? RAW_WORD_GRID_CONTENT[instanceId]
          : shapeId === 'timed-encounter'
            ? RAW_TIMED_ENCOUNTER_CONTENT[instanceId]
            : serializableRegistryContent(instanceId),
    }))
    .sort((a, b) => a.shapeId.localeCompare(b.shapeId) || a.instanceId.localeCompare(b.instanceId))
}

export function buildGameboardCatalogIdentity(): GameboardCatalogIdentity {
  return {
    gameboardVersion: GAMEBOARD_MANIFEST.version,
    gameboardHash: sha256(stableStringify(GAMEBOARD_MANIFEST)),
    referencedContentHash: sha256(stableStringify(buildContentFingerprintInput())),
  }
}

export function gameboardIdentityMatches(saved: GameboardCatalogIdentity | undefined): boolean {
  if (!saved) return false
  const current = buildGameboardCatalogIdentity()
  return (
    saved.gameboardVersion === current.gameboardVersion &&
    saved.gameboardHash === current.gameboardHash &&
    saved.referencedContentHash === current.referencedContentHash
  )
}
