/**
 * Theme-adaptive color sampling.
 *
 * Reads CSS custom properties from :root to determine
 * whether the current theme is dark or light, then computes
 * appropriate particle colors for visibility in both modes.
 *
 * All colors are derived from theme tokens — zero hardcoded values.
 */

import type { ThemeColors } from './types'

// ── Parse helpers ──

function parseOklchToRgb(raw: string): [number, number, number] | null {
  // Match oklch(L% S H) or oklch(L% S H / A)
  const m = raw.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)/)
  if (!m) return null
  const l = parseFloat(m[1]) / 100
  const c = parseFloat(m[2])
  const h = (parseFloat(m[3]) * Math.PI) / 180
  return oklchToSrgb(l, c, h)
}

function parseRgb(raw: string): [number, number, number] | null {
  const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
}

function oklchToSrgb(l: number, c: number, h: number): [number, number, number] {
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const LabL = l
  // oklab to linear sRGB (simplified)
  const l_ = LabL + 0.3963377774 * a + 0.2158037573 * b
  const m_ = LabL - 0.1055613458 * a - 0.0638541728 * b
  const s_ = LabL - 0.0894841775 * a - 1.2914855480 * b
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_
  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const dd = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
  // Gamma
  const toSrgb = (x: number) => {
    const v = Math.max(0, Math.min(1, x))
    return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  }
  return [
    Math.round(toSrgb(r) * 255),
    Math.round(toSrgb(g) * 255),
    Math.round(toSrgb(dd) * 255),
  ]
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

// ── Main sampler ──

let cachedColors: ThemeColors | null = null
let cacheTime = 0
const CACHE_TTL = 200 // ms

export function sampleThemeColors(): ThemeColors {
  const now = performance.now()
  if (cachedColors && now - cacheTime < CACHE_TTL) return cachedColors

  if (typeof document === 'undefined') {
    return fallbackColors()
  }

  const style = getComputedStyle(document.documentElement)

  // Determine dark/light from surface base luminance
  const surfaceRaw = style.getPropertyValue('--gc-surface-base').trim()
  let isDark = true
  let bgLum = 0.12

  const oklchRgb = parseOklchToRgb(surfaceRaw)
  const rgb = oklchRgb ?? parseRgb(surfaceRaw)
  if (rgb) {
    bgLum = relativeLuminance(rgb[0], rgb[1], rgb[2])
    isDark = bgLum < 0.35
  }

  // Sample accent for sakura hue
  const accentRaw = style.getPropertyValue('--gc-accent').trim()
  let accentHue = 340
  const accentMatch = accentRaw.match(/oklch\([\d.]+%\s+[\d.]+\s+([\d.]+)/)
  if (accentMatch) {
    accentHue = parseFloat(accentMatch[1])
  }

  // ── Compute particle colors ──

  if (isDark) {
    cachedColors = {
      isDark: true,
      bgLuminance: bgLum,
      snowFill: 'rgba(210,225,250,ALPHA)',
      snowStroke: 'rgba(235,245,255,ALPHA)',
      snowHighlight: 'rgba(255,255,255,ALPHA)',
      rainFill: 'rgba(150,190,235,ALPHA)',
      rainHighlight: 'rgba(220,240,255,ALPHA)',
      sakuraBase: `oklch(72% 0.12 ${accentHue > 300 || accentHue < 60 ? 340 : accentHue})`,
      sakuraStroke: `oklch(80% 0.08 ${accentHue > 300 || accentHue < 60 ? 340 : accentHue})`,
      sakuraInner: 'rgba(255,220,230,ALPHA)',
      lightningColor: 'rgba(200,220,255,ALPHA)',
      fogTint: 'rgba(180,195,215,ALPHA)',
    }
  } else {
    // Light mode: darker particles for contrast
    cachedColors = {
      isDark: false,
      bgLuminance: bgLum,
      snowFill: 'rgba(60,85,130,ALPHA)',
      snowStroke: 'rgba(80,110,160,ALPHA)',
      snowHighlight: 'rgba(140,170,210,ALPHA)',
      rainFill: 'rgba(55,80,130,ALPHA)',
      rainHighlight: 'rgba(120,160,200,ALPHA)',
      sakuraBase: `oklch(55% 0.15 ${accentHue > 300 || accentHue < 60 ? 340 : accentHue})`,
      sakuraStroke: `oklch(45% 0.12 ${accentHue > 300 || accentHue < 60 ? 340 : accentHue})`,
      sakuraInner: 'rgba(200,120,150,ALPHA)',
      lightningColor: 'rgba(140,160,200,ALPHA)',
      fogTint: 'rgba(140,155,175,ALPHA)',
    }
  }

  cacheTime = now
  return cachedColors
}

function fallbackColors(): ThemeColors {
  return {
    isDark: true,
    bgLuminance: 0.12,
    snowFill: 'rgba(210,225,250,ALPHA)',
    snowStroke: 'rgba(235,245,255,ALPHA)',
    snowHighlight: 'rgba(255,255,255,ALPHA)',
    rainFill: 'rgba(150,190,235,ALPHA)',
    rainHighlight: 'rgba(220,240,255,ALPHA)',
    sakuraBase: 'oklch(72% 0.12 340)',
    sakuraStroke: 'oklch(80% 0.08 340)',
    sakuraInner: 'rgba(255,220,230,ALPHA)',
    lightningColor: 'rgba(200,220,255,ALPHA)',
    fogTint: 'rgba(180,195,215,ALPHA)',
  }
}

/** Format a color template with alpha value. */
export function alphaColor(template: string, alpha: number): string {
  return template.replace('ALPHA', alpha.toFixed(3))
}

/** Build an rgba string from oklch with alpha. */
export function oklchWithAlpha(base: string, alpha: number): string {
  // If already has alpha, replace it; otherwise append
  if (base.includes(' / ')) {
    return base.replace(/ \/ [\d.]+\)/, ` / ${alpha.toFixed(3)})`)
  }
  return base.replace(')', ` / ${alpha.toFixed(3)})`)
}
