/**
 * Reactive bridge: Theme layer → Pipeline.
 *
 * The appearance store writes computed theme base tokens here.
 * pipeline.ts reads from here as one of its three watch sources.
 *
 * Single-writer rule: only the appearance store calls setThemeBaseTokens.
 * Only pipeline.ts reads this bridge — no other module may import it.
 *
 * All tokens go through devFreezeTokens() — the single freeze contract.
 */
import { ref, readonly, type DeepReadonly } from 'vue'
import type { TokenMap } from './types'
import { devFreezeTokens } from '@/shared/utils/freeze'

const _tokens = ref<TokenMap>({})

/** Current theme base tokens (readonly reactive). */
export const themeBaseTokens: DeepReadonly<typeof _tokens> = readonly(_tokens)

/** Write theme base tokens from the appearance store. */
export function setThemeBaseTokens(tokens: TokenMap): void {
  _tokens.value = devFreezeTokens({ ...tokens })
}
