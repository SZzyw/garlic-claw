/**
 * Atmosphere Lighting Token Computation.
 *
 * This is the INDEPENDENT atmosphere layer. It only reads:
 *   - wallpaper-sampled colors (via atmosphereSamples bridge)
 *   - weather type + intensity
 *   - atmosphere config
 *
 * It only OUTPUTS lighting tokens. It must NOT modify theme palette tokens.
 * Material layer reads the scalar metadata tokens (--atmosphere-hue etc.)
 * to avoid importing atmosphereSamples directly.
 */
import type { SampledColors, AtmosphereConfig } from './types'
import { type WeatherType, WEATHER_COLORS, mixOklch, oklchString } from './weather'

/** CSS custom property key → computed value. */
type TokenRecord = Record<string, string>

/**
 * Compute atmosphere lighting tokens from wallpaper sample + weather.
 *
 * When wallpaper sampling is active but weather is 'none', uses sampled
 * colors directly (the UI feels "lit" by the wallpaper).
 *
 * When weather is active, applies mixOklch(sampled, weatherColor, intensity).
 *
 * When wallpaper sampling is unavailable and weather is 'none', returns
 * an empty TokenMap (CSS fallback in tokens.css provides defaults).
 */
export function computeAtmosphereLighting(
  sampled: SampledColors | null,
  weather: WeatherType,
  weatherIntensity: number,
  config: AtmosphereConfig,
): TokenRecord {
  // No data → empty map, tokens.css fallback handles defaults
  if (!sampled && weather === 'none') return {}

  // Base color: sampled wallpaper or fallback neutral
  const base = sampled
    ? { hue: sampled.accentHue, saturation: sampled.accentSaturation, lightness: sampled.accentLightness }
    : { hue: 220, saturation: 0.08, lightness: 60 }

  // Apply weather mix if active (skip 'none' and 'clear')
  const weatherColor = weather !== 'none' && weather !== 'clear' ? WEATHER_COLORS[weather] : null
  const mixed = weatherColor
    ? mixOklch(base, weatherColor, weatherIntensity)
    : base

  const intensity = Math.max(0, Math.min(1, config.intensity))
  const glowScale = Math.max(0.5, Math.min(2, config.glowScale))
  const atmoSat = Math.min(mixed.saturation, 0.40)
  const atmoHue = mixed.hue
  const atmoL = clampL(mixed.lightness)
  const atmoC = atmoSat * 0.12
  const glowRatio = glowScale * intensity

  const tokens: TokenRecord = {
    // ── Atmosphere ambient layers ──
    '--atmosphere-1': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.3, lightness: atmoL },
      0.08 * intensity,
    ),
    '--atmosphere-2': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.6, lightness: atmoL },
      0.18 * intensity,
    ),
    '--atmosphere-3': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.9, lightness: atmoL },
      0.28 * intensity,
    ),

    // ── Atmosphere glow: focal bloom ──
    '--atmosphere-glow': oklchString(
      { hue: atmoHue, saturation: atmoSat * 0.16, lightness: clampL(atmoL + 8) },
      0.20 * glowRatio,
    ),

    // ── Scalar metadata: consumed by material layer ──
    // Material reads these instead of importing atmosphereSamples directly.
    '--atmosphere-hue': String(atmoHue),
    '--atmosphere-saturation': String(atmoSat),
    '--atmosphere-luminance': String(mixed.lightness),
  }

  // ── Glass reflection: atmosphere-tinted top sheen ──
  // Uses mixed atmosphere color, NOT raw wallpaper sample
  const reflSat = atmoSat * 0.08
  const reflLightness = clampL(atmoL + 5)
  tokens['--glass-reflection'] =
    `linear-gradient(180deg, ${oklchString({ hue: atmoHue, saturation: reflSat, lightness: reflLightness }, 0.08)} 0%, transparent 12px)`

  return tokens
}

function clampL(l: number): number {
  return Math.max(1, Math.min(98, l))
}
