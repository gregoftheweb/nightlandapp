import { WordGridIntroScreen } from '../_shared/word-grid'
import { tesseractWordGridConfig } from './wordGridConfig'

export default function TesseractMain() {
  return <WordGridIntroScreen config={tesseractWordGridConfig} />
}
