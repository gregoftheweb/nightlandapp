import { WordGridFailureScreen } from '../_shared/word-grid'
import { tesseractWordGridConfig } from './wordGridConfig'

export default function TesseractScreen3() {
  return <WordGridFailureScreen config={tesseractWordGridConfig} />
}
