import { buildParsedCatalog, buildRawCatalog } from '@config/contentCatalog'
import { jauntCaveContent } from './content/jauntCave'
import { createTimedEncounterShapeAdapter } from './manifestAdapter'

export const RAW_TIMED_ENCOUNTER_CONTENT = buildRawCatalog([
  { instanceId: jauntCaveContent.instanceId, content: jauntCaveContent },
])
export const TIMED_ENCOUNTER_SHAPE_ADAPTER = createTimedEncounterShapeAdapter()
export const parsedTimedEncounterContentResult = buildParsedCatalog(
  RAW_TIMED_ENCOUNTER_CONTENT,
  TIMED_ENCOUNTER_SHAPE_ADAPTER
)

export function resolveParsedTimedEncounter(instanceId: string) {
  if (!parsedTimedEncounterContentResult.success)
    throw new Error('Parsed timed-encounter catalog is invalid')
  const parsed = parsedTimedEncounterContentResult.value[instanceId]
  if (!parsed) throw new Error(`Unknown timed encounter '${instanceId}'`)
  return parsed
}
