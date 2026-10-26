import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useIsFocused, useRouter } from 'expo-router'
import { SafeAreaContent } from '@components/SafeAreaContent'
import { useSubGameLifecycle } from '../../_shared/lifecycle'
import { HOUSE_INSTANCE_ID } from '../_config/lifecycleConfig'
import { loadTextures } from '../_config/loadTextures'
import { buildDungeonDocument } from '../_engine/document'
import DungeonSurface from './DungeonSurface'

export function HouseInterior({ testMode }: { testMode: boolean }) {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle(HOUSE_INSTANCE_ID)
  const focused = useIsFocused()
  const [appActive, setAppActive] = useState(AppState.currentState === 'active')
  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setAppActive(state === 'active')
    )
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    let mounted = true
    setFailed(false)
    setHtml(null)
    void loadTextures()
      .then((textures) => {
        if (mounted) setHtml(buildDungeonDocument(textures))
      })
      .catch(() => {
        if (mounted) setFailed(true)
      })
    return () => {
      mounted = false
    }
  }, [attempt])

  useEffect(() => {
    if (!focused) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (testMode) router.replace('/')
      else void lifecycle.failSubGame()
      return true
    })
    return () => subscription.remove()
  }, [focused, lifecycle, router, testMode])

  const exit = () => {
    if (testMode) router.replace('/')
    else void lifecycle.failSubGame()
  }

  return (
    <SafeAreaContent style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>HOUSE OF SILENCE</Text>
          <Text style={styles.subtitle}>
            {testMode ? 'Interior study · corridor test' : 'The threshold'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={testMode ? 'Exit test' : 'Leave House of Silence'}
          onPress={exit}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{testMode ? 'Exit test' : 'Leave'}</Text>
        </Pressable>
      </View>
      {failed ? (
        <View style={styles.loading}>
          <Text style={styles.message}>The corridor could not load.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAttempt((value) => value + 1)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : html ? (
        <DungeonSurface
          key={attempt}
          html={html}
          active={focused && appActive}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color="#c9bfae" />
          <Text style={styles.message}>Preparing the pencil study…</Text>
        </View>
      )}
    </SafeAreaContent>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#242320' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#554f43',
  },
  title: { color: '#e6dfd1', fontSize: 15, letterSpacing: 2 },
  subtitle: { color: '#a69e8e', fontSize: 12, marginTop: 4 },
  button: {
    borderWidth: 1,
    borderColor: '#726b5d',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  buttonText: { color: '#e6dfd1', fontSize: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  message: { color: '#c9bfae', fontSize: 16 },
})
