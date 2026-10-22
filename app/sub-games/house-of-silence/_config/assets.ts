export const HOUSE_TEXTURES = {
  wall: require('@assets/images/sub-games/HouseOfSilence/insidePOV/wall-pencil-01.webp'),
  floor: require('@assets/images/sub-games/HouseOfSilence/insidePOV/floor-pencil-01.webp'),
  ceiling: require('@assets/images/sub-games/HouseOfSilence/insidePOV/ceiling-pencil-01.webp'),
  door: require('@assets/images/sub-games/HouseOfSilence/insidePOV/door-pencil-01.webp'),
  silentOne: require('@assets/images/sub-games/HouseOfSilence/insidePOV/silent-one-standing-pencil-01.webp'),
} as const

export type TextureSources = Record<keyof typeof HOUSE_TEXTURES, string>
