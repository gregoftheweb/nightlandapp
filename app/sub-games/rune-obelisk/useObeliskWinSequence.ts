import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

export type ObeliskWinPhase = 'playing' | 'shaking' | 'settled'

export const OBELISK_SHAKE_STEP_DURATION_MS = 100
export const OBELISK_SHAKE_STEP_COUNT = 20
export const OBELISK_SHAKE_DURATION_MS = OBELISK_SHAKE_STEP_DURATION_MS * OBELISK_SHAKE_STEP_COUNT

export function getObeliskBackgroundState(phase: ObeliskWinPhase): 'plain' | 'electric' {
  return phase === 'shaking' ? 'electric' : 'plain'
}

export function useObeliskWinSequence(solved: boolean, onSettled: () => void) {
  const [phase, setPhase] = useState<ObeliskWinPhase>('playing')
  const shakeX = useRef(new Animated.Value(0)).current
  const started = useRef(false)
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  useEffect(() => {
    if (!solved || started.current) return
    started.current = true
    setPhase('shaking')

    const steps = Array.from({ length: OBELISK_SHAKE_STEP_COUNT }, (_, index) =>
      Animated.timing(shakeX, {
        toValue: index === OBELISK_SHAKE_STEP_COUNT - 1 ? 0 : index % 2 === 0 ? -8 : 8,
        duration: OBELISK_SHAKE_STEP_DURATION_MS,
        useNativeDriver: true,
      })
    )
    const animation = Animated.sequence(steps)
    animation.start(({ finished }) => {
      if (!finished) return
      setPhase('settled')
      onSettledRef.current()
    })

    return () => animation.stop()
  }, [shakeX, solved])

  return { phase, shakeX }
}
