import React, { useState } from 'react'
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaContent } from '@components/SafeAreaContent'

const COVENANT = [
  {
    marker: 'WITHIN THE LAST REDOUBT',
    title: 'The last remnant of Mankind endures still.',
    text: "Christos and Persius, heirs of the Pyramid's great houses, had been friends since boyhood. Helen was Christos's betrothed and dear to them both. Then Persius found word of the Tesseract in the old archive—and could speak of little else.",
    action: 'Listen',
  },
  {
    marker: 'HELEN MOURNS YOUR FATE',
    title: '“Christos, I beg thee—do not follow him.”',
    text: '“Persius would not heed me. He has cast himself beyond the Circle for an old tale and a foolish bauble. Follow not his folly into the Night. Stay with me, my love. I cannot lose thee also.”',
    action: 'Take her hand',
  },
  {
    marker: 'THE DEPARTURE',
    title: 'Yet Christos takes up his Discos.',
    text: 'He turns and leaves his betrothed. The quest is surely hopeless, and the Night will consume his everlasting soul; yet Persius is his oldest friend. He can not leave him to the dark alone. Though likely doomed, he must try—to save Persius and retrieve the Tesseract. He leaves Helen in her sorrow...',
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
    backgroundColor: 'rgba(7, 8, 10, 0.40)',
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
