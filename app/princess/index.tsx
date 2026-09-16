import React, { useState } from 'react'
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaContent } from '@components/SafeAreaContent'

const COVENANT = [
  {
    marker: 'WITHIN THE LAST REDOUBT',
    title: 'The last human light burns behind you.',
    text: 'For ten million souls, the Great Pyramid is the whole of the world. Beyond its electric Circle the Night has waited for ages, patient and awake.',
    action: 'Listen',
  },
  {
    marker: 'THE WORD OF MYRA',
    title: '“Persius went seeking a shape that cannot exist.”',
    text: '“He spoke of the Tesseract, of a Salamander, and of old machines beneath the earth. Now his voice comes only in dreams—and something listens when he calls.”',
    action: 'Take her hand',
  },
  {
    marker: 'THE COVENANT',
    title: 'Go into the Night. Learn its laws. Bring him home.',
    text: 'Every step beyond the Circle gives the dark a turn of its own. Follow the green trace. Inspect the places it reaches. A saved waypoint is a memory; death ends the present expedition.',
    action: 'Cross the Circle',
  },
] as const

export default function PrincessScreen() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const scene = COVENANT[page]

  const advance = () => {
    if (page < COVENANT.length - 1) {
      setPage((current) => current + 1)
      return
    }
    router.replace('/game')
  }

  return (
    <ImageBackground
      source={require('@assets/images/backgrounds/splash/sadprincess.webp')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.scrim} />
      <SafeAreaContent style={styles.safeArea}>
        <View style={styles.chapter}>
          <Text style={styles.marker}>{scene.marker}</Text>
          <Text style={styles.title}>{scene.title}</Text>
          <View style={styles.rule} />
          <Text style={styles.body}>{scene.text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.steps} accessibilityLabel={`Part ${page + 1} of 3`}>
            {COVENANT.map((_, index) => (
              <View key={index} style={[styles.step, index === page && styles.stepActive]} />
            ))}
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={advance}>
            <Text style={styles.buttonText}>{scene.action}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaContent>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 24 },
  chapter: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    marginTop: 20,
    padding: 22,
    backgroundColor: 'rgba(7, 8, 10, 0.84)',
    borderLeftWidth: 3,
    borderColor: '#842828',
  },
  marker: { color: '#8f8269', fontSize: 11, letterSpacing: 2.4, fontWeight: '700' },
  title: { color: '#d5c6a0', fontFamily: 'Gabrielle', fontSize: 31, lineHeight: 37, marginTop: 9 },
  rule: { width: 74, height: 1, backgroundColor: '#7e2929', marginVertical: 17 },
  body: { color: '#b9ad91', fontSize: 17, lineHeight: 26 },
  footer: { alignItems: 'center', paddingBottom: 18 },
  steps: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  step: { width: 22, height: 2, backgroundColor: '#514b40' },
  stepActive: { backgroundColor: '#a43a34' },
  button: {
    minWidth: 230,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(5, 5, 5, 0.82)',
    borderWidth: 1,
    borderColor: '#a13b34',
  },
  buttonText: { color: '#d0c09a', fontFamily: 'Gabrielle', fontSize: 23, textAlign: 'center' },
})
