import { computed } from 'vue'
import { useBackgroundStore } from '@/shared/stores/background'
import type { DisplayMode, BackgroundSource, Slide } from '@/shared/background/types'
import { DEFAULT_INTERVAL_SEC } from '@/shared/background/types'
import { getGradientCSS, backgroundPresets } from '@/shared/background/presets'

export function useBackgroundSource() {
  const store = useBackgroundStore()

  const source = computed(() => store.source)
  const activeResolvedSource = computed(() => store.activeResolvedSource)
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

  function setSlideshow(photos: Slide[], intervalSec: number = DEFAULT_INTERVAL_SEC): void {
    store.setSource({ kind: 'slideshow', photos, intervalSec })
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

  function addSlideshowPhotos(photos: Slide[]): boolean {
    return store.addSlideshowPhotos(photos)
  }

  function removeSlideshowPhoto(index: number): void {
    store.removeSlideshowPhoto(index)
  }

  function setSlideshowInterval(sec: number): void {
    store.setSlideshowInterval(sec)
  }

  function getPresetGradientCSS(presetId: string): string {
    return getGradientCSS(presetId)
  }

  return {
    source,
    activeResolvedSource,
    displayMode,
    currentSourceKind,
    presets,
    isPresetActive,
    currentColor,
    selectPreset,
    setUploadedImage,
    setSlideshow,
    setSolidColor,
    setDisplayMode,
    clear,
    addSlideshowPhotos,
    removeSlideshowPhoto,
    setSlideshowInterval,
    getPresetGradientCSS,
  }
}
