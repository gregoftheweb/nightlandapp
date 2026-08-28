import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'

import { currentLoom01Content } from './content/currentLoom01'
import { currentLoom02Content } from './content/currentLoom02'
import { createCurrentLoomShapeAdapter } from './manifestAdapter'

export const RAW_CURRENT_LOOM_CONTENT = buildRawCatalog([
  { instanceId: currentLoom01Content.instanceId, content: currentLoom01Content },
  { instanceId: currentLoom02Content.instanceId, content: currentLoom02Content },
])

export const CURRENT_LOOM_SHAPE_ADAPTER = createCurrentLoomShapeAdapter()
export const parsedCurrentLoomContentResult = buildParsedCatalog(
  RAW_CURRENT_LOOM_CONTENT,
  CURRENT_LOOM_SHAPE_ADAPTER
)

export function resolveParsedCurrentLoomEncounter(instanceId: string) {
  if (!parsedCurrentLoomContentResult.success) {
    throw new Error('Parsed Current-Loom catalog is invalid')
  }
  const parsed = parsedCurrentLoomContentResult.value[instanceId]
  if (!parsed) throw new Error(`Unknown Current-Loom encounter '${instanceId}'`)
  return parsed
}
