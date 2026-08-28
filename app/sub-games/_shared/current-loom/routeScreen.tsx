import React from 'react'
import { useLocalSearchParams } from 'expo-router'

import { resolveParsedCurrentLoomEncounter } from './contentCatalog'
import {
  CurrentLoomIntroScreen,
  CurrentLoomPuzzleScreen,
  CurrentLoomSuccessScreen,
} from './screens'

export type CurrentLoomRouteScreenKind = 'intro' | 'puzzle' | 'success'

export function normalizeCurrentLoomInstanceId(value: string | string[] | undefined): string {
  const instanceId = Array.isArray(value) ? value[0] : value
  if (!instanceId) throw new Error('Current-Loom route requires an instanceId')
  return instanceId
}

export function CurrentLoomRouteScreen({ screen }: { screen: CurrentLoomRouteScreenKind }) {
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>()
  const instanceId = normalizeCurrentLoomInstanceId(params.instanceId)
  const parsed = resolveParsedCurrentLoomEncounter(instanceId)
  const props = { config: parsed.shapeConfig, definition: parsed.definition }

  switch (screen) {
    case 'intro':
      return <CurrentLoomIntroScreen {...props} />
    case 'puzzle':
      return <CurrentLoomPuzzleScreen {...props} />
    case 'success':
      return <CurrentLoomSuccessScreen {...props} />
  }
}
