import { Asset } from 'expo-asset'
import { HOUSE_TEXTURES, type TextureSources } from './assets'

export async function loadTextures(): Promise<TextureSources> {
  const entries = await Promise.all(
    Object.entries(HOUSE_TEXTURES).map(async ([name, module]) => {
      const asset = Asset.fromModule(module)
      const response = await fetch(asset.uri)
      if (!response.ok) throw new Error(`Could not load ${name} texture`)
      const blob = await response.blob()
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error(`Could not read ${name} texture`))
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(blob)
      })
      return [name, data] as const
    })
  )
  return Object.fromEntries(entries) as TextureSources
}
