/**
 * Atmosphere Lighting Token Computation.
 *
 * Reads wallpaper-sampled colors and atmosphere config, outputs CSS
 * custom property tokens consumed by the CSS pipeline.
 */
import type { SampledColors, AtmosphereConfig } from './types'

type TokenRecord = Record<string, string>

interface OklchColor {
  hue: number
  saturation: number
  lightness: number
}

function oklchString(c: OklchColor, alpha?: number): string {
  const a = alpha !== undefined ? ` / ${alpha.toFixed(4)}` : ''
  return `oklch(${c.lightness.toFixed(1)}% ${c.saturation.toFixed(4)} ${c.hue.toFixed(1)}${a})`
}

export function computeAtmosphereLighting(
  sampled: SampledColors | null,
  intensity: number,
  config: AtmosphereConfig,
): TokenRecord {
  if (!sampled) return {}

  const base: OklchColor = {
    hue: sampled.accentHue,
    saturation: sampled.accentSaturation,
    lightness: sampled.accentLightness,
  }

  const i = Math.max(0, Math.min(1, config.intensity))
  const glowScale = Math.max(0.5, Math.min(2, config.glowScale))
  const atmoSat = Math.min(base.saturation, 0.40)
  const atmoHue = base.hue
  const atmoL = clampL(base.lightness)
  const atmoC = atmoSat * 0.12
  const glowRatio = glowScale * i

  const tokens: TokenRecord = {
    '--atmosphere-1': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.3, lightness: atmoL },
      0.08 * i,
    ),
    '--atmosphere-2': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.6, lightness: atmoL },
      0.18 * i,
    ),
    '--atmosphere-3': oklchString(
      { hue: atmoHue, saturation: atmoC * 0.9, lightness: atmoL },
      0.28 * i,
    ),
    '--atmosphere-glow': oklchString(
      { hue: atmoHue, saturation: atmoSat * 0.16, lightness: clampL(atmoL + 8) },
      0.20 * glowRatio,
    ),
    '--atmosphere-hue': String(atmoHue),
    '--atmosphere-saturation': String(atmoSat),
    '--atmosphere-luminance': String(base.lightness),
  }

  const reflSat = atmoSat * 0.08
  const reflLightness = clampL(atmoL + 5)
  tokens['--glass-reflection'] =
    `linear-gradient(180deg, ${oklchString({ hue: atmoHue, saturation: reflSat, lightness: reflLightness }, 0.08)} 0%, transparent 12px)`

  return tokens
}

function clampL(l: number): number {
  return Math.max(1, Math.min(98, l))
}
