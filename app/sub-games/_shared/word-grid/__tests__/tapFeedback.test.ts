import { parsedWordGridContentResult } from '../contentCatalog'
import {
  INVALID_WORD_GRID_BORDER_COLOR,
  INVALID_WORD_GRID_CIRCLE_COLOR,
  resolveWordGridTapFeedbackColors,
} from '../tapFeedback'

describe('word-grid tap feedback', () => {
  it.each(['word-tile-crypt-01', 'word-tile-crypt-02'])(
    'uses green for valid taps and a red 500ms failure window for %s',
    (instanceId) => {
      expect(parsedWordGridContentResult.success).toBe(true)
      if (!parsedWordGridContentResult.success) return

      const config = parsedWordGridContentResult.value[instanceId].shapeConfig
      expect(resolveWordGridTapFeedbackColors(config.tapFeedback, false)).toEqual({
        borderColor: '#20e878',
        circleColor: 'rgba(32, 232, 120, 0.55)',
      })
      expect(resolveWordGridTapFeedbackColors(config.tapFeedback, true)).toEqual({
        borderColor: INVALID_WORD_GRID_BORDER_COLOR,
        circleColor: INVALID_WORD_GRID_CIRCLE_COLOR,
      })
      expect(config.wrongInputOutcome.delayMs).toBe(500)
      expect(config.tapFeedback.selectionFadeMs).toBeGreaterThanOrEqual(
        config.wrongInputOutcome.delayMs
      )
    }
  )
})
