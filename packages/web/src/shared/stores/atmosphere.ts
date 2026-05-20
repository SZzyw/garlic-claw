import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type { SampledColors, AtmosphereConfig } from '@/shared/atmosphere/types'
import { DEFAULT_ATMOSPHERE_CONFIG } from '@/shared/atmosphere/types'
import { extractColors } from '@/shared/atmosphere/colorExtractor'
import { setAtmosphereSamples } from '@/shared/atmosphere/samples'
import { setAtmosphereLightingTokens } from '@/shared/atmosphere/lighting-bridge'
import { computeAtmosphereLighting } from '@/shared/atmosphere/lighting-tokens'
import { type WeatherType } from '@/shared/atmosphere/weather'
import { useBackgroundStore } from './background'

const STORAGE_KEY = 'garlic-claw:atmosphere'

function readConfig(): AtmosphereConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_ATMOSPHERE_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_ATMOSPHERE_CONFIG }
  } catch {
    return { ...DEFAULT_ATMOSPHERE_CONFIG }
  }
}

function writeConfig(config: AtmosphereConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const useAtmosphereStore = defineStore('atmosphere', () => {
  // ── State ──
  const samples = ref<SampledColors | null>(null)
  const isSampling = ref(false)
  const lastError = ref<string | null>(null)
  const config = ref<AtmosphereConfig>(readConfig())
  const enabled = ref(true)
  const weather = ref<WeatherType>('none')

  // ── Getters ──
  const hasSamples = computed(() => samples.value !== null)
  const dominantColor = computed(() => samples.value
    ? `oklch(${samples.value.dominantLightness.toFixed(1)}% ${samples.value.dominantSaturation.toFixed(3)} ${samples.value.dominantHue.toFixed(1)})`
    : null)
  const accentColor = computed(() => samples.value
    ? `oklch(${samples.value.accentLightness.toFixed(1)}% ${samples.value.accentSaturation.toFixed(3)} ${samples.value.accentHue.toFixed(1)})`
    : null)

  /** Lighting tokens: computed from wallpaper sample + weather + config. */
  const lightingTokens = computed(() => {
    return computeAtmosphereLighting(
      samples.value,
      weather.value,
      config.value.intensity,
      config.value,
    )
  })

  // ── Actions ──
  async function sampleBackground(): Promise<void> {
    const bg = useBackgroundStore()
    const src = bg.source

    if (src.kind === 'none' || src.kind === 'color' || src.kind === 'gradient') {
      clearSamples()
      return
    }

    if (src.kind === 'video') {
      clearSamples()
      return
    }

    // src.kind === 'image'
    if (!src.url) {
      clearSamples()
      return
    }

    isSampling.value = true
    lastError.value = null

    try {
      const result = await extractColors(src.url)
      if (result.samples) {
        samples.value = result.samples
        setAtmosphereSamples(result.samples)
      } else {
        lastError.value = result.error ?? null
        clearSamples()
      }
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : 'Sampling failed'
      clearSamples()
    } finally {
      isSampling.value = false
    }
  }

  function clearSamples(): void {
    samples.value = null
    setAtmosphereSamples(null)
  }

  function setWeather(type: WeatherType): void {
    weather.value = type
  }

  function setConfig(partial: Partial<AtmosphereConfig>): void {
    config.value = { ...config.value, ...partial }
    writeConfig(config.value)
  }

  function resetConfig(): void {
    config.value = { ...DEFAULT_ATMOSPHERE_CONFIG }
    writeConfig(config.value)
  }

  // ── Init ──
  function init(): void {
    // Write lighting tokens to bridge for pipeline consumption
    watch(lightingTokens, (tokens) => {
      setAtmosphereLightingTokens(tokens)
    }, { immediate: true })

    // Sample immediately if background is active
    sampleBackground()

    // Watch for background source changes
    const bg = useBackgroundStore()
    watch(
      () => {
        const s = bg.source
        if (s.kind === 'image') return s.url
        return s.kind
      },
      () => {
        if (enabled.value) {
          sampleBackground()
        }
      },
    )
  }

  return {
    samples,
    isSampling,
    lastError,
    config,
    enabled,
    weather,
    hasSamples,
    dominantColor,
    accentColor,
    lightingTokens,
    sampleBackground,
    clearSamples,
    setWeather,
    setConfig,
    resetConfig,
    init,
  }
})
