/**
 * Weather Runtime — Module-level state (NOT Pinia, NOT localStorage).
 *
 * Self-contained: manages weather selection, intensity, particles config, quality.
 * Delegates lighting to atmosphere store's setWeather for CSS token pipeline.
 */

import { reactive, ref } from 'vue'
import type { WeatherType } from '@/shared/atmosphere/weather'
import { WEATHER_PRESETS } from '@/shared/atmosphere/weather'
import { setQualityOverride, detectQuality } from './particles/quality'
import type { QualityLevel } from './particles/types'
import { useAtmosphereStore } from '@/shared/stores/atmosphere'

// ── State ──

const currentWeather = ref<WeatherType>('clear')
const qualityLevel = ref<QualityLevel>(detectQuality())

const config = reactive({
  intensity: 50,
  particleCount: 50,
})

// ── Keep atmosphere store in sync for lighting pipeline ──
function syncAtmosphere(): void {
  const store = useAtmosphereStore()
  if (currentWeather.value === 'clear') {
    store.setWeather('none' as WeatherType)
  } else {
    store.setWeather(currentWeather.value)
  }
}

// ── API ──

export const weatherRuntime = {
  get current() {
    return currentWeather.value
  },
  get preset() {
    return WEATHER_PRESETS[currentWeather.value]
  },
  get intensity() {
    return config.intensity / 100
  },
  get quality() {
    return qualityLevel.value
  },
  get config() {
    return config
  },
  get hasParticles() {
    return WEATHER_PRESETS[currentWeather.value].hasParticles
  },

  setWeather(type: WeatherType): void {
    currentWeather.value = type
    syncAtmosphere()
  },

  setIntensity(value: number): void {
    config.intensity = Math.max(0, Math.min(100, value))
  },

  setQuality(level: QualityLevel): void {
    qualityLevel.value = level
    setQualityOverride(level)
  },

  setConfig(partial: { intensity?: number; particleCount?: number }): void {
    if (partial.intensity !== undefined) {
      config.intensity = Math.max(0, Math.min(100, partial.intensity))
    }
    if (partial.particleCount !== undefined) {
      config.particleCount = Math.max(0, Math.min(100, partial.particleCount))
    }
  },

  reset(): void {
    currentWeather.value = 'clear'
    qualityLevel.value = detectQuality()
    setQualityOverride(null)
    config.intensity = 50
    config.particleCount = 50
    syncAtmosphere()
  },
}
