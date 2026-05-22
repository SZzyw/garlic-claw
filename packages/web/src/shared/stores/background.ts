import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type BackgroundSource,
  type PersistedBackgroundSource,
  type DisplayMode,
  type BackgroundAdjustments,
  type BackgroundConfig,
  type BackgroundPreset,
  type Slide,
  DEFAULT_CONFIG,
  DEFAULT_OVERLAY_INTENSITY,
  DEFAULT_ADJUSTMENTS,
} from '@/shared/background/types'
import { backgroundPresets, getGradientCSS } from '@/shared/background/presets'
import { SlideshowRuntime } from '@/shared/background/SlideshowRuntime'
import { useUiStore } from '@/shared/stores/ui'

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
  // Slideshow has no blob URLs in persisted state → expired
  if (source.kind === 'slideshow') {
    return { kind: 'none' }
  }
  return source as BackgroundSource
}

function runtimeToPersisted(source: BackgroundSource): PersistedBackgroundSource {
  if (source.kind === 'image') {
    return { kind: 'image', meta: source.meta }
  }
  if (source.kind === 'slideshow') {
    // Only persist photo ids, not blob URLs
    return {
      kind: 'slideshow',
      photos: source.photos.map((p) => ({ id: p.id })),
      intervalSec: source.intervalSec,
    }
  }
  return source as PersistedBackgroundSource
}

export const useBackgroundStore = defineStore('background', () => {
  const persisted = readPersisted()

  const source = ref<BackgroundSource>(persistedToRuntime(persisted.source))
  const activeResolvedSource = ref<BackgroundSource>(source.value)
  const displayMode = ref<DisplayMode>(persisted.displayMode)
  const overlayIntensity = ref<number>(persisted.overlayIntensity)
  const adjustments = ref<BackgroundAdjustments>({ ...persisted.adjustments })

  // ── Slideshow runtime (on store instance, HMR-safe) ──
  let slideshowRuntime: SlideshowRuntime | null = null

  // ── Blob URL tracking (survives component unmount/remount) ──
  let trackedBlobURLs = new Set<string>()

  function collectBlobURLs(src: BackgroundSource): Set<string> {
    const urls = new Set<string>()
    if (src.kind === 'image') urls.add(src.url)
    if (src.kind === 'slideshow') {
      for (const photo of src.photos) urls.add(photo.url)
    }
    return urls
  }

  function swapBlobURLs(newSource: BackgroundSource): void {
    const newURLs = collectBlobURLs(newSource)
    for (const url of trackedBlobURLs) {
      if (!newURLs.has(url)) URL.revokeObjectURL(url)
    }
    trackedBlobURLs = newURLs
  }

  function revokeAllBlobURLs(): void {
    for (const url of trackedBlobURLs) URL.revokeObjectURL(url)
    trackedBlobURLs = new Set()
  }

  // ── Restore failure detection ──
  const restoredFromPersisted = persisted.source.kind !== 'none'
    && persisted.source.kind !== 'color'
    && persisted.source.kind !== 'gradient'
    && source.value.kind === 'none'

  if (restoredFromPersisted) {
    // Blob URL expired — notify user
    setTimeout(() => {
      useUiStore().notify('壁纸已失效，请重新上传', 'error')
    }, 0)
  }

  // ── Derived ──
  const isActive = computed(() => activeResolvedSource.value.kind !== 'none')

  const activePreset = computed<BackgroundPreset | null>(() => {
    const src = source.value
    if (src.kind !== 'gradient') return null
    return backgroundPresets.find((p) => p.id === src.presetId) ?? null
  })

  const gradientCSS = computed(() => {
    const src = activeResolvedSource.value
    if (src.kind === 'gradient') return getGradientCSS(src.presetId)
    return ''
  })

  // ── Actions ──
  function setSource(newSource: BackgroundSource): void {
    destroyRuntime()

    swapBlobURLs(newSource)
    source.value = newSource

    if (newSource.kind === 'slideshow') {
      slideshowRuntime = new SlideshowRuntime((url: string) => {
        activeResolvedSource.value = { kind: 'image', url }
      })
      slideshowRuntime.start(newSource.photos, newSource.intervalSec)
    } else {
      activeResolvedSource.value = newSource
    }

    persist()
  }

  function applyPreset(preset: BackgroundPreset): void {
    setSource({ ...preset.source })
  }

  function setSolidColor(color: string): void {
    setSource({ kind: 'color', color })
  }

  function setDisplayMode(mode: DisplayMode): void {
    displayMode.value = mode
    persist()
  }

  function clear(): void {
    destroyRuntime()
    revokeAllBlobURLs()
    source.value = { kind: 'none' }
    activeResolvedSource.value = { kind: 'none' }
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
    destroyRuntime()
    revokeAllBlobURLs()
    source.value = { kind: 'none' }
    activeResolvedSource.value = { kind: 'none' }
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

  // ── Slideshow actions ──
  function addSlideshowPhotos(newPhotos: Slide[]): boolean {
    if (source.value.kind !== 'slideshow') return false

    const current = source.value.photos
    const capacity = 5 - current.length
    if (capacity <= 0) return false

    const toAdd = newPhotos.slice(0, capacity)
    const updatedPhotos = [...current, ...toAdd]
    source.value = { ...source.value, photos: updatedPhotos }
    slideshowRuntime?.updatePhotos(updatedPhotos)
    persist()
    return toAdd.length === newPhotos.length
  }

  function removeSlideshowPhoto(index: number): void {
    if (source.value.kind !== 'slideshow') return

    const updatedPhotos = [...source.value.photos]
    const removed = updatedPhotos.splice(index, 1)[0]
    if (removed) {
      URL.revokeObjectURL(removed.url)
      trackedBlobURLs.delete(removed.url)
    }

    if (updatedPhotos.length === 1) {
      // Degrade to static image with the last remaining photo
      const url = updatedPhotos[0].url
      destroyRuntime()
      source.value = { kind: 'image', url }
      activeResolvedSource.value = { kind: 'image', url }
      persist()
      return
    }

    if (updatedPhotos.length === 0) {
      clear()
      return
    }

    source.value = { ...source.value, photos: updatedPhotos }
    slideshowRuntime?.updatePhotos(updatedPhotos, index < updatedPhotos.length ? undefined : 0)
    persist()
  }

  function setSlideshowInterval(sec: number): void {
    if (source.value.kind !== 'slideshow') return
    source.value = { ...source.value, intervalSec: sec }
    slideshowRuntime?.setInterval(sec)
    persist()
  }

  function destroyRuntime(): void {
    if (slideshowRuntime) {
      slideshowRuntime.destroy()
      slideshowRuntime = null
    }
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
    activeResolvedSource,
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
    addSlideshowPhotos,
    removeSlideshowPhoto,
    setSlideshowInterval,
  }
})
