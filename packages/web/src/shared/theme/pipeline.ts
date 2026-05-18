import { watch } from 'vue'
import type { TokenMap, TokenDiff } from './types'
import { computeDiff } from './diff'
import { themeBaseTokens } from './theme-base-bridge'
import { atmosphereLightingTokens } from '@/shared/atmosphere/lighting-bridge'
import { materialRuntimeConfig } from './material-config'
import { composeTokens } from './composer'
import { computeTokenHash } from '@/shared/utils/freeze'

// ── Debug instrumentation ──
const DEBUG = initDebug()

function initDebug() {
  const api = {
    themeRecomputeCount: 0,
    composeCount: 0,
    scheduleBatchCount: 0,
    activeRAFCount: 0,
    activeBursts: 0,
    activeCSSVars: 0,
    hydrationHash: 0,
    pipelineFirstHash: 0,
    hydrationMismatch: false,
  }
  if (typeof window !== 'undefined') {
    ;(window as any).__GC_DEBUG__ = api
  }
  return api
}

/** External modules call this to increment theme recompute counter. */
export function bumpThemeRecompute(): void {
  DEBUG.themeRecomputeCount++
}

// ── Pipeline State ──

let prevTokens: TokenMap = {}
let pendingTokens: TokenMap | null = null
let rafId: number | null = null

/** Last serialized token snapshot. Used to skip no-op scheduleBatch calls. */
let lastSerializedTokens = ''

// ── Serialization helpers ──

/** Deterministic JSON serialization (sorted keys). Returns stable string for comparison. */
function serializeTokens(tokens: TokenMap): string {
  const sorted: Record<string, string> = {}
  for (const key of Object.keys(tokens).sort()) {
    sorted[key] = tokens[key]
  }
  return JSON.stringify(sorted)
}

// ── Public API ──

/**
 * Batch-schedule a token update via requestAnimationFrame.
 * Multiple calls within the same frame are coalesced — only the
 * most recent token map is applied.
 *
 * Dedup: if the serialized token map is identical to the last
 * flushed map, the call is silently dropped to avoid CSS churn.
 */
export function scheduleBatch(tokens: TokenMap): void {
  const serialized = serializeTokens(tokens)
  if (serialized === lastSerializedTokens) return

  DEBUG.scheduleBatchCount++
  pendingTokens = tokens

  if (rafId === null) {
    DEBUG.activeRAFCount++
    rafId = requestAnimationFrame(() => {
      rafId = null
      DEBUG.activeRAFCount--
      const final = pendingTokens
      pendingTokens = null
      if (final) {
        flush(final)
      }
    })
  }
}

/**
 * Synchronously apply tokens to :root. Only changed properties
 * are written — unchanged values are skipped.
 *
 * Used for pre-mount hydration. Does NOT update lastSerializedTokens
 * (hydration baseline is separate from reactive dedup state).
 */
export function applySync(tokens: TokenMap): void {
  if (typeof document === 'undefined') return

  const diff = computeDiff(prevTokens, tokens)
  if (diff.set && Object.keys(diff.set).length === 0 && diff.remove.length === 0) {
    return
  }

  applyDiff(diff)
  prevTokens = { ...tokens }
  DEBUG.activeCSSVars = Object.keys(prevTokens).length
}

// ── Internal ──

function flush(tokens: TokenMap): void {
  if (typeof document === 'undefined') return

  const diff = computeDiff(prevTokens, tokens)
  if (Object.keys(diff.set).length === 0 && diff.remove.length === 0) {
    return
  }

  applyDiff(diff)
  prevTokens = { ...tokens }
  lastSerializedTokens = serializeTokens(tokens)
  DEBUG.activeCSSVars = Object.keys(prevTokens).length
}

function applyDiff(diff: TokenDiff): void {
  const root = document.documentElement

  for (const key of diff.remove) {
    root.style.removeProperty(key)
  }

  for (const [key, value] of Object.entries(diff.set)) {
    root.style.setProperty(key, value)
  }
}

// ── Reset (for testing / hot-reload) ──

export function resetPipeline(): void {
  prevTokens = {}
  pendingTokens = null
  lastSerializedTokens = ''
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    DEBUG.activeRAFCount--
    rafId = null
  }
}

// ── Reactive Graph Pipeline ──

let pipelineStarted = false
let firstComposeDone = false

/**
 * Start the reactive graph pipeline.
 * Call once from ThemeProvider.setup().
 *
 * Watches three sources in a DAG:
 *   1. themeBaseTokens      — theme layer output
 *   2. atmosphereLightingTokens — atmosphere layer output
 *   3. materialRuntimeConfig    — material configuration
 *
 * Any source change → composeTokens → scheduleBatch → :root.
 * This is the ONLY function in the system that calls scheduleBatch.
 */
export function startPipeline(): void {
  if (pipelineStarted) return
  pipelineStarted = true

  watch(
    [
      themeBaseTokens,
      atmosphereLightingTokens,
      () => materialRuntimeConfig.value,
    ],
    ([themeBase, atmosphereLighting]) => {
      if (Object.keys(themeBase).length === 0) return
      const tokens = composeTokens(themeBase, atmosphereLighting)
      DEBUG.composeCount++

      // On first compose, verify hash matches hydration output
      if (!firstComposeDone) {
        firstComposeDone = true
        const pipelineHash = computeTokenHash(tokens)
        DEBUG.pipelineFirstHash = pipelineHash

        const hydrationHash = (window as any).__GC_DEBUG__?.hydrationHash
        if (hydrationHash !== undefined && hydrationHash !== 0 && hydrationHash !== pipelineHash) {
          DEBUG.hydrationMismatch = true
          console.error(
            '[hydration mismatch]',
            `hydration=${hydrationHash} pipeline=${pipelineHash}`,
          )
        }
      }

      scheduleBatch(tokens)
    },
    { immediate: true },
  )
}
