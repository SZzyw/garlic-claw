import { computed } from 'vue'
import { useBackgroundStore } from '@/shared/stores/background'
import type { DisplayMode, BackgroundSource } from '@/shared/background/types'
import { getGradientCSS, backgroundPresets } from '@/shared/background/presets'

export function useBackgroundSource() {
  const store = useBackgroundStore()

  const source = computed(() => store.source)
  const displayMode = computed(() => store.displayMode)
  const currentSourceKind = computed(() => store.source.kind)
  const presets = backgroundPresets

  function isPresetActive(presetId: string): boolean {
    const s = store.source
    return s.kind === 'gradient' && s.presetId === presetId
  }

  function currentColor(): string {
    const s = store.source
    return s.kind === 'color' ? s.color : '—'
  }

  function selectPreset(presetId: string): void {
    const preset = backgroundPresets.find((p) => p.id === presetId)
    if (preset) store.applyPreset(preset)
  }

  function setUploadedImage(url: string, name: string, size: number, width?: number, height?: number): void {
    const src: BackgroundSource = {
      kind: 'image',
      url,
      meta: { name, size, width, height },
    }
    store.setSource(src)
  }

  function setSolidColor(color: string): void {
    store.setSolidColor(color)
  }

  function setDisplayMode(mode: DisplayMode): void {
    store.setDisplayMode(mode)
  }

  function clear(): void {
    store.clear()
  }

  function getPresetGradientCSS(presetId: string): string {
    return getGradientCSS(presetId)
  }

  return {
    source,
    displayMode,
    currentSourceKind,
    presets,
    isPresetActive,
    currentColor,
    selectPreset,
    setUploadedImage,
    setSolidColor,
    setDisplayMode,
    clear,
    getPresetGradientCSS,
  }
}
