// ── BackgroundSource: discriminated union ──
export type BackgroundSource =
  | { kind: 'none' }
  | { kind: 'color';  color: string }
  | { kind: 'gradient'; presetId: string }
  | { kind: 'image';  url: string; meta?: ImageMeta }
  | { kind: 'video';  url: string }
  | { kind: 'slideshow'; photos: Slide[]; intervalSec: number }

// ── Persisted source: image/slideshow kind has no blob URL ──
export type PersistedBackgroundSource =
  | { kind: 'none' }
  | { kind: 'color';  color: string }
  | { kind: 'gradient'; presetId: string }
  | { kind: 'image';  meta?: ImageMeta }
  | { kind: 'video';  url: string }
  | { kind: 'slideshow'; photos: { id: string }[]; intervalSec: number }

export interface Slide {
  id: string
  url: string
}

export const MAX_SLIDESHOW_PHOTOS = 5
export const DEFAULT_INTERVAL_SEC = 10
export const INTERVAL_SEC_OPTIONS = [5, 10, 15, 30, 60]

export interface ImageMeta {
  name: string
  size: number
  width?: number
  height?: number
}

// ── Display mode ──
export type DisplayMode = 'fill' | 'fit' | 'stretch'

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  fill: '填充',
  fit: '适应',
  stretch: '拉伸',
}

export const OBJECT_FIT_MAP: Record<DisplayMode, string> = {
  fill: 'cover',
  fit: 'contain',
  stretch: 'fill',
}

// ── Overlay intensity: single 0–1 knob that drives blur/dim/glow proportionally ──
export const DEFAULT_OVERLAY_INTENSITY = 0

// ── Adjustments (consumed by SourceRenderer CSS filter + partially by EffectRenderer) ──
export interface BackgroundAdjustments {
  blur: number       // 0–100 px
  opacity: number    // 0–1
  saturation: number // 0–200 (100 = normal)
  brightness: number // 0–200 (100 = normal)
  contrast: number   // 0–200 (100 = normal)
}

export const DEFAULT_ADJUSTMENTS: BackgroundAdjustments = {
  blur: 0,
  opacity: 1,
  saturation: 100,
  brightness: 100,
  contrast: 100,
}

// ── Persisted config (no blob URLs) ──
export interface BackgroundConfig {
  source: PersistedBackgroundSource
  displayMode: DisplayMode
  overlayIntensity: number
  adjustments: BackgroundAdjustments
}

export const DEFAULT_CONFIG: BackgroundConfig = {
  source: { kind: 'none' },
  displayMode: 'fill',
  overlayIntensity: DEFAULT_OVERLAY_INTENSITY,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
}

// ── Preset ──
export interface BackgroundPreset {
  id: string
  label: string
  source: BackgroundSource
  capabilities?: {
    recommendedTheme?: 'light' | 'dark'
    preferredAccent?: string
  }
}
