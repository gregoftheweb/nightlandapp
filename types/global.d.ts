// /types/global.d.ts
export {}

declare global {
  var resetTesseractTiles: (() => void) | undefined
}

// React Native injects this global at runtime; application modules consume it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __DEV__: boolean
