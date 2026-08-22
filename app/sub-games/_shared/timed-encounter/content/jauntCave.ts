import type { JauntCaveEncounterContent } from '../types'

export const jauntCaveContent: JauntCaveEncounterContent = {
  instanceId: 'jaunt-cave',
  shapeId: 'timed-encounter',
  metadata: {
    title: 'Cave of the daemon of the walking shadows',
    description:
      'A sulfur smelling wallow in the Night Lands plains lead to a cave shining with the light from lava. Christos is drawn to it, an aegis of foreboding and necessity upon him. He knows he MUST confront what is inside. Doom and Destiny collide within.',
    entrance: {
      shortName: 'jauntCave',
      category: 'building',
      assetId: 'jaunt-cave-entrance',
      footprint: { width: 4, height: 4 },
      initialActive: true,
      zIndex: 0,
      effects: [{ type: 'hide' }],
      ctaLabel: 'Enter the cave',
      requiresPlayerOnObject: true,
    },
  },
  daemon: {
    name: 'Jaunt Daemon',
    deathMessage: 'Christos was killed by the Jaunt Daemon.',
    killerName: 'Jaunt Daemon',
  },
  narrative: {
    rejectLabel: 'Reject your destiny and return to the Night Land',
    enterLabel: 'Accept your doom and enter the cave',
    rockfallText:
      'There is a rockfall in the cave! Christos is TRAPPED!\n\nIn here his destiny becomes his DOOM!',
    rockfallContinueLabel: 'He meets his doom',
    victoryTitle: 'Victory!',
    victoryText:
      'Christos has slain the Jaunt Daemon!\n\nThe creature dissolves into shadow and ash.\n\nThe cave falls silent.',
    rewardText:
      "Christos claims the Jaunt Daemon's Black Diamond Heart!\n\nHe feels a new power surge through him.",
    revisitVictoryText:
      'Christos has already defeated the Jaunt Daemon.\n\nOnly a pile of black dust remains.',
    revisitRewardText: 'Christos should not tarry here, nothing but fire and woe remain.',
    returnLabel: 'Return to the Night Land',
    defeatTitle: 'Defeated by the Daemon',
    defeatText:
      'The Jaunt Daemon has slain Christos.\n\nSophia will weep in sorrow for you, now lost to your doom in the Night Land.',
    defeatActionLabel: 'Return to Night Land',
    aftermathText: 'the cave is dark, the daemon is dead. There is nothing here now for Christos',
  },
  presentation: {
    introAssetId: 'jaunt-cave-intro',
    battleAssetId: 'jaunt-cave-battle',
    victoryAssetId: 'jaunt-cave-victory',
    defeatAssetId: 'jaunt-cave-defeat',
    aftermathAssetId: 'jaunt-cave-aftermath',
    daemonSpriteAssetIds: {
      resting: 'jaunt-daemon-resting',
      prep1: 'jaunt-daemon-prep1',
      prep2: 'jaunt-daemon-prep2',
      landed: 'jaunt-daemon-landed',
      attackLeft: 'jaunt-daemon-attack-left',
      attackRight: 'jaunt-daemon-attack-right',
    },
    prep1FizzleColor: '#ff6600',
    prep2FizzleColor: '#ff00ff',
    vulnerableGlowColor: '#ff0',
  },
  lifecycle: {
    completion: { event: 'Player confirms return from the victory screen', idempotent: true },
    failure: {
      exit: 'death',
      message: 'The Jaunt Daemon has slain Christos.',
      killerName: 'Jaunt Daemon',
      suppressDeathDialog: false,
      deathRoute: '/death',
    },
    waypoint: { createsWaypoint: false },
    revisit: 'aftermath-screen',
    progress: { mode: 'local-only' },
    reward: {
      kind: 'jaunt-crystal-grant',
      grantEvent: 'Player confirms victory',
      idempotent: true,
    },
    returnToRpg: { signalRpgResume: true, exitSubGame: true },
  },
}
