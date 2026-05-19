/**
 * Weather Particle System — Shared Types.
 */

// ── Quality ──

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

export const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  ultra: '极致',
}

export interface QualityConfig {
  /** Particle count multiplier per layer. */
  particleMultiplier: number
  /** Number of depth layers to render (1-3). */
  depthLayers: number
  /** Whether to render crystal snow (hexagonal + star shapes). */
  crystalSnow: boolean
  /** Whether to use gradient rain trails. */
  gradientRain: boolean
  /** Whether to render specular highlights on rain. */
  specularRain: boolean
  /** Sakura petal vertex count (3=triangle, 5=pentagon, 8=detailed). */
  petalDetail: number
  /** Max blur passes per frame. */
  blurPasses: number
}

// ── Depth Layers ──

export type DepthLayer = 'background' | 'midground' | 'foreground'

export interface LayerConfig {
  layer: DepthLayer
  zIndex: number
  /** Speed multiplier (background slower, foreground faster). */
  speed: number
  /** Size multiplier. */
  size: number
  /** Blur radius in px (0 = sharp). */
  blur: number
  /** Opacity multiplier. */
  opacity: number
  /** Wind influence (0-1). Background less affected. */
  windInfluence: number
  /** Spawn density fraction of total count. */
  spawnDensity: number
}

// ── Theme Colors ──

export interface ThemeColors {
  isDark: boolean
  bgLuminance: number
  /** snow particle fill (light mode: darker blue-grey, dark mode: bright white-blue). */
  snowFill: string
  /** snow crystal stroke. */
  snowStroke: string
  /** snow highlight (specular). */
  snowHighlight: string
  /** rain streak color. */
  rainFill: string
  /** rain specular highlight. */
  rainHighlight: string
  /** sakura petal base color. */
  sakuraBase: string
  /** sakura petal outline. */
  sakuraStroke: string
  /** sakura inner highlight. */
  sakuraInner: string
  /** lightning flash color. */
  lightningColor: string
  /** fog tint color. */
  fogTint: string
}

// ── Particle Config (from UI sliders) ──

export interface ParticleConfig {
  intensity: number   // 0-100
  particleCount: number // 0-100
  windSpeed: number   // 0-100
}

// ── Base Particle ──

export interface Particle {
  x: number
  y: number
  layer: DepthLayer
  alive: boolean
}

// ── Z-Index Hierarchy ──

export const Z_LAYERS = {
  wallpaper: 0,
  ambience: 1,
  weatherBackground: 2,
  weatherMidground: 3,
  content: 4,
  weatherForeground: 5,
  clickFX: 2500,
} as const
