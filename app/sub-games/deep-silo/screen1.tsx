// app/sub-games/deep-silo/screen1.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useGameState } from '@context/GameContext'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { isDeepSiloSwitchThrown, useDeepSiloDevState } from './entranceState'

export const DEEP_SILO_APPROACH_IMAGES = {
  closed: require('@assets/images/backgrounds/subgames/deep-silo/silo-entrance-approach.webp'),
  open: require('@assets/images/backgrounds/subgames/deep-silo/silo-entrance-open.webp'),
} as const

export function DeepSiloApproachView({
  open,
  onEnter,
  onLookCloser,
  onReturn,
}: {
  open: boolean
  onEnter: () => void
  onLookCloser: () => void
  onReturn: () => void
}) {
  return (
    <BackgroundImage
      source={open ? DEEP_SILO_APPROACH_IMAGES.open : DEEP_SILO_APPROACH_IMAGES.closed}
      overlayOpacity={0.12}
    >
      <View style={styles.container}>
        <View style={styles.contentArea} />
        <BottomActionBar>
          <View style={styles.buttonRow}>
            {open ? <Action label="Enter" onPress={onEnter} primary /> : null}
            <Action label="Look closer" onPress={onLookCloser} />
            <Action label="Return to the Night Land" onPress={onReturn} />
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

export default function DeepSiloScreen1() {
  const router = useRouter()
  const state = useGameState()
  const dev = useDeepSiloDevState()
  const realThrown = isDeepSiloSwitchThrown(state.subGamesCompleted)
  const open = realThrown || (__DEV__ && dev.switchThrown)
  return (
    <DeepSiloApproachView
      open={open}
      onEnter={() => {
        if (open) router.push('/sub-games/deep-silo/screen2' as never)
      }}
      onLookCloser={() => router.push('/sub-games/deep-silo/entrance-panel' as never)}
      onReturn={() => exitSubGame({ completed: false })}
    />
  )
}

function Action({
  label,
  onPress,
  primary,
}: {
  label: string
  onPress: () => void
  primary?: boolean
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.button, primary && styles.downButton]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.blue,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.red,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  downButton: {
    backgroundColor: subGameTheme.red,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
})
