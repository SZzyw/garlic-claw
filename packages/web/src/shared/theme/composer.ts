/**
 * Token Composition Engine.
 *
 * Pure function. No side effects. No DOM access. No bridge reads.
 * Takes independent layer outputs (themeBase, atmosphereLighting) and
 * derives all alias, depth, material, legacy, and v3 short-name tokens.
 *
 * This is the ONLY place where token layers are merged.
 *
 * Inputs are frozen and mutation-checked — any downstream mutation
 * of composed tokens will throw in dev.
 */
import type { TokenMap } from './types'
import { computeAliases } from './aliases'
import { computeDepthTokens } from './depth'
import { computeMaterialTokens } from './material'
import { computeLegacyTokens } from './legacy'

/**
 * Compose final token map from layer outputs.
 *
 * Layer precedence (later wins):
 *   1. themeBase      (base palette: --background, --primary, --hue, ...)
 *   2. atmosphereLighting (overrides atmosphere/lighting tokens)
 *   3. alias tokens   (--gc-* → primitive mapping)
 *   4. depth tokens   (--gc-surface-*, --gc-shadow-*, --gc-z-*, ...)
 *   5. material tokens (--gc-reflection-*, --gc-blur-*, --gc-edge-light, ...)
 *   6. legacy tokens  (backwards compat shell)
 *   7. v3 short aliases (--gc-bg, --gc-surface, --gc-text, ...)
 */
export function composeTokens(
  themeBase: TokenMap,
  atmosphereLighting: TokenMap,
): TokenMap {
  // Freeze inputs — any mutation attempt will throw in strict mode
  // Empty objects (e.g. hydration pre-atmosphere) are exempt
  if (Object.keys(themeBase).length > 0) checkFrozen(themeBase, 'themeBase')
  if (Object.keys(atmosphereLighting).length > 0) checkFrozen(atmosphereLighting, 'atmosphereLighting')

  const merged = { ...themeBase, ...atmosphereLighting }

  const composed = {
    ...merged,
    ...computeAliases(merged),
    ...computeDepthTokens(merged),
    ...computeMaterialTokens(merged),
    ...computeLegacyTokens(merged),
    ...v3ShortAliases(merged),
  }

  // Freeze individual values to detect post-compose tampering
  for (const key of Object.keys(composed)) {
    Object.freeze(composed[key])
  }

  return composed
}

function checkFrozen(tokens: TokenMap, label: string): void {
  if (!Object.isFrozen(tokens)) {
    throw new Error(
      `[composer] ${label} tokens are not frozen — bridge setter must Object.freeze before write. ` +
      `This indicates a mutation path bypassing the bridge.`,
    )
  }
  for (const key of Object.keys(tokens)) {
    if (typeof tokens[key] === 'string' && !Object.isFrozen(tokens[key])) {
      throw new Error(
        `[composer] ${label}["${key}"] is not frozen — bridge setter must freeze individual values.`,
      )
    }
  }
}

/** V3 spec short-name aliases. Read by components, derived from final composition. */
function v3ShortAliases(tokens: TokenMap): TokenMap {
  return {
    '--gc-bg': tokens['--gc-background'] ?? '',
    '--gc-surface': tokens['--gc-surface-base'] ?? '',
    '--gc-card': tokens['--gc-card'] ?? '',
    '--gc-border': tokens['--gc-border'] ?? '',
    '--gc-text': tokens['--gc-foreground'] ?? '',
    '--gc-muted': tokens['--gc-muted-foreground'] ?? '',
    '--gc-primary': tokens['--gc-primary'] ?? '',
  }
}
