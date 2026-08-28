import { createCurrentLoomAssetCatalog } from '../assetCatalog'
import { currentLoom01Content } from '../content/currentLoom01'
import { createCurrentLoomShapeAdapter, validateCurrentLoomContent } from '../manifestAdapter'

const assetIds = [
  'current-loom-entrance',
  'current-loom-board',
  'current-loom-intro',
  'current-loom-hazard',
  'current-loom-success',
]
const catalog = createCurrentLoomAssetCatalog(
  assetIds.map((assetId, index) => ({
    assetId,
    image: index + 1,
    intrinsicSize: { width: 100, height: 80 },
  }))
)
if (!catalog.success) throw new Error('Fixture catalog must be valid')

const clone = () => JSON.parse(JSON.stringify(currentLoom01Content)) as Record<string, any>

describe('Current-Loom adapter', () => {
  it('parses a complete encounter and returns explicit navigable routes', () => {
    const adapter = createCurrentLoomShapeAdapter({ assets: catalog.value })
    const result = adapter.parse(clone())
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.definition).toEqual(
      expect.objectContaining({ instanceId: 'current-loom-01', shapeId: 'current-loom' })
    )
    expect(result.value.shapeConfig.channelLabels).toHaveLength(5)
    expect(adapter.routes('current-loom-01')).toEqual({
      entry: '/sub-games/current-loom/current-loom-01',
      success: '/sub-games/current-loom/current-loom-01/success',
    })
  })

  it('validates supported rewards against the real catalogs', () => {
    const adapter = createCurrentLoomShapeAdapter({ assets: catalog.value })
    expect(adapter.validateRewardId('persius-scroll', 'item')).toBe(true)
    expect(adapter.validateRewardId('not-real', 'item')).toBe(false)
  })

  const invalidCases: [string, (entry: Record<string, any>) => void, string][] = [
    ['instance id', (entry) => (entry.instanceId = 'BAD ID'), 'invalid-instance-id'],
    ['shape id', (entry) => (entry.shapeId = 'word-grid'), 'unknown-shape-id'],
    ['metadata', (entry) => (entry.metadata = null), 'invalid-metadata'],
    ['entrance', (entry) => (entry.metadata.entrance = null), 'invalid-entrance'],
    ['labels', (entry) => (entry.content.channelLabels = ['one']), 'invalid-channel-labels'],
    [
      'completion',
      (entry) => (entry.lifecycle.completion.event = 'wrong'),
      'invalid-completion-trigger',
    ],
    ['failure', (entry) => (entry.lifecycle.failure.exit = 'death'), 'invalid-failure-policy'],
    [
      'waypoint',
      (entry) => (entry.lifecycle.waypoint.createsWaypoint = true),
      'invalid-waypoint-policy',
    ],
    ['revisit', (entry) => (entry.lifecycle.revisit = 'replay'), 'invalid-revisit-policy'],
    [
      'progress',
      (entry) => (entry.lifecycle.progress.mode = 'async-storage'),
      'invalid-progress-policy',
    ],
    [
      'reward',
      (entry) =>
        (entry.lifecycle.reward = {
          kind: 'item',
          id: 'missing',
          grantEvent: 'success-confirmed',
          idempotent: true,
        }),
      'unknown-reward-id',
    ],
    [
      'return',
      (entry) => (entry.lifecycle.returnToRpg.exitSubGame = false),
      'missing-lifecycle-field',
    ],
    ['presentation', (entry) => (entry.presentation.intro.text = ''), 'invalid-required-text'],
    ['asset', (entry) => (entry.presentation.puzzle.assetId = 'missing'), 'unknown-asset-id'],
  ]

  it.each(invalidCases)('rejects invalid %s content', (_name, mutate, expectedCode) => {
    const entry = clone()
    mutate(entry)
    const result = validateCurrentLoomContent(entry, { assets: catalog.value })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.map(({ code }) => code)).toContain(expectedCode)
  })

  it('collects independent errors instead of short-circuiting', () => {
    const entry = clone()
    entry.instanceId = 'BAD'
    entry.metadata.title = ''
    entry.content.channelLabels = []
    const result = validateCurrentLoomContent(entry, { assets: catalog.value })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors).toHaveLength(3)
  })

  it('validates asset catalog duplicates and dimensions', () => {
    const duplicate = createCurrentLoomAssetCatalog([
      { assetId: 'same', image: 1, intrinsicSize: { width: 1, height: 1 } },
      { assetId: 'same', image: 2, intrinsicSize: { width: 1, height: 1 } },
    ])
    const dimensions = createCurrentLoomAssetCatalog([
      { assetId: 'bad', image: 1, intrinsicSize: { width: 0, height: 1 } },
    ])
    expect(duplicate.success).toBe(false)
    expect(dimensions.success).toBe(false)
  })
})
