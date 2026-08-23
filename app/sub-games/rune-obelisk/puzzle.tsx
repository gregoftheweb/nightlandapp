import React, { useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { RuneDial } from '@components/RuneDial'
import { RandomSource } from '@modules/gameboardLayout'
import { useSubGameLifecycle } from '../_shared/lifecycle'
import { InscriptionGrid } from './InscriptionGrid'
import { ObeliskArt } from './ObeliskArt'
import { ObeliskCompletionButton } from './ObeliskCompletionButton'
import { getObeliskControlPanelRect } from './layout'
import { getObeliskBackgroundState, useObeliskWinSequence } from './useObeliskWinSequence'
import {
  createRuneObeliskPuzzle,
  getRuneObeliskEnglishInscription,
  isRuneObeliskSolved,
  RUNE_OBELISK_CATEGORY_ORDER,
  RUNE_OBELISK_CATEGORY_RUNES,
  RUNE_OBELISK_STOP_RUNES,
  selectRuneObeliskCategory,
  setRuneObeliskPosition,
  toRunicInscription,
  type RuneObeliskCategory,
} from './puzzleState'

const CATEGORY_NAMES: Record<RuneObeliskCategory, string> = {
  vowels: 'Vowels',
  soft: 'Soft consonants',
  hard: 'Hard consonants',
}

export default function RuneObeliskPuzzle() {
  const lifecycle = useSubGameLifecycle('rune-obelisk')
  const [puzzle, setPuzzle] = useState(() => createRuneObeliskPuzzle(new RandomSource()))
  const lastUnsolvedEnglish = useRef('')
  const solved = isRuneObeliskSolved(puzzle)
  const { phase: winPhase, shakeX } = useObeliskWinSequence(solved, () => {
    void lifecycle.grantReward()
  })
  const english = getRuneObeliskEnglishInscription(puzzle)
  if (!solved) lastUnsolvedEnglish.current = english
  const displayedEnglish = solved && winPhase !== 'settled' ? lastUnsolvedEnglish.current : english
  const runic = toRunicInscription(displayedEnglish)

  const selectCategory = (category: RuneObeliskCategory) => {
    if (!solved) setPuzzle((current) => selectRuneObeliskCategory(current, category))
  }

  const changePosition = (position: number) => {
    if (solved) return
    setPuzzle((current) => setRuneObeliskPosition(current, current.activeCategory, position))
  }

  return (
    <View style={styles.screen}>
      <Animated.View
        testID="rune-obelisk-shake-view"
        style={[styles.shakeView, { transform: [{ translateX: shakeX }] }]}
      >
        <ObeliskArt state={getObeliskBackgroundState(winPhase)}>
          {({ actualWidth, actualHeight }) => {
            const artSize = Math.min(actualWidth, actualHeight)
            const panelFontSize = Math.max(11, artSize * 0.025) + 1
            const dialSize = artSize * 0.198
            const controlSize = artSize * 0.0624
            const controlPanelRect = getObeliskControlPanelRect(artSize)
            const categoryButtonSize = { width: artSize * 0.08, height: artSize * 0.065 }
            const activePosition = puzzle.positions[puzzle.activeCategory]

            return (
              <>
                <View testID="rune-inscription-panel" style={[styles.textPanel, styles.leftPanel]}>
                  <InscriptionGrid
                    text={runic}
                    fontSize={panelFontSize}
                    runic
                    testID="rune-inscription"
                  />
                </View>
                <View
                  testID="english-inscription-panel"
                  style={[styles.textPanel, styles.rightPanel]}
                >
                  <InscriptionGrid
                    text={displayedEnglish}
                    fontSize={panelFontSize}
                    testID="english-inscription"
                  />
                </View>

                <View
                  testID="obelisk-control-panel"
                  style={[styles.controlPanel, controlPanelRect]}
                >
                  <>
                    <View style={styles.categoryRow}>
                      {RUNE_OBELISK_CATEGORY_ORDER.map((category) => {
                        const active = category === puzzle.activeCategory
                        return (
                          <View key={category} style={styles.categoryColumn}>
                            <Pressable
                              disabled={solved}
                              accessibilityState={{ disabled: solved }}
                              accessibilityRole="button"
                              accessibilityLabel={CATEGORY_NAMES[category]}
                              onPress={() => selectCategory(category)}
                              style={[
                                styles.categoryButton,
                                categoryButtonSize,
                                active && styles.categoryButtonActive,
                                solved && styles.disabledControl,
                              ]}
                            >
                              <Text style={[styles.categoryRune, { fontSize: artSize * 0.05 }]}>
                                {RUNE_OBELISK_CATEGORY_RUNES[category]}
                              </Text>
                            </Pressable>
                          </View>
                        )
                      })}
                    </View>
                    <View style={styles.dialArea}>
                      <RuneDial
                        currentPosition={activePosition}
                        totalPositions={8}
                        labels={RUNE_OBELISK_STOP_RUNES}
                        size={dialSize}
                        controlSize={controlSize}
                        disabled={solved}
                        onPositionChange={changePosition}
                      />
                    </View>
                  </>
                </View>
                <ObeliskCompletionButton
                  phase={winPhase}
                  onComplete={() => void lifecycle.completeSubGame()}
                />
              </>
            )
          }}
        </ObeliskArt>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071018' },
  shakeView: { flex: 1 },
  textPanel: { position: 'absolute', top: '16.5%', width: '29%', height: '25%' },
  leftPanel: { left: '18%' },
  rightPanel: { left: '53%', transform: [{ translateX: 8 }] },
  controlPanel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  categoryRow: {
    position: 'absolute',
    top: 10,
    width: '58%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  categoryColumn: { alignItems: 'center' },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#607985',
    borderRadius: 5,
    backgroundColor: 'rgba(10, 20, 27, 0.88)',
  },
  categoryButtonActive: {
    borderColor: '#dffaff',
    backgroundColor: '#24556b',
    shadowColor: '#71dfff',
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  disabledControl: { opacity: 0.55 },
  categoryRune: { color: '#effdff', fontFamily: 'NotoSansRunic' },
  dialArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 5,
    alignItems: 'center',
  },
})
