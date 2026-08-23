import React, { useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'

import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { useSubGameLifecycle } from '../_shared/lifecycle'

const entranceImage = require('@assets/images/backgrounds/subgames/rosseta/obelisk-entrance.webp')

export default function RuneObeliskEntrance() {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle('rune-obelisk')

  useEffect(() => {
    if (!lifecycle.isCompleted()) return
    const route = lifecycle.resolveEntryRoute()
    if (route) router.replace(route as never)
  }, [lifecycle, router])

  return (
    <BackgroundImage source={entranceImage} overlayOpacity={0.12} foregroundFit="cover">
      <View style={styles.container}>
        <View style={styles.copyBox}>
          <Text style={styles.title}>The Rune-Inscribed Obelisk</Text>
          <Text style={styles.copy}>
            Paired tablets shimmer above an ancient dial. Their alphabets seem divided, waiting to
            be brought back into accord.
          </Text>
        </View>
        <BottomActionBar>
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={() => void lifecycle.failSubGame()}>
              <Text style={styles.buttonText}>Leave it undisturbed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primary]}
              onPress={() => router.push('/sub-games/rune-obelisk/puzzle' as never)}
            >
              <Text style={styles.buttonText}>Touch the dial</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  copyBox: {
    margin: 24,
    padding: 18,
    maxWidth: 540,
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(3, 12, 19, 0.82)',
    borderWidth: 1,
    borderColor: '#92e8ff',
  },
  title: { color: '#e5fbff', fontFamily: 'Gabrielle', fontSize: 26, textAlign: 'center' },
  copy: {
    color: '#f3fbff',
    fontFamily: 'Sofia',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#1b2932',
    borderWidth: 2,
    borderColor: '#607985',
  },
  primary: { borderColor: '#92e8ff', backgroundColor: '#153748' },
  buttonText: { color: '#f3fbff', fontFamily: 'Sofia', fontSize: 16, textAlign: 'center' },
})
