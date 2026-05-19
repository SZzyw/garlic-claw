/**
 * Particle Quality System.
 *
 * Auto-detects device capability and provides quality presets.
 * Low-end devices get reduced particles, no blur, single layer.
 * High-end devices get full crystal snow, gradient rain, multi-layer parallax.
 */

import type { QualityLevel, QualityConfig } from './types'

// ── Presets ──

export const QUALITY_PRESETS: Record<QualityLevel, QualityConfig> = {
  low: {
    particleMultiplier: 0.25,
    depthLayers: 1,
    crystalSnow: false,
    gradientRain: false,
    specularRain: false,
    petalDetail: 3,
    blurPasses: 0,
  },
  medium: {
    particleMultiplier: 0.55,
    depthLayers: 2,
    crystalSnow: true,
    gradientRain: true,
    specularRain: false,
    petalDetail: 5,
    blurPasses: 0,
  },
  high: {
    particleMultiplier: 0.8,
    depthLayers: 3,
    crystalSnow: true,
    gradientRain: true,
    specularRain: true,
    petalDetail: 8,
    blurPasses: 1,
  },
  ultra: {
    particleMultiplier: 1.0,
    depthLayers: 3,
    crystalSnow: true,
    gradientRain: true,
    specularRain: true,
    petalDetail: 12,
    blurPasses: 2,
  },
}

// ── Layer configs per depth ──

import type { LayerConfig } from './types'

export const LAYER_CONFIGS: Record<'background' | 'midground' | 'foreground', LayerConfig> = {
  background: {
    layer: 'background',
    zIndex: 2,
    speed: 0.4,
    size: 0.5,
    blur: 2,
    opacity: 0.4,
    windInfluence: 0.3,
    spawnDensity: 0.45,
  },
  midground: {
    layer: 'midground',
    zIndex: 3,
    speed: 0.7,
    size: 0.8,
    blur: 0.5,
    opacity: 0.7,
    windInfluence: 0.6,
    spawnDensity: 0.35,
  },
  foreground: {
    layer: 'foreground',
    zIndex: 5,
    speed: 1.0,
    size: 1.0,
    blur: 0,
    opacity: 0.9,
    windInfluence: 1.0,
    spawnDensity: 0.2,
  },
}

// ── Auto-detect ──

let _detected: QualityLevel | null = null
let _override: QualityLevel | null = null

export function detectQuality(): QualityLevel {
  if (_override) return _override
  if (_detected) return _detected

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    _detected = 'medium'
    return _detected
  }

  // Check for mobile
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  if (isMobile) {
    _detected = 'low'
    return _detected
  }

  // Check for low memory
  const memory = (navigator as any).deviceMemory
  if (memory !== undefined && memory < 4) {
    _detected = 'low'
    return _detected
  }

  // Check for hardware concurrency
  const cores = navigator.hardwareConcurrency ?? 4
  if (cores <= 2) {
    _detected = 'low'
    return _detected
  }
  if (cores <= 4) {
    _detected = 'medium'
    return _detected
  }

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    _detected = 'low'
    return _detected
  }

  // Desktop with good specs
  _detected = cores >= 8 ? 'high' : 'medium'
  return _detected
}

/** Get the active quality config. */
export function getQualityConfig(): QualityConfig {
  return QUALITY_PRESETS[detectQuality()]
}

/** Override quality level (user setting). */
export function setQualityOverride(level: QualityLevel | null): void {
  _override = level
  _detected = null // re-detect if override cleared
}
