import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { HouseInterior } from './_components/HouseInterior'

export default function HouseInteriorRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  return <HouseInterior testMode={mode === 'test'} />
}
