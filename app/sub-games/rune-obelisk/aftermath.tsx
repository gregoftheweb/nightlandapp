import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useSubGameLifecycle } from '../_shared/lifecycle'
import { ObeliskArt } from './ObeliskArt'

export default function RuneObeliskAftermath() {
  const lifecycle = useSubGameLifecycle('rune-obelisk')

  return (
    <View style={styles.screen}>
      <ObeliskArt state="electric">
        {() => (
          <View style={styles.panel}>
            <Text style={styles.title}>The awakened obelisk remembers you.</Text>
            <Text style={styles.copy}>
              Its paired scripts are clear now; the rune cipher is yours.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => void lifecycle.completeSubGame()}
            >
              <Text style={styles.buttonText}>Return to the Night Land</Text>
            </TouchableOpacity>
          </View>
        )}
      </ObeliskArt>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071018' },
  panel: {
    position: 'absolute',
    left: '19%',
    top: '53%',
    width: '62%',
    height: '24%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: { color: '#e9fdff', fontFamily: 'Gabrielle', fontSize: 20, textAlign: 'center' },
  copy: { color: '#e9fdff', fontFamily: 'Sofia', fontSize: 14, textAlign: 'center' },
  button: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dffaff',
    backgroundColor: '#17485e',
  },
  buttonText: { color: '#fff', fontFamily: 'Sofia', fontSize: 14 },
})
