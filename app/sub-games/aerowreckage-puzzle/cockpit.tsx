// app/sub-games/aerowreckage-puzzle/cockpit.tsx
// Screen [2]: Cockpit overview screen
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { THEME } from './theme'

const bgCockpit = require('@assets/images/backgrounds/subgames/aerowreck-safe5.webp')

export default function AeroWreckageCockpit() {
  const router = useRouter()

  const handleLookCloser = () => {
    if (__DEV__) {
      console.log('[AeroWreckageCockpit] Looking more closely')
    }
    router.push('/sub-games/aerowreckage-puzzle/cockpit-closeup' as any)
  }

  const handleReturnToEntrance = () => {
    if (__DEV__) {
      console.log('[AeroWreckageCockpit] Returning to entrance')
    }
    router.back()
  }

  return (
    <BackgroundImage source={bgCockpit}>
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
              The ruined cockpit stretches before Christos. Shattered glass crunches under his feet,
              but the workmanship speaks of a lost age of wonders.
            </Text>
          </View>
        </View>

        <BottomActionBar>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLookCloser}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Look more closely</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleReturnToEntrance}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Return back to entrance</Text>
            </TouchableOpacity>
          </View>
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
  flavorTextSecondary: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  primaryButton: {
    flex: 1,
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
})
