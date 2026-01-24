export const SPLASH_STRINGS = {
  splashScreen: {
    buttonText: 'Enter the Night Land at Your Peril',
  },

  princessScreen: {
text: `My love, my warrior… do not go into the Nightland. There is only death there, or worse, the unmaking of the soul.

Persius followed foolish dreams and broken tales; always that word on his lips, the Tesseract, the Tesseract; a stone of lies, a shape of false hope.

He is lost to the Silent Ones. She turns away and weeps.

You say nothing, and depart. For though hope is a shadow, you must follow it. The Tesseract and Persius...`,


    buttonText: 'Depart into the Nightland and your doom...',
  },

  deathScreen: {
    title: 'Christos is dead.',
    buttonText: 'Venture yet again out into the Night Land to face the horrors of the dark.....',
    slainByText: (killerName: string) => `\nSlain by the ${killerName}.\n\n`,
    monstersKilledText: (count: number) => `Monsters killed: ${count}\n`,
    distanceTraveledText: (distance: number) => `Distance traveled: ${distance} steps`,
  },
} as const
