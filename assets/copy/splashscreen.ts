export const SPLASH_STRINGS = {
  splashScreen: {
    buttonText: 'Enter the Night Land at Your Peril',
  },

  princessScreen: {
    text: `My love, my warrior. Don't go out into the Nightland. Don't go! 
You will surely die or worse, the evil powers will consume your everlasting soul. 
Persius is lost to the Silent Ones, there is no hope of saving him... your quest is doomed 
and my love will become sorrow...

She turns from you and quietly sobs.

You say nothing and depart. For even though hopeless, you must try.`,
    buttonText: 'Leave your love and depart into the Nightland and your doom...',
  },

  deathScreen: {
    title: 'Christos is dead.',
    buttonText: 'Venture yet again out into the Night Land to face the horrors of the dark.....',
    slainByText: (killerName: string) => `\nSlain by the ${killerName}.\n\n`,
    monstersKilledText: (count: number) => `Monsters killed: ${count}\n`,
    distanceTraveledText: (distance: number) => `Distance traveled: ${distance} steps`,
  },
} as const
