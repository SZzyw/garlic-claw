import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type BackgroundSource,
  type PersistedBackgroundSource,
  type DisplayMode,
  type BackgroundAdjustments,
  type BackgroundConfig,
  type BackgroundPreset,
  DEFAULT_CONFIG,
  DEFAULT_OVERLAY_INTENSITY,
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
      overlayIntensity: parsed.overlayIntensity ?? DEFAULT_OVERLAY_INTENSITY,
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
  const overlayIntensity = ref<number>(persisted.overlayIntensity)
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

  function setOverlayIntensity(value: number): void {
    overlayIntensity.value = Math.max(0, Math.min(1, value))
    persist()
  }

  function setAdjustment(key: keyof BackgroundAdjustments, value: number): void {
    adjustments.value = { ...adjustments.value, [key]: value }
    persist()
  }

  function resetAll(): void {
    source.value = { kind: 'none' }
    displayMode.value = DEFAULT_CONFIG.displayMode
    overlayIntensity.value = DEFAULT_OVERLAY_INTENSITY
    adjustments.value = { ...DEFAULT_ADJUSTMENTS }
    persist()
  }

  function setConfig(partial: {
    displayMode?: DisplayMode
    overlayIntensity?: number
    adjustments?: Partial<BackgroundAdjustments>
  }): void {
    if (partial.displayMode !== undefined) displayMode.value = partial.displayMode
    if (partial.overlayIntensity !== undefined) overlayIntensity.value = partial.overlayIntensity
    if (partial.adjustments) adjustments.value = { ...adjustments.value, ...partial.adjustments }
    persist()
  }

  function persist(): void {
    const config: BackgroundConfig = {
      source: runtimeToPersisted(source.value),
      displayMode: displayMode.value,
      overlayIntensity: overlayIntensity.value,
      adjustments: { ...adjustments.value },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  return {
    source,
    displayMode,
    overlayIntensity,
    adjustments,
    isActive,
    activePreset,
    gradientCSS,
    setSource,
    applyPreset,
    setSolidColor,
    setDisplayMode,
    clear,
    setOverlayIntensity,
    setAdjustment,
    setConfig,
    resetAll,
  }
})
