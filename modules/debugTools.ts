// modules/debugTools.ts
/**
 * Central gate for the in-app debug tools (Settings > Debug tab: minimap,
 * jump-to-location, walkthrough-mode monster toggle, and the dev-only
 * DEBUG_TELEPORT_PLAYER action/deep-silo QA overrides that back it).
 *
 * Normally these are __DEV__-only. That's correct for local development, but
 * it also means a standalone release/preview APK (no Metro dev server, built
 * via `eas build`) never shows them - useful for alpha/playtester builds
 * where testers need the walkthrough and jump tools in an installable build.
 *
 * isDebugToolsEnabled() is the single source of truth: true in __DEV__ as
 * before, or when the build sets EXPO_PUBLIC_DEBUG_TOOLS=true. That env var
 * is inlined at bundle time by Expo's built-in EXPO_PUBLIC_* support, so it
 * works in a release JS bundle (unlike __DEV__, which a release bundle
 * always evaluates to false). Set it per EAS build profile in eas.json -
 * never hardcode it true here, or every production build would ship it.
 *
 * This is a function, not a frozen constant: __DEV__ is a live global that
 * can change at runtime (tests flip it to simulate production), so caching
 * its value once at module-load time would silently stop reacting to that -
 * re-read it on every call, same as the bare `__DEV__` checks this replaced.
 */
export function isDebugToolsEnabled(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_DEBUG_TOOLS === 'true'
}
