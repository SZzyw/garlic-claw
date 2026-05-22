/**
 * Unified token freeze protocol.
 *
 * All token maps entering composeTokens MUST be frozen — this is the single
 * contract that prevents accidental mutation across layer boundaries.
 *
 * In dev mode, recursively freezes every value so that any assignment throws.
 * In production, returns the object as-is (zero overhead).
 *
 * Every bridge setter AND the hydration path MUST use this utility.
 * Direct Object.freeze() calls in bridge setters are forbidden — use this instead.
 */

type TokenMap = Record<string, string>

/**
 * Deep-freeze a token map in development.
 *
 * In production this is a no-op — the freeze contract is enforced
 * exclusively at dev time. This keeps production bundle overhead at zero
 * while catching every mutation bug during development and CI.
 */
export function devFreezeTokens(tokens: TokenMap): TokenMap {
  if (import.meta.env.DEV) {
    Object.freeze(tokens)
    for (const key of Object.keys(tokens)) {
      const val = tokens[key]
      if (typeof val === 'string') {
        Object.freeze(val)
      }
    }
  }
  return tokens
}

/**
 * Deterministic djb2 hash of a token map.
 *
 * Sorts keys to ensure stability regardless of insertion order.
 * Used by hydration and pipeline to verify pre-mount tokens
 * match the first reactive compose.
 */
export function computeTokenHash(tokens: TokenMap): number {
  let hash = 5381
  const keys = Object.keys(tokens).sort()
  for (const key of keys) {
    hash = ((hash << 5) + hash + hashString(key)) | 0
    hash = ((hash << 5) + hash + hashString(tokens[key])) | 0
  }
  return hash
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return h
}
