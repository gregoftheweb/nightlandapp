// modules/victoryImages.ts
import type { ImageSourcePropType } from 'react-native'

import abhumanVictory1 from '@assets/images/sprites/victory/abhuman-victory-1.webp'
import abhumanVictory2 from '@assets/images/sprites/victory/abhuman-victory-2.webp'
import abhumanVictory3 from '@assets/images/sprites/victory/abhuman-victory-3.webp'
import nightHoundVictory1 from '@assets/images/sprites/victory/night-hound-victory-1.webp'
import nightHoundVictory2 from '@assets/images/sprites/victory/night-hound-victory-2.webp'
import nightHoundVictory3 from '@assets/images/sprites/victory/night-hound-victory-3.webp'

// Keyed by monster shortName (config/monsters.ts), not by the image files' own
// kebab-case naming - the two don't need to match.
// giant_slug / jaunt_deamon images already exist under assets/images/sprites/victory/
// but have no entry here yet - there's no monster template for either in
// config/monsters.ts. Add their entries here once those templates exist.
export const VICTORY_IMAGES: Record<string, readonly ImageSourcePropType[]> = {
  abhuman: [abhumanVictory1, abhumanVictory2, abhumanVictory3],
  night_hound: [nightHoundVictory1, nightHoundVictory2, nightHoundVictory3],
}

export function getVictoryImage(
  monsterShortName: string,
  imageIndex: number
): ImageSourcePropType | undefined {
  return VICTORY_IMAGES[monsterShortName]?.[imageIndex]
}
