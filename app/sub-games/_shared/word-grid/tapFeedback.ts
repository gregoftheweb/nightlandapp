export const INVALID_WORD_GRID_BORDER_COLOR = '#ff2b2b'
export const INVALID_WORD_GRID_CIRCLE_COLOR = 'rgba(255, 43, 43, 0.72)'

interface WordGridTapFeedbackPalette {
  selectedBorderColor: string
  circleColor: string
}

export function resolveWordGridTapFeedbackColors(
  palette: WordGridTapFeedbackPalette,
  invalid: boolean
) {
  return invalid
    ? {
        borderColor: INVALID_WORD_GRID_BORDER_COLOR,
        circleColor: INVALID_WORD_GRID_CIRCLE_COLOR,
      }
    : {
        borderColor: palette.selectedBorderColor,
        circleColor: palette.circleColor,
      }
}
