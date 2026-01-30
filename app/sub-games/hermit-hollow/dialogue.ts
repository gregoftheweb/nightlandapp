export interface DialogueNode {
  id: string
  npcText: string
  choices?: { text: string; next: string }[]
  effects?: string[]
  end?: boolean
}

export const HERMIT_DIALOGUE: DialogueNode[] = [
  {
    id: 'start',
    npcText: 'Welcome traveler, come sit by my fire and have some warm cider.',
    choices: [
      {
        text: 'Christos sits down by the little campfire in disbelief in finding this haven in the dark of the evil land.',
        next: 'welcome_response',
      },
    ],
  },

  {
    id: 'welcome_response',
    npcText: 'You walk loudly for a man alone in the Night Land.',
    choices: [
      { text: 'How do you survive here with no armor, no discos, alone?', next: 'quietly' },
    ],
  },

  {
    id: 'quietly',
    npcText:
      'Quietly.\nReverently.\n\nThe Dark Powers slide by my peace like oily snakes, never sensing my calm.',
    choices: [
      { text: 'How do you survive?', next: 'impossible' },
      { text: 'Are you protected?', next: 'protected' },
      { text: 'Who are you?', next: 'who' },
    ],
  },

  {
    id: 'impossible',
    npcText: 'I endure, I sit and breathe...and grow old.\n\nThe Watchers pass.\nThey do not see.',
    choices: [
      { text: 'How can they not see you?', next: 'protected' },
      { text: 'Who are you?', next: 'who' },
    ],
  },

  {
    id: 'who',
    npcText: 'I no longer carry my name.\n\nNames echo too far in the dark.',
    choices: [
      { text: 'And yet you are here and not discovered...how?', next: 'protected' },
      { text: 'How long have you been here?', next: 'protected' },
    ],
  },

  {
    id: 'protected',
    npcText:
      'By a great power for good.\n\nFor they do exist traveler… such things endure still.\n\nIt is here in this hollow.  It sleeps now.\nDozes, dreams, waits.\n\nI live in the hush of its dreams.\nWhere its breathing is slow…\nand the dark does not look too closely.',
    choices: [
      { text: 'Its dreams protect you?', next: 'silence' },
      { text: 'You speak in riddles.', next: 'riddles' },
    ],
    effects: ['learned_great_power_exists'],
  },

  {
    id: 'silence',
    npcText:
      'In part, but I am its solace, its company, its friend, its only friend.\n\nIt needs me as much as I need him.',
    choices: [
      { text: 'You cannot be the first.', next: 'line_of_hermits' },
      { text: 'You speak in riddles.', next: 'riddles' },
    ],
  },

  {
    id: 'riddles',
    npcText: 'Forgive an old man his meager pleasures.\n\nAnd riddles teach better than truth.',
    choices: [{ text: 'You cannot be the first.', next: 'line_of_hermits' }],
  },

  {
    id: 'line_of_hermits',
    npcText:
      'No.\n\nNor will I be the last.\n\nWhen my breath grows thin… another will come.\nDrawn to this hollow.\n\nTo keep this goodness company, a friend in the dark.\nTo share its dreams.',
    choices: [
      { text: 'That is sacrifice.', next: 'warning' },
      { text: 'That is madness.', next: 'warning' },
    ],
    effects: ['learned_line_of_hermits', 'location_is_balanced'],
  },

  {
    id: 'warning',
    npcText:
      'A man must follow the path chosen for him.\n\nEven when hope seems lost.\n\nYour path is chosen, you seek hope, even though you believe it lost.',
    choices: [
      { text: 'You speak as if you know my path.', next: 'tesseract_reveal' },
      { text: 'What futures?', next: 'tesseract_reveal' },
    ],
  },

  {
    id: 'tesseract_reveal',
    npcText: 'You search for the Tesseract.',
    choices: [
      { text: 'How do you know that?', next: 'tesseract_knowing' },
      { text: 'Who told you?', next: 'tesseract_knowing' },
      { text: 'What is the Tesseract?', next: 'tesseract_partial_history' },
    ],
    effects: ['tesseract_quest_confirmed'],
  },

  {
    id: 'tesseract_knowing',
    npcText:
      'The great power sleeps, but his dreams cary truths, whispers in the air.\n\nOne of them is yours.\n\nAnother is of your friend.\n\nI do not envy you and your quest for the Tesseract.',
    choices: [
      { text: 'What can you tell me of the Tesseract?', next: 'tesseract_partial_history' },
    ],
  },

  {
    id: 'tesseract_partial_history',
    npcText:
      'It was made long ago. In an epoch when night had not yet descended on us fully.\n\nOne called the Salamander crafted it.\n\nA wizard of vast reach.\nA thinker who could weigh stars as lightly as pebbles.\n\nHe created it as a catalyst...a detonator - ...aach - those words are not right - A Tesseract is a Tesseract: a tool of great change...vast change.\nA cleansing token to bring back the light.\nA powerful artifact of the purest gold and eldest magic.',
    choices: [
      { text: 'What happened, why is the Night Land our prison?', next: 'tesseract_lost' },
      { text: 'Where is it now?', next: 'tesseract_lost' },
    ],
    effects: ['learned_salamander'],
  },

  {
    id: 'tesseract_lost',
    npcText:
      'The Great Dark Powers came upon The Salamander and devoured him before he could wield it.\n\nThey stole it and hid the Tesseract, because they could not unmake it.  The Tesseract is an artifact of the light.\n\nIt remains hidden, and your friend believes he has found its vault.\n\nHis quest is not in vain Christos, it is hopeless, but not in  vain...the creatures of the Night Land have become aware of your quest even now.',
    choices: [{ text: 'Can it still save us?', next: 'tesseract_can_save' }],
    effects: ['learned_tesseract_lost'],
  },

  {
    id: 'tesseract_can_save',
    npcText:
      'Yes...if found...\n\n...and if a man of great learning could weild it.\n\nAt least that is what the whispers of the sleeping god tell me.',
    choices: [
      { text: 'Tell me everything you know.', next: 'too_much' },
      { text: 'Help me find it.', next: 'too_much' },
    ],
    effects: ['tesseract_can_save_mankind'],
  },

  {
    id: 'too_much',
    npcText:
      "No.\n\nWe have spoken too much.\n\nWe have spoken too loudly.\n\nThought too strong a'thoughts.\n\nThe Dark Evil Powers are alerted and sniffing... I must be quiet now... for some time...ssshhhhhhhh",
    choices: [{ text: 'Wait—', next: 'silence_end' }],
  },

  {
    id: 'silence_end',
    npcText:
      'Shhhhh.\n\nquiet...shhhhh\n\nthey hear you...they are coming\n\nsshhhh\n\nThe hermit is in a trance.',
    end: true,
    effects: ['hermit_enters_trance', 'tesseract_lore_partial', 'location_marked_sacred_silent'],
  },
]

export function validateHermitDialogue(nodes: DialogueNode[]) {
  const seen = new Set<string>()
  for (const node of nodes) {
    if (seen.has(node.id)) {
      // eslint-disable-next-line no-console
      console.warn(`[HERMIT_DIALOGUE] Duplicate node id: ${node.id}`)
    }
    seen.add(node.id)
  }
}
