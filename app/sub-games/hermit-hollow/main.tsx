// app/sub-games/hermit-hollow/main.tsx
// Main dialogue screen for the hermit-hollow sub-game
import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native'
import { exitSubGame } from '@/modules/subGames'
import { useGameContext } from '@/context/GameContext'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { HERMIT_DIALOGUE, DialogueNode } from './dialogue'
import { saveWaypoint } from '@/modules/saveGame'
import { applyEffect } from '@/modules/effects'
import { Effect } from '@/config/types'

const bgHermit = require('@assets/images/backgrounds/subgames/hermit-screen1.png')
const SUB_GAME_NAME = 'hermit-hollow'
const WAYPOINT_NAME = 'hermit-hollow waypoint'

export default function HermitHollowMain() {
  const { state, dispatch, signalRpgResume } = useGameContext()

  // Waypoint toast state
  const [showWaypointToast, setShowWaypointToast] = useState(false)
  const toastOpacity = useState(new Animated.Value(0))[0]

  // Build dialogue map from array for O(1) lookups
  const dialogueMap = useMemo(() => {
    const map = new Map<string, DialogueNode>()
    HERMIT_DIALOGUE.forEach((node) => map.set(node.id, node))
    return map
  }, [])

  // Find the end node (for return visits)
  const endNode = useMemo(() => {
    return HERMIT_DIALOGUE.find((node) => node.end === true)
  }, [])

  // Check if player has already completed the hermit conversation
  // (hermit entered trance, so return visits should start at end-state)
  const isHermitConversationCompleted = useMemo(() => {
    return state.subGamesCompleted?.[SUB_GAME_NAME] === true
  }, [state.subGamesCompleted])

  // Initialize current node - start at end if completed, otherwise start node
  const [currentNodeId, setCurrentNodeId] = useState<string>(() => {
    if (isHermitConversationCompleted && endNode) {
      if (__DEV__) {
        console.log('[HermitHollow] Returning visit - starting at trance state')
      }
      return endNode.id
    }
    return 'start'
  })

  // Track if effects have been applied for current node (to avoid duplicates)
  const [appliedEffectsForNode, setAppliedEffectsForNode] = useState<string | null>(null)

  // Get current node from map
  const currentNode = dialogueMap.get(currentNodeId)

  // Apply effects when node changes
  useEffect(() => {
    if (!currentNode || appliedEffectsForNode === currentNodeId) {
      return
    }

    // IMPORTANT: On return visits (when hermit is already completed),
    // we start at the end node but should NOT re-apply its effects.
    // The effects were already applied during the first playthrough.
    if (isHermitConversationCompleted && currentNode.end === true) {
      if (__DEV__) {
        console.log('[HermitHollow] Return visit - skipping effects for end node (already applied)')
      }
      setAppliedEffectsForNode(currentNodeId)
      return
    }

    if (currentNode.effects && currentNode.effects.length > 0) {
      if (__DEV__) {
        console.log(
          `[HermitHollow] Applying effects for node ${currentNodeId}:`,
          currentNode.effects
        )
      }

      // Build updated subGamesCompleted object with all effects
      const updatedSubGamesCompleted = {
        ...(state.subGamesCompleted || {}),
      }

      // Track if we need to create a waypoint
      let shouldCreateWaypoint = false

      // Apply each effect
      currentNode.effects.forEach((effect) => {
        // Check if this is the final trance effect
        if (effect === 'hermit_enters_trance') {
          shouldCreateWaypoint = true
          updatedSubGamesCompleted[SUB_GAME_NAME] = true
          
          // Mark sub-game as completed
          dispatch({
            type: 'SET_SUB_GAME_COMPLETED',
            payload: { subGameName: SUB_GAME_NAME, completed: true },
          })
        }

        // Execute the effect through the effects system if it has a handler
        // This handles effects like unlock_hide_ability that modify player state
        if (effect === 'unlock_hide_ability') {
          if (__DEV__) {
            console.log(`[HermitHollow] Executing effect handler: ${effect}`)
          }
          
          // Create an Effect object for the applyEffect function
          const effectObj: Effect = {
            type: effect,
          }
          
          // Execute the effect
          applyEffect(effectObj, {
            state,
            dispatch,
            sourceType: 'system',
            sourceId: SUB_GAME_NAME,
            trigger: 'onInteract',
          })
        }

        // Store other effects as persistent flags in subGamesCompleted
        // Pattern: Use sub-game name as namespace to avoid collisions
        // Format: `{sub-game-name}:{effect_flag}`
        // Example: `hermit-hollow:learned_great_power_exists`
        // These can be checked later by other systems for quest/lore progression
        updatedSubGamesCompleted[`${SUB_GAME_NAME}:${effect}`] = true
        
        dispatch({
          type: 'SET_SUB_GAME_COMPLETED',
          payload: { subGameName: `${SUB_GAME_NAME}:${effect}`, completed: true },
        })
      })

      // Create waypoint save with ALL completion flags included
      // IMPORTANT: We must create an updated state object because dispatch is async
      // and won't have updated the state yet when saveWaypoint is called
      // ALSO: Only create the waypoint ONCE - the first time through the conversation
      if (shouldCreateWaypoint) {
        // Check if waypoint has already been created
        const waypointAlreadyCreated = state.waypointSavesCreated?.[WAYPOINT_NAME] === true
        
        if (waypointAlreadyCreated) {
          if (__DEV__) {
            console.log(`[HermitHollow] Waypoint already created - skipping save: ${WAYPOINT_NAME}`)
          }
        } else {
          // First time completing - create the waypoint
          const stateWithCompletion = {
            ...state,
            subGamesCompleted: updatedSubGamesCompleted,
          }
          
          saveWaypoint(stateWithCompletion, WAYPOINT_NAME)
            .then(() => {
              if (__DEV__) {
                console.log(`[HermitHollow] Waypoint save created (FIRST TIME): ${WAYPOINT_NAME}`)
                console.log(`[HermitHollow] Saved with subGamesCompleted:`, updatedSubGamesCompleted)
              }

              // Mark waypoint as created to prevent future saves
              dispatch({
                type: 'SET_WAYPOINT_CREATED',
                payload: { waypointName: WAYPOINT_NAME },
              })

              // Show toast
              setShowWaypointToast(true)

              // Animate toast in
              Animated.sequence([
                Animated.timing(toastOpacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.delay(2400), // Show for 2.4s
                Animated.timing(toastOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setShowWaypointToast(false)
              })
            })
            .catch((err) => {
              console.error('[HermitHollow] Failed to create waypoint save:', err)
            })
        }
      }

      setAppliedEffectsForNode(currentNodeId)
    }
  }, [currentNodeId, currentNode, appliedEffectsForNode, dispatch, state, toastOpacity])

  const handleChoicePress = (nextNodeId: string) => {
    if (__DEV__) {
      console.log(`[HermitHollow] Choice selected, transitioning to node: ${nextNodeId}`)
    }
    setCurrentNodeId(nextNodeId)
    setAppliedEffectsForNode(null) // Reset to allow effects on new node
  }

  const handleReturnToNightLand = () => {
    if (__DEV__) {
      console.log(`[HermitHollow] Exiting sub-game`)
    }

    // Signal RPG to refresh/resume at player's current position
    signalRpgResume()

    // Exit sub-game and return to RPG
    exitSubGame({ completed: true })
  }

  // Safety check
  if (!currentNode) {
    if (__DEV__) {
      console.error(`[HermitHollow] Node not found: ${currentNodeId}`)
    }
    return (
      <BackgroundImage source={bgHermit}>
        <View style={styles.container}>
          <View style={styles.contentArea}>
            <Text style={styles.errorText}>Error: Dialogue node not found</Text>
          </View>
          <BottomActionBar>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={handleReturnToNightLand}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Return to the Night Land</Text>
            </TouchableOpacity>
          </BottomActionBar>
        </View>
      </BackgroundImage>
    )
  }

  const isEndState = currentNode.end === true

  return (
    <BackgroundImage source={bgHermit}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* NPC Text Box */}
          <View style={styles.textBoxContainer}>
            <ScrollView
              style={styles.textBoxScroll}
              contentContainerStyle={styles.textBoxContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.npcText}>{currentNode.npcText}</Text>
            </ScrollView>
          </View>
        </View>

        <BottomActionBar>
          {isEndState ? (
            // End state: Show only "Return to the Night Land" button
            <TouchableOpacity
              style={styles.returnButton}
              onPress={handleReturnToNightLand}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Return to the Night Land</Text>
            </TouchableOpacity>
          ) : (
            // Active dialogue: Show choice buttons
            <View style={styles.choicesContainer}>
              {currentNode.choices?.map((choice, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.choiceButton}
                  onPress={() => handleChoicePress(choice.next)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.choiceText}>{choice.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </BottomActionBar>

        {/* Waypoint Saved Toast */}
        {showWaypointToast && (
          <Animated.View style={[styles.waypointToast, { opacity: toastOpacity }]}>
            <Text style={styles.waypointToastText}>Waypoint Saved</Text>
          </Animated.View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  textBoxContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    padding: 20,
    minHeight: 200,
    maxHeight: 400,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  textBoxScroll: {
    flex: 1,
  },
  textBoxContent: {
    flexGrow: 1,
  },
  npcText: {
    fontSize: 18,
    fontWeight: '500',
    color: subGameTheme.white,
    lineHeight: 28,
    textAlign: 'left',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: subGameTheme.red,
    textAlign: 'center',
  },
  choicesContainer: {
    gap: 12,
    width: '100%',
  },
  choiceButton: {
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
  choiceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
  returnButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
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
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: subGameTheme.white,
    textAlign: 'center',
  },
  waypointToast: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  waypointToastText: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: subGameTheme.blue,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
})
