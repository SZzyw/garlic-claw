<template>
  <div class="wx-settings">
    <!-- Weather type selection -->
    <section
      v-for="group in weatherGroups"
      :key="group.id"
      class="wx-section"
    >
      <span class="wx-section-label">{{ group.label }}</span>
      <div class="wx-type-grid">
        <button
          v-for="wt in group.types"
          :key="wt.id"
          class="wx-type-chip"
          :class="{ active: weather === wt.id }"
          @click="selectWeather(wt.id)"
        >
          <span class="wx-chip-icon" v-html="wt.icon" />
          <div class="wx-chip-text">
            <span class="wx-chip-name">{{ wt.label }}</span>
            <span class="wx-chip-desc">{{ wt.description }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- Quality -->
    <section class="wx-section">
      <span class="wx-section-label">画质</span>
      <div class="wx-quality-grid">
        <button
          v-for="(label, level) in QUALITY_LABELS"
          :key="level"
          class="wx-quality-chip"
          :class="{ active: weatherRuntime.quality === level }"
          @click="weatherRuntime.setQuality(level)"
        >
          {{ label }}
        </button>
      </div>
    </section>

    <!-- Sliders -->
    <section class="wx-section">
      <span class="wx-section-label">参数</span>
      <div class="wx-sliders">
        <div class="slider-group">
          <div class="slider-group__header">
            <label class="slider-group__label">强度</label>
            <span class="slider-group__value">{{ config.intensity }}</span>
          </div>
          <div class="slider-group__track">
            <input
              type="range"
              class="slider"
              min="0"
              max="100"
              :value="config.intensity"
              @input="onIntensity"
            />
          </div>
        </div>

        <template v-if="weatherRuntime.hasParticles">
          <div class="slider-group">
            <div class="slider-group__header">
              <label class="slider-group__label">粒子数</label>
              <span class="slider-group__value">{{ config.particleCount }}</span>
            </div>
            <div class="slider-group__track">
              <input
                type="range"
                class="slider"
                min="0"
                max="100"
                :value="config.particleCount"
                @input="onParticleCount"
              />
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Reset -->
    <button class="wx-reset" @click="weatherRuntime.reset()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      重置天气
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { weatherRuntime } from './weatherRuntime'
import { WEATHER_PRESETS, type WeatherType } from '@/shared/atmosphere/weather'
import { QUALITY_LABELS } from './particles/types'

const weather = computed(() => weatherRuntime.current)
const config = weatherRuntime.config

// ── Grouped weather types ──

const weatherGroups = computed(() => {
  const all = Object.entries(WEATHER_PRESETS) as [WeatherType, typeof WEATHER_PRESETS[WeatherType]][]
  const categories: { id: string; label: string; types: { id: WeatherType; label: string; description: string; icon: string }[] }[] = [
    { id: 'clear', label: '无天气', types: [] },
    { id: 'precipitation', label: '降水', types: [] },
    { id: 'atmosphere', label: '氛围', types: [] },
    { id: 'celestial', label: '天象', types: [] },
  ]

  for (const [id, preset] of all) {
    const group = categories.find(c => c.id === preset.category)
    if (group) {
      group.types.push({
        id,
        label: preset.label,
        description: preset.description,
        icon: weatherIcon(id),
      })
    }
  }

  return categories.filter(g => g.types.length > 0)
})

function weatherIcon(type: WeatherType): string {
  const icons: Record<string, string> = {
    clear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    rain: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 2.5-8.2 6 6 0 0 0-11.1-2.3A4 4 0 0 0 6.5 17.5"/><path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/></svg>',
    snow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 2.5-8.2 6 6 0 0 0-11.1-2.3A4 4 0 0 0 6.5 17.5"/><path d="M12 22v-6M9 19l3 3 3-3M15 19l-3 3"/></svg>',
    fog: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M5 16h14M9 20h6M17 8a5 5 0 0 0-10 0"/></svg>',
    storm: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 2.5-8.2 6 6 0 0 0-11.1-2.3A4 4 0 0 0 6.5 17.5"/><path d="M13 12l-2 4h3l-2 4"/></svg>',
    night: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-9.5 7.7A7 7 0 0 1 12 4a8 8 0 0 0 8 8z"/><path d="M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5z"/></svg>',
    sunset: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0M12 9V2M12 9l2 2M12 9l-2 2M22 18H2M4 22h16M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5z"/></svg>',
    sakura: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2s-2 4-2 10 2 10 2 10M12 2s2 4 2 10-2 10-2 10"/><path d="M3 12h4M17 12h4"/></svg>',
    dust: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="16" cy="16" r="2"/><path d="M2 12h3M14 6h3M8 18h3M14 16h3"/></svg>',
    aurora: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c3-4 8-6 10-6s7 2 10 6-7 6-10 6-7-2-10-6z"/><path d="M6 12l3 2M15 12l-3 2M18 12l-3-2M9 12l3-2"/></svg>',
  }
  return icons[type] ?? icons.clear
}

function selectWeather(type: WeatherType): void {
  weatherRuntime.setWeather(type)
}

function onIntensity(event: Event): void {
  weatherRuntime.setConfig({ intensity: Number((event.target as HTMLInputElement).value) })
}

function onParticleCount(event: Event): void {
  weatherRuntime.setConfig({ particleCount: Number((event.target as HTMLInputElement).value) })
}

</script>

<style scoped>
.wx-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wx-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wx-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gc-muted-foreground);
  opacity: 0.7;
}

/* ── Type chips ── */
.wx-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.wx-type-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--gc-glass-border);
  background: var(--gc-glass-bg);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast),
    color var(--gc-transition-fast);
}

.wx-type-chip:hover {
  border-color: var(--gc-accent);
}

.wx-type-chip.active {
  border-color: var(--gc-accent);
  background: var(--gc-accent-bg);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--gc-accent) 15%, transparent);
}

.wx-chip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  min-width: 18px;
  height: 18px;
  color: var(--gc-muted-foreground);
  transition: color var(--gc-transition-fast);
}

.wx-type-chip.active .wx-chip-icon {
  color: var(--gc-accent);
}

.wx-chip-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.wx-chip-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.wx-chip-name {
  font-size: 12px;
  font-weight: 550;
  color: var(--gc-foreground);
}

.wx-chip-desc {
  font-size: 10px;
  color: var(--gc-muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Quality chips ── */
.wx-quality-grid {
  display: flex;
  gap: 6px;
}

.wx-quality-chip {
  flex: 1;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--gc-glass-border);
  background: var(--gc-glass-bg);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: var(--gc-muted-foreground);
  text-align: center;
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast),
    color var(--gc-transition-fast);
}

.wx-quality-chip:hover {
  border-color: var(--gc-accent);
}

.wx-quality-chip.active {
  border-color: var(--gc-accent);
  background: var(--gc-accent-bg);
  color: var(--gc-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--gc-accent) 15%, transparent);
}

/* ── Sliders ── */
.wx-sliders {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-group__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gc-foreground);
}

.slider-group__value {
  font-size: 11px;
  font-weight: 600;
  color: var(--gc-accent);
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}

.slider-group__track {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--gc-muted);
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gc-card);
  border: 1.5px solid var(--gc-accent);
  cursor: pointer;
  box-shadow:
    0 1px 4px var(--gc-shadow-color),
    0 0 6px var(--gc-glow);
  margin-top: -6px;
  transition: transform var(--gc-transition-fast);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-webkit-slider-thumb:active {
  transform: scale(0.9);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gc-card);
  border: 1.5px solid var(--gc-accent);
  cursor: pointer;
  box-shadow: 0 1px 4px var(--gc-shadow-color);
}

/* ── Reset ── */
.wx-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--gc-glass-border);
  background: transparent;
  color: var(--gc-muted-foreground);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color var(--gc-transition-fast),
    color var(--gc-transition-fast),
    background var(--gc-transition-fast);
}

.wx-reset:hover {
  border-color: var(--gc-accent);
  color: var(--gc-accent);
  background: var(--gc-interactive-hover-bg);
}
</style>
