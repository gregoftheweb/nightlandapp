export function normalizeTimedEncounterInstanceId(value: string | string[] | undefined): string {
  const instanceId = Array.isArray(value) ? value[0] : value
  if (!instanceId) throw new Error('Timed-encounter route requires an instanceId')
  return instanceId
}
