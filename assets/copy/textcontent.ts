// assets/copy/textcontent.ts
const splashScreen1ButtonText = 'Enter the Night Land at Your Peril'
const princessScreenText =
  "My love, my warrior. Don't go out into the Nightland. Don't go! You will surely die or worse, the evil powers will consume your everlasting soul. Persius is lost to the Silent Ones, there is no hope of saving him... your quest is doomed and my love will become sorrow...\n\nShe turns from you and quietly sobs.\n\nYou say nothing and depart. For even though hopeless, you must try."
const splashScreen2ButtonText = 'Leave your love and depart into the Nightland and your doom...'
const combatStart = 'The [monster] attacks Christos!'
const combatVictoryPlayerComment = 'You vanquished him!'
const combatVictoryEnemyComment = "He's dead!"
const combatDeathPlayerComment = "You're dead!"
const combatDeathEnemyComment = 'He overwhelmed you!'
const combatPlayerHitComment = 'You hit for 6 points!'
const combatPlayerMissComment = 'You missed him!'
const combatEnemyHitComment = 'He hit you for 4 points!'
const combatEnemyMissComment = 'He missed you!'
const combatStartPlayerComment = 'Combat begins!'
const combatStartEnemyComment = 'Ready to fight!'
const watcherDeathMessage =
  'The Watcher has eaten your eternal soul! Your existence is ended and all you will be is void.'
const deathReviveMessage = 'You awaken in the Redoubt.'
const settingsSFXLabel = 'SFX: '
const combatChristosDeathDefault = 'Christos dies in the Nightland'

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
