/**
 * Weather presets and deterministic OKLCH color mixing.
 *
 * Weather is a lighting modifier — it NEVER replaces wallpaper or theme.
 * All mixing is done in JS (component-wise OKLCH), no CSS color-mix.
 * Every function is pure: same input → same output. No DOM, no random.
 */

export type WeatherType =
  | 'none'
  | 'clear'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'night'
  | 'sunset'
  | 'sakura'
  | 'dust'
  | 'aurora'

export interface WeatherColor {
  hue: number
  saturation: number // 0–1
  lightness: number // 0–100
}

export interface WeatherPreset {
  label: string
  description: string
  category: 'clear' | 'precipitation' | 'atmosphere' | 'celestial'
  hasParticles: boolean
  hasOverlay: boolean
  baseWind: number // 0–1 normalized
}

export const WEATHER_PRESETS: Record<WeatherType, WeatherPreset> = {
  none:     { label: '无',     description: '无天气效果',         category: 'clear',         hasParticles: false, hasOverlay: false, baseWind: 0 },
  clear:    { label: '晴朗',   description: '无天气效果',         category: 'clear',         hasParticles: false, hasOverlay: false, baseWind: 0 },
  rain:     { label: '雨',     description: '雨滴 + 水面飞溅',   category: 'precipitation', hasParticles: true,  hasOverlay: false, baseWind: 0.5 },
  snow:     { label: '雪',     description: '冰晶 + 雪花飘落',   category: 'precipitation', hasParticles: true,  hasOverlay: false, baseWind: 0.3 },
  fog:      { label: '雾',     description: '多层深度雾气',      category: 'atmosphere',    hasParticles: false, hasOverlay: true,  baseWind: 0.15 },
  storm:    { label: '暴风雨', description: '暴雨 + 雷电',       category: 'precipitation', hasParticles: true,  hasOverlay: false, baseWind: 0.8 },
  night:    { label: '夜空',   description: '暗夜 + 星光',       category: 'celestial',     hasParticles: false, hasOverlay: true,  baseWind: 0.1 },
  sunset:   { label: '日落',   description: '暖色暮光带',        category: 'celestial',     hasParticles: false, hasOverlay: true,  baseWind: 0.2 },
  sakura:   { label: '樱花',   description: '花瓣飘舞 + 旋转',   category: 'celestial',     hasParticles: true,  hasOverlay: false, baseWind: 0.35 },
  dust:     { label: '沙尘',   description: '微尘悬浮 + 朦胧',   category: 'atmosphere',    hasParticles: true,  hasOverlay: false, baseWind: 0.25 },
  aurora:   { label: '极光',   description: '光带律动 + 星辰',   category: 'celestial',     hasParticles: false, hasOverlay: true,  baseWind: 0.1 },
}

export const WEATHER_COLORS: Record<Exclude<WeatherType, 'none' | 'clear'>, WeatherColor> = {
  rain:   { hue: 220, saturation: 0.15, lightness: 45 },
  snow:   { hue: 210, saturation: 0.05, lightness: 75 },
  fog:    { hue: 215, saturation: 0.04, lightness: 55 },
  storm:  { hue: 230, saturation: 0.18, lightness: 30 },
  night:  { hue: 250, saturation: 0.20, lightness: 22 },
  sunset: { hue: 25,  saturation: 0.35, lightness: 55 },
  sakura: { hue: 340, saturation: 0.20, lightness: 70 },
  dust:   { hue: 40,  saturation: 0.25, lightness: 60 },
  aurora: { hue: 170, saturation: 0.30, lightness: 55 },
}

export interface OklchColor {
  hue: number
  saturation: number // 0–1
  lightness: number // 0–100
}

/**
 * Deterministic OKLCH component-wise mix.
 *
 * - Hue: shortest-arc interpolation (handles 0/360 wraparound)
 * - Saturation, lightness: linear interpolation
 * - intensity: 0 = pure base, 1 = pure target
 *
 * No CSS color-mix. No random. No DOM access.
 */
export function mixOklch(
  base: OklchColor,
  target: WeatherColor,
  intensity: number,
): OklchColor {
  const t = Math.max(0, Math.min(1, intensity))
  if (t === 0) return { ...base }

  // Shortest-arc hue interpolation
  let dH = target.hue - base.hue
  if (dH > 180) dH -= 360
  if (dH < -180) dH += 360

  return {
    hue: (base.hue + dH * t + 360) % 360,
    saturation: base.saturation + (target.saturation - base.saturation) * t,
    lightness: base.lightness + (target.lightness - base.lightness) * t,
  }
}

/**
 * Build an oklch() CSS color string from components.
 */
export function oklchString(c: OklchColor, alpha?: number): string {
  const a = alpha !== undefined ? ` / ${alpha.toFixed(4)}` : ''
  return `oklch(${c.lightness.toFixed(1)}% ${c.saturation.toFixed(4)} ${c.hue.toFixed(1)}${a})`
}
