// components/CombatDialog.tsx
import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

interface CombatDialogProps {
  visible: boolean
  messages: string[] // Array of combat messages for the current round
  onClose?: () => void
}

export const CombatDialog: React.FC<CombatDialogProps> = ({ visible, messages, onClose }) => {
  const [opacity] = useState(new Animated.Value(0))
  const [isVisible, setIsVisible] = useState(false)
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]) // Track displayed messages to clear on hide
  const timerRef = useRef<number | null>(null)

  // Process messages to show one complete combat round
  // Christos's action should be at the top, followed by monster responses
  const processRoundMessages = (messages: string[]): string[] => {
    if (messages.length === 0) return []

    // Find the last Christos action (player turn)
    let christosActionIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].toLowerCase().includes('christos')) {
        christosActionIndex = i
        break
      }
    }

    if (christosActionIndex === -1) {
      // No Christos action found, show last 5 messages
      return messages.slice(-5)
    }

    // Get Christos action and all messages after it (monster responses in this round)
    const roundMessages = messages.slice(christosActionIndex)

    // Limit to max 5 messages (1 Christos + up to 4 monster responses)
    return roundMessages.slice(0, 5)
  }

  const displayMessages = processRoundMessages(messages)

  useEffect(() => {
    if (visible && messages.length > 0) {
      // Clear any existing timer first
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      setIsVisible(true)
      // Update displayed messages when showing
      setDisplayedMessages(displayMessages)

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()

      // Set auto-close timer (2 seconds for combat messages)
      timerRef.current = setTimeout(() => {
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false)
          setDisplayedMessages([]) // Clear messages when hiding
          timerRef.current = null
          if (onClose) {
            onClose()
          }
        })
      }, 2000) // 2 seconds for one combat round
    } else {
      // Clear timer and hide immediately when visible becomes false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false)
        setDisplayedMessages([]) // Clear messages when hiding
      })
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [visible, messages, opacity, onClose, displayMessages])

  if (!isVisible || displayedMessages.length === 0) {
    return null
  }

  return (
    <Animated.View style={[styles.combatDialog, { opacity }]}>
      {displayedMessages.map((msg, index) => (
        <Text
          key={index}
          style={[styles.combatText, index === 0 ? styles.christosMessage : styles.monsterMessage]}
        >
          {msg}
        </Text>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  combatDialog: {
    position: 'absolute',
    top: 80,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 70% transparent
    borderWidth: 2,
    borderColor: '#ff0000', // Red border
    padding: 12,
    borderRadius: 8,
    maxWidth: '49%', // Reduced from 70% to be 30% narrower
    minWidth: 200, // Reduced proportionally from 240
    zIndex: 1000, // High z-index to appear above other elements
  },
  combatText: {
    color: '#ff0000', // Red text to match the theme
    textAlign: 'left',
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  christosMessage: {
    fontWeight: 'bold',
    fontSize: 14,
    opacity: 1.0,
    color: '#ffaa00', // Golden/orange color for Christos
  },
  monsterMessage: {
    fontSize: 13,
    opacity: 0.85,
    color: '#ff0000', // Red for monsters
  },
})
