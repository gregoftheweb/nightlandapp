import * as React from 'react'
import { render } from '@testing-library/react-native'

import { ThemedText } from '../ThemedText'

it('renders its content', () => {
  const { getByText } = render(<ThemedText>Test text</ThemedText>)

  expect(getByText('Test text')).toBeTruthy()
})
