import type { ThemePreset, ThemeModeConfig, TokenMap } from './types'
import { PRIMITIVE } from './registry'

/**
 * SINGLE color entry point. Generates ALL base colors in oklch().
 *
 * "Neutral Surface + Accent Atmosphere" dual-layer architecture:
 * - Surfaces (bg, card, muted): near-neutral gray base, chroma ≤ 0.020 dark / 0.014 light
 * - Text (fg, mutedFg): essentially achromatic, chroma ≤ 0.012 dark / 0.008 light
 * - Borders: subtle definition only, chroma ≤ 0.028 dark / 0.022 light
 * - Accent (primary, accent, ring): sqrt curve, chroma ≤ 0.20 — restrained Windows system-accent presence
 * - Atmosphere (ambient bloom layers): independent curve, chroma ≤ 0.08 — visible edge-air
 * - Shadows: ≤ 5% of surface chroma — barely perceptible tint
 *
 * Growth curves (different per token type for perceptual balance):
 * - Surface/border: quadratic  pow(s/100, 2)   — near-zero tint at s < 40
 * - Text:             cubic    pow(s/100, 3)   — achromatic at all but extreme saturation
 * - Accent:           sqrt     sqrt(s/100)     — confident at default, refined at full
 * - Atmosphere:       linear   s/100           — steady growth for ambient bloom
 *
 * Atmosphere NEVER enters card/background/main surface directly.
 * It only enters aura, edge glow, modal bloom, hover bloom, overlay ambient.
 */
export function computeThemeBase(
  preset: ThemePreset,
  modeConfig: ThemeModeConfig,
  overrides?: {
    hue?: number
    saturation?: number
    brightness?: number
    glowStrength?: number
    glassOpacity?: number
    blurStrength?: number
  },
): TokenMap {
  const h = overrides?.hue ?? preset.hue
  const s = overrides?.saturation ?? preset.saturation
  const isDark = modeConfig.backgroundLightness < 50

  // Slider ratios (0–1 scale)
  const brightness = overrides?.brightness ?? modeConfig.brightness ?? 50
  const glowRatio = overrides?.glowStrength ?? 0.5
  const glassRatio = overrides?.glassOpacity ?? 0.5
  const blurRatio = overrides?.blurStrength ?? 0.5

  // Brightness delta: -25 to +25 applied to all lightness values
  const deltaL = (brightness - 50) * 0.5

  const accentHue = ((h + modeConfig.accentHueShift) + 360) % 360
  const accentLit = modeConfig.accentLightness

  // ── Chroma: independent curves per token type ──
  const bgC = surfaceChroma(s, isDark)
  const mutedC = textChroma(s, isDark)
  const accentC = accentChroma(s)
  const borderC = borderChroma(s, isDark)

  // Lightness values with brightness offset applied
  const bgL = clampL(modeConfig.backgroundLightness + deltaL)
  const fgL = clampL(modeConfig.foregroundLightness + deltaL)
  const cardL = clampL(modeConfig.cardLightness + deltaL)
  const borderL = clampL(modeConfig.borderLightness + deltaL)
  const mutedFgL = clampL(modeConfig.mutedForegroundLightness + deltaL)
  const accentL = clampL(accentLit + deltaL)

  return {
    // ── Base ──
    [PRIMITIVE.hue]: String(h),
    [PRIMITIVE.saturation]: `${s}%`,
    [PRIMITIVE.lightness]: `${bgL}%`,

    // ── Slider controller values (0–1 ratio strings) ──
    [PRIMITIVE.glowStrength]: String(glowRatio),
    [PRIMITIVE.glassOpacity]: String(glassRatio),
    [PRIMITIVE.blurStrength]: String(blurRatio),

    // ── Surface: neutral gray base ──
    [PRIMITIVE.background]: oklch(bgL, bgC, h),
    [PRIMITIVE.card]: oklch(cardL, bgC, h),
    [PRIMITIVE.muted]: oklch(cardL, bgC * 0.6, h),

    // ── Text: essentially achromatic ──
    [PRIMITIVE.foreground]: oklch(fgL, mutedC, h),
    [PRIMITIVE.cardForeground]: oklch(fgL, mutedC, h),
    [PRIMITIVE.mutedForeground]: oklch(mutedFgL, mutedC, h),

    // ── Accent: independent curve, high chroma — where color is visible ──
    [PRIMITIVE.primary]: oklch(accentL, accentC, accentHue),
    [PRIMITIVE.primaryForeground]: oklch(98, 0, 0),
    [PRIMITIVE.accent]: oklch(accentL, accentC, accentHue),
    [PRIMITIVE.accentForeground]: oklch(98, 0, 0),

    // ── Border: subtle tint, independent from accent ──
    [PRIMITIVE.border]: oklch(borderL, borderC, h),
    [PRIMITIVE.ring]: oklch(accentL, accentC, accentHue, 0.3 * glowRatio),

    // ── Glow: accent hue, visible but refined ──
    [PRIMITIVE.glow]: oklch(accentL, accentC * 0.5, accentHue, 0.12 * glowRatio),

    // ── Shadow: ambient depth — felt, not seen ──
    [PRIMITIVE.shadowColor]: oklch(20, bgC * 0.08, h, 0.2),

    // ── Glass: frosted air-glass with body and subtle edge refraction ──
    [PRIMITIVE.glassBg]: oklch(clampL(cardL + 2), bgC * 0.4, h, 0.55 * glassRatio),
    [PRIMITIVE.glassBorder]: oklch(borderL, borderC * 0.5, h, 0.35 * glassRatio),

    // ── Glass reflection: theme-derived — atmosphere layer may override ──
    [PRIMITIVE.glassReflection]: `linear-gradient(180deg, var(${PRIMITIVE.surfaceTint}) 0%, transparent 8px)`,

    // ── Surface Tint: environmental color wash (2-6% chroma at 18% alpha dark) ──
    // 30% of accent chroma, applied at card lightness — tints ALL surfaces uniformly
    // via color-mix in depth.ts. Never enters foreground/text — only surface compositing.
    [PRIMITIVE.surfaceTint]: oklch(cardL, accentC * 0.30, accentHue, isDark ? 0.18 : 0.10),

    // ── Backdrop Noise: SVG filter reference for ultra-subtle film grain ──
    [PRIMITIVE.backdropNoise]: 'url(#gc-noise)',
  }
}

// ── oklch() helper ──

function oklch(l: number, c: number, h: number, a?: number): string {
  const clampedL = Math.max(0, Math.min(100, l))
  if (a !== undefined) {
    return `oklch(${clampedL}% ${c.toFixed(3)} ${h} / ${a})`
  }
  return `oklch(${clampedL}% ${c.toFixed(3)} ${h})`
}

// ── Chroma curves — independent per token type ──

/**
 * Surface chroma: quadratic growth.
 * Near-zero at default saturation, subtle tint only at high saturation.
 * Dark max 0.020, Light max 0.014.
 */
function surfaceChroma(s: number, isDark: boolean): number {
  const max = isDark ? 0.020 : 0.014
  return Math.pow(s / 100, 2) * max
}

/**
 * Text chroma: cubic growth — achromatic at all but extreme saturation.
 * Text must never look tinted.
 */
function textChroma(s: number, isDark: boolean): number {
  const max = isDark ? 0.012 : 0.008
  return Math.pow(s / 100, 3) * max
}

/**
 * Accent chroma: sqrt growth — fast early, confident at default saturation.
 * The one place in the system where color has clear personality.
 */
function accentChroma(s: number): number {
  return Math.sqrt(s / 100) * 0.20
}

/**
 * Border chroma: quadratic growth — independent from accent.
 * Subtle definition only, stronger than surface but still restrained.
 */
function borderChroma(s: number, isDark: boolean): number {
  const max = isDark ? 0.028 : 0.022
  return Math.pow(s / 100, 2) * max
}

// ── Clamp lightness to valid range ──

function clampL(l: number): number {
  return Math.max(1, Math.min(98, l))
}
