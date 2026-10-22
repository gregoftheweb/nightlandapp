import React from 'react'
import { Redirect, useLocalSearchParams, type Href } from 'expo-router'

export default function HouseEntry() {
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  // Only the explicit temporary test entry bypasses normal expedition routing.
  return (
    <Redirect
      href={
        (mode === 'test'
          ? '/sub-games/house-of-silence/interior?mode=test'
          : '/sub-games/house-of-silence/interior') as Href
      }
    />
  )
}
