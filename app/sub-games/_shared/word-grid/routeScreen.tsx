import React from 'react'
import { useLocalSearchParams } from 'expo-router'

import { resolveParsedWordGridEncounter } from './contentCatalog'
import {
  WordGridFailureScreen,
  WordGridIntroScreen,
  WordGridPuzzleScreen,
  WordGridSuccessScreen,
} from './screens'

export type WordGridRouteScreenKind = 'intro' | 'puzzle' | 'failure' | 'success' | 'aftermath'

export function normalizeWordGridInstanceId(value: string | string[] | undefined): string {
  const instanceId = Array.isArray(value) ? value[0] : value
  if (!instanceId) throw new Error('Word-grid route requires an instanceId')
  return instanceId
}

export function WordGridRouteScreen({ screen }: { screen: WordGridRouteScreenKind }) {
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>()
  const instanceId = normalizeWordGridInstanceId(params.instanceId)
  const parsed = resolveParsedWordGridEncounter(instanceId)
  const props = { config: parsed.shapeConfig, definition: parsed.definition }

  switch (screen) {
    case 'intro':
      return <WordGridIntroScreen {...props} />
    case 'puzzle':
      return <WordGridPuzzleScreen {...props} />
    case 'failure':
      return <WordGridFailureScreen {...props} />
    case 'success':
    case 'aftermath':
      return <WordGridSuccessScreen {...props} />
  }
}
