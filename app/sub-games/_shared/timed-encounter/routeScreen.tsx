import { useLocalSearchParams } from 'expo-router'
import { useSubGameLifecycle } from '../lifecycle'
import { resolveParsedTimedEncounter } from './contentCatalog'
import TimedEncounterIntro from './IntroScreen'
import TimedEncounterRockfall from './RockfallScreen'
import TimedEncounterBattle from './BattleScreen'
import TimedEncounterVictory from './VictoryScreen'
import TimedEncounterDefeat from './DefeatScreen'
import TimedEncounterAftermath from './AftermathScreen'
import { normalizeTimedEncounterInstanceId } from './routing'

export type TimedEncounterScreen =
  'intro' | 'rockfall' | 'battle' | 'victory' | 'defeat' | 'aftermath'

export function TimedEncounterRouteScreen({ screen }: { screen: TimedEncounterScreen }) {
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>()
  const instanceId = normalizeTimedEncounterInstanceId(params.instanceId)
  const parsed = resolveParsedTimedEncounter(instanceId)
  const lifecycle = useSubGameLifecycle(
    instanceId,
    (id) => resolveParsedTimedEncounter(id).definition
  )
  const props = { config: parsed.shapeConfig, lifecycle }
  switch (screen) {
    case 'intro':
      return <TimedEncounterIntro {...props} />
    case 'rockfall':
      return <TimedEncounterRockfall config={parsed.shapeConfig} />
    case 'battle':
      return <TimedEncounterBattle {...props} />
    case 'victory':
      return <TimedEncounterVictory {...props} />
    case 'defeat':
      return <TimedEncounterDefeat {...props} />
    case 'aftermath':
      return <TimedEncounterAftermath {...props} />
  }
}
