import { WordGridEntry } from '../_shared/word-grid'
import { tesseractWordGridConfig } from './wordGridConfig'

export default function TesseractIndex() {
  return <WordGridEntry config={tesseractWordGridConfig} />
}
