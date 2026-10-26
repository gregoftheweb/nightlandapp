import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

export interface DungeonSurfaceProps {
  html: string
  active: boolean
  onError: () => void
}

/** Native canvas host. All images are embedded data URIs; no network or file access. */
export default function DungeonSurface({ html, active, onError }: DungeonSurfaceProps) {
  const ref = useRef<WebView>(null)
  const syncActive = useCallback(() => {
    const message = JSON.stringify({
      channel: 'house-of-silence',
      action: active ? 'resume' : 'pause',
    })
    ref.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(message)}}));true;`
    )
  }, [active])
  useEffect(syncActive, [syncActive])
  return (
    <WebView
      ref={ref}
      source={{ html }}
      style={styles.surface}
      originWhitelist={['about:*']}
      javaScriptEnabled
      domStorageEnabled={false}
      scrollEnabled={false}
      bounces={false}
      allowFileAccess={false}
      onLoadEnd={syncActive}
      onError={onError}
      onContentProcessDidTerminate={onError}
      onRenderProcessGone={onError}
      onShouldStartLoadWithRequest={(request) =>
        request.url === 'about:blank' || request.url.startsWith('about:blank#')
      }
    />
  )
}

const styles = StyleSheet.create({ surface: { flex: 1, backgroundColor: '#242320' } })
