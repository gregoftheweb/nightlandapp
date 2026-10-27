import React, { useCallback, useEffect, useRef } from 'react'
import type { DungeonSurfaceProps } from './DungeonSurface'

export default function DungeonSurface({ html, active, onError }: DungeonSurfaceProps) {
  const ref = useRef<HTMLIFrameElement>(null)
  const syncActive = useCallback(() => {
    ref.current?.contentWindow?.postMessage(
      { channel: 'house-of-silence', action: active ? 'resume' : 'pause' },
      '*'
    )
  }, [active])
  useEffect(syncActive, [syncActive])
  return React.createElement('iframe', {
    ref,
    title: 'House of Silence dungeon test',
    srcDoc: html,
    sandbox: 'allow-scripts',
    allow: 'autoplay',
    onLoad: syncActive,
    onError,
    style: { border: 0, width: '100%', height: '100%', flex: 1, background: '#242320' },
  })
}
