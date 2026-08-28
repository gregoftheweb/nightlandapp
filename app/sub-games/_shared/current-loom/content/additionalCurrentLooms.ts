import type { CurrentLoomEncounterContent } from '../content'
import { currentLoom01Content } from './currentLoom01'
import { currentLoom02Content } from './currentLoom02'

function additionalLoom(
  instanceId: string,
  title: string,
  description: string,
  channelLabels: [string, string, string, string, string]
): CurrentLoomEncounterContent {
  return {
    ...currentLoom01Content,
    instanceId,
    metadata: {
      ...currentLoom01Content.metadata,
      title,
      description,
    },
    content: { channelLabels },
    presentation: {
      ...currentLoom01Content.presentation,
      intro: {
        ...currentLoom01Content.presentation.intro,
        text: `${description} Five currents wait to be brought into accord.`,
      },
      success: {
        ...currentLoom02Content.presentation.success,
        firstVisitText:
          'The five channels settle together. Another reach of the Earth Current steadies.',
        revisitText: 'The restored Current-Loom maintains its equilibrium.',
      },
    },
  }
}

export const currentLoom03Content = additionalLoom(
  'current-loom-03',
  'Current-Loom of the Hollow March',
  'A regulator stands alone beyond the main trail, threaded with a low subterranean pulse.',
  ['Hollow', 'Flint', 'Blood', 'Mist', 'Star']
)

export const currentLoom04Content = additionalLoom(
  'current-loom-04',
  'Current-Loom of the Iron Waste',
  'Blackened conduits draw a fitful current from far beneath the waste.',
  ['Grave', 'Iron', 'Cinder', 'Gale', 'Vault']
)

export const currentLoom05Content = additionalLoom(
  'current-loom-05',
  'Current-Loom of the Last Reach',
  'The final regulator shudders beneath the gathered strain of the Earth Current.',
  ['Deep', 'Bone', 'Pyre', 'Night', 'Crown']
)
