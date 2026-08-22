import type { ImageSourcePropType } from 'react-native'

export const TIMED_ENCOUNTER_ASSETS: Readonly<Record<string, ImageSourcePropType>> = Object.freeze({
  'jaunt-cave-entrance': require('@assets/images/sprites/buildings/jaunt-cave.webp'),
  'jaunt-cave-intro': require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen1.webp'),
  'jaunt-cave-battle': require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen2.webp'),
  'jaunt-cave-victory': require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen3.webp'),
  'jaunt-cave-defeat': require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen4.webp'),
  'jaunt-cave-aftermath': require('@assets/images/backgrounds/subgames/jaunt-cave/jaunt-cave-screen5.webp'),
  'jaunt-daemon-resting': require('@assets/images/sprites/monsters/jaunt-deamon-1.webp'),
  'jaunt-daemon-prep1': require('@assets/images/sprites/monsters/jaunt-deamon-2.webp'),
  'jaunt-daemon-prep2': require('@assets/images/sprites/monsters/jaunt-deamon-3.webp'),
  'jaunt-daemon-landed': require('@assets/images/sprites/monsters/jaunt-deamon-4.webp'),
  'jaunt-daemon-attack-left': require('@assets/images/sprites/monsters/jaunt-deamon-5.webp'),
  'jaunt-daemon-attack-right': require('@assets/images/sprites/monsters/jaunt-deamon-6.webp'),
})
