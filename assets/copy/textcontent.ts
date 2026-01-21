// assets/copy/textcontent.ts
export const splashScreen1ButtonText = 'Enter the Night Land at Your Peril'
export const princessScreenText =
  "My love, my warrior. Don't go out into the Nightland. Don't go! You will surely die or worse, the evil powers will consume your everlasting soul. Persius is lost to the Silent Ones, there is no hope of saving him... your quest is doomed and my love will become sorrow...\n\nShe turns from you and quietly sobs.\n\nYou say nothing and depart. For even though hopeless, you must try."
export const splashScreen2ButtonText =
  'Leave your love and depart into the Nightland and your doom...'
export const combatStart = 'The [monster] attacks Christos!'
export const combatVictoryPlayerComment = 'You vanquished him!'
export const combatVictoryEnemyComment = "He's dead!"
export const combatDeathPlayerComment = "You're dead!"
export const combatDeathEnemyComment = 'He overwhelmed you!'
export const combatPlayerHitComment = 'You hit for 6 points!'
export const combatPlayerMissComment = 'You missed him!'
export const combatEnemyHitComment = 'He hit you for 4 points!'
export const combatEnemyMissComment = 'He missed you!'
export const combatStartPlayerComment = 'Combat begins!'
export const combatStartEnemyComment = 'Ready to fight!'
export const watcherDeathMessage =
  'The Watcher has eaten your eternal soul! Your existence is ended and all you will be is void.'
export const deathReviveMessage = 'You awaken in the Redoubt.'
export const settingsSFXLabel = 'SFX: '
export const combatChristosDeathDefault = 'Christos dies in the Nightland'

// Add these lines to allow dynamic string indexing:
const textContent = {
  splashScreen1ButtonText,
  princessScreenText,
  splashScreen2ButtonText,
  combatStart,
  combatVictoryPlayerComment,
  combatVictoryEnemyComment,
  combatDeathPlayerComment,
  combatDeathEnemyComment,
  combatPlayerHitComment,
  combatPlayerMissComment,
  combatEnemyHitComment,
  combatEnemyMissComment,
  combatStartPlayerComment,
  combatStartEnemyComment,
  watcherDeathMessage,
  deathReviveMessage,
  settingsSFXLabel,
  combatChristosDeathDefault,
} as { [key: string]: string }

export default textContent
