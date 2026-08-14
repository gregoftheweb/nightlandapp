import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Level } from '@config/types' // import your Level type

interface PositionDisplayProps {
  position?: { row: number; col: number }
  level?: Level
}

export const PositionDisplay: React.FC<PositionDisplayProps> = ({ position, level }) => {
  const insets = useSafeAreaInsets()

  if (!position || !level) {
    return null // or render "Loading..."
  }

  return (
    <View style={[styles.container, { top: insets.top + 8, right: insets.right + 10 }]}>
      <Text style={styles.text}>
        {level.name || level.id} {'\n'}({position.row},{position.col})
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
})
