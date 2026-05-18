/**
 * Reactive bridge: Atmosphere layer → Pipeline.
 *
 * The atmosphere store writes computed lighting tokens here.
 * pipeline.ts reads from here as one of its three watch sources.
 *
 * Single-writer rule: only the atmosphere store calls setAtmosphereLightingTokens.
 * Only pipeline.ts reads this bridge — no other module may import it.
 *
 * All tokens go through devFreezeTokens() — the single freeze contract.
 */
import { ref, readonly, type DeepReadonly } from 'vue'
import { devFreezeTokens } from '@/shared/utils/freeze'

/** CSS custom property key → computed value. */
type TokenRecord = Record<string, string>

const _tokens = ref<TokenRecord>({})

/** Current atmosphere lighting tokens (readonly reactive). */
export const atmosphereLightingTokens: DeepReadonly<typeof _tokens> = readonly(_tokens)

/** Write atmosphere lighting tokens from the atmosphere store. */
export function setAtmosphereLightingTokens(tokens: TokenRecord): void {
  _tokens.value = devFreezeTokens(tokens)
}
