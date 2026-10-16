import type { TerrainRegion } from './types/terrain'
import shapes from './terrainShapes.json'

/** Reference-map placements relative to the central Redoubt; north is decreasing row. */
export const NIGHTLAND_TERRAIN: TerrainRegion[] = [
  {
    id: 'giants-sea',
    description:
      'A vast, cold sea northeast of the Last Redoubt. Dark waters and jagged shores bar the way; travellers must go around it.',
    name: 'Giant’s Sea',
    position: { row: 94, col: 250 },
    width: 52,
    height: 63,
    image: require('@assets/images/sprites/terrain/giants-sea.webp'),
    shape: shapes['giants-sea'],
    blocksMovement: true,
  },
  {
    id: 'mountains-of-the-voice',
    description:
      'A broken range of barren peaks in the southeastern wastes. Steep ridges and deep ravines make these mountains impassable.',
    name: 'Mountains of the Voice',
    position: { row: 315, col: 280 },
    width: 48,
    height: 50,
    image: require('@assets/images/sprites/terrain/mountains-of-the-voice.webp'),
    shape: shapes['mountains-of-the-voice'],
    blocksMovement: true,
  },
  {
    id: 'giants-pit',
    description:
      'An immense chasm east of the Last Redoubt. Fractured rock walls descend into darkness. The abyss cannot be crossed.',
    name: 'Giant’s Pit',
    position: { row: 216, col: 270 },
    width: 20,
    height: 15,
    image: require('@assets/images/sprites/terrain/giants-pit.webp'),
    shape: shapes['giants-pit'],
    blocksMovement: true,
  },
  {
    id: 'deep-valley',
    description:
      'A deep valley southwest of the Last Redoubt, bordered by weathered escarpments. Its broad, dry floor offers a walkable passage through the rocky wastes.',
    name: 'Deep Valley',
    position: { row: 210, col: 150 },
    width: 42,
    height: 28,
    image: require('@assets/images/sprites/terrain/deep-valley.webp'),
    shape: shapes['deep-valley'],
    blocksMovement: false,
  },
  {
    id: 'vale-of-red-fire',
    description:
      'A volcanic vale northwest of the Last Redoubt. Red fire burns in fissures along its dark rocky sides, while the solid valley floor remains passable.',
    name: 'Vale of Red Fire',
    position: { row: 143, col: 175 },
    width: 44,
    height: 22,
    image: require('@assets/images/sprites/terrain/vale-of-red-fire.webp'),
    shape: shapes['vale-of-red-fire'],
    blocksMovement: false,
  },
  {
    id: 'valley-of-the-hounds',
    description:
      'A long, barren valley in the eastern wastes. Branching gullies cut between rugged ridges, leaving an open passage along the valley floor.',
    name: 'Valley of the Hounds',
    position: { row: 178, col: 304 },
    width: 28,
    height: 42,
    image: require('@assets/images/sprites/terrain/valley-of-the-hounds.webp'),
    shape: shapes['valley-of-the-hounds'],
    blocksMovement: false,
  },
]
