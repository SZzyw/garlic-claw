import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type BackgroundSource,
  type PersistedBackgroundSource,
  type DisplayMode,
  type BackgroundOverlays,
  type BackgroundAdjustments,
  type BackgroundConfig,
  type BackgroundPreset,
  DEFAULT_CONFIG,
  DEFAULT_OVERLAYS,
  DEFAULT_ADJUSTMENTS,
} from '@/shared/background/types'
import { backgroundPresets, getGradientCSS } from '@/shared/background/presets'

const STORAGE_KEY = 'garlic-claw:background'

function readPersisted(): BackgroundConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(raw) as Partial<BackgroundConfig>
    return {
      source: parsed.source ?? DEFAULT_CONFIG.source,
      displayMode: parsed.displayMode ?? DEFAULT_CONFIG.displayMode,
      overlays: { ...DEFAULT_OVERLAYS, ...parsed.overlays },
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...parsed.adjustments },
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

function persistedToRuntime(source: PersistedBackgroundSource): BackgroundSource {
  // Image with no URL → blob was revoked, revert to none
  if (source.kind === 'image') {
    return { kind: 'none' }
  }
  return source as BackgroundSource
}

function runtimeToPersisted(source: BackgroundSource): PersistedBackgroundSource {
  // Strip blob URL from image kind
  if (source.kind === 'image') {
    return { kind: 'image', meta: source.meta }
  }
  return source as PersistedBackgroundSource
}

export const useBackgroundStore = defineStore('background', () => {
  const persisted = readPersisted()

  const source = ref<BackgroundSource>(persistedToRuntime(persisted.source))
  const displayMode = ref<DisplayMode>(persisted.displayMode)
  const overlays = ref<BackgroundOverlays>({ ...persisted.overlays })
  const adjustments = ref<BackgroundAdjustments>({ ...persisted.adjustments })

  // ── Derived ──
  const isActive = computed(() => source.value.kind !== 'none')

  const activePreset = computed<BackgroundPreset | null>(() => {
    const src = source.value
    if (src.kind !== 'gradient') return null
    return backgroundPresets.find((p) => p.id === src.presetId) ?? null
  })

  const gradientCSS = computed(() => {
    const src = source.value
    if (src.kind === 'gradient') return getGradientCSS(src.presetId)
    return ''
  })

  // ── Actions ──
  function setSource(newSource: BackgroundSource): void {
    source.value = newSource
    persist()
  }

  function applyPreset(preset: BackgroundPreset): void {
    source.value = { ...preset.source }
    persist()
  }

  function setSolidColor(color: string): void {
    source.value = { kind: 'color', color }
    persist()
  }

  function setDisplayMode(mode: DisplayMode): void {
    displayMode.value = mode
    persist()
  }

  function clear(): void {
    source.value = { kind: 'none' }
    persist()
  }

  function setOverlay(key: keyof BackgroundOverlays, value: boolean): void {
    overlays.value = { ...overlays.value, [key]: value }
    persist()
  }

  function setAdjustment(key: keyof BackgroundAdjustments, value: number): void {
    adjustments.value = { ...adjustments.value, [key]: value }
    persist()
  }

  function resetAll(): void {
    source.value = { kind: 'none' }
    displayMode.value = DEFAULT_CONFIG.displayMode
    overlays.value = { ...DEFAULT_OVERLAYS }
    adjustments.value = { ...DEFAULT_ADJUSTMENTS }
    persist()
  }

  // ── Batch API (for future Background Style tab) ──
  function setConfig(partial: {
    displayMode?: DisplayMode
    overlays?: Partial<BackgroundOverlays>
    adjustments?: Partial<BackgroundAdjustments>
  }): void {
    if (partial.displayMode !== undefined) displayMode.value = partial.displayMode
    if (partial.overlays) overlays.value = { ...overlays.value, ...partial.overlays }
    if (partial.adjustments) adjustments.value = { ...adjustments.value, ...partial.adjustments }
    persist()
  }

  function persist(): void {
    const config: BackgroundConfig = {
      source: runtimeToPersisted(source.value),
      displayMode: displayMode.value,
      overlays: { ...overlays.value },
      adjustments: { ...adjustments.value },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  return {
    source,
    displayMode,
    overlays,
    adjustments,
    isActive,
    activePreset,
    gradientCSS,
    setSource,
    applyPreset,
    setSolidColor,
    setDisplayMode,
    clear,
    setOverlay,
    setAdjustment,
    setConfig,
    resetAll,
  }
})
