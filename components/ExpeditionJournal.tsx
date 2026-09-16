import React, { useMemo } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { GameState } from '@config/types'
import { deriveExpeditionJournal } from '@modules/expeditionJournal'

interface ExpeditionJournalProps {
  state: GameState
  visible: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ExpeditionJournal({
  state,
  visible,
  onOpen,
  onClose,
}: ExpeditionJournalProps) {
  const insets = useSafeAreaInsets()
  const journal = useMemo(() => deriveExpeditionJournal(state), [state])

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open expedition journal. Current purpose: ${journal.objective.title}`}
        activeOpacity={0.82}
        style={[styles.tab, { top: insets.top + 12 }]}
        onPress={(event) => {
          event.stopPropagation()
          onOpen()
        }}
      >
        <Text style={styles.eyebrow}>PRESENT PURPOSE</Text>
        <Text numberOfLines={1} style={styles.tabTitle}>
          {journal.objective.title}
        </Text>
        {journal.objective.progress ? (
          <Text style={styles.tabProgress}>{journal.objective.progress}</Text>
        ) : (
          <Text style={styles.tabHint}>Tap for the expedition journal</Text>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>THE BOOK OF THE EXPEDITION</Text>
                <Text style={styles.title}>Marks against the Night</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.sectionLabel}>PRESENT PURPOSE</Text>
              <Text style={styles.objectiveTitle}>{journal.objective.title}</Text>
              <Text style={styles.body}>{journal.objective.detail}</Text>
              {journal.objective.progress && (
                <Text style={styles.progress}>{journal.objective.progress}</Text>
              )}

              <View style={styles.rule} />
              <Text style={styles.sectionLabel}>CONDITION OF THE PILGRIM</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, journal.condition === 'DIRE' && styles.dire]}>
                    {journal.condition}
                  </Text>
                  <Text style={styles.statLabel}>
                    {state.player.currentHP} / {state.player.maxHP} vitality
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{state.distanceTraveled ?? state.moveCount}</Text>
                  <Text style={styles.statLabel}>steps from safety</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{state.monstersKilled ?? 0}</Text>
                  <Text style={styles.statLabel}>horrors slain</Text>
                </View>
              </View>

              <View style={styles.rule} />
              <Text style={styles.sectionLabel}>THINGS LEARNED</Text>
              {journal.discoveries.length === 0 ? (
                <Text style={styles.empty}>
                  Nothing is known. Follow the green trace and inspect what the Night has failed to
                  bury.
                </Text>
              ) : (
                journal.discoveries.map((discovery) => (
                  <View key={discovery.id} style={styles.discovery}>
                    <Text style={styles.discoveryTitle}>{discovery.title}</Text>
                    <Text style={styles.body}>{discovery.text}</Text>
                  </View>
                ))
              )}

              <View style={styles.rule} />
              <Text style={styles.warning}>
                Each step moves the things beyond the light. A waypoint preserves a memory of the
                journey. Death consumes the present expedition.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const INK = '#d7c9a2'
const RED = '#9d2929'

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    left: 12,
    zIndex: 850,
    width: 226,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: 'rgba(6, 7, 9, 0.9)',
    borderLeftWidth: 3,
    borderColor: RED,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  eyebrow: { color: '#8f856d', fontSize: 9, letterSpacing: 1.8, fontWeight: '700' },
  tabTitle: { color: INK, fontSize: 16, fontFamily: 'Gabrielle', marginTop: 2 },
  tabProgress: { color: '#ba5b4d', fontSize: 10, marginTop: 3, letterSpacing: 0.5 },
  tabHint: { color: '#6f695b', fontSize: 9, marginTop: 3 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '88%',
    backgroundColor: '#0c0d0e',
    borderWidth: 1,
    borderColor: '#493e31',
    borderRadius: 4,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingRight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#312b24',
    backgroundColor: '#11100e',
  },
  kicker: { color: '#81755e', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { color: INK, fontFamily: 'Gabrielle', fontSize: 27, marginTop: 3 },
  close: { position: 'absolute', right: 12, top: 12, width: 40, height: 40, alignItems: 'center' },
  closeText: { color: '#8e8068', fontSize: 32, lineHeight: 36 },
  content: { padding: 20, paddingBottom: 30 },
  sectionLabel: { color: '#756a56', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  objectiveTitle: { color: '#c96150', fontFamily: 'Gabrielle', fontSize: 25, marginTop: 7 },
  body: { color: '#b9ad91', fontSize: 15, lineHeight: 22, marginTop: 5 },
  progress: { color: '#d16b57', fontSize: 12, marginTop: 10, fontWeight: '700', letterSpacing: 1 },
  rule: { height: 1, backgroundColor: '#302920', marginVertical: 20 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#111211',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#3a3127',
  },
  statValue: { color: INK, fontSize: 16, fontWeight: '700' },
  dire: { color: '#d44c42' },
  statLabel: { color: '#706858', fontSize: 10, marginTop: 3 },
  empty: { color: '#8b806a', fontSize: 15, lineHeight: 22, fontStyle: 'italic', marginTop: 8 },
  discovery: { marginTop: 14, borderLeftWidth: 1, borderColor: '#574738', paddingLeft: 12 },
  discoveryTitle: { color: INK, fontFamily: 'Gabrielle', fontSize: 20 },
  warning: { color: '#80685e', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
})
