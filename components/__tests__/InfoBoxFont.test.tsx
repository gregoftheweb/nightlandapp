import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'

import { InfoBox } from '../InfoBox'

describe('InfoBox message font', () => {
  test('applies an optional font family to scrollable description text', () => {
    const screen = render(
      <InfoBox
        visible
        name="Message"
        description="Runes"
        descriptionFontFamily="NotoSansRunic"
        scrollableDescription
        onClose={jest.fn()}
      />
    )

    expect(StyleSheet.flatten(screen.getByText('Runes').props.style)).toEqual(
      expect.objectContaining({ fontFamily: 'NotoSansRunic' })
    )
  })
})
