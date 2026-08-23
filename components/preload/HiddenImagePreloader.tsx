import React, { useCallback, useEffect, useRef } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import type { ImagePreloadAsset } from '@config/types/imagePreload'

export type { ImagePreloadAsset } from '@config/types/imagePreload'

export interface ImagePreloadResult {
  reason: 'loaded' | 'failed' | 'timeout'
  loadedCount: number
  failedIds: string[]
}

interface HiddenImagePreloaderProps {
  assets: readonly ImagePreloadAsset[]
  onReady: (result: ImagePreloadResult) => void
  timeoutMs: number
  testIDPrefix?: string
  warningPrefix?: string
}

export function HiddenImagePreloader({
  assets,
  onReady,
  timeoutMs,
  testIDPrefix = 'image-preload',
  warningPrefix = '[preload]',
}: HiddenImagePreloaderProps) {
  const onReadyRef = useRef(onReady)
  const loadedIdsRef = useRef(new Set<string>())
  const failedIdsRef = useRef(new Set<string>())
  const completedRef = useRef(false)
  onReadyRef.current = onReady

  const finish = useCallback((reason: ImagePreloadResult['reason']) => {
    if (completedRef.current) return
    completedRef.current = true
    onReadyRef.current({
      reason,
      loadedCount: loadedIdsRef.current.size,
      failedIds: [...failedIdsRef.current],
    })
  }, [])

  const settleAsset = useCallback(
    (id: string, loaded: boolean) => {
      if (completedRef.current) return
      if (loadedIdsRef.current.has(id) || failedIdsRef.current.has(id)) return

      if (loaded) loadedIdsRef.current.add(id)
      else failedIdsRef.current.add(id)

      if (loadedIdsRef.current.size + failedIdsRef.current.size === assets.length) {
        finish(failedIdsRef.current.size > 0 ? 'failed' : 'loaded')
      }
    },
    [assets.length, finish]
  )

  useEffect(() => {
    if (assets.length === 0) {
      finish('loaded')
      return
    }
    const timeout = setTimeout(() => finish('timeout'), timeoutMs)
    return () => clearTimeout(timeout)
  }, [assets.length, finish, timeoutMs])

  return (
    <View pointerEvents="none" accessibilityElementsHidden style={styles.container}>
      {assets.map(({ id, source, width, height }) => (
        <Image
          key={id}
          testID={`${testIDPrefix}-${id}`}
          source={source}
          style={[styles.image, { width, height }]}
          fadeDuration={0}
          onLoad={() => settleAsset(id, true)}
          onError={() => {
            console.warn(`${warningPrefix} Failed to decode image '${id}'`)
            settleAsset(id, false)
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  image: { position: 'absolute' },
})
