import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { useGameActions, useGameState } from '@context/GameContext'
import { DeepSiloPanelView } from './EntranceLeverPanel'
import {
  countCompletedCurrentLooms,
  DEEP_SILO_SWITCH_THROWN_FLAG,
  effectiveLoomCount,
  incrementDevLoomOverride,
  isDeepSiloSwitchThrown,
  setDevSwitchThrown,
  useDeepSiloDevState,
} from './entranceState'

export default function DeepSiloEntrancePanelScreen() {
  const router = useRouter()
  const state = useGameState()
  const { dispatch } = useGameActions()
  const dev = useDeepSiloDevState()
  const [animating, setAnimating] = useState(false)
  const [locallyThrown, setLocallyThrown] = useState(false)
  const [completionFlashNonce, setCompletionFlashNonce] = useState(0)
  const realCount = countCompletedCurrentLooms(state.subGamesCompleted)
  const loomCount = effectiveLoomCount(realCount, dev.loomOverrideCount)
  const realThrown = isDeepSiloSwitchThrown(state.subGamesCompleted)
  const switchThrown = realThrown || locallyThrown || (__DEV__ && dev.switchThrown)

  const finishThrow = () => {
    // Keep the final frame visible while the persistent game-state update commits.
    // Without this local handoff, removing the animation can briefly reveal frame 1.
    setLocallyThrown(true)
    setCompletionFlashNonce((nonce) => nonce + 1)
    if (__DEV__ && dev.loomOverrideCount > 0) setDevSwitchThrown()
    else if (realCount === 5)
      dispatch({
        type: 'SET_SUB_GAME_COMPLETED',
        payload: { subGameName: DEEP_SILO_SWITCH_THROWN_FLAG, completed: true },
      })
    setAnimating(false)
  }

  return (
    <DeepSiloPanelView
      loomCount={loomCount}
      switchThrown={switchThrown}
      animating={animating}
      completionFlashNonce={completionFlashNonce}
      onThrow={() => {
        if (loomCount === 5 && !switchThrown) setAnimating(true)
      }}
      onAnimationComplete={finishThrow}
      onEnter={() => {
        if (realThrown || (__DEV__ && dev.switchThrown))
          router.push('/sub-games/deep-silo/screen2' as never)
      }}
      onBack={() => router.back()}
      onDevIncrement={incrementDevLoomOverride}
      showDevtool={__DEV__}
    />
  )
}
