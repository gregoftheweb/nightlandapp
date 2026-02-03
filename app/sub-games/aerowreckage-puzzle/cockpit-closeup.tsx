// app/sub-games/aerowreckage-puzzle/cockpit-closeup.tsx
// Screen [3]: Cockpit close-up with etched combination
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { THEME } from './theme'

const bgCockpitCloseup = require('@assets/images/backgrounds/subgames/aerowreck-safe6.png')

export default function AeroWreckageCockpitCloseup() {
  const router = useRouter()

  const handleContinueExploration = () => {
    if (__DEV__) {
      console.log('[AeroWreckageCockpitCloseup] Continuing exploration')
    }
    router.back()
  }

  return (
    <BackgroundImage source={bgCockpitCloseup}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <View
            style={{
              flex: 1,
              alignSelf: 'stretch',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              paddingTop: '10%',
            }}
          >
            <Text style={styles.flavorText}>
              Christos leans in closer. Among the intricate brass work, there is something unusual
              there etched in the panel, as if left by a previous explorer or perhaps the craft&apos;s
              final crew.
            </Text>
          </View>
        </View>

        <BottomActionBar>
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFull]}
            onPress={handleContinueExploration}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Continue exploration</Text>
          </TouchableOpacity>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  flavorText: {
    fontSize: 18,
    color: THEME.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  comboText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.brass,
    textAlign: 'center',
    letterSpacing: 4,
    marginVertical: 10,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flavorTextSecondary: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonFull: {
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
