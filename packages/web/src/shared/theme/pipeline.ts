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

interface ComposeRecord {
  hash: number
  tokenCount: number
  skipped: boolean // true if dedup dropped this compose
  time: number
}

interface FlushRecord {
  hash: number
  changedCount: number
  removedCount: number
  time: number
}

function initDebug() {
  const api = {
    // Counters
    themeRecomputeCount: 0,
    composeCount: 0,
    scheduleBatchCount: 0,
    flushCount: 0,
    activeRAFCount: 0,
    activeBursts: 0,
    activeCSSVars: 0,
    // Hash verification
    hydrationHash: 0,
    pipelineFirstHash: 0,
    hydrationMismatch: false,
    // History (ring buffers, last 16 entries)
    composeHistory: [] as ComposeRecord[],
    flushHistory: [] as FlushRecord[],
    lastComposeHash: 0,
    lastComposeTokenCount: 0,
    lastChangedCount: 0,
    lastSkipped: false,
    // Dump helper
    dump(): string {
      const lines: string[] = [
        '══════ Runtime Stability Report ══════',
        `themeRecomputeCount : ${api.themeRecomputeCount}`,
        `composeCount         : ${api.composeCount}`,
        `scheduleBatchCount   : ${api.scheduleBatchCount}`,
        `flushCount           : ${api.flushCount}`,
        `activeRAFCount       : ${api.activeRAFCount}`,
        `activeBursts         : ${api.activeBursts}`,
        `activeCSSVars        : ${api.activeCSSVars}`,
        `hydrationHash        : ${api.hydrationHash}`,
        `pipelineFirstHash    : ${api.pipelineFirstHash}`,
        `hydrationMismatch    : ${api.hydrationMismatch}`,
        `lastComposeHash      : ${api.lastComposeHash}`,
        `lastComposeTokenCount: ${api.lastComposeTokenCount}`,
        `lastChangedCount     : ${api.lastChangedCount}`,
        `lastSkipped          : ${api.lastSkipped}`,
        '',
        '── Compose History (last 16) ──',
        ...api.composeHistory.slice(-16).map((r) =>
          `  hash=${r.hash} tokens=${r.tokenCount} ${r.skipped ? 'SKIPPED' : 'OK'} @${(r.time - t0).toFixed(0)}ms`,
        ),
        '',
        '── Flush History (last 16) ──',
        ...api.flushHistory.slice(-16).map((r) =>
          `  hash=${r.hash} changed=${r.changedCount} removed=${r.removedCount} @${(r.time - t0).toFixed(0)}ms`,
        ),
        '',
        '── V3 Short Aliases on :root ──',
        ...checkV3Aliases(),
        '══════════════════════════════════════',
      ]
      return lines.join('\n')
    },
  }
  if (typeof window !== 'undefined') {
    (window as any).__GC_DEBUG__ = api
  }
  return api
}

const t0 = typeof performance !== 'undefined' ? performance.now() : 0

function checkV3Aliases(): string[] {
  if (typeof document === 'undefined') return ['(SSR)']
  const root = document.documentElement
  const vars = [
    '--gc-bg', '--gc-surface', '--gc-card', '--gc-border',
    '--gc-text', '--gc-muted', '--gc-primary',
  ]
  const style = getComputedStyle(root)
  return vars.map((v) => {
    const raw = style.getPropertyValue(v).trim()
    const ok = raw && raw !== 'undefined' && !raw.includes('NaN')
    return `  ${v}: ${ok ? '✓' : '✗ MISSING'}  ${raw.slice(0, 60)}`
  })
}

function pushHistory<T>(arr: T[], entry: T, max: number = 16): void {
  arr.push(entry)
  if (arr.length > max) arr.shift()
}

/** External modules call this to increment theme recompute counter. */
export function bumpThemeRecompute(): void {
  DEBUG.themeRecomputeCount++
}

// ── Pipeline State ──

let prevTokens: TokenMap = {}
let pendingTokens: TokenMap | null = null
let rafId: number | null = null

/** Last flushed token serialization. Used to skip no-op scheduleBatch calls. */
let lastSerializedTokens = ''

// ── Serialization helpers ──

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
 * Multiple calls within the same frame are coalesced.
 *
 * Dedup: if the serialized token map is identical to the last
 * flushed map, the compose is logged as SKIPPED and no rAF is queued.
 */
export function scheduleBatch(tokens: TokenMap): void {
  const serialized = serializeTokens(tokens)
  const hash = computeTokenHash(tokens)

  if (serialized === lastSerializedTokens) {
    // Dedup hit — token map unchanged
    DEBUG.lastSkipped = true
    DEBUG.lastComposeHash = hash
    pushHistory(DEBUG.composeHistory, {
      hash,
      tokenCount: Object.keys(tokens).length,
      skipped: true,
      time: performance.now(),
    })
    return
  }

  DEBUG.lastSkipped = false
  DEBUG.lastComposeHash = hash
  DEBUG.lastComposeTokenCount = Object.keys(tokens).length
  DEBUG.scheduleBatchCount++
  pushHistory(DEBUG.composeHistory, {
    hash,
    tokenCount: Object.keys(tokens).length,
    skipped: false,
    time: performance.now(),
  })

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
 * are written. Used for pre-mount hydration.
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
  DEBUG.lastChangedCount = Object.keys(diff.set).length
}

// ── Internal ──

function flush(tokens: TokenMap): void {
  if (typeof document === 'undefined') return

  const diff = computeDiff(prevTokens, tokens)
  if (Object.keys(diff.set).length === 0 && diff.remove.length === 0) {
    return
  }

  const hash = computeTokenHash(tokens)
  const changedCount = Object.keys(diff.set).length
  const removedCount = diff.remove.length

  applyDiff(diff)
  prevTokens = { ...tokens }
  lastSerializedTokens = serializeTokens(tokens)
  DEBUG.activeCSSVars = Object.keys(prevTokens).length
  DEBUG.lastChangedCount = changedCount
  DEBUG.flushCount++
  pushHistory(DEBUG.flushHistory, {
    hash,
    changedCount,
    removedCount,
    time: performance.now(),
  })
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

// ── Reset ──

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
 * This is the ONLY function that calls scheduleBatch at runtime.
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

      // First compose: verify hash matches hydration
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
