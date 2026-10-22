import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { HOUSE_TEXTURES, type TextureSources } from './assets'

export async function loadTextures(): Promise<TextureSources> {
  const entries = await Promise.all(
    Object.entries(HOUSE_TEXTURES).map(async ([name, module]) => {
      const asset = await Asset.fromModule(module).downloadAsync()
      const base64 = await new File(asset.localUri ?? asset.uri).base64()
      return [name, `data:image/webp;base64,${base64}`] as const
    })
  )
  return Object.fromEntries(entries) as TextureSources
}
