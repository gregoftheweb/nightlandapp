export interface DialogueNode {
  id: string
  npcText: string
  choices?: { text: string; next: string }[]
  effects?: string[]
  end?: boolean
}

export const HERMIT_DIALOGUE: DialogueNode[] = [
  {
    'id': 'start',
    'npcText': 'You walk loudly for a man alone in the Night Land.',
    'choices': [
      { 'text': 'How do you survive here with no armor, no discos, alone?', 'next': 'quietly' }
    ]
  },

  {
    'id': 'quietly',
    'npcText': 'Quietly.\nReverently.\n\nNoise is a kind of pride.',
    'choices': [
      { 'text': 'You should not be alive out here.', 'next': 'impossible' },
      { 'text': 'Then you are protected.', 'next': 'protected' },
      { 'text': 'Who are you?', 'next': 'who' }
    ]
  },

  {
    'id': 'impossible',
    'npcText': 'And yet I sit. And breathe. And grow old.\n\nThe Watchers pass.\nThey do not see.',
    'choices': [
      { 'text': 'Why not?', 'next': 'protected' },
      { 'text': 'What hides you?', 'next': 'protected' }
    ]
  },

  {
    'id': 'who',
    'npcText': 'I no longer carry my name.\n\nNames echo too far in the dark.',
    'choices': [
      { 'text': 'Then what are you?', 'next': 'protected' },
      { 'text': 'How long have you been here?', 'next': 'protected' }
    ]
  },

  {
    'id': 'protected',
    'npcText': 'By a great power for good.\n\nThey do exist… for those who still believe such things can endure.\n\nIt sleeps now.\nNot dead. Not gone.\nOnly dozing. Waiting.\n\nI live in the hush of its dreams.\nWhere its breathing is slow…\nand the dark does not look too closely.',
    'choices': [
      { 'text': 'Silence is not armor.', 'next': 'silence' },
      { 'text': 'You speak in riddles.', 'next': 'riddles' }
    ],
    'effects': ['learned_great_power_exists']
  },

  {
    'id': 'silence',
    'npcText': 'No.\nBut it is shelter.\n\nArmor resists the blow.\nSilence teaches the blow to pass elsewhere.',
    'choices': [
      { 'text': 'You cannot be the first.', 'next': 'line_of_hermits' }
    ]
  },

  {
    'id': 'riddles',
    'npcText': 'Plain truth is dangerous in the Night Land.\n\nIt echoes too far.',
    'choices': [
      { 'text': 'You cannot be the first.', 'next': 'line_of_hermits' }
    ]
  },

  {
    'id': 'line_of_hermits',
    'npcText': 'No.\n\nNor the last.\n\nWhen my breath grows thin… another will come.\nDrawn. Not chosen.\n\nThe Power dreams.\nAnd its dreams require a human shape to rest against.',
    'choices': [
      { 'text': 'That is sacrifice.', 'next': 'warning' },
      { 'text': 'That is madness.', 'next': 'warning' },
      { 'text': 'Who decides?', 'next': 'warning' }
    ],
    'effects': ['learned_line_of_hermits', 'location_is_balanced']
  },

  {
    'id': 'warning',
    'npcText': 'Do not return often.\nDo not bring hope here.\n\nHope shouts.\n\nGo, Christos of the Redoubt.\nWalk softly.\nYou carry too many futures already.',
    'choices': [
      { 'text': 'You speak as if you know my path.', 'next': 'tesseract_reveal' },
      { 'text': 'What futures?', 'next': 'tesseract_reveal' }
    ]
  },

  {
    'id': 'tesseract_reveal',
    'npcText': 'You hunt the Tesseract.',
    'choices': [
      { 'text': 'How do you know that?', 'next': 'tesseract_knowing' },
      { 'text': 'Who told you?', 'next': 'tesseract_knowing' },
      { 'text': 'What is the Tesseract?', 'next': 'tesseract_partial_history' }
    ],
    'effects': ['tesseract_quest_confirmed']
  },

  {
    'id': 'tesseract_knowing',
    'npcText': 'The quiet hears what shouting cannot.\n\nThe great power dreams… and in its dreams there are shapes.\n\nOne of them is yours.\n\nAnother is a wound in the world, folded too many times.\n\nThat wound has a name.',
    'choices': [
      { 'text': 'Tell me of it.', 'next': 'tesseract_partial_history' }
    ]
  },

  {
    'id': 'tesseract_partial_history',
    'npcText': 'It was made long ago.\n\nIn epochs when night had not yet learned its own strength.\n\nBy one called the Salamander.\n\nA wizard of vast reach.\nA thinker who could weigh stars as lightly as numbers.\n\nHe meant it as a vessel.\nA shelter for mankind.\nA geometry that could outlast the dark.',
    'choices': [
      { 'text': 'Then why is the world still dying?', 'next': 'tesseract_lost' },
      { 'text': 'Where is it now?', 'next': 'tesseract_lost' }
    ],
    'effects': ['learned_salamander']
  },

  {
    'id': 'tesseract_lost',
    'npcText': 'Because the dark noticed.\n\nBecause genius shines.\n\nThe great enemies came upon him before the work was sealed.\n\nThe Salamander was unmade.\n\nThe Tesseract was scattered.\nLost into folds of distance and untime.\n\nNot destroyed.\n\nOnly misplaced… beyond honest reach.',
    'choices': [
      { 'text': 'Can it still save us?', 'next': 'tesseract_can_save' }
    ],
    'effects': ['learned_tesseract_lost']
  },

  {
    'id': 'tesseract_can_save',
    'npcText': 'Yes.\n\nOr damn what little remains.\n\nGreat tools do not care who lifts them.\n\nBut it was built to shelter life.\n\nIf it is ever made whole…\n\nmankind will not need walls of metal again.\n\nThe night itself would be forced to step around us.',
    'choices': [
      { 'text': 'Tell me everything you know.', 'next': 'too_much' },
      { 'text': 'Help me find it.', 'next': 'too_much' }
    ],
    'effects': ['tesseract_can_save_mankind']
  },

  {
    'id': 'too_much',
    'npcText': 'No.\n\nWe have spoken too much.\n\nToo loudly.\n\nThought too strong thoughts.\n\nEven sleeping things can turn in their dreams.',
    'choices': [
      { 'text': 'Wait—', 'next': 'silence_end' }
    ]
  },

  {
    'id': 'silence_end',
    'npcText': 'Shhhhh.\n\nI must go quiet.\n\nSo must you.\n\nRemember what silence kept alive here.\n\nAnd do not bring your wars to sleeping gods.',
    'end': true,
    'effects': [
      'hermit_enters_trance',
      'tesseract_lore_partial',
      'location_marked_sacred_silent'
    ]
  }
  
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
