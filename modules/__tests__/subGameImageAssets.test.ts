import { resolveSubGameImageAssets } from '../subGameImageAssets'

const ids = (instanceId: string) => resolveSubGameImageAssets(instanceId).map(({ id }) => id)

describe('per-instance sub-game image assets', () => {
  test.each(['word-tile-crypt-01', 'word-tile-crypt-02'])(
    'derives all five word-grid references for %s',
    (instanceId) => {
      expect(ids(instanceId)).toEqual([
        'word-grid-board-blank',
        'tesseract-entrance',
        'tesseract-intro',
        'tesseract-failure',
        'tesseract-success',
      ])
    }
  )

  test.each(['jaunt-cave', 'jaunt-cave-02'])(
    'derives all Jaunt Cave backgrounds and daemon sprites for %s',
    (instanceId) => {
      expect(ids(instanceId)).toEqual([
        'jaunt-cave-entrance',
        'jaunt-cave-intro',
        'jaunt-cave-battle',
        'jaunt-cave-victory',
        'jaunt-cave-defeat',
        'jaunt-cave-aftermath',
        'jaunt-daemon-resting',
        'jaunt-daemon-prep1',
        'jaunt-daemon-prep2',
        'jaunt-daemon-landed',
        'jaunt-daemon-attack-left',
        'jaunt-daemon-attack-right',
      ])
    }
  )

  test.each(['current-loom-01', 'current-loom-02'])(
    'derives all five shared Current-Loom assets for %s',
    (instanceId) => {
      expect(ids(instanceId)).toEqual([
        'current-loom-entrance',
        'current-loom-intro',
        'current-loom-board',
        'current-loom-hazard',
        'current-loom-success',
      ])
    }
  )

  test('declares the exact Deep Silo runtime set', () => {
    expect(ids('deep-silo')).toEqual([
      'silo-entrance-approach',
      'silo-entrance-open',
      'silo-lever-1',
      'silo-lever-2',
      'silo-lever-3',
      'silo-lever-4',
      'silo-lever-5',
      'silo-screen2',
      'silo-screen3',
      'silo-screen4',
      'silo-screen5',
      'silo-screen6-table-empty',
      'silo-screen6-table-charging',
      'silo-screen6-spark',
      'silo-screen7',
      'silo-screen8',
      'silo-power-switch1',
      'silo-power-switch2',
      'silo-power-switch3',
    ])
  })

  test('declares the exact Aero-Wreckage runtime set', () => {
    expect(ids('aerowreckage-puzzle')).toEqual([
      'aerowreck-safe1',
      'aerowreck-safe2',
      'aerowreck-safe3',
      'aerowreck-safe4',
      'aerowreck-safe5',
      'aerowreck-safe6',
      'safe-dial-cc',
      'safe-dial-clockwise',
    ])
  })

  test('declares the exact Hermit Hollow runtime set', () => {
    expect(ids('hermit-hollow')).toEqual(['hermit-screen1'])
  })

  test('declares every runtime-referenced obelisk image, including electric but not blurred', () => {
    expect(ids('rune-obelisk')).toEqual(['obelisk-entrance', 'obelisk-plain', 'obelisk-electric'])
  })
})
