/**
 * Weather presets and deterministic OKLCH color mixing.
 *
 * Weather is a lighting modifier — it NEVER replaces wallpaper or theme.
 * All mixing is done in JS (component-wise OKLCH), no CSS color-mix.
 * Every function is pure: same input → same output. No DOM, no random.
 */

export type WeatherType = 'none' | 'rain' | 'sakura' | 'dust' | 'aurora'

export interface WeatherColor {
  hue: number
  saturation: number // 0–1
  lightness: number // 0–100
}

export const WEATHER_COLORS: Record<Exclude<WeatherType, 'none'>, WeatherColor> = {
  rain: { hue: 220, saturation: 0.15, lightness: 45 },
  sakura: { hue: 340, saturation: 0.20, lightness: 70 },
  dust: { hue: 40, saturation: 0.25, lightness: 60 },
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
